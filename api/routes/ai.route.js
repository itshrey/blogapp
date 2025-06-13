import express from "express";
import { summarizeBlog } from "../controllers/ai.controller.js";
import { improveBlog,generateTitle } from '../controllers/ai.controller.js';
const router = express.Router();

router.post('/improve', improveBlog);
router.post('/improve-title', generateTitle);
router.post("/summarize-blog", summarizeBlog);
export default router;
