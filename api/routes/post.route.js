import express from 'express';
import { create } from '../controllers/post.controller.js';
import { verifyToken } from './../utils/verifyUser.js';
import { getPosts } from '../controllers/post.controller.js';
const router= express.Router();

router.post('/create',verifyToken,create);
router.get('/getPosts',getPosts);

export default router;