'use client';

import ProductCard from './ProductCard';
import { Product } from '@/types';

interface ProductListProps {
  products: Product[];
}

export default function ProductList({ products }: ProductListProps) {
  // Flatten products into individual variants for display
  const displayItems: { product: Product; variantId: string | undefined }[] = products.flatMap((product) => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.map((variant) => ({
        product,
        variantId: variant._id as string | undefined,
      }));
    }
    // Fallback for products without variants
    return [{ product, variantId: undefined }];
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {displayItems.map((item, index) => (
        <ProductCard 
          key={`${item.product._id}-${item.variantId || index}`} 
          product={item.product} 
          initialVariantId={item.variantId}
        />
      ))}
    </div>
  );
}
