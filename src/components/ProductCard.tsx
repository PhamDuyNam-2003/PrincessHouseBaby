'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, type CartItem } from '@/context/CartContext';
import { Product } from '@/types';
import AddToCartModal from '@/components/AddToCartModal';

interface ProductCardProps {
  product: Product;
  initialVariantId?: string;
}

export default function ProductCard({ product, initialVariantId }: ProductCardProps) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  
  // Find the index of the initial variant if provided
  const initialIndex = initialVariantId 
    ? product.variants.findIndex(v => v._id === initialVariantId)
    : 0;
    
  const [previewVariantIndex, setPreviewVariantIndex] = useState(initialIndex >= 0 ? initialIndex : 0);

  const displayVariant = product.variants[previewVariantIndex] || product.variants[0];
  const firstVariant = product.variants[0];

  const handleOpen = () => {
    if (displayVariant) setModalOpen(true);
  };

  const handleAddToCart = (item: CartItem) => {
    addToCart(item);
  };

  const handleBuyNow = (item: CartItem) => {
    addToCart(item);
    router.push('/checkout');
  };

  return (
    <>
      <div className="bg-white rounded-3xl shadow-[0_4px_15px_rgba(236,72,153,0.1)] hover:shadow-[0_10px_30px_rgba(236,72,153,0.3)] transition-all transform hover:-translate-y-2 overflow-hidden border border-pink-50 flex flex-col group relative">
        <Link href={`/product/${product._id}`}>
          <div className="h-56 bg-pink-50 overflow-hidden relative">
            <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-black text-pink-500 shadow-sm z-10 border border-pink-100">
              Mới nè ✨
            </div>
            {displayVariant?.ImageURL ? (
              <img
                src={displayVariant.ImageURL}
                alt={product.ProductName}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-pink-100 text-pink-400 font-bold border-2 border-dashed border-pink-200 m-2 rounded-2xl w-[calc(100%-16px)] h-[calc(100%-16px)]">
                Chưa có ảnh 📷
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-pink-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        </Link>

        <div className="p-5 flex-1 flex flex-col">
          <Link href={`/product/${product._id}`}>
            <h3 className="font-extrabold text-purple-800 text-lg hover:text-pink-600 transition-colors line-clamp-2 leading-tight">
              {product.ProductName} {displayVariant?.variantName ? ` - ${displayVariant.variantName}` : ''}
            </h3>
          </Link>

          {/* Show all small variants */}
          {product.variants.length > 1 && (
             <div className="flex flex-wrap gap-1.5 mt-3 mb-1">
                {product.variants.map((v, i) => (
                   <button
                     key={v._id || i}
                     onMouseEnter={() => setPreviewVariantIndex(i)}
                     className={`w-6 h-6 rounded-full border-2 overflow-hidden transition-transform hover:scale-110 ${previewVariantIndex === i ? 'border-pink-500 scale-110' : 'border-pink-100'}`}
                     title={v.variantName}
                   >
                     {v.ImageURL ? (
                        <img src={v.ImageURL} alt={v.variantName} className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full bg-pink-100"></div>
                     )}
                   </button>
                ))}
             </div>
          )}

          <p className="text-gray-500 text-sm mt-2 line-clamp-2 font-medium flex-1">
            {product.Description || 'Một chiếc kẹp siêu xinh xắn dành cho bé gái dễ thương 🎀'}
          </p>

          <div className="flex flex-col gap-3 mt-4">
            <div className="flex justify-between items-center bg-pink-50/50 px-3 py-2 rounded-xl border border-pink-100">
              <span className="text-xs font-bold text-gray-500">Giá:</span>
              <span className="text-xl font-black text-pink-600 drop-shadow-sm">
                {displayVariant ? `${displayVariant.Price.toLocaleString()} đ` : 'N/A'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleOpen}
                disabled={!displayVariant}
                className="bg-white text-pink-500 border-2 border-pink-200 py-2 rounded-xl hover:bg-pink-50 hover:border-pink-300 transition-all text-sm font-bold disabled:opacity-50 shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-1"
              >
                🛒 Thêm
              </button>
              <button
                onClick={handleOpen}
                disabled={!displayVariant}
                className="bg-gradient-to-r from-pink-400 to-purple-400 text-white border-2 border-transparent py-2 rounded-xl hover:from-pink-500 hover:to-purple-500 transition-all text-sm font-black disabled:bg-gray-400 shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-1"
              >
                🛍️ Mua ngay!
              </button>
            </div>
          </div>
        </div>
      </div>

      <AddToCartModal
        open={modalOpen}
        product={modalOpen ? product : null}
        initialVariantId={displayVariant?._id}
        onClose={() => setModalOpen(false)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />
    </>
  );
}
