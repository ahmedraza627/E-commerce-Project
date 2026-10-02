import { Router } from 'express';
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../controllers/cart.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate, cartItemSchema, cartQtySchema } from '../middleware/validate.middleware.js';

const router = Router();

// Every cart route requires an authenticated user
router.use(protect);

router.route('/')
  .get(getCart)
  .delete(clearCart);

router.post('/items', validate(cartItemSchema), addCartItem);

router.patch('/items/:productId', validate(cartQtySchema), updateCartItem);
router.delete('/items/:productId', removeCartItem);

export default router;
