import express from 'express';
import {
  test,
  updateUser,
  deleteUser,
  signout,
  getUser,
} from '../controllers/user.controller.js';
import { verifyToken, adminOnly, verifiedOnly } from '../middleware/auth.middleware.js';
const router = express.Router();

// Public route
router.get('/test', test);

// Authenticated routes
router.put('/update/:userId', verifyToken, updateUser);
router.post('/signout', verifyToken, signout);
router.get('/:userId', verifyToken, getUser);

// Admin-only routes

router.delete('/delete/:userId', verifyToken, adminOnly, deleteUser);




export default router;