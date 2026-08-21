import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, requireAdmin } from '../middlewares/auth';
import { AppError } from '../utils/appError';
import { v2 as cloudinary } from 'cloudinary';

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only image files (jpeg, jpg, png, webp, gif) are allowed!'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter,
});

// POST /api/upload - Admin only
router.post(
  '/',
  protect,
  requireAdmin,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('image')(req, res, async (err) => {
      if (err) {
        return next(new AppError(err.message, 400));
      }
      if (!req.file) {
        return next(new AppError('No file uploaded.', 400));
      }

      try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'puja_products',
        });
        
        // Remove file from local storage
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        res.status(200).json({
          success: true,
          message: 'Image uploaded successfully.',
          imageUrl: result.secure_url,
        });
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        // Clean up local file in case of error
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return next(new AppError('Failed to upload image to cloud storage.', 500));
      }
    });
  }
);

export default router;

