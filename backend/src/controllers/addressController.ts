import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { AppError } from '../utils/appError';

// Get all saved addresses
export const getAddresses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated.', 401);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    res.status(200).json({
      success: true,
      data: user.addresses || [],
    });
  } catch (error) {
    next(error);
  }
};

// Add new address
export const addAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { name, phone, street, city, state, pincode, isDefault = false } = req.body;

    if (!userId) {
      throw new AppError('User not authenticated.', 401);
    }

    if (!name || !phone || !street || !city || !state || !pincode) {
      throw new AppError('All address fields are required.', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    // Set other addresses as default = false if isDefault is true,
    // or if this is the user's first address, make it default automatically!
    const makeDefault = isDefault || (user.addresses?.length === 0);

    if (makeDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      name,
      phone,
      street,
      city,
      state,
      pincode,
      isDefault: makeDefault,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully.',
      data: user.addresses,
    });
  } catch (error) {
    next(error);
  }
};

// Update address
export const updateAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { addressId } = req.params;
    const { name, phone, street, city, state, pincode, isDefault } = req.body;

    if (!userId) {
      throw new AppError('User not authenticated.', 401);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const address = (user.addresses as any).id(addressId);
    if (!address) {
      throw new AppError('Address not found.', 404);
    }

    if (name) address.name = name;
    if (phone) address.phone = phone;
    if (street) address.street = street;
    if (city) address.city = city;
    if (state) address.state = state;
    if (pincode) address.pincode = pincode;

    if (isDefault !== undefined) {
      if (isDefault) {
        user.addresses.forEach((addr) => {
          addr.isDefault = false;
        });
        address.isDefault = true;
      } else {
        address.isDefault = false;
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully.',
      data: user.addresses,
    });
  } catch (error) {
    next(error);
  }
};

// Delete address
export const deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { addressId } = req.params;

    if (!userId) {
      throw new AppError('User not authenticated.', 401);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id?.toString() === addressId
    );

    if (addressIndex === -1) {
      throw new AppError('Address not found.', 404);
    }

    const wasDefault = user.addresses[addressIndex].isDefault;
    user.addresses.splice(addressIndex, 1);

    // If we deleted the default address, and we still have other addresses left, make the first one default!
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully.',
      data: user.addresses,
    });
  } catch (error) {
    next(error);
  }
};

// Set default address
export const setDefaultAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { addressId } = req.params;

    if (!userId) {
      throw new AppError('User not authenticated.', 401);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    let found = false;
    user.addresses.forEach((addr) => {
      if (addr._id?.toString() === addressId) {
        addr.isDefault = true;
        found = true;
      } else {
        addr.isDefault = false;
      }
    });

    if (!found) {
      throw new AppError('Address not found.', 404);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Default address set successfully.',
      data: user.addresses,
    });
  } catch (error) {
    next(error);
  }
};
