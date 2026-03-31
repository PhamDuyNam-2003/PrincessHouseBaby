'use client';

import { useEffect, useState } from 'react';

export default function AdminReports() {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState<{
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    ordersByStatus: Record<string, number>;
    topProducts: { name: string; units: number; revenue: number }[];
    from: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stats?period=${period}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Lỗi');
        if (!cancelled) {
          setData({
            totalRevenue: json.data.totalRevenue,
            totalOrders: json.data.totalOrders,
            totalCustomers: json.data.totalCustomers,
            totalProducts: json.data.totalProducts,
            ordersByStatus: json.data.ordersByStatus || {},
            topProducts: json.data.topProducts || [],
            from: json.data.from,
          });
          setError('');
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Lỗi');
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [period]);

  const statusLabels: Record<string, string> = {
    pending: 'Chờ xử lý',
    processing: 'Đang xử lý',
    shipped: 'Đang giao',
    delivered: 'Hoàn thành',
    cancelled: 'Đã hủy',
  };

  return (
    <div className="bg-[#fff0f5] min-h-[80vh] font-sans p-2">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-pink-500 drop-shadow-sm flex items-center gap-2">
          📊 Báo Cáo Siêu Xinh 🎀
        </h1>
        <div className="flex flex-wrap gap-4 items-center bg-white/60 p-2 rounded-full border border-pink-100 shadow-sm">
          <label className="text-sm font-bold text-pink-400 pl-3">Kỳ:</label>
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="appearance-none bg-white border-2 border-pink-200 text-pink-600 font-bold rounded-full pl-4 pr-10 py-2 shadow-sm hover:border-pink-300 focus:outline-none focus:ring-4 focus:ring-pink-100 transition-all cursor-pointer text-sm"
            >
              <option value="day">Theo ngày (Hôm nay) ☀️</option>
              <option value="month">Theo tháng 🌙</option>
              <option value="year">Theo năm 🌟</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-pink-400 text-xs">
              ▼
            </div>
          </div>
          {data?.from && (
            <span className="text-xs font-bold text-purple-400 bg-purple-50 px-3 py-1.5 rounded-full mr-2 line-clamp-1">
              Từ: {new Date(data.from).toLocaleString('vi-VN')}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 font-bold border border-red-200 p-4 rounded-2xl mb-6 shadow-sm flex items-center gap-2">
           💔 {error}
        </div>
      )}
      
      {loading && (
        <div className="flex justify-center my-12">
          <div className="bg-pink-100 text-pink-600 font-bold px-6 py-3 rounded-full animate-bounce shadow-sm border border-pink-200">
            🌸 Đang gom số liệu nè... ✨
          </div>
        </div>
      )}

      {data && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-pink-100 to-rose-100 p-8 rounded-3xl shadow-[0_8px_30px_rgba(251,113,133,0.15)] border border-white transform transition-transform hover:-translate-y-1">
            <h2 className="text-lg font-black text-rose-500 mb-6 flex items-center gap-2">💸 Doanh thu (kỳ)</h2>
            <p className="text-5xl font-black text-rose-600 mb-4 drop-shadow-sm">
              {data.totalRevenue.toLocaleString()} đ
            </p>
            <div className="inline-block bg-white/80 px-4 py-2 rounded-xl text-sm font-bold text-rose-500 shadow-sm border border-rose-100">
              Đơn trong kỳ: <span className="text-xl text-rose-600">{data.totalOrders}</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-100 to-indigo-100 p-8 rounded-3xl shadow-[0_8px_30px_rgba(129,140,248,0.15)] border border-white transform transition-transform hover:-translate-y-1">
            <h2 className="text-lg font-black text-indigo-500 mb-6 flex items-center gap-2">🌟 Tổng quan (toàn DB)</h2>
            <ul className="text-lg space-y-4 font-bold text-indigo-700">
              <li className="flex items-center justify-between bg-white/60 p-4 rounded-2xl shadow-sm">
                <span>Khách hàng iu:</span>
                <span className="text-2xl font-black text-indigo-600">{data.totalCustomers}</span>
              </li>
              <li className="flex items-center justify-between bg-white/60 p-4 rounded-2xl shadow-sm">
                <span>Số lượng kẹp bé xíu (SKU):</span>
                <span className="text-2xl font-black text-indigo-600">{data.totalProducts}</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-[0_10px_40px_rgba(236,72,153,0.1)] border-2 border-pink-50 xl:col-span-1">
            <h2 className="text-lg font-black text-pink-500 mb-6 flex items-center gap-2">
              📦 Trạng thái đơn (kỳ)
            </h2>
            <ul className="space-y-3">
              {Object.entries(data.ordersByStatus).length === 0 ? (
                <li className="text-center py-6 text-pink-300 font-bold">Không có đơn nào luôn 😢</li>
              ) : (
                Object.entries(data.ordersByStatus).map(([k, v]) => (
                  <li key={k} className="flex justify-between items-center bg-pink-50 p-3 rounded-2xl border border-pink-100 font-bold text-gray-700 hover:bg-pink-100/50 transition-colors">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-pink-400 inline-block"></span>
                      {statusLabels[k] || k}
                    </span>
                    <span className="bg-white px-3 py-1 rounded-full text-pink-600 shadow-sm">{v}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          
          <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-[0_10px_40px_rgba(236,72,153,0.1)] border-2 border-pink-50 xl:col-span-1">
            <h2 className="text-lg font-black text-pink-500 mb-6 flex items-center gap-2">
              🔥 Kẹp bán chạy xỉu (kỳ)
            </h2>
            {data.topProducts.length === 0 ? (
              <p className="text-center py-6 text-pink-300 font-bold">Trống trơn à 😢</p>
            ) : (
              <ul className="space-y-4">
                {data.topProducts.map((p, i) => (
                  <li key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-pink-50/50 p-4 rounded-2xl border border-pink-100 hover:bg-pink-100/50 transition-colors">
                    <span className="font-extrabold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-100 text-sm">{p.name}</span>
                    <div className="flex flex-col sm:items-end text-sm">
                       <span className="font-black text-pink-500 text-lg">
                         {p.revenue.toLocaleString()} đ
                       </span>
                       <span className="text-gray-500 font-bold">
                         Đã bán: <span className="text-purple-600">{p.units}</span>
                       </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
