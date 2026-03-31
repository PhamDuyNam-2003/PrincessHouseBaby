import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  CategoryName: string;
  Description?: string;
}

const categorySchema = new Schema<ICategory>(
  {
    CategoryName: {
      type: String,
      required: true,
      trim: true,
    },
    Description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema);
