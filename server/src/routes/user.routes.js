import { Router } from 'express';
import {
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getUsers,
  setUserActive,
} from '../controllers/user.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { validate, profileSchema, addressSchema } from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

const activeSchema = z.object({ isActive: z.boolean() });

// Profile
router.put('/me', protect, validate(profileSchema), updateProfile);

// Addresses
router.get('/me/addresses', protect, getAddresses);
router.post('/me/addresses', protect, validate(addressSchema), addAddress);
router.put('/me/addresses/:addressId', protect, validate(addressSchema.partial()), updateAddress);
router.delete('/me/addresses/:addressId', protect, deleteAddress);

// Admin
router.get('/', protect, authorize('admin'), getUsers);
router.patch('/:id/active', protect, authorize('admin'), validate(activeSchema), setUserActive);

export default router;
