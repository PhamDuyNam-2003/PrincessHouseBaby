'use client';

import { useState, useEffect, Suspense } from 'react';
import ProductList from '@/components/ProductList';
import { useSearchParams } from 'next/navigation';
import { Product } from '@/types';

function HomeContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const category = searchParams.get('category') || '';
    setSelectedCategory(category);
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const search = searchParams.get('search') || '';
        const url = search
          ? `/api/products?search=${encodeURIComponent(search)}`
          : '/api/products';

        const response = await fetch(url);
        const result = await response.json();
        setProducts(result.data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  const filteredProducts = selectedCategory
    ? products.filter(
        (product) => product.CategoryID._id === selectedCategory
      )
    : products;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center text-gray-500 text-lg">⏳ Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {selectedCategory ? '📦 Sản phẩm' : '⭐ Sản phẩm nổi bật'}
        </h2>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Không có sản phẩm nào</p>
          </div>
        ) : (
          <ProductList products={filteredProducts} />
        )}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center">Đang tải...</div>}>
      <HomeContent />
    </Suspense>
  );
}
