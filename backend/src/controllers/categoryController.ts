import { Request, Response, NextFunction } from 'express';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { AppError } from '../utils/appError';

export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const showAll = req.query.all === 'true'; // Allow admins to fetch disabled categories
    const filter = showAll ? {} : { isActive: true };
    const categories = await Category.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description, image, isActive } = req.body;

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      throw new AppError('Category with this name already exists.', 400);
    }

    const category = await Category.create({
      name,
      description,
      image,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, image, isActive } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      throw new AppError('Category not found.', 404);
    }

    if (name && name !== category.name) {
      const existing = await Category.findOne({ name });
      if (existing) {
        throw new AppError('Category with this name already exists.', 400);
      }
    }

    category.name = name || category.name;
    category.description = description || category.description;
    category.image = image || category.image;
    if (isActive !== undefined) {
      category.isActive = isActive;
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      throw new AppError('Category not found.', 404);
    }

    // Integrity Check: Do not delete if products are linked to this category
    const linkedProductsCount = await Product.countDocuments({ category: id });
    if (linkedProductsCount > 0) {
      throw new AppError(
        `Cannot delete category. There are ${linkedProductsCount} products linked to it.`,
        400
      );
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
