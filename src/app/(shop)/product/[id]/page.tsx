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
      <div className="container mx-auto px-4 py-12">
        <div className="text-center text-gray-500">⏳ Đang tải...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center text-gray-500">Sản phẩm không tìm thấy</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex justify-center items-center bg-gray-100 rounded-lg p-4 h-96">
          {selectedVariant?.ImageURL ? (
            <img
              src={selectedVariant.ImageURL}
              alt={product.ProductName}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="text-gray-400">No Image</div>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {product.ProductName}
          </h1>
          <p className="text-sm text-gray-500 mb-4">
            📦 {product.CategoryID?.CategoryName}
          </p>

          <p className="text-gray-600 mb-6 leading-relaxed">
            {product.Description}
          </p>

          {product.variants.length > 1 && (
            <div className="mb-4">
              <label className="font-bold mb-2 block">Chọn biến thể:</label>
              <select
                value={selectedVariant?._id || ''}
                onChange={(e) => {
                  const variant = product.variants.find(
                    (v) => v._id === e.target.value
                  );
                  setSelectedVariant(variant || null);
                }}
                className="border rounded px-3 py-2 w-full"
              >
                {product.variants.map((variant) => (
                  <option key={variant._id} value={variant._id}>
                    {variant.variantName} - {variant.Price.toLocaleString()} đ
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              Số lượng sẵn có: {selectedVariant?.StockQuantity}
            </p>
            <div className="mb-8">
              <p className="text-3xl font-bold text-pink-600">
                {selectedVariant
                  ? selectedVariant.Price.toLocaleString()
                  : 0}{' '}
                đ
              </p>
              <p className="text-gray-500 text-sm">
                Giá niêm yết / sản phẩm
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            disabled={!selectedVariant || selectedVariant.StockQuantity === 0}
            className="w-full bg-pink-600 text-white py-3 rounded-lg font-bold hover:bg-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            🛒 Thêm vào giỏ
          </button>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            disabled={!selectedVariant || selectedVariant.StockQuantity === 0}
            className="w-full border-2 border-pink-600 text-pink-600 py-3 rounded-lg font-bold hover:bg-pink-50 transition disabled:opacity-50 mb-4"
          >
            🔥 Mua ngay
          </button>

          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full border border-gray-300 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
          >
            Quay lại
          </button>
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
