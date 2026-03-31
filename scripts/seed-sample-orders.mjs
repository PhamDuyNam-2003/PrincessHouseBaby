/**
 * Chèn đơn hàng mẫu (schema customer + items + total như MongoDB Compass).
 *
 * Chạy từ thư mục gốc project:
 *   node scripts/seed-sample-orders.mjs
 *
 * Biến môi trường: MONGODB_URI (mặc định giống app: mongodb://localhost:27017/princess-house-baby)
 *
 * Thay các ObjectId product_id bằng _id thật trong collection `products` của bạn.
 */

import mongoose from 'mongoose';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/princess-house-baby';

const SAMPLE_ORDERS = [
  {
    customer: {
      name: 'Nguyen Van e',
      phone: '0912345678',
      address: '123 ABC, Hanoi',
    },
    items: [
      {
        product_id: new mongoose.Types.ObjectId('69be9ecf40af07d459fc620d'),
        variantName: 'Xanh',
        image: 'https://example.com/Phụkiệnkhác_5_Xanh.jpg',
        quantity: 1,
        unit_price: 110500,
        subtotal: 110500,
      },
      {
        product_id: new mongoose.Types.ObjectId('69be9ecf40af07d459fc61d5'),
        variantName: 'Đỏ',
        image: 'https://example.com/Bờm_1_Đỏ.jpg',
        quantity: 2,
        unit_price: 82000,
        subtotal: 164000,
      },
      {
        product_id: new mongoose.Types.ObjectId('69be9ecf40af07d459fc61ed'),
        variantName: 'Xanh',
        image: 'https://example.com/Nơ_2_Xanh.jpg',
        quantity: 3,
        unit_price: 94500,
        subtotal: 283500,
      },
    ],
    total: 558000,
    status: 'pending',
    paymentMethod: 'online',
    paymentStatus: 'pending',
    created_at: new Date('2026-03-21T13:36:15.283Z'),
  },
  {
    customer: {
      name: 'Tran Thi d',
      phone: '0987654321',
      address: '45 Đường XYZ, TP.HCM',
    },
    items: [
      {
        product_id: new mongoose.Types.ObjectId('69be9ecf40af07d459fc620d'),
        variantName: 'Hồng',
        image: 'https://example.com/sample.jpg',
        quantity: 2,
        unit_price: 99000,
        subtotal: 198000,
      },
    ],
    total: 198000,
    status: 'processing',
    paymentMethod: 'COD',
    paymentStatus: 'pending',
    created_at: new Date(),
  },
];

async function main() {
  console.log('Connecting:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  const col = mongoose.connection.db.collection('orders');

  const result = await col.insertMany(SAMPLE_ORDERS);
  console.log('Inserted orders:', result.insertedCount);
  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
