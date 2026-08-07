import { Schema, model, Document } from 'mongoose';

export interface IBanner extends Document {
  title: string;
  image: string;
  link?: string;
  isActive: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Banner image URL is required'],
    },
    link: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    position: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Banner = model<IBanner>('Banner', bannerSchema);
