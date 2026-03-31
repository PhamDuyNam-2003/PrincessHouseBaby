# Princess House Baby - Next.js Application

Ứng dụng e-commerce cho đồ dùng trẻ em được xây dựng bằng **Next.js 16** với full-stack architecture.

## 🚀 Tính năng

- ✅ Danh sách sản phẩm với tìm kiếm
- ✅ Lọc sản phẩm theo danh mục
- ✅ Chi tiết sản phẩm
- ✅ Giỏ hàng (Cart Context)
- ✅ Form thanh toán
- ✅ Quản lý đơn hàng
- ✅ API RESTful tích hợp
- ✅ MongoDB integration

## 📋 Yêu cầu

- Node.js 18+
- MongoDB (local hoặc cloud)
- npm hoặc yarn

## 🔧 Cài đặt

### 1. Cài đặt dependencies

```bash
cd nextjs-app
npm install
```

### 2. Cấu hình MongoDB

Chỉnh sửa file `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/princess-house-baby
```

Hoặc sử dụng MongoDB Atlas:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/princess-house-baby
```

### 3. Chạy development server

```bash
npm run dev
```

Truy cập: http://localhost:3000

## 📁 Cấu trúc dự án

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── products/         # Product endpoints
│   │   ├── categories/       # Category endpoints
│   │   ├── customers/        # Customer endpoints
│   │   └── orders/           # Order endpoints
│   ├── checkout/             # Checkout page
│   ├── product/[id]/         # Product detail page
│   ├── order-success/        # Order confirmation
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── globals.css           # Global styles
├── components/               # React components
│   ├── Header.tsx           # Header component
│   ├── Footer.tsx           # Footer component
│   ├── ProductCard.tsx      # Product card
│   └── ProductList.tsx      # Product list
├── context/                  # React Context
│   └── CartContext.tsx      # Cart state management
├── models/                   # Mongoose schemas
│   ├── Category.ts
│   ├── Product.ts
│   ├── Customer.ts
│   └── Order.ts
├── lib/                      # Utilities
│   └── mongodb.ts           # Database connection
└── public/                   # Static files
```

## 🔌 API Endpoints

### Products
- `GET /api/products` - Lấy tất cả sản phẩm
- `GET /api/products/[id]` - Lấy chi tiết sản phẩm
- `POST /api/products` - Tạo sản phẩm mới
- `PUT /api/products/[id]` - Cập nhật sản phẩm
- `DELETE /api/products/[id]` - Xóa sản phẩm

### Categories
- `GET /api/categories` - Lấy tất cả danh mục
- `POST /api/categories` - Tạo danh mục mới

### Customers
- `GET /api/customers` - Lấy tất cả khách hàng
- `POST /api/customers` - Tạo khách hàng mới

### Orders
- `GET /api/orders` - Lấy tất cả đơn hàng
- `POST /api/orders` - Tạo đơn hàng mới

## 🛠️ Technology Stack

- **Frontend**: React 18, Next.js 16, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB, Mongoose
- **State Management**: React Context API

## 📝 Các bước tiếp theo

1. Thêm authentication (JWT)
2. Thêm admin dashboard
3. Tích hợp payment gateway
4. Thêm email notifications
5. Deployment (Vercel/AWS)

## 🚀 Build & Deploy

### Production Build

```bash
npm run build
npm start
```

### Deploy to Vercel

```bash
npm i -g vercel
vercel
```

## 📧 Support

Liên hệ: info@princesshousebaby.com

---

**Lưu ý**: Đảm bảo MongoDB đang chạy trước khi khởi động ứng dụng!
# PrincessHouseBaby
# PrincessHouseBaby
# PrincessHouseBaby
