import Comment from "../models/Comment.model.js";
import User from "../models/User.model.js";
import Post from "../models/Post.model.js";
import { errorHandler } from "../utils/error.js";

// Constants
const ACTIVITY_POINTS = {
    COMMENT_ADD: 3,
    COMMENT_DELETE: -2,
    COMMENT_LIKE: 1,
    COMMENT_UNLIKE: -1
};

// Create a new comment
export const createComment = async (req, res, next) => {
    try {
        const { content, postId } = req.body;
        const userId = req.user.id;

        if (!content || !content.trim()) {
            return next(errorHandler(400, "Comment cannot be empty"));
        }

        if (content.length > 1000) {
            return next(errorHandler(400, "Comment exceeds 1000 character limit"));
        }

        const newComment = new Comment({
            content: content.trim(),
            postId,
            userId
        });

        await newComment.save();

        await User.findByIdAndUpdate(userId, {
            $inc: {
                activityScore: ACTIVITY_POINTS.COMMENT_ADD,
                commentCount: 1
            }
        });

        await Post.findByIdAndUpdate(postId, {
            $inc: { commentCount: 1 }
        });

        res.status(201).json({
            success: true,
            comment: newComment
        });

    } catch (error) {
        next(errorHandler(500, "Failed to create comment"));
    }
};

// Get comments for a post (paginated)
export const getPostComments = async (req, res, next) => {
    try {
        const { postId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const comments = await Comment.find({ postId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('userId', 'username profilePicture isVerified');

        const totalComments = await Comment.countDocuments({ postId });

        res.status(200).json({
            success: true,
            comments,
            totalPages: Math.ceil(totalComments / limit),
            currentPage: page
        });
    } catch (error) {
        next(errorHandler(500, "Failed to fetch comments"));
    }
};

// Like or unlike a comment
export const likeComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        const comment = await Comment.findById(commentId);
        if (!comment) return next(errorHandler(404, "Comment not found"));

        const hasLiked = comment.likes.includes(userId);
        const update = hasLiked
            ? { $pull: { likes: userId }, $inc: { numberOfLikes: -1 } }
            : { $addToSet: { likes: userId }, $inc: { numberOfLikes: 1 } };

        const updatedComment = await Comment.findByIdAndUpdate(commentId, update, { new: true });

        await User.findByIdAndUpdate(userId, {
            $inc: {
                activityScore: hasLiked ? ACTIVITY_POINTS.COMMENT_UNLIKE : ACTIVITY_POINTS.COMMENT_LIKE
            }
        });

        res.status(200).json({
            success: true,
            comment: updatedComment
        });

    } catch (error) {
        next(errorHandler(500, "Failed to process like"));
    }
};

// Edit a comment
export const editComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        if (!content || !content.trim()) {
            return next(errorHandler(400, "Comment content required"));
        }

        const comment = await Comment.findById(commentId);
        if (!comment) return next(errorHandler(404, "Comment not found"));

        if (comment.userId.toString() !== userId && !req.user.isAdmin) {
            return next(errorHandler(403, "Unauthorized to edit this comment"));
        }

        const updatedComment = await Comment.findByIdAndUpdate(
            commentId,
            {
                content: content.trim(),
                editedAt: new Date()
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            comment: updatedComment
        });

    } catch (error) {
        next(errorHandler(500, "Failed to update comment"));
    }
};

// Delete a comment permanently
export const deleteComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        const comment = await Comment.findById(commentId);
        if (!comment) return next(errorHandler(404, "Comment not found"));

        if (comment.userId.toString() !== userId && !req.user.isAdmin) {
            return next(errorHandler(403, "Unauthorized to delete this comment"));
        }

        await Comment.findByIdAndDelete(commentId);

        await User.findByIdAndUpdate(userId, {
            $inc: {
                activityScore: ACTIVITY_POINTS.COMMENT_DELETE,
                commentCount: -1
            }
        });

        await Post.findByIdAndUpdate(comment.postId, {
            $inc: { commentCount: -1 }
        });

        res.status(200).json({
            success: true,
            message: "Comment deleted successfully"
        });

    } catch (error) {
        next(errorHandler(500, "Failed to delete comment"));
    }
};

// Admin: Get all comments (with search/sort/pagination)
export const getComments = async (req, res, next) => {
    if (!req.user.isAdmin) {
      return next(errorHandler(403, "Admin access required"));
    }
  
    try {
      const startIndex = parseInt(req.query.startIndex) || 0;
      const limit = parseInt(req.query.limit) || 9;
      const sort = req.query.sort === 'asc' ? 1 : -1;
      const search = req.query.search;
      const shouldPopulate = req.query.populate === 'user,post';
  
      const query = {};
      if (search) {
        query.content = { $regex: search, $options: 'i' };
      }
  
      // Base query without population
      let commentQuery = Comment.find(query)
        .sort({ createdAt: sort })
        .skip(startIndex)
        .limit(limit);
  
      // Add population if requested
      if (shouldPopulate) {
        commentQuery = commentQuery
          .populate({
            path: 'userId',
            select: 'username profilePicture isVerified isAdmin'
          })
          .populate({
            path: 'postId',
            select: 'title slug'
          });
      }
  
      const [comments, totalComments, lastMonthComments] = await Promise.all([
        commentQuery.exec(),
        Comment.countDocuments(query),
        Comment.countDocuments({
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
          }
        })
      ]);
  
      res.status(200).json({
        success: true,
        comments,
        totalComments,
        lastMonthComments
      });
  
    } catch (error) {
      next(errorHandler(500, "Failed to fetch comments", error));
    }
  };