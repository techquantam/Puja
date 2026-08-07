import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
} from '../controllers/productController';
import { protect, requireAdmin } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { productSchema } from '../utils/validationSchemas';

const router = Router();

// Public routes for product lookups
router.get('/', getProducts);
router.get('/:id', getProductById);

// Review submission route (Authenticated users)
router.post('/:id/review', protect, addProductReview);

// Admin-only CRUD routes
router.post('/', protect, requireAdmin, validate(productSchema), createProduct);
router.put('/:id', protect, requireAdmin, validate(productSchema), updateProduct);
router.delete('/:id', protect, requireAdmin, deleteProduct);

export default router;
