import { Router } from 'express';
import {
  getMyOrders,
  getOrderById,
  createOrder,
  verifyOrderPayment,
  cancelOrder,
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
} from '../controllers/orderController';
import { protect, requireAdmin } from '../middlewares/auth';

const router = Router();

// Protect all order routes
router.use(protect);

// Customer routes
router.get('/', getMyOrders);
router.get('/:orderId', getOrderById);
router.post('/', createOrder);
router.post('/verify', verifyOrderPayment);
router.put('/:orderId/cancel', cancelOrder);

// Admin-only order routes
router.get('/admin/all', requireAdmin, getAllOrdersAdmin);
router.put('/admin/:orderId/status', requireAdmin, updateOrderStatusAdmin);

export default router;
