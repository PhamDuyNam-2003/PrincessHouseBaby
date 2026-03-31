
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// --- 1. SCHEMA ---
const categorySchema = new mongoose.Schema({ CategoryName: String });
const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

const customerSchema = new mongoose.Schema({
    _id: String,
    CustomerName: String,
    PhoneNumber: String,
    Address: String,
    Email: String,
    isVerified: Boolean
});
const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);

const productSchema = new mongoose.Schema({
    ProductName: String,
    CategoryID: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    Description: String,
    variants: Array,
    rating: Number,
    sold: Number,
    created_at: Date
});
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

const orderSchema = new mongoose.Schema({
    customer: Object,
    items: Array,
    total: Number,
    status: String,
    paymentMethod: String,
    paymentStatus: String,
    created_at: Date
});
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

// --- 2. RANDOM ---
const randomEl = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomPhone = () => '0' + Math.floor(Math.random() * 900000000 + 100000000);

// --- ẢNH THẬT ---
const realImages = [
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400",
    "https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?w=400",
    "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=400",
    "https://images.unsplash.com/photo-1585386959984-a41552231658?w=400",
    "https://images.unsplash.com/photo-1618354691438-25bc04584c23?w=400",
    "https://images.unsplash.com/photo-1593032465171-8f0b8c9a3b38?w=400",
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=400",
    "https://images.unsplash.com/photo-1521334884684-d80222895322?w=400"
];

const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

// --- DATA NGẪU NHIÊN ---
const firstNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh"];
const middleNames = ["Thị", "Văn", "Ngọc", "Thanh"];
const lastNames = ["Anh", "Linh", "Hương", "Trang", "Phúc"];

const streets = ["Hai Bà Trưng", "Lê Lợi", "Nguyễn Huệ"];
const cities = ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng"];

const generateRandomCustomer = (index) => ({
    _id: `cus${String(index).padStart(3, '0')}`,
    CustomerName: `${randomEl(firstNames)} ${randomEl(middleNames)} ${randomEl(lastNames)}`,
    PhoneNumber: randomPhone(),
    Address: `${Math.floor(Math.random() * 200)} ${randomEl(streets)}, ${randomEl(cities)}`,
    Email: `customer${index}@gmail.com`,
    isVerified: Math.random() > 0.5
});

const productNames = [
    "Kẹp tóc hoa cúc", "Vương miện công chúa", "Băng đô nơ Hàn Quốc",
    "Dây buộc tóc dễ thương", "Kẹp mái ngọc trai", "Set phụ kiện bé gái"
];

const generateRandomProduct = (categoryIds) => {
    const basePrice = (Math.floor(Math.random() * 5) + 2) * 10000;
    const images = shuffle([...realImages]).slice(0, 3);

    return {
        ProductName: `${randomEl(productNames)} - Mẫu ${Math.floor(Math.random() * 999)}`,
        CategoryID: randomEl(categoryIds),
        Description: "Phụ kiện cao cấp cho bé, mềm mại, an toàn.",
        variants: [
            {
                variantName: randomEl(["Hồng", "Trắng", "Tím", "Vàng"]),
                Price: basePrice,
                Price50: Math.floor(basePrice * 0.9),
                Price100: Math.floor(basePrice * 0.8),
                StockQuantity: Math.floor(Math.random() * 200) + 10,
                ImageURL: images[0],
                images: images
            }
        ],
        rating: +(Math.random() * 2 + 3).toFixed(1),
        sold: Math.floor(Math.random() * 500),
        created_at: new Date()
    };
};

// --- 3. SEED ---
async function seedDB() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected DB:", mongoose.connection.name);

        // 🔥 reset DB
        await mongoose.connection.dropDatabase();
        console.log("🗑️ Đã xóa toàn bộ database");

        // 🔥 tạo category
        console.log("📂 Đang tạo Category...");
        const categoryData = [
            { CategoryName: "Kẹp tóc" },
            { CategoryName: "Băng đô" },
            { CategoryName: "Nơ" },
            { CategoryName: "Bờm tóc" },
            { CategoryName: "Phụ kiện khác" }
        ];

        const insertedCategories = await Category.insertMany(categoryData);
        console.log("✅ Category:", insertedCategories.length);

        const categoryIds = insertedCategories.map(c => c._id);

        // 👤 Customer
        const customers = Array.from({ length: 50 }, (_, i) => generateRandomCustomer(i + 1));
        const insertedCustomers = await Customer.insertMany(customers);
        console.log("✅ Customers:", insertedCustomers.length);

        // 🛍 Product
        const products = Array.from({ length: 30 }, () => generateRandomProduct(categoryIds));
        const insertedProducts = await Product.insertMany(products);
        console.log("✅ Products:", insertedProducts.length);

        // 📦 Orders
        const orders = [];
        for (let i = 0; i < 100; i++) {
            const customer = randomEl(insertedCustomers);
            const items = [];
            let total = 0;

            const count = Math.floor(Math.random() * 3) + 1;
            for (let j = 0; j < count; j++) {
                const product = randomEl(insertedProducts);
                const v = product.variants[0];
                const qty = Math.floor(Math.random() * 3) + 1;

                const sub = v.Price * qty;

                items.push({
                    product_id: product._id,
                    variantName: v.variantName,
                    image: v.ImageURL,
                    quantity: qty,
                    unit_price: v.Price,
                    subtotal: sub
                });

                total += sub;
            }

            orders.push({
                customer: {
                    name: customer.CustomerName,
                    phone: customer.PhoneNumber,
                    address: customer.Address
                },
                items,
                total,
                status: randomEl(["pending", "processing", "shipped", "delivered"]),
                paymentMethod: randomEl(["cod", "online"]),
                paymentStatus: randomEl(["pending", "completed"]),
                created_at: new Date(Date.now() - Math.random() * 30 * 86400000)
            });
        }

        await Order.insertMany(orders);
        console.log("✅ Orders:", orders.length);

        console.log("🎉 DONE SEED DATA XỊN!");
        process.exit();

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedDB();

