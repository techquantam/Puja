import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AppError } from '../utils/appError';

interface DecodedToken {
  id: string;
  role: string;
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = '';

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Not authorized, access token missing.', 401);
    }

    // Verify token
    const secret = process.env.JWT_SECRET || 'super_secret_access_token_key_12345';
    const decoded = jwt.verify(token, secret) as DecodedToken;

    // Fetch user
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw new AppError('User belonging to this token no longer exists.', 401);
    }

    // Attach to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    next(new AppError('Forbidden. Admin access required.', 403));
  }
};
