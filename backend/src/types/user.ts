import { Document, Model } from 'mongoose';

export interface IAddress {
  _id?: any;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  otpCode: string | null;
  otpExpiresAt: Date | null;
  refreshToken: string | null;
  addresses: IAddress[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(password: string): Promise<boolean>;
}

export type UserModel = Model<IUser, {}, IUserMethods>;
