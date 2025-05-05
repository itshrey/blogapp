import Post from "../models/Post.model.js";
import { errorHandler } from "../utils/error.js";
import mongoose from 'mongoose';
import User from "../models/User.model.js";

export const create = async (req, res, next) => {
    try {
        // Admin or verified user check
        if (!req.user.isAdmin && !req.user.isVerified) {
            return next(errorHandler(403, 'You need verified status to create posts'));
        }

        // Validation
        if (!req.body.title || !req.body.title.trim() || 
            !req.body.content || !req.body.content.trim()) {
            return next(errorHandler(400, 'Title and content are required'));
        }

        // Slug generation
        const slug = req.body.title
            .split(' ')
            .join('-')
            .toLowerCase()
            .replace(/[^a-zA-Z0-9-]/g, '');

            const newPost = new Post({
              title: req.body.title.trim(),
              content: req.body.content.trim(),
              category: req.body.category || 'uncategorized',
              image: req.body.image || '',
              slug,
              userId: req.user.id,
              views: 0,
              likesCount: 0,
              commentCount: 0,
          });
  

        const savedPost = await newPost.save();

        // Update user activity (atomic operation)
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { 
                activityScore: 5, // Higher points for post creation
                postCount: 1 
            }
        });

        res.status(201).json({
            success: true,
            post: savedPost
        });

    } catch (error) {
        next(errorHandler(500, "Failed to create post", error));
    }
};

export const getPosts = async (req, res, next) => {
  try {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;
    const sortDirection = req.query.sort === 'asc' ? 1 : -1;

    // Build query
    const query = {
      ...(req.query.userId && { userId: req.query.userId }),
      ...(req.query.category && { category: req.query.category }),
      ...(req.query.slug && { slug: req.query.slug }),
      ...(req.query.postId && { _id: req.query.postId }),
      ...(req.query.ids && { _id: { $in: req.query.ids.split(',') } }),
      ...(req.query.searchTerm && {
        $or: [
          { title: { $regex: req.query.searchTerm, $options: 'i' } },
          { content: { $regex: req.query.searchTerm, $options: 'i' } },
        ],
      })
    };

    // Special handling for single post fetch by slug
    if (req.query.slug) {
      const post = await Post.findOneAndUpdate(
        { slug: req.query.slug },
        { $inc: { views: 1 } }, // Increment views
        { new: true }
      )
      .select('title likes content image category slug userId views commentCount likesCount updatedAt')
      .populate('userId', 'username profilePicture isVerified');

      if (!post) {
        return next(errorHandler(404, 'Post not found'));
      }

      // Check if current user has liked this post if authenticated
      let isLiked = false;
      if (req.user && post.likes) {
        isLiked = post.likes.includes(req.user._id);
      }

      return res.status(200).json({
        success: true,
        posts: [{
          ...post.toObject(),
          isLiked
        }],
        totalPosts: 1,
        totalPages: 1,
        lastMonthPosts: 0
      });
    }

    // If fetching by IDs, we don't need pagination info
    if (req.query.ids) {
      const posts = await Post.find(query)
        .select('title content image category slug userId views commentCount likesCount likes updatedAt')
        .populate('userId', 'username profilePicture isVerified');

      return res.status(200).json({
        success: true,
        posts,
        totalPosts: posts.length,
        totalPages: 1,
        lastMonthPosts: 0
      });
    }

    // Execute parallel queries for multiple posts (default case)
    const [posts, totalPosts, lastMonthPosts] = await Promise.all([
      Post.find(query)
        .select('title content image category slug userId views commentCount likesCount updatedAt')
        .sort({ updatedAt: sortDirection })
        .skip(startIndex)
        .limit(limit)
        .populate('userId', 'username profilePicture isVerified'),
      Post.countDocuments(query),
      Post.countDocuments({
        createdAt: { 
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) 
        }
      })
    ]);

    res.status(200).json({
      success: true,
      posts,
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      lastMonthPosts
    });

  } catch (error) {
    next(errorHandler(500, "Failed to fetch posts", error));
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Post.distinct('category');
    res.status(200).json({ categories });
  } catch (error) {
    next(errorHandler(500, "Failed to fetch categories", error));
  }
};
export const deletePost = async (req, res, next) => {
    try {
        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
            return next(errorHandler(400, 'Invalid post ID'));
        }

        const post = await Post.findById(req.params.postId);
        if (!post) {
            return next(errorHandler(404, 'Post not found'));
        }

        // Ownership check (user or admin)
        if (post.userId.toString() !== req.user.id && !req.user.isAdmin) {
            return next(errorHandler(403, 'Unauthorized to delete this post'));
        }

        await Post.findByIdAndDelete(req.params.postId);

        // Update user stats if not admin deletion
        if (post.userId.toString() === req.user.id) {
            await User.findByIdAndUpdate(req.user.id, {
                $inc: { 
                    activityScore: -3,
                    postCount: -1 
                }
            });
        }

        res.status(200).json({
            success: true,
            message: "Post deleted successfully"
        });

    } catch (error) {
        next(errorHandler(500, "Failed to delete post", error));
    }
};

export const updatePost = async (req, res, next) => {
    try {
        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
            return next(errorHandler(400, 'Invalid post ID'));
        }

        const post = await Post.findById(req.params.postId);
        if (!post) {
            return next(errorHandler(404, 'Post not found'));
        }

        // Ownership check (user or admin)
        console.log("Post userId:", post.userId.toString(), "Request userId:", req.user.id);
        if (post.userId.toString() !== req.user.id.toString() && !req.user.isAdmin) {
            return next(errorHandler(403, 'Unauthorized to update this post'));
        }

        // Generate new slug if title changed
        const slug = req.body.title 
            ? req.body.title
                .split(' ')
                .join('-')
                .toLowerCase()
                .replace(/[^a-zA-Z0-9-]/g, '')
            : post.slug;

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.postId,
            {
                $set: {
                    title: req.body.title?.trim() || post.title,
                    content: req.body.content?.trim() || post.content,
                    category: req.body.category || post.category,
                    image: req.body.image || post.image,
                    slug,
                },
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            post: updatedPost
        });

    } catch (error) {
        next(errorHandler(500, "Failed to update post", error));
    }
};

export const getUserPosts = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;
    
    // Make sure user can only access their own posts unless they're an admin
    if (req.user.id !== userId && !req.user.isAdmin) {
      return next(errorHandler(403, 'You can only access your own posts'));
    }

    // Check if user exists and is verified
    const user = await User.findById(userId);
    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }
    
    if (!user.isVerified) {
      return next(errorHandler(403, 'User must be verified to have posts'));
    }

    // Find posts by this user
    const posts = await Post.find({ userId })
      .sort({ updatedAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const totalPosts = await Post.countDocuments({ userId });

    res.status(200).json({
      posts,
      totalPosts,
      hasMore: startIndex + posts.length < totalPosts
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

export const likePost = async (req, res, next) => {
  try {
      
      const { postId } = req.body;  // Assuming user ID is sent in the request body
      const userId = req.user.id; // Extract user ID from the request object
      // Validate if the postId and userId are valid
      if (!mongoose.Types.ObjectId.isValid(postId)) {
          return next(errorHandler(400, "Invalid post ID"));
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
          return next(errorHandler(400, "Invalid user ID"));
      }

      // Find the post
      const post = await Post.findById(postId);

      if (!post) {
          return next(errorHandler(404, "Post not found"));
      }

      // Check if the user has already liked the post
      const isLiked = post.likes.includes(userId);

      if (isLiked) {
          // If already liked, remove the user from the likes array and decrement likes count
          post.likes.pull(userId);
          post.likesCount -= 1;
      } else {
          // If not liked, add the user to the likes array and increment likes count
          post.likes.push(userId);
          post.likesCount += 1;
      }

      // Save the updated post
      await post.save();

      // Return the updated post
      res.status(200).json({ success: true, post });

  } catch (err) {
      next(errorHandler(500, "Failed to like/unlike post", err));
  }
};
