'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCart, type CartItem } from '@/context/CartContext';
import { Product, Variant } from '@/types';
import AddToCartModal from '@/components/AddToCartModal';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${params.id}`);
        const result = await response.json();
        setProduct(result.data);
        if (result.data?.variants?.length > 0) {
          setSelectedVariant(result.data.variants[0]);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  const handleAddToCart = (item: CartItem) => {
    addToCart(item);
  };

  const handleBuyNow = (item: CartItem) => {
    addToCart(item);
    router.push('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#fff0f5]">
        <div className="bg-pink-100 text-pink-600 font-bold px-8 py-4 rounded-full animate-bounce shadow-md border border-pink-200 text-xl">
          🌸 Đang tìm kẹp tóc... ✨
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#fff0f5]">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-pink-100 text-center">
          <p className="text-4xl mb-4">🥲</p>
          <h2 className="text-2xl font-black text-pink-600 mb-2">Trang không tồn tại</h2>
          <p className="text-gray-500 mb-6">Sản phẩm này đã bị ẩn hoặc không thể tìm thấy.</p>
          <button onClick={() => router.push('/')} className="bg-gradient-to-r from-pink-400 to-purple-400 text-white px-6 py-3 rounded-full font-bold hover:shadow-lg transition-transform transform hover:-translate-y-1">
            Quay lại trang chủ 🏠
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff0f5] py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="bg-white/90 backdrop-blur-md rounded-[3rem] shadow-[0_20px_60px_rgba(236,72,153,0.1)] overflow-hidden border border-pink-50 p-6 md:p-12">
          
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mb-8 inline-flex items-center text-pink-500 font-bold hover:text-purple-600 transition-colors bg-pink-50 px-4 py-2 rounded-full border border-pink-100"
          >
            ← Quay lại mua sắm
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left: Image Gallery */}
            <div className="space-y-6">
              <div className="relative aspect-square bg-pink-50/50 rounded-3xl flex items-center justify-center p-6 border-2 border-pink-100 overflow-hidden shadow-sm group">
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-200/20 to-purple-200/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                {selectedVariant?.ImageURL ? (
                  <img
                    src={selectedVariant.ImageURL}
                    alt={product.ProductName}
                    className="max-w-full max-h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="text-pink-300 font-bold border-2 border-dashed border-pink-200 rounded-2xl w-full h-full flex items-center justify-center">
                    Chưa có ảnh 📷
                  </div>
                )}
              </div>

              {/* All Variants Gallery */}
              <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-sm">
                <h3 className="text-sm font-extrabold text-pink-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  ✨ Chọn màu / kiểu dáng yêu thích
                </h3>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((variant) => {
                    const isSelected = selectedVariant?._id === variant._id;
                    return (
                      <button
                        key={variant._id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`relative w-20 h-20 rounded-2xl border-2 overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-sm ${
                          isSelected
                            ? 'border-pink-500 ring-4 ring-pink-100 scale-105 z-10'
                            : 'border-pink-100 opacity-70 hover:opacity-100'
                        }`}
                        title={variant.variantName}
                      >
                        {variant.ImageURL ? (
                          <img
                            src={variant.ImageURL}
                            alt={variant.variantName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-pink-50 flex items-center justify-center text-[10px] font-bold text-pink-400 text-center leading-tight p-1 leading-none">
                            {variant.variantName}
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute inset-0 border-4 border-pink-500 rounded-xl pointer-events-none"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Product Info */}
            <div className="flex flex-col justify-center space-y-6">
              <div>
                <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-sm border border-purple-200 mb-4">
                  🎀 {product.CategoryID?.CategoryName || 'Bộ sưu tập'}
                </span>
                <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-4 leading-tight">
                  {product.ProductName}
                </h1>
                
                <p className="text-gray-600 text-lg leading-relaxed font-medium bg-pink-50/30 p-4 rounded-2xl border border-pink-50/50">
                  {product.Description || 'Một sản phẩm tuyệt vời dành riêng cho các nàng công chúa. Đừng bỏ lỡ nhé! ✨'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-pink-50 to-white p-6 rounded-3xl border border-pink-100 shadow-[0_4px_20px_rgba(236,72,153,0.05)]">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-pink-400 font-bold mb-1">Giá thanh toán</p>
                    <p className="text-4xl md:text-5xl font-black text-pink-600 drop-shadow-sm">
                      {selectedVariant ? selectedVariant.Price.toLocaleString() : 0} 
                      <span className="text-2xl text-pink-400 ml-2">đ</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Kho hàng</p>
                    <p className="text-lg font-black text-emerald-500 bg-emerald-50 px-4 py-1.5 rounded-xl border border-emerald-100">
                      📦 {selectedVariant?.StockQuantity || 0}
                    </p>
                  </div>
                </div>
                
                <p className="text-sm font-semibold text-purple-600 mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                  {(selectedVariant?.StockQuantity ?? 0) > 0 ? 'Sản phẩm đang còn hàng, chốt đơn ngay nào!' : 'Tiếc quá, mẫu này đang tạm hết 🥲'}
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    disabled={!selectedVariant || selectedVariant.StockQuantity === 0}
                    className="flex-1 bg-white border-2 border-pink-300 text-pink-600 py-4 rounded-2xl font-black text-lg hover:bg-pink-50 hover:border-pink-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2"
                  >
                    🛒 Thêm vào giỏ
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    disabled={!selectedVariant || selectedVariant.StockQuantity === 0}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-2xl font-black text-lg hover:from-pink-600 hover:to-purple-600 transition-all shadow-[0_8px_20px_rgba(236,72,153,0.3)] hover:shadow-[0_12px_25px_rgba(236,72,153,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 active:scale-95 active:translate-y-0 flex items-center justify-center gap-2"
                  >
                    💖 Đặt Mua Ngay
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddToCartModal
        open={modalOpen}
        product={modalOpen ? product : null}
        initialVariantId={selectedVariant?._id}
        onClose={() => setModalOpen(false)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />
    </div>
  );
}
