import express from 'express';
import {test} from '../controllers/user.controller.js';
import { updateUser,deleteUser } from '../controllers/user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
const router = express.Router();

router.get('/test',test);
router.delete('/delete/:userId',verifyToken,deleteUser);
router.put('/update/:userId',verifyToken,updateUser);

export default router;