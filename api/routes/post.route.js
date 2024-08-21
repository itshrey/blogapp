import express from 'express';
import { create } from '../controllers/post.controller.js';
import { verifyToken } from './../utils/verifyUser.js';
import { getPosts } from '../controllers/post.controller.js';
import { deletePost,updatePost } from '../controllers/post.controller.js';
const router= express.Router();

router.post('/create',verifyToken,create);
router.get('/getPosts',getPosts);
router.delete('/deletepost/:postId/:userId',verifyToken,deletePost);
router.put('/updatepost/:postId/:userId',verifyToken,updatePost);
export default router;