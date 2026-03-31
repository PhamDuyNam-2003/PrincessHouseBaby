'use client';

import { useSearchParams, useRouter } from 'next/navigation';

export default function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold text-green-600 mb-4">
          Đơn hàng được tạo thành công!
        </h1>
        <p className="text-gray-600 mb-4">
          Cảm ơn bạn đã mua hàng. Chúng tôi sẽ liên hệ với bạn sớm nhất.
        </p>
        {orderId && (
          <p className="text-gray-700 mb-6 bg-gray-100 p-3 rounded break-all">
            <span className="font-bold">Mã đơn hàng:</span> {orderId}
          </p>
        )}
        <button
          onClick={() => router.push('/')}
          className="w-full bg-pink-600 text-white py-3 rounded-lg font-bold hover:bg-pink-700 transition"
        >
          Tiếp tục mua sắm
        </button>
      </div>
    </div>
  );
}
