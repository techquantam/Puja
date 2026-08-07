import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { generateOTP, sendOTP } from '../services/otpService';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../services/tokenService';
import { AppError } from '../utils/appError';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      throw new AppError('Email or Phone number is already registered.', 400);
    }

    // Create user (verified by default now!)
    const newUser = await User.create({
      name,
      email,
      phone,
      password,
      isVerified: true,
    });

    // Generate tokens
    const payload = { id: newUser._id.toString(), role: newUser.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          isVerified: newUser.isVerified,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { contact, code } = req.body; // contact can be email or phone

    const user = await User.findOne({
      $or: [{ email: contact }, { phone: contact }],
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      throw new AppError('No OTP has been sent to this user.', 400);
    }

    // Verify OTP code and expiry
    if (user.otpCode !== code) {
      throw new AppError('Invalid OTP code.', 400);
    }

    if (new Date() > user.otpExpiresAt) {
      throw new AppError('OTP code has expired. Please request a new one.', 400);
    }

    // Update user status
    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;

    // Generate tokens
    const payload = { id: user._id.toString(), role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'OTP verification successful.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { contact, password } = req.body; // contact is either email or phone

    const user = await User.findOne({
      $or: [{ email: contact }, { phone: contact }],
    });

    if (!user) {
      throw new AppError('Invalid login credentials.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid login credentials.', 401);
    }

    // Check verification status
    if (!user.isVerified) {
      // Re-trigger OTP
      const { code, expiresAt } = generateOTP(10);
      user.otpCode = code;
      user.otpExpiresAt = expiresAt;
      await user.save();

      await sendOTP(user.phone || user.email, code);

      res.status(403).json({
        success: false,
        message: 'Account not verified. OTP sent, verification required.',
        requiresVerification: true,
        data: {
          contact: user.phone || user.email,
          otp: process.env.NODE_ENV === 'development' ? code : undefined,
        },
      });
      return;
    }

    // Generate tokens
    const payload = { id: user._id.toString(), role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const resendOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { contact } = req.body;

    const user = await User.findOne({
      $or: [{ email: contact }, { phone: contact }],
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    // Generate new OTP
    const { code, expiresAt } = generateOTP(10);
    user.otpCode = code;
    user.otpExpiresAt = expiresAt;
    await user.save();

    // Send OTP
    await sendOTP(user.phone || user.email, code);

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully.',
      data: {
        otp: process.env.NODE_ENV === 'development' ? code : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      throw new AppError('Refresh token is required.', 400);
    }

    // Verify token
    const decoded = verifyRefreshToken(token);

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      throw new AppError('Invalid or expired refresh token.', 401);
    }

    // Generate new set of tokens (rotation)
    const payload = { id: user._id.toString(), role: user.role };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully.',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { contact } = req.body;

    const user = await User.findOne({
      $or: [{ email: contact }, { phone: contact }],
    });

    if (!user) {
      // For security, don't disclose that the user doesn't exist
      res.status(200).json({
        success: true,
        message: 'If the account exists, an OTP has been sent for password reset.',
      });
      return;
    }

    // Generate recovery OTP
    const { code, expiresAt } = generateOTP(10);
    user.otpCode = code;
    user.otpExpiresAt = expiresAt;
    await user.save();

    // Send OTP
    await sendOTP(user.phone || user.email, code);

    res.status(200).json({
      success: true,
      message: 'If the account exists, an OTP has been sent for password reset.',
      data: {
        otp: process.env.NODE_ENV === 'development' ? code : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { contact, code, newPassword } = req.body;

    const user = await User.findOne({
      $or: [{ email: contact }, { phone: contact }],
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    if (!user.otpCode || !user.otpExpiresAt) {
      throw new AppError('No recovery OTP request exists for this user.', 400);
    }

    if (user.otpCode !== code) {
      throw new AppError('Invalid OTP code.', 400);
    }

    if (new Date() > user.otpExpiresAt) {
      throw new AppError('OTP has expired. Please request a new one.', 400);
    }

    // Reset password & clear OTP fields
    user.password = newPassword;
    user.otpCode = null;
    user.otpExpiresAt = null;
    user.refreshToken = null; // Invalidate all sessions
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. Please login with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Not authenticated.', 401);
    }

    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated.', 401);
    }

    const user = await User.findById(userId).select('-password -otpCode -otpExpiresAt -refreshToken');
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { name, phone } = req.body;

    if (!userId) {
      throw new AppError('User not authenticated.', 401);
    }

    if (!name || !phone) {
      throw new AppError('Name and phone are required.', 400);
    }

    if (phone.length !== 10 || isNaN(Number(phone))) {
      throw new AppError('Please enter a valid 10-digit phone number.', 400);
    }

    // Check if phone number is taken by another user
    const existingUser = await User.findOne({ phone, _id: { $ne: userId } });
    if (existingUser) {
      throw new AppError('Phone number is already registered by another devotee.', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    user.name = name.trim();
    user.phone = phone.trim();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};
