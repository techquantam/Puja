import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(2, 'Name must be at least 2 characters'),
    email: z.string({ required_error: 'Email is required' }).email('Invalid email address'),
    phone: z.string({ required_error: 'Phone number is required' }).min(10, 'Phone number must be at least 10 digits'),
    password: z.string({ required_error: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    contact: z.string({ required_error: 'Email or Phone is required' }).min(3, 'Invalid email or phone format'),
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    contact: z.string({ required_error: 'Contact is required' }),
    code: z.string({ required_error: 'OTP code is required' }).length(6, 'OTP must be exactly 6 digits'),
  }),
});

export const resendOtpSchema = z.object({
  body: z.object({
    contact: z.string({ required_error: 'Contact is required' }),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string({ required_error: 'Refresh token is required' }),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    contact: z.string({ required_error: 'Contact is required' }),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    contact: z.string({ required_error: 'Contact is required' }),
    code: z.string({ required_error: 'OTP code is required' }).length(6, 'OTP must be exactly 6 digits'),
    newPassword: z.string({ required_error: 'New password is required' }).min(6, 'Password must be at least 6 characters'),
  }),
});

export const categorySchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Category name is required' }).min(2, 'Name must be at least 2 characters'),
    description: z.string({ required_error: 'Description is required' }).min(5, 'Description must be at least 5 characters'),
    image: z.string({ required_error: 'Category image is required' }).url('Invalid image URL format'),
    isActive: z.boolean().optional(),
  }),
});

export const productSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Product name is required' }).min(2, 'Name must be at least 2 characters'),
    description: z.string({ required_error: 'Description is required' }).min(5, 'Description must be at least 5 characters'),
    category: z.string({ required_error: 'Category ID reference is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Invalid Category ID format'),
    price: z.number({ required_error: 'Price is required' }).min(0, 'Price must be non-negative'),
    discountPrice: z.number().min(0).optional(),
    images: z.array(z.string().url('Invalid image URL format')).min(1, 'At least one image is required'),
    specifications: z.array(z.object({
      key: z.string().min(1, 'Spec key is required'),
      value: z.string().min(1, 'Spec value is required'),
    })).optional(),
    stock: z.number({ required_error: 'Stock quantity is required' }).min(0, 'Stock must be non-negative'),
    isBestSeller: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isFlashSale: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const bannerSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Banner title is required' }),
    image: z.string({ required_error: 'Banner image is required' }).url('Invalid image URL format'),
    link: z.string().optional(),
    isActive: z.boolean().optional(),
    position: z.number().optional(),
  }),
});

