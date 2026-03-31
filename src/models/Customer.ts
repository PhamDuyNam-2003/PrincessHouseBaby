import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  CustomerName: string;
  Email: string;
  Phone: string;
  Address: string;
  Password?: string;
  ProvinceName?: string;
  DistrictName?: string;
  WardName?: string;
}

const customerSchema = new Schema<ICustomer>(
  {
    CustomerName: {
      type: String,
      required: true,
      trim: true,
    },
    Email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    Phone: {
      type: String,
      required: true,
    },
    Address: {
      type: String,
      default: '',
    },
    ProvinceName: { type: String, default: '' },
    DistrictName: { type: String, default: '' },
    WardName: { type: String, default: '' },
    Password: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Customer = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', customerSchema);
