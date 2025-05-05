import express from 'express';
import { create, getCategories, getUserPosts, likePost } from '../controllers/post.controller.js';
import { 
    verifyToken, 
    verifiedOnly, 
    adminOnly,
    trackActivity 
  } from '../middleware/auth.middleware.js';
import { getPosts } from '../controllers/post.controller.js';
import { deletePost,updatePost } from '../controllers/post.controller.js';

const router= express.Router();

router.post('/like', verifyToken, likePost);
router.post(
    '/create',
    verifyToken,
    verifiedOnly,
    trackActivity,
    create
  );
  router.get(
    '/getPosts',
    getPosts
  );


  // Add this to your post routes
router.get('/categories', getCategories);

router.get('/user/:userId', verifyToken, getUserPosts);

  router.delete(
    '/deletepost/:postId/:userId',
    verifyToken,
    deletePost
  );
  
// Example structure of your backend route handler
router.post('/like', verifyToken, async (req, res) => {
    const { postId } = req.body;
    const userId = req.user.id;
  
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
  
    const index = post.likes.indexOf(userId);
    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(index, 1); // remove like
    }
    await post.save();
  
    res.status(200).json({ likes: post.likes.length, liked: index === -1 });
  });
  

  // Update post (owner or admin)
  router.put(
    '/update/:postId/:userId',
    verifyToken,
    updatePost
  );
export default router;