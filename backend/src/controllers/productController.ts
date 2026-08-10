import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { User } from '../models/User';
import { AppError } from '../utils/appError';

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      search,
      category,
      isBestSeller,
      isNewArrival,
      isFeatured,
      isFlashSale,
      minPrice,
      maxPrice,
      sort,
      all,
    } = req.query;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build query filter
    const query: any = {};

    // Clients only see active products
    if (all !== 'true') {
      query.isActive = true;
    }

    if (search) {
      query.$text = { $search: search as string };
    }

    if (category) {
      query.category = category as string;
    }

    if (isBestSeller === 'true') {
      query.isBestSeller = true;
    }

    if (isNewArrival === 'true') {
      query.isNewArrival = true;
    }

    if (isFeatured === 'true') {
      query.isFeatured = true;
    }

    if (isFlashSale === 'true') {
      query.isFlashSale = true;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice as string);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice as string);
    }

    // Build sorting logic
    let sortQuery: any = { createdAt: -1 }; // Default: newest first

    if (sort === 'price_asc') {
      sortQuery = { price: 1 };
    } else if (sort === 'price_desc') {
      sortQuery = { price: -1 };
    } else if (sort === 'rating') {
      sortQuery = { rating: -1 };
    } else if (sort === 'newest') {
      sortQuery = { createdAt: -1 };
    }

    const products = await Product.find(query)
      .populate('category', 'name image')
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total: totalProducts,
        page,
        limit,
        pages: Math.ceil(totalProducts / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate('category', 'name image description');
    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    // Fetch related products (same category, excluding current product, limit 4)
    const relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
      isActive: true,
    })
      .select('name price discountPrice images rating reviewsCount isBestSeller')
      .limit(4);

    res.status(200).json({
      success: true,
      data: {
        product,
        relatedProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      name,
      description,
      category,
      price,
      discountPrice,
      images,
      specifications,
      stock,
      isBestSeller,
      isNewArrival,
      isFeatured,
      isFlashSale,
      isActive,
    } = req.body;

    // Validate category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      throw new AppError('Specified category does not exist.', 400);
    }

    const product = await Product.create({
      name,
      description,
      category,
      price,
      discountPrice,
      images,
      specifications: specifications || [],
      stock,
      isBestSeller: isBestSeller || false,
      isNewArrival: isNewArrival || false,
      isFeatured: isFeatured || false,
      isFlashSale: isFlashSale || false,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const product = await Product.findById(id);
    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    // If category is being updated, validate it
    if (updateData.category && updateData.category !== product.category.toString()) {
      const categoryExists = await Category.findById(updateData.category);
      if (!categoryExists) {
        throw new AppError('Specified category does not exist.', 400);
      }
    }

    // Validate discountPrice < price manually
    // (Mongoose `this` context is unreliable with findByIdAndUpdate + runValidators)
    const finalPrice = updateData.price !== undefined ? Number(updateData.price) : product.price;
    if (updateData.discountPrice !== undefined && updateData.discountPrice !== null) {
      if (Number(updateData.discountPrice) >= finalPrice) {
        throw new AppError('Discount price must be strictly lower than original price.', 400);
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate('category', 'name image');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const addProductReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated.', 401);
    }

    if (!rating || !comment) {
      throw new AppError('Rating and comment are required.', 400);
    }

    const ratingVal = Number(rating);
    if (ratingVal < 1 || ratingVal > 5) {
      throw new AppError('Rating must be between 1 and 5.', 400);
    }

    const product = await Product.findById(id);
    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    // Check if user has already reviewed
    const hasReviewed = product.reviews.some(
      (r) => r.userId.toString() === userId.toString()
    );

    if (hasReviewed) {
      throw new AppError('You have already submitted a review for this product.', 400);
    }

    // Get user name from database
    const userDoc = await User.findById(userId);
    const userName = userDoc ? userDoc.name : 'Spiritual Devotee';

    const newReview = {
      userId,
      userName,
      rating: ratingVal,
      comment,
      createdAt: new Date(),
    };

    product.reviews.push(newReview as any);
    product.reviewsCount = product.reviews.length;

    // Calculate new average rating
    const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.rating = totalRating / product.reviews.length;

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully.',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};
