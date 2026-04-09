'use client';

import { useEffect, useState } from 'react';
import { Product, Variant } from '@/types';
import { CartItem, cartLineId } from '@/context/CartContext';

type Props = {
  open: boolean;
  product: Product | null;
  initialVariantId?: string | null;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
  onBuyNow: (item: CartItem) => void;
};

export default function AddToCartModal({
  open,
  product,
  initialVariantId,
  onClose,
  onAddToCart,
  onBuyNow,
}: Props) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!product?.variants?.length) {
      setSelectedVariant(null);
      return;
    }
    const fromProp = initialVariantId
      ? product.variants.find((v) => v._id === initialVariantId)
      : null;
    setSelectedVariant(fromProp || product.variants[0]);
    setQuantity(1);
  }, [product, open, initialVariantId]);

  if (!open || !product) return null;

  const buildItem = (): CartItem | null => {
    if (!selectedVariant || !product._id) return null;
    const max = selectedVariant.StockQuantity ?? 0;
    const q = Math.min(Math.max(1, quantity), Math.max(1, max));
    return {
      _id: cartLineId(product._id, selectedVariant._id),
      productId: product._id,
      variantId: selectedVariant._id,
      ProductName: product.ProductName,
      variantName: selectedVariant.variantName,
      ProductPrice: selectedVariant.Price,
      basePrice: selectedVariant.Price,
      price50: selectedVariant.Price50,
      price100: selectedVariant.Price100,
      ProductImage: selectedVariant.ImageURL,
      quantity: q,
    };
  };

  const handleAdd = () => {
    const item = buildItem();
    if (!item) return;
    onAddToCart(item);
    onClose();
  };

  const handleBuy = () => {
    const item = buildItem();
    if (!item) return;
    onBuyNow(item);
    onClose();
  };

  const maxStock = selectedVariant?.StockQuantity ?? 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800 pr-8">
            {product.ProductName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-4">
            <div className="w-32 h-32 shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              {selectedVariant?.ImageURL ? (
                <img
                  src={selectedVariant.ImageURL}
                  alt={product.ProductName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-sm">No image</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 line-clamp-3">
                {product.Description}
              </p>
              {selectedVariant && (
                <p className="mt-2 text-pink-600 font-bold text-lg">
                  {selectedVariant.Price.toLocaleString()} đ
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Còn lại: {maxStock}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Màu / biến thể (cùng loại)
            </p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v._id}
                  type="button"
                  onClick={() => {
                    setSelectedVariant(v);
                    setQuantity(1);
                  }}
                  className={`relative w-14 h-14 rounded border-2 overflow-hidden shrink-0 ${
                    selectedVariant?._id === v._id
                      ? 'border-pink-600 ring-2 ring-pink-200'
                      : 'border-gray-200'
                  }`}
                  title={v.variantName}
                >
                  {v.ImageURL ? (
                    <img
                      src={v.ImageURL}
                      alt={v.variantName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] p-1">{v.variantName}</span>
                  )}
                </button>
              ))}
            </div>
            {selectedVariant && (
              <p className="text-sm text-gray-700 mt-2">
                Đang chọn:{' '}
                <span className="font-medium">{selectedVariant.variantName}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-700">Số lượng</span>
            <div className="flex items-center border rounded">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-2 text-lg"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={Math.max(1, maxStock)}
                value={quantity}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (Number.isNaN(n)) return;
                  setQuantity(
                    Math.min(Math.max(1, n), Math.max(1, maxStock))
                  );
                }}
                className="w-16 text-center border-l border-r focus:outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) =>
                    Math.min(Math.max(1, maxStock), q + 1)
                  )
                }
                className="px-3 py-2 text-lg"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!selectedVariant || maxStock === 0}
              className="flex-1 bg-pink-600 text-white py-3 rounded-lg font-bold hover:bg-pink-700 disabled:opacity-50"
            >
              Thêm vào giỏ
            </button>
            <button
              type="button"
              onClick={handleBuy}
              disabled={!selectedVariant || maxStock === 0}
              className="flex-1 border border-pink-600 text-pink-600 py-3 rounded-lg font-bold hover:bg-pink-50 disabled:opacity-50"
            >
              Mua ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
