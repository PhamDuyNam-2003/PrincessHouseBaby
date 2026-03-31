'use client';

import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-pink-50 text-pink-800 py-12 mt-12 border-t-4 border-pink-200">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-black text-pink-600 mb-4 flex items-center gap-2">
              👑 Princess House 
            </h3>
            <p className="text-pink-600/80 font-medium leading-relaxed">
              Thế giới kẹp tóc siêu xinh xắn dành riêng cho các nàng công chúa nhỏ! 🎀 Hàng xịn xò, giá hạt dẻ, bé nào cũng mê tít. 💕
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-black text-purple-600 mb-4">🌟 Khám phá nha</h4>
            <ul className="space-y-3">
              <li><a href="/" className="text-pink-600 hover:text-pink-500 hover:translate-x-1 inline-block transition-transform font-bold">🏠 Trang nhà của tụi mình</a></li>
              <li><a href="#products" className="text-pink-600 hover:text-pink-500 hover:translate-x-1 inline-block transition-transform font-bold">🎀 Kẹp tóc siêu cưng</a></li>
              <li><a href="#about" className="text-pink-600 hover:text-pink-500 hover:translate-x-1 inline-block transition-transform font-bold">📖 Truyện của Tụi mình</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-black text-purple-600 mb-4">💌 Alo Tụi mình</h4>
            <ul className="space-y-3 text-pink-700 font-medium">
              <li className="flex gap-2"><span>🏰</span> <span>Lâu đài số 123, Phố Kẹo Ngọt, TP. Đáng Yêu</span></li>
              <li className="flex gap-2"><span>📱</span> <span>0999 888 777 (Zalo luôn nhaaa)</span></li>
              <li className="flex gap-2"><span>⏰</span> <span>Tụi mình thức từ 9h sáng - 9h tối nè</span></li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-lg font-black text-purple-600 mb-4">🌈 Kết bạn hông?</h4>
            <div className="flex space-x-3 mb-4">
              <a
                href="#"
                className="bg-blue-100 text-blue-500 w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-blue-200 transition-colors text-2xl shadow-sm border border-blue-200"
              >
                📘
              </a>
              <a
                href="#"
                className="bg-pink-100 text-pink-500 w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-pink-200 transition-colors text-2xl shadow-sm border border-pink-200"
              >
                📷
              </a>
              <a
                href="#"
                className="bg-orange-100 text-orange-500 w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-orange-200 transition-colors text-2xl shadow-sm border border-orange-200"
              >
                🛍️
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-dashed border-pink-200 py-6">
          {/* Payment Methods */}
          <div className="mb-6 text-center">
            <p className="text-sm font-bold text-pink-400 mb-3">💸 Tụi mình nhận các loại xiền nè:</p>
            <div className="flex justify-center space-x-3">
              <span className="bg-white border-2 border-pink-100 text-pink-600 font-bold px-4 py-1.5 rounded-full text-sm shadow-sm">💰 Tiền mặt (COD)</span>
              <span className="bg-white border-2 border-pink-100 text-pink-600 font-bold px-4 py-1.5 rounded-full text-sm shadow-sm">🏦 Chuyển khoản (Có QR)</span>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center font-medium">
            <p className="text-pink-400 text-sm">
              © 2024 Princess House. Tụi mình làm bằng cả trái tim 💖
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
