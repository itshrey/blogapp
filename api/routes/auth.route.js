import express from 'express';
import {
  signup,
  signin,
  google,
  adminSignup,
  sendAdminOtp
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/google', google);
router.post('/admin/send-otp', sendAdminOtp);
router.post('/admin/signup', adminSignup);

export default router;