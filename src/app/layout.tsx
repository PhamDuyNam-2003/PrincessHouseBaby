import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  title: "Princess House Baby",
  description: "Đồ dùng chất lượng cao cho bé yêu của bạn",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="icon" href="https://res.cloudinary.com/dil3cfvtb/image/upload/v1775063743/avt_qlvii1.jpg" />
      </head>
      <body className="bg-white text-gray-900">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
