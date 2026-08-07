import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';
import { protect, requireAdmin } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { categorySchema } from '../utils/validationSchemas';

const router = Router();

// Public route to list active categories
router.get('/', getCategories);

// Admin-only CRUD routes
router.post('/', protect, requireAdmin, validate(categorySchema), createCategory);
router.put('/:id', protect, requireAdmin, validate(categorySchema), updateCategory);
router.delete('/:id', protect, requireAdmin, deleteCategory);

export default router;
