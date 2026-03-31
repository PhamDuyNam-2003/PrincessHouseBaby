import mongoose, { Schema, Document, Types } from 'mongoose';


export interface IOrder extends Document {
  OrderNumber?: string;
  CustomerId?: Types.ObjectId;
  customer?: { name?: string; phone?: string; address?: string };
  Items?: Array<{
    ProductID?: Types.ObjectId;
    product_id?: Types.ObjectId;
    VariantId?: Types.ObjectId;
    variantName?: string;
    image?: string;
    Quantity?: number;
    quantity?: number;
    Price?: number;
    unit_price?: number;
    subtotal?: number;
  }>;
  items?: IOrder['Items'];
  TotalAmount?: number;
  total?: number;
  Address?: string;
  Phone?: string;
  Email?: string;
  Status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  status?: string;
  PaymentMethod?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  created_at?: Date;
}

const orderItemSchema = new Schema(
  {
    ProductID: { type: Schema.Types.ObjectId, ref: 'Product' },
    product_id: { type: Schema.Types.ObjectId, ref: 'Product' },
    VariantId: { type: Schema.Types.ObjectId },
    variantName: { type: String, default: '' },
    image: String,
    Quantity: Number,
    quantity: Number,
    Price: Number,
    unit_price: Number,
    subtotal: Number,
  },
  { _id: true, strict: false }
);

const orderSchema = new Schema<IOrder>(
  {
    OrderNumber: {
      type: String,
      sparse: true,
      unique: true,
    },
    CustomerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    customer: {
      name: String,
      phone: String,
      address: String,
    },
    Items: [orderItemSchema],
    items: [orderItemSchema],
    TotalAmount: Number,
    total: Number,
    Address: String,
    Phone: String,
    Email: String,
    Status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    status: String,
    PaymentMethod: {
      type: String,
      default: 'COD',
    },
    paymentMethod: String,
    paymentStatus: String,
    created_at: Date,
  },
  { strict: false, timestamps: true }
);

export const Order =
  mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);
