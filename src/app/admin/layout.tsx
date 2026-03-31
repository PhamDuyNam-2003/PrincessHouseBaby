'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname === '/admin/login';
  const [ordersBadgeCount, setOrdersBadgeCount] = useState(0);

  const fetchOrdersBadge = useCallback(async () => {
    if (isLogin) return;
    try {
      const res = await fetch('/api/orders?badge=1');
      const json = await res.json();
      const n = json?.data?.count;
      setOrdersBadgeCount(typeof n === 'number' ? n : 0);
    } catch {
      setOrdersBadgeCount(0);
    }
  }, [isLogin]);

  useEffect(() => {
    if (isLogin) return;
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (!isLoggedIn) {
      router.push('/admin/login');
    }
  }, [router, isLogin]);

  useEffect(() => {
    if (isLogin) return;
    void fetchOrdersBadge();
  }, [isLogin, pathname, fetchOrdersBadge]);

  useEffect(() => {
    if (isLogin) return;
    const onRefresh = () => void fetchOrdersBadge();
    window.addEventListener('admin-orders-badge-refresh', onRefresh);
    return () => window.removeEventListener('admin-orders-badge-refresh', onRefresh);
  }, [isLogin, fetchOrdersBadge]);

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#fff0f5] text-gray-800 font-sans">
      <header className="bg-gradient-to-r from-pink-200 via-pink-100 to-purple-200 shadow-[0_4px_20px_rgba(236,72,153,0.1)] p-4 sticky top-0 z-50 border-b border-pink-100">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <Link href="/admin/dashboard" className="flex items-center gap-2 group">
            <span className="text-3xl group-hover:scale-110 group-hover:rotate-12 transition-transform drop-shadow-md">👑</span>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 drop-shadow-sm">Princess Admin</h1>
          </Link>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('adminLoggedIn');
              router.push('/admin/login');
            }}
            className="bg-white/60 text-pink-600 border-2 border-pink-200 px-5 py-2 rounded-full hover:bg-pink-50 focus:ring-4 focus:ring-pink-200 font-bold transition-all hover:scale-105 backdrop-blur-sm shadow-sm flex items-center gap-2"
          >
            🚪 Đăng xuất
          </button>
        </div>
        <nav className="mt-5 flex flex-wrap gap-3 max-w-7xl mx-auto px-1">
          <Link
            href="/admin/dashboard"
            className={`px-6 py-2.5 rounded-full font-bold transition-all shadow-sm flex items-center gap-2 ${pathname === '/admin/dashboard' ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-pink-300 scale-105' : 'bg-white/80 text-pink-600 hover:bg-white hover:-translate-y-1 border border-pink-100'}`}
          >
            📊 Tổng quan
          </Link>
          <Link
            href="/admin/products"
            className={`px-6 py-2.5 rounded-full font-bold transition-all shadow-sm flex items-center gap-2 ${pathname === '/admin/products' ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-pink-300 scale-105' : 'bg-white/80 text-pink-600 hover:bg-white hover:-translate-y-1 border border-pink-100'}`}
          >
            🎀 Kẹp tóc
          </Link>
          <Link
            href="/admin/orders"
            title="Đơn chờ xử lý (pending) hoặc đang xử lý (processing)"
            className={`relative inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all shadow-sm ${
              pathname === '/admin/orders'
                ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-pink-300 scale-105'
                : 'bg-white/80 text-pink-600 hover:bg-white hover:-translate-y-1 border border-pink-100'
            }`}
          >
            <span>🛍️ Đơn hàng</span>
            {ordersBadgeCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 inline-flex min-h-[1.5rem] min-w-[1.5rem] px-1 text-[12px] font-black leading-none text-white bg-pink-500 rounded-full items-center justify-center shadow-md animate-bounce border-2 border-white"
                aria-label={`${ordersBadgeCount} đơn cần xử lý`}
              >
                {ordersBadgeCount > 99 ? '99+' : ordersBadgeCount}
              </span>
            )}
          </Link>
          <Link
            href="/admin/customers"
            className={`px-6 py-2.5 rounded-full font-bold transition-all shadow-sm flex items-center gap-2 ${pathname === '/admin/customers' ? 'bg-gradient-to-r from-pink-400 to-purple-400 text-white shadow-pink-300 scale-105' : 'bg-white/80 text-pink-600 hover:bg-white hover:-translate-y-1 border border-pink-100'}`}
          >
            👧 Khách iu
          </Link>
        </nav>
      </header>
      <main className="p-4 md:p-6 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
