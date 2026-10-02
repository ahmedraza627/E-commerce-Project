import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  logoutAllDevices,
  me,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate, registerSchema, loginSchema } from '../middleware/validate.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', refresh); // rotation endpoint — deliberately not rate-limited as hard
router.post('/logout', logout);
router.post('/logout-all', protect, logoutAllDevices);
router.get('/me', protect, me);

export default router;
