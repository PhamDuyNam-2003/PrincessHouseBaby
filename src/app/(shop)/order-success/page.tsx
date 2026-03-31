'use client';

import { Suspense } from 'react';
import OrderSuccessContent from './content';

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center">Đang tải...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
