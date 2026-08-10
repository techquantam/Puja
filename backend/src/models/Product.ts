import { Schema, model, Document, Types } from 'mongoose';

export interface ISpecification {
  key: string;
  value: string;
}

export interface IReview {
  userId: Types.ObjectId;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface IProduct extends Document {
  name: string;
  description: string;
  category: Types.ObjectId;
  price: number;
  discountPrice?: number;
  images: string[];
  specifications: ISpecification[];
  rating: number;
  reviewsCount: number;
  reviews: IReview[];
  stock: number;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isFeatured: boolean;
  isFlashSale: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const specificationSchema = new Schema<ISpecification>({
  key: { type: String, required: true },
  value: { type: String, required: true },
}, { _id: false });

const reviewSchema = new Schema<IReview>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      min: [0, 'Discount price cannot be negative'],
    },
    images: {
      type: [String],
      required: [true, 'At least one product image is required'],
      validate: {
        validator: (val: string[]) => val.length > 0,
        message: 'Product must have at least one image',
      },
    },
    specifications: [specificationSchema],
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
    reviews: [reviewSchema],
    stock: {
      type: Number,
      required: [true, 'Product stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isFlashSale: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for text search and category lookups
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });

export const Product = model<IProduct>('Product', productSchema);
