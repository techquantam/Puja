import { Router } from 'express';
import {
  register,
  verifyOTP,
  login,
  resendOTP,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,
  getProfile,
  updateProfile,
} from '../controllers/authController';
import { validate } from '../middlewares/validate';
import { protect } from '../middlewares/auth';
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../utils/validationSchemas';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/verify-otp', validate(verifyOtpSchema), verifyOTP);
router.post('/login', validate(loginSchema), login);
router.post('/resend-otp', validate(resendOtpSchema), resendOTP);
router.post('/refresh-token', validate(refreshTokenSchema), refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/logout', protect, logout);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

export default router;
