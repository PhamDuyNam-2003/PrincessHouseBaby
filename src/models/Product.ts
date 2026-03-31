import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IVariant {
  variantName: string;
  Price: number;
  Price50: number;
  Price100: number;
  StockQuantity: number;
  ImageURL: string;
}

export interface IProduct extends Document {
  ProductName: string;
  CategoryID: Types.ObjectId;
  Description: string;
  variants: IVariant[];
}

const variantSchema = new Schema<IVariant>({
  variantName: {
    type: String,
    required: true,
  },
  Price: {
    type: Number,
    required: true,
    min: 0,
  },
  Price50: {
    type: Number,
    required: true,
    min: 0,
  },
  Price100: {
    type: Number,
    required: true,
    min: 0,
  },
  StockQuantity: {
    type: Number,
    required: true,
    min: 0,
  },
  ImageURL: {
    type: String,
    required: true,
  },
});

const productSchema = new Schema<IProduct>(
  {
    ProductName: {
      type: String,
      required: true,
      trim: true,
    },
    CategoryID: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    Description: {
      type: String,
      default: '',
    },
    variants: [variantSchema],
  },
  { timestamps: true }
);

export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
