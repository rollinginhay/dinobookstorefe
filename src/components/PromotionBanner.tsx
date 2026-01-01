'use client';

import { usePromotion } from '@/contexts/PromotionContext';
import Link from 'next/link';

export default function PromotionBanner() {
  const { activePromotions } = usePromotion();
  
  // Lấy đợt giảm giá nổi bật nhất (discount cao nhất)
  const featuredPromotion = activePromotions.length > 0
    ? activePromotions.reduce((best, current) => {
        const bestDiscount = best.discountType === 'percentage' 
          ? best.discount 
          : (best.discount / 1000) * 100; // Ước tính % cho fixed
        const currentDiscount = current.discountType === 'percentage'
          ? current.discount
          : (current.discount / 1000) * 100;
        return currentDiscount > bestDiscount ? current : best;
      })
    : null;

  return (
    <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-600 text-white py-3 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)'
        }}></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.856.1L9.5 15.5l-2.611 1.856a1 1 0 01-1.856-.1L3.854 12.8 1.5 10.866a1 1 0 010-1.732L3.854 7.2l1.179-4.456A1 1 0 016.889 2.644L9.5 4.5l2.611-1.856A1 1 0 0112 2z" clipRule="evenodd" />
            </svg>
            <span className="font-bold text-lg">KHUYẾN MÃI ĐẶC BIỆT</span>
          </div>
          <span className="hidden sm:inline text-white/70">|</span>
          {featuredPromotion ? (
            <>
              <Link href="/khuyen-mai" className="text-center sm:text-left hover:underline">
                <span className="text-base sm:text-lg">
                  🔥 {featuredPromotion.name}: Giảm{' '}
                  <span className="font-bold text-yellow-300 text-xl">
                    {featuredPromotion.discountType === 'percentage' 
                      ? `${featuredPromotion.discount}%`
                      : `${featuredPromotion.discount.toLocaleString('vi-VN')}₫`
                    }
                  </span>
                </span>
              </Link>
              <span className="hidden sm:inline text-white/70">|</span>
            </>
          ) : (
            <>
              <div className="text-center sm:text-left">
                <span className="text-base sm:text-lg">
                  Giảm đến <span className="font-bold text-yellow-300 text-xl">50%</span> cho đơn hàng đầu tiên
                </span>
              </div>
              <span className="hidden sm:inline text-white/70">|</span>
            </>
          )}
          <div className="text-center sm:text-left">
            <span className="text-base sm:text-lg">
              🚚 Miễn phí ship cho đơn từ <span className="font-bold">299.000₫</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
