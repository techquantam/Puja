import { Request, Response, NextFunction } from 'express';
import Order from '../models/Order';
import Cart from '../models/Cart';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { AppError } from '../utils/appError';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
  });
};

// Create new order
export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { addressId, paymentMethod } = req.body;

    if (!userId) {
      throw new AppError('User not authenticated.', 401);
    }

    if (!addressId || !paymentMethod) {
      throw new AppError('Shipping address and payment method are required.', 400);
    }

    if (!['COD', 'Online'].includes(paymentMethod)) {
      throw new AppError('Invalid payment method.', 400);
    }

    // Get user address
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const shippingAddress = (user.addresses as any).id(addressId);
    if (!shippingAddress) {
      throw new AppError('Shipping address not found.', 404);
    }

    // Get user cart
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      throw new AppError('Your shopping cart is empty.', 400);
    }

    // Validate stock and calculate prices
    const orderItems: any[] = [];
    let subtotal = 0;
    let discount = 0;

    for (const item of cart.items) {
      const product = item.productId as any;
      if (!product) {
        throw new AppError('One of the products in your cart no longer exists.', 400);
      }

      if (product.stock < item.quantity) {
        throw new AppError(
          `Insufficient stock for "${product.name}". Only ${product.stock} items left.`,
          400
        );
      }

      const itemPrice = product.price;
      const itemDiscPrice = product.discountPrice || itemPrice;

      subtotal += itemPrice * item.quantity;
      discount += (itemPrice - itemDiscPrice) * item.quantity;

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: itemDiscPrice,
      });
    }

    const shippingCharges = subtotal - discount > 500 ? 0 : 49;
    const totalAmount = subtotal - discount + shippingCharges;

    // Create Order
    const order = new Order({
      userId,
      items: orderItems,
      shippingAddress: {
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
      },
      paymentMethod,
      paymentStatus: 'Pending',
      orderStatus: 'Placed',
      subtotal,
      discount,
      shippingCharges,
      totalAmount,
    });

    await order.save();

    // Razorpay Integration Setup (Online Payments)
    let razorpayOrderId = '';
    if (paymentMethod === 'Online') {
      try {
        const razorpay = getRazorpayInstance();
        const rzpOrder = await razorpay.orders.create({
          amount: Math.round(totalAmount * 100), // amount in paisa
          currency: 'INR',
          receipt: `receipt_${order._id}`,
        });
        razorpayOrderId = rzpOrder.id;
        order.razorpayOrderId = razorpayOrderId;
        await order.save();
      } catch (err: any) {
        // Rollback created order if Razorpay creation fails
        await Order.findByIdAndDelete(order._id);
        throw new AppError(`Razorpay order creation failed: ${err.message}`, 500);
      }
    }

    // If COD, decrement stock and clear cart immediately
    if (paymentMethod === 'COD') {
      for (const item of cart.items) {
        await Product.findByIdAndUpdate(item.productId._id, {
          $inc: { stock: -item.quantity },
        });
      }
      cart.items = [];
      await cart.save();
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      data: {
        order,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verify payment for online payments
export const verifyOrderPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    if (!userId) {
      throw new AppError('User not authenticated.', 401);
    }

    if (!orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      throw new AppError('Order validation fields are missing.', 400);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found.', 404);
    }

    if (order.paymentStatus === 'Completed') {
      return res.status(200).json({
        success: true,
        message: 'Order payment is already verified.',
        data: order,
      });
    }

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '');
    hmac.update(razorpayOrderId + '|' + razorpayPaymentId);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpaySignature) {
      throw new AppError('Payment signature verification failed.', 400);
    }

    // Transition statuses
    order.paymentStatus = 'Completed';
    order.razorpayOrderId = razorpayOrderId;
    order.razorpayPaymentId = razorpayPaymentId;
    await order.save();

    // Decrement stock since order is finalized
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    // Clear cart
    const cart = await Cart.findOne({ userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully.',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// Get order history
export const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated.', 401);
    }

    const orders = await Order.find({ userId })
      .populate('items.productId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// Cancel order
export const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;

    if (!userId) {
      throw new AppError('User not authenticated.', 401);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found.', 404);
    }

    if (order.userId.toString() !== userId.toString()) {
      throw new AppError('You are not authorized to cancel this order.', 403);
    }

    if (['Delivered', 'Cancelled'].includes(order.orderStatus)) {
      throw new AppError(`Cannot cancel order when status is ${order.orderStatus}.`, 400);
    }

    const wasStockDecremented = order.paymentMethod === 'COD' || order.paymentStatus === 'Completed';

    order.orderStatus = 'Cancelled';
    await order.save();

    // Restore stock if it was previously decremented
    if (wasStockDecremented) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully.',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;

    if (!userId) {
      throw new AppError('User not authenticated.', 401);
    }

    const order = await Order.findById(orderId).populate('items.productId');
    if (!order) {
      throw new AppError('Order not found.', 404);
    }

    if (order.userId.toString() !== userId.toString()) {
      throw new AppError('You are not authorized to view this order.', 403);
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOrdersAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email phone')
      .populate('items.productId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatusAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found.', 404);
    }

    const previousStatus = order.orderStatus;

    if (orderStatus) {
      if (!['Placed', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].includes(orderStatus)) {
        throw new AppError('Invalid order status.', 400);
      }
      order.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      if (!['Pending', 'Completed', 'Failed'].includes(paymentStatus)) {
        throw new AppError('Invalid payment status.', 400);
      }
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    // If transition to Cancelled and previous was not Cancelled, restore stock
    if (orderStatus === 'Cancelled' && previousStatus !== 'Cancelled') {
      const wasStockDecremented = order.paymentMethod === 'COD' || order.paymentStatus === 'Completed';
      if (wasStockDecremented) {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: item.quantity },
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Order updated successfully by administrator.',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
