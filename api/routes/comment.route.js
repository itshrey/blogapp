import express from 'express';
import {
  createComment,
  getPostComments,
  likeComment,
  editComment,
  deleteComment,
  getComments
} from '../controllers/comment.controller.js';
import { 
  verifyToken,
  verifiedOnly,
  adminOnly,
  trackActivity
} from '../middleware/auth.middleware.js';

const router = express.Router();

// Create comment (verified users only)
router.post(
  '/create',
  verifyToken,
  trackActivity,
  createComment
);

// Get comments for a post (public)
router.get(
  '/post/:postId',
  getPostComments
);

// Like/unlike comment (verified users only)
router.put(
  '/like/:commentId',
  verifyToken,
  trackActivity,
  likeComment
);

// Edit comment (owner or admin)
router.put(
  '/:commentId',
  verifyToken,
  trackActivity,
  editComment
);

// Delete comment (owner or admin)
router.delete(
  '/:commentId',
  verifyToken,
  deleteComment
);

// Get all comments (admin only)
router.get(
  '/',
  verifyToken,
  adminOnly,
  getComments
);

export default router;