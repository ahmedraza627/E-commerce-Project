import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/order.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { validate, orderSchema } from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

const statusSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
});

// Customer endpoints
router.post('/', protect, validate(orderSchema), createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);

// Admin endpoints
router.get('/', protect, authorize('admin'), getAllOrders);
router.patch('/:id/status', protect, authorize('admin'), validate(statusSchema), updateOrderStatus);

export default router;
