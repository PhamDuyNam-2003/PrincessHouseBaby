'use client';

import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';

type ProvinceRow = { code: number; name: string };
type DistrictRow = { code: number; name: string };
type WardRow = { code: number; name: string };

const normalizeText = (str: string) =>
  str
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

export default function CheckoutPage() {
  const { cart, clearCart, updateQuantity, removeFromCart, cartHydrated } =
    useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState<ProvinceRow[]>([]);
  const [districts, setDistricts] = useState<DistrictRow[]>([]);
  const [wards, setWards] = useState<WardRow[]>([]);
  const [provinceCode, setProvinceCode] = useState<number | null>(null);
  const [districtCode, setDistrictCode] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    CustomerName: '',
    Email: '',
    Phone: '',
    Address: '',
    Province: '',
    District: '',
    Ward: '',
    PaymentMethod: 'COD',
  });

  const [provinceSearch, setProvinceSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [wardSearch, setWardSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('https://provinces.open-api.vn/api/p/');
        const data = await res.json();
        if (!cancelled && Array.isArray(data)) setProvinces(data);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!provinceCode) {
      setDistricts([]);
      setWards([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`
        );
        const data = await res.json();
        if (cancelled) return;
        setDistricts(data.districts || []);
        setWards([]);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [provinceCode]);

  useEffect(() => {
    if (!districtCode) {
      setWards([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`
        );
        const data = await res.json();
        if (cancelled) return;
        setWards(data.wards || []);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [districtCode]);

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.ProductPrice * item.quantity,
    0
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const fullAddress = [
      formData.Address,
      formData.Ward,
      formData.District,
      formData.Province,
    ]
      .filter(Boolean)
      .join(', ');

    try {
      const customerRes = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          CustomerName: formData.CustomerName,
          Email: formData.Email,
          Phone: formData.Phone,
          Address: fullAddress,
          ProvinceName: formData.Province,
          DistrictName: formData.District,
          WardName: formData.Ward,
        }),
      });

      const customerData = await customerRes.json();
      if (!customerRes.ok || !customerData.data?._id) {
        alert(customerData.error || 'Không tạo được khách hàng');
        return;
      }
      const customerId = customerData.data._id;

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          CustomerId: customerId,
          Items: cart.map((item) => ({
            ProductID: item.productId,
            VariantId: item.variantId,
            variantName: item.variantName,
            Quantity: item.quantity,
            Price: item.ProductPrice,
          })),
          TotalAmount: totalAmount,
          Address: fullAddress,
          Phone: formData.Phone,
          Email: formData.Email,
          PaymentMethod: formData.PaymentMethod,
        }),
      });

      if (orderRes.ok) {
        const orderData = await orderRes.json();
        clearCart();
        router.push(`/order-success?orderId=${orderData.data._id}`);
      } else {
        const err = await orderRes.json().catch(() => ({}));
        alert(err.error || 'Lỗi khi tạo đơn hàng');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (!cartHydrated) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-gray-500">
        Đang tải giỏ hàng...
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">Giỏ hàng của bạn trống</p>
          <button
            onClick={() => router.push('/')}
            className="bg-pink-600 text-white px-6 py-2 rounded hover:bg-pink-700 transition"
          >
            Quay lại mua sắm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fff0f5] min-h-screen pb-12">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Cột trái: Giỏ hàng */}
          <div className="order-2 lg:order-1">
            <h1 className="text-3xl font-black text-pink-500 mb-6 drop-shadow-sm flex items-center gap-2">
              🛒 Giỏ hàng của bé
            </h1>
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item._id}
                  className="flex gap-4 p-4 items-center bg-white rounded-3xl shadow-[0_4px_15px_rgba(236,72,153,0.1)] border-2 border-pink-50 hover:shadow-[0_8px_30px_rgba(236,72,153,0.2)] transition-shadow group"
                >
                  {item.ProductImage ? (
                    <img
                      src={item.ProductImage}
                      alt={item.ProductName}
                      className="w-24 h-24 object-cover rounded-2xl group-hover:scale-105 transition-transform shadow-sm"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-pink-50 rounded-2xl flex items-center justify-center text-[10px] text-pink-300 border-2 border-dashed border-pink-200">
                      Chưa có ảnh
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-between h-24 py-1">
                    <div>
                      <h3 className="font-extrabold text-purple-700 text-lg leading-tight">
                        {item.ProductName}
                      </h3>
                      {item.variantName && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-600">
                          Kiểu: {item.variantName}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-3 bg-pink-50 rounded-full px-2 py-1 border border-pink-100">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item._id, item.quantity - 1)
                          }
                          className="w-7 h-7 flex items-center justify-center bg-white text-pink-600 rounded-full shadow-sm hover:bg-pink-100 font-black transition-colors"
                        >
                          -
                        </button>
                        <span className="font-bold text-gray-700 w-4 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item._id, item.quantity + 1)
                          }
                          className="w-7 h-7 flex items-center justify-center bg-pink-400 text-white rounded-full shadow-sm hover:bg-pink-500 font-black transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-pink-500 text-lg">
                          {(item.ProductPrice * item.quantity).toLocaleString()} đ
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(236,72,153,0.15)] p-6 md:p-8 sticky top-24 border border-pink-100">
              <h2 className="text-2xl font-black text-purple-600 mb-6 flex items-center gap-2">
                💌 Gửi đơn cho Tụi mình 
              </h2>

              <form onSubmit={handleSubmitOrder} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-pink-400 uppercase tracking-wider ml-1">
                    Tên của công chúa 👧
                  </label>
                  <input
                    type="text"
                    name="CustomerName"
                    value={formData.CustomerName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-pink-50/50 border-2 border-pink-100 rounded-2xl font-bold text-purple-800 focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all placeholder:font-normal placeholder:text-pink-300"
                    placeholder="Ví dụ: Bé Dâu Tây"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-pink-400 uppercase tracking-wider ml-1">
                      Email 📧
                    </label>
                    <input
                      type="email"
                      name="Email"
                      value={formData.Email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-pink-50/50 border-2 border-pink-100 rounded-2xl font-bold text-purple-800 focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all placeholder:font-normal placeholder:text-pink-300"
                      placeholder="email@gmail.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-pink-400 uppercase tracking-wider ml-1">
                      Số điện thoại 📞
                    </label>
                    <input
                      type="tel"
                      name="Phone"
                      value={formData.Phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-pink-50/50 border-2 border-pink-100 rounded-2xl font-bold text-purple-800 focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all placeholder:font-normal placeholder:text-pink-300"
                      placeholder="0912..."
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-pink-50 space-y-4">
                  <label className="text-sm font-black text-pink-500 flex items-center gap-1">
                    🏡 Chỗ ở của bé 
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select
                      name="Province"
                      value={formData.Province}
                      onChange={(e) => {
                        const p = provinces.find((x) => x.name === e.target.value);
                        setProvinceCode(p?.code ?? null);
                        setDistrictCode(null);
                        setFormData((prev) => ({
                          ...prev,
                          Province: e.target.value,
                          District: '',
                          Ward: '',
                        }));
                      }}
                      required
                      className="w-full px-3 py-2.5 bg-pink-50/50 border-2 border-pink-100 rounded-xl font-bold text-gray-700 focus:outline-none focus:border-pink-300"
                    >
                      <option value="">Chọn Tỉnh...</option>
                      {provinces.map((loc) => (
                        <option key={loc.code} value={loc.name}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                    <select
                      name="District"
                      value={formData.District}
                      onChange={(e) => {
                        const d = districts.find((x) => x.name === e.target.value);
                        setDistrictCode(d?.code ?? null);
                        setFormData((prev) => ({
                          ...prev,
                          District: e.target.value,
                          Ward: '',
                        }));
                      }}
                      required
                      disabled={!formData.Province}
                      className="w-full px-3 py-2.5 bg-pink-50/50 border-2 border-pink-100 rounded-xl font-bold text-gray-700 focus:outline-none focus:border-pink-300 disabled:opacity-50"
                    >
                      <option value="">Chọn Quận/Huyện...</option>
                      {districts.map((dist) => (
                        <option key={dist.code} value={dist.name}>
                          {dist.name}
                        </option>
                      ))}
                    </select>
                    <select
                      name="Ward"
                      value={formData.Ward}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, Ward: e.target.value }))
                      }
                      required
                      disabled={!formData.District}
                      className="w-full px-3 py-2.5 bg-pink-50/50 border-2 border-pink-100 rounded-xl font-bold text-gray-700 focus:outline-none focus:border-pink-300 disabled:opacity-50"
                    >
                      <option value="">Chọn Phường...</option>
                      {wards.map((w) => (
                        <option key={w.code} value={w.name}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <input
                    type="text"
                    name="Address"
                    value={formData.Address}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-pink-50/50 border-2 border-pink-100 rounded-2xl font-bold text-purple-800 focus:outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-100 transition-all placeholder:font-normal placeholder:text-pink-300"
                    placeholder="Số nhà, tên đường chi tiết..."
                  />
                </div>

                <div className="pt-2 border-t border-pink-50 space-y-2">
                  <label className="text-sm font-black text-pink-500">
                    💳 Hình thức gửi xiền nè
                  </label>
                  <select
                    name="PaymentMethod"
                    value={formData.PaymentMethod}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-purple-50 border-2 border-purple-100 rounded-2xl font-black text-purple-700 focus:outline-none focus:border-purple-300 appearance-none shadow-sm"
                  >
                    <option value="COD">💰 Giao hàng tận cửa thu tiền (COD)</option>
                    <option value="transfer">🏦 Chuyển khoản qua Ngân hàng / Momo</option>
                  </select>
                  
                  {/* Hướng dẫn chuyển khoản */}
                  {formData.PaymentMethod === 'transfer' && (
                    <div className="mt-3 bg-pink-50 border-2 border-pink-200 rounded-3xl p-5 flex flex-col md:flex-row items-center gap-6 animate-fade-in shadow-[0_10px_25px_rgba(236,72,153,0.1)]">
                      <div className="w-32 h-32 bg-white rounded-2xl shadow-md p-1.5 flex shrink-0 items-center justify-center border-2 border-pink-200 overflow-hidden group hover:scale-105 transition-transform duration-300">
                        <img 
                          src="https://res.cloudinary.com/dil3cfvtb/image/upload/v1775062787/princess-house-baby/hu72s9pl4zpdfqf2l0ea.jpg" 
                          alt="QR Chuyển khoản"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>
                      <div className="text-sm text-gray-700 text-left flex-1">
                        <p className="font-bold text-pink-600 mb-2 flex items-center gap-2">
                          <span className="bg-pink-100 p-1 rounded-md text-base">📝</span>
                          Nội dung: <span className="bg-pink-100 px-2.5 py-0.5 rounded-full font-mono text-pink-700 border border-pink-200">TênBé SốĐT</span>
                        </p>
                        <div className="space-y-1.5 border-l-4 border-pink-200 pl-4 py-1">
                          <p className="flex items-center gap-2">🏦 Ngân hàng: <strong className="text-purple-700">BIDV</strong></p>
                          <p className="flex items-center gap-2 underline decoration-pink-300 decoration-2 underline-offset-4">💳 Số tài khoản: <strong className="text-lg text-pink-600 select-all">2123973886</strong></p>
                          <p className="flex items-center gap-2">👤 Chủ TK: <strong className="uppercase">PHAM THI BICH NGOC</strong></p>
                          <p className="text-[10px] text-gray-400 font-medium">Chi nhánh: Tây Hồ</p>
                        </div>
                        <p className="text-xs text-pink-500 mt-2 italic font-bold">✨ Quét mã QR để tự động nhập thông tin nè! ✨</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t-2 border-dashed border-pink-200 pt-5 mt-6">
                  <div className="flex justify-between mb-3 text-gray-600 font-bold">
                    <span>Tạm tính giỏ hàng:</span>
                    <span>{totalAmount.toLocaleString()} đ</span>
                  </div>
                  <div className="flex justify-between mb-4 text-emerald-500 font-bold">
                    <span>Phí vận chuyển (Freeship 🚀):</span>
                    <span>0 đ</span>
                  </div>
                  <div className="flex justify-between items-center text-xl bg-pink-50 p-4 rounded-2xl border-2 border-pink-100">
                    <span className="font-extrabold text-pink-600">Tổng cộng:</span>
                    <span className="font-black text-2xl text-purple-700">{totalAmount.toLocaleString()} đ</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white py-4 rounded-full font-black text-lg hover:from-pink-500 hover:to-purple-500 transition-all transform hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(236,72,153,0.3)] disabled:opacity-50 disabled:transform-none mt-4 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    'Đang xíu xíu nè... ⏳'
                  ) : (
                    <>
                      Chốt đơn liền tay! ✨🛍️
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
