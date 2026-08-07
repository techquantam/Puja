import { Request, Response, NextFunction } from 'express';
import { Banner } from '../models/Banner';
import { AppError } from '../utils/appError';

export const getBanners = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const showAll = req.query.all === 'true';
    const filter = showAll ? {} : { isActive: true };
    const banners = await Banner.find(filter).sort({ position: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: banners,
    });
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, image, link, isActive, position } = req.body;

    const banner = await Banner.create({
      title,
      image,
      link,
      isActive: isActive !== undefined ? isActive : true,
      position: position !== undefined ? position : 0,
    });

    res.status(201).json({
      success: true,
      message: 'Banner created successfully.',
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBanner = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, image, link, isActive, position } = req.body;

    const banner = await Banner.findById(id);
    if (!banner) {
      throw new AppError('Banner not found.', 404);
    }

    banner.title = title || banner.title;
    banner.image = image || banner.image;
    banner.link = link !== undefined ? link : banner.link;
    if (isActive !== undefined) {
      banner.isActive = isActive;
    }
    if (position !== undefined) {
      banner.position = position;
    }

    await banner.save();

    res.status(200).json({
      success: true,
      message: 'Banner updated successfully.',
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);
    if (!banner) {
      throw new AppError('Banner not found.', 404);
    }

    await Banner.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Banner deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
