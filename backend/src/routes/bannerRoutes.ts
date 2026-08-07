import { Router } from 'express';
import {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from '../controllers/bannerController';
import { protect, requireAdmin } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { bannerSchema } from '../utils/validationSchemas';

const router = Router();

// Public route to fetch active sliding banners
router.get('/', getBanners);

// Admin-only CRUD routes
router.post('/', protect, requireAdmin, validate(bannerSchema), createBanner);
router.put('/:id', protect, requireAdmin, validate(bannerSchema), updateBanner);
router.delete('/:id', protect, requireAdmin, deleteBanner);

export default router;
