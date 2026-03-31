'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

interface Category {
  _id: string;
  CategoryName: string;
}

interface HeaderProps {
  onCategoryChange?: (categoryId: string) => void;
}

export default function Header({ onCategoryChange }: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const { cart, removeFromCart, updateQuantity } = useCart();
  const router = useRouter();

  useEffect(() => {
    setIsAdminLoggedIn(Boolean(localStorage.getItem('adminLoggedIn')));
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const result = await response.json();
        setCategories(result.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/?search=${searchTerm}`);
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    if (onCategoryChange) {
      onCategoryChange(categoryId);
    }
    const query = categoryId ? `?category=${categoryId}` : '/';
    router.push(query);
  };

  return (
    <header className="bg-gradient-to-r from-pink-100 via-white to-pink-100 shadow-sm sticky top-0 z-40 border-b-2 border-pink-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95">
            <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 drop-shadow-sm flex items-center gap-2">
              👑 Princess House 🎀
            </h1>
          </Link>

          <form
            onSubmit={handleSearch}
            className="flex-1 md:mx-8 relative"
          >
            <input
              type="text"
              placeholder="Bé tìm gì nè... 🌸"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-pink-200 rounded-full focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 font-bold text-gray-700 shadow-inner placeholder:font-normal placeholder:text-pink-300 transition-all"
            />
            <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-pink-400">
              🔍
            </div>
          </form>

          <div className="flex items-center justify-between md:justify-end gap-3">
            <button
              onClick={() => router.push('/admin/login')}
              className="px-5 py-2.5 rounded-full border-2 border-pink-300 text-pink-600 font-bold hover:bg-pink-50 hover:border-pink-400 transition-all shadow-sm flex items-center gap-1 active:scale-95"
            >
              {isAdminLoggedIn ? 'Quản trị ✨' : 'Đăng nhập 🔑'}
            </button>

            <button
              onClick={() => setIsCartOpen((prev) => !prev)}
              className="relative flex items-center gap-2 bg-gradient-to-r from-pink-400 to-rose-400 text-white px-5 py-2.5 rounded-full hover:from-pink-500 hover:to-rose-500 transition-all font-black shadow-md hover:shadow-lg active:scale-95"
            >
              🛒 Giỏ hàng
              <span className="absolute -top-2 -right-2 bg-white text-pink-600 border-2 border-pink-400 text-xs w-6 h-6 flex items-center justify-center rounded-full shadow-sm">
                {cart.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {isCartOpen && (
        <div className="absolute right-4 top-24 w-auto min-w-[320px] max-w-sm bg-white/95 backdrop-blur-md border-2 border-pink-200 rounded-[2rem] shadow-[0_20px_60px_rgba(236,72,153,0.2)] z-50 p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-xl text-purple-600 flex items-center gap-2">
              🛍️ Giỏ của bé ({cart.length})
            </h3>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-pink-300 hover:text-pink-500 font-black text-xl hover:rotate-90 transition-transform w-8 h-8 flex items-center justify-center bg-pink-50 rounded-full"
            >
              ✕
            </button>
          </div>
          
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl block mb-2">🎈</span>
              <p className="text-pink-400 font-bold">Giỏ hàng trống teo à!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {cart.map((item) => (
                <div key={item._id} className="flex gap-4 items-start bg-pink-50/50 p-3 rounded-2xl border border-pink-100 group hover:bg-pink-50 transition-colors">
                  {item.ProductImage ? (
                    <img src={item.ProductImage} alt={item.ProductName} className="w-16 h-16 object-cover rounded-xl shadow-sm" />
                  ) : (
                    <div className="w-16 h-16 bg-pink-100 flex items-center justify-center rounded-xl text-xs text-pink-400 font-bold border border-dashed border-pink-200">Không ảnh</div>
                  )}
                  <div className="flex-1">
                    <p className="font-extrabold text-sm text-gray-800 leading-tight">
                      {item.ProductName}
                    </p>
                    {item.variantName && (
                      <p className="text-xs text-purple-500 font-bold mt-0.5">Mẫu: {item.variantName}</p>
                    )}
                    <p className="text-sm font-black text-pink-500 mt-1">{item.ProductPrice.toLocaleString()} đ</p>
                    <div className="flex items-center justify-between w-full mt-2">
                       <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-full border border-pink-100 shadow-sm w-fit">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="w-5 h-5 flex items-center justify-center text-pink-500 font-bold hover:bg-pink-100 rounded-full transition-colors"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-gray-700 w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="w-5 h-5 flex items-center justify-center text-pink-500 font-bold hover:bg-pink-100 rounded-full transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="text-red-400 text-xs font-bold hover:text-red-600 bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition-colors"
                      >
                        Bỏ xíu
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {cart.length > 0 && (
             <div className="mt-6 pt-4 border-t-2 border-dashed border-pink-200">
               <button
                 onClick={() => { router.push('/checkout'); setIsCartOpen(false); }}
                 className="w-full bg-gradient-to-r from-pink-400 to-purple-400 text-white font-black py-3 rounded-full hover:from-pink-500 hover:to-purple-500 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 text-center"
               >
                 Tới thùng tiền nè! 💸✨
               </button>
             </div>
          )}
        </div>
      )}

      <nav className="bg-white/80 backdrop-blur-md border-b border-pink-100">
        <div className="container mx-auto px-4 py-2 flex gap-2 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => handleCategorySelect('')}
            className="px-4 py-1.5 text-sm font-bold text-pink-500 bg-pink-50 border border-transparent hover:border-pink-300 rounded-full hover:bg-pink-100 transition whitespace-nowrap active:scale-95"
          >
            🌟 Tủ đồ chung
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => handleCategorySelect(cat._id)}
              className="px-4 py-1.5 text-sm font-bold text-purple-600 bg-purple-50 border border-transparent hover:border-purple-300 rounded-full hover:bg-purple-100 transition whitespace-nowrap active:scale-95"
            >
               🎀 {cat.CategoryName}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}
