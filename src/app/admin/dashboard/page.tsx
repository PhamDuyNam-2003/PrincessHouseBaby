'use client';

import { useEffect, useState } from 'react';

type StatsData = {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  topProducts: { name: string; units: number; revenue: number }[];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/stats?period=${period}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Lỗi');
        if (!cancelled) {
          setStats({
            totalRevenue: json.data.totalRevenue,
            totalOrders: json.data.totalOrders,
            totalCustomers: json.data.totalCustomers,
            totalProducts: json.data.totalProducts,
            topProducts: json.data.topProducts || [],
          });
          setError('');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Không tải được dữ liệu');
          setStats(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <div className="bg-[#fff0f5] min-h-[80vh] font-sans p-2">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-pink-500 drop-shadow-sm flex items-center gap-2">
          ✨ Tình Hình Buôn Bán 🎀
        </h1>
        <div className="relative">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="appearance-none bg-white border-2 border-pink-200 text-pink-600 font-bold rounded-full pl-6 pr-10 py-2.5 shadow-sm hover:border-pink-300 focus:outline-none focus:ring-4 focus:ring-pink-100 transition-all cursor-pointer"
          >
            <option value="day">Hôm nay ☀️</option>
            <option value="month">Tháng này 🌙</option>
            <option value="year">Năm nay 🌟</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-pink-400">
             ▼
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 font-bold border border-red-200 p-4 rounded-2xl mb-6 shadow-sm flex items-center gap-2">
           💔 {error}
        </div>
      )}

      {!stats && !error && (
        <div className="flex justify-center my-12">
          <div className="bg-pink-100 text-pink-600 font-bold px-6 py-3 rounded-full animate-bounce shadow-sm border border-pink-200">
            🌸 Đang đếm tiền... ✨
          </div>
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Thẻ Doanh thu */}
            <div className="bg-gradient-to-br from-pink-100 to-rose-100 p-6 rounded-3xl shadow-[0_8px_30px_rgba(251,113,133,0.15)] transform transition-transform hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(251,113,133,0.25)] border border-white">
              <h2 className="text-sm font-black text-rose-400 uppercase tracking-widest mb-1 flex items-center gap-1">💸 Tổng Doanh Thu</h2>
              <p className="text-3xl font-black text-rose-600 mb-2 drop-shadow-sm">
                {stats.totalRevenue.toLocaleString()} đ
              </p>
              <div className="bg-white/60 inline-block px-3 py-1 rounded-full text-xs font-bold text-rose-500">
                Theo kỳ đã chọn ✨
              </div>
            </div>
            {/* Thẻ Đơn Hàng */}
            <div className="bg-gradient-to-br from-purple-100 to-indigo-100 p-6 rounded-3xl shadow-[0_8px_30px_rgba(129,140,248,0.15)] transform transition-transform hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(129,140,248,0.25)] border border-white">
              <h2 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">📦 Đơn hàng</h2>
              <p className="text-3xl font-black text-indigo-600 mb-2 drop-shadow-sm">
                {stats.totalOrders} <span className="text-lg">đơn</span>
              </p>
              <div className="bg-white/60 inline-block px-3 py-1 rounded-full text-xs font-bold text-indigo-500">
                Theo kỳ đã chọn ✨
              </div>
            </div>
            {/* Thẻ Khách hàng */}
            <div className="bg-gradient-to-br from-teal-100 to-emerald-100 p-6 rounded-3xl shadow-[0_8px_30px_rgba(52,211,153,0.15)] transform transition-transform hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(52,211,153,0.25)] border border-white">
              <h2 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1">👧 Khách iu</h2>
              <p className="text-3xl font-black text-emerald-600 mb-2 drop-shadow-sm">
                {stats.totalCustomers} <span className="text-lg">bé</span>
              </p>
              <div className="bg-white/60 inline-block px-3 py-1 rounded-full text-xs font-bold text-emerald-500">
                Thành viên gia đình 💖
              </div>
            </div>
            {/* Thẻ Sản phẩm */}
            <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-6 rounded-3xl shadow-[0_8px_30px_rgba(251,146,60,0.15)] transform transition-transform hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(251,146,60,0.25)] border border-white">
              <h2 className="text-sm font-black text-orange-400 uppercase tracking-widest mb-1 flex items-center gap-1">🎀 Kẹp tóc</h2>
              <p className="text-3xl font-black text-orange-600 mb-2 drop-shadow-sm">
                {stats.totalProducts} <span className="text-lg">mẫu</span>
              </p>
              <div className="bg-white/60 inline-block px-3 py-1 rounded-full text-xs font-bold text-orange-500">
                Sản phẩm xinh xẻo 🌟
              </div>
            </div>
          </div>

          {/* Biểu đồ / Best Sellers */}
          <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-[0_10px_40px_rgba(236,72,153,0.1)] border-2 border-pink-50">
            <h2 className="text-xl font-black text-pink-500 mb-6 flex items-center gap-2">
               🔥 Kẹp tóc bán chạy nhất
            </h2>
            {stats.topProducts.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl block mb-2">😴</span>
                <p className="text-pink-300 font-bold">Chưa có ai mua mẫu nào trong kỳ này hết...</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {stats.topProducts.map((product, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center bg-pink-50/50 p-4 rounded-2xl hover:bg-pink-100/50 transition-colors border border-transparent hover:border-pink-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-pink-200 text-pink-700 font-black flex items-center justify-center shadow-sm">
                        #{index + 1}
                      </div>
                      <span className="font-bold text-purple-700 text-lg">{product.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-pink-500 block">
                        {product.revenue.toLocaleString()} đ
                      </span>
                      <span className="text-sm font-bold text-gray-500">
                        Đã bán: <span className="text-purple-600">{product.units}</span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
