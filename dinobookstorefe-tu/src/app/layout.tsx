import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { CartProvider } from "@/contexts/CartContext";
import { FavoriteProvider } from "@/contexts/FavoriteContext";
import { VoucherProvider } from "@/contexts/VoucherContext";
import FloatingWidgets from "@/components/FloatingWidgets";
import Footer from "@/components/Footer";
import AIChatbox from "@/components/AIChatbox";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dino Bookstore",
  description: "Cửa hàng sách trực tuyến - Sách trong nước và sách nước ngoài",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CartProvider>
          <FavoriteProvider>
            <VoucherProvider>
              <Navigation />
              {children}
              <FloatingWidgets />
              <AIChatbox />
              <Footer />
            </VoucherProvider>
          </FavoriteProvider>
        </CartProvider>
      </body>
    </html>
  );
}
