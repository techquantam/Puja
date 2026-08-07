import { Request, Response, NextFunction } from 'express';
import Cart from '../models/Cart';
import { Product } from '../models/Product';
import { AppError } from '../utils/appError';

// Get user cart
export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    let cart = await Cart.findOne({ userId }).populate('items.productId');

    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

// Add item to cart
export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { productId, quantity = 1 } = req.body;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!productId) {
      return next(new AppError('Product ID is required', 400));
    }

    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    if (!product.isActive) {
      return next(new AppError('Product is no longer active', 400));
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    const existingQty = itemIndex > -1 ? cart.items[itemIndex].quantity : 0;
    const targetQty = existingQty + Number(quantity);

    if (targetQty > product.stock) {
      return next(
        new AppError(`Cannot add items. Only ${product.stock} items left in stock.`, 400)
      );
    }

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = targetQty;
    } else {
      cart.items.push({ productId, quantity: Number(quantity) });
    }

    await cart.save();
    await cart.populate('items.productId');

    res.status(200).json({
      success: true,
      message: 'Product added to cart successfully',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

// Update item quantity
export const updateCartItemQuantity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { productId, quantity } = req.body;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!productId || quantity === undefined) {
      return next(new AppError('Product ID and quantity are required', 400));
    }

    const qty = Number(quantity);
    if (qty < 1) {
      return next(new AppError('Quantity must be at least 1', 400));
    }

    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    if (qty > product.stock) {
      return next(
        new AppError(`Cannot set quantity. Only ${product.stock} items left in stock.`, 400)
      );
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      return next(new AppError('Product not found in cart', 404));
    }

    cart.items[itemIndex].quantity = qty;
    await cart.save();
    await cart.populate('items.productId');

    res.status(200).json({
      success: true,
      message: 'Cart quantity updated successfully',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

// Remove item from cart
export const removeFromCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { productId } = req.params;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId.toString()
    );

    await cart.save();
    await cart.populate('items.productId');

    res.status(200).json({
      success: true,
      message: 'Product removed from cart successfully',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

// Clear cart
export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};
