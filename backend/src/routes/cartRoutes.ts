import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
} from '../controllers/cartController';
import { protect } from '../middlewares/auth';

const router = Router();

// Protect all routes
router.use(protect);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateCartItemQuantity);
router.delete('/remove/:productId', removeFromCart);
router.delete('/clear', clearCart);

export default router;
