import { Router } from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} from '../controllers/product.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { validate, productSchema } from '../middleware/validate.middleware.js';
import { uploadProductImages } from '../middleware/upload.middleware.js';
import { generalLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// Public catalog
router.get('/', generalLimiter, getProducts);
router.get('/meta/categories', getCategories);
router.get('/:idOrSlug', getProduct);

// Admin management
router.post('/', protect, authorize('admin'), uploadProductImages.array('images', 4), validate(productSchema), createProduct);
router.put('/:id', protect, authorize('admin'), uploadProductImages.array('images', 4), validate(productSchema.partial()), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

export default router;
