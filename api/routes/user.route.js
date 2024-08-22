import express from 'express';
import {getUsers, test} from '../controllers/user.controller.js';
import { updateUser,deleteUser,signout,getUser } from '../controllers/user.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
const router = express.Router();

router.get('/test',test);
router.delete('/delete/:userId',verifyToken,deleteUser);
router.put('/update/:userId',verifyToken,updateUser);
router.post('/signout',signout);
router.get('/getusers',verifyToken,getUsers);
router.get('/:userId',getUser);

export default router;