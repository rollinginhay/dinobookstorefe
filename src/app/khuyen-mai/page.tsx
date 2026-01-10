'use client';

import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import { usePromotion } from '@/contexts/PromotionContext';
import Link from 'next/link';

export default function KhuyenMaiPage() {
  const { promotions, activePromotions } = usePromotion();
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'ended'>('all');

  const now = new Date();
  
  const filteredPromotions = promotions.filter((promo) => {
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);
    end.setHours(23, 59, 59, 999);

    if (filter === 'active') {
      return promo.active && now >= start && now <= end;
    }
    if (filter === 'upcoming') {
      return promo.active && now < start;
    }
    if (filter === 'ended') {
      return now > end;
    }
    return true;
  });

  const getStatusBadge = (promo: typeof promotions[0]) => {
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);
    end.setHours(23, 59, 59, 999);

    if (!promo.active) {
      return <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">Tạm dừng</span>;
    }
    if (now < start) {
      return <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Sắp diễn ra</span>;
    }
    if (now > end) {
      return <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">Đã kết thúc</span>;
    }
    return <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">Đang diễn ra</span>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb 
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Đợt giảm giá' }
        ]} 
      />

      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-3">🔥 Đợt Giảm Giá</h1>
          <p className="text-lg text-purple-100">
            Các chương trình khuyến mãi đặc biệt đang diễn ra
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả ({promotions.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                filter === 'active'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đang diễn ra ({activePromotions.length})
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                filter === 'upcoming'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sắp diễn ra ({promotions.filter(p => {
                const start = new Date(p.startDate);
                return p.active && now < start;
              }).length})
            </button>
            <button
              onClick={() => setFilter('ended')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                filter === 'ended'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đã kết thúc ({promotions.filter(p => {
                const end = new Date(p.endDate);
                end.setHours(23, 59, 59, 999);
                return now > end;
              }).length})
            </button>
          </div>
        </div>

        {/* Promotions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPromotions.map((promo) => {
            const start = new Date(promo.startDate);
            const end = new Date(promo.endDate);
            end.setHours(23, 59, 59, 999);
            const isActive = promo.active && now >= start && now <= end;
            const isUpcoming = promo.active && now < start;

            return (
              <div
                key={promo.id}
                className={`bg-white border-2 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 ${
                  isActive
                    ? 'border-red-500'
                    : isUpcoming
                    ? 'border-blue-400'
                    : 'border-gray-300 opacity-75'
                }`}
              >
                {/* Banner Image */}
                {promo.image ? (
                  <div className="h-48 bg-gradient-to-r from-purple-500 to-pink-500 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-6xl">🔥</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-r from-purple-500 to-pink-500 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-6xl">🔥</span>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-xl text-gray-900 flex-1">
                      {promo.name}
                    </h3>
                    {getStatusBadge(promo)}
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{promo.description}</p>

                  {/* Discount Info */}
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl font-bold text-red-600">
                        {promo.discountType === 'percentage' 
                          ? `${promo.discount}%`
                          : `${promo.discount.toLocaleString('vi-VN')}₫`
                        }
                      </span>
                      {promo.discountType === 'percentage' && promo.maxDiscount && (
                        <span className="text-sm text-gray-600">
                          (Tối đa {promo.maxDiscount.toLocaleString('vi-VN')}₫)
                        </span>
                      )}
                    </div>
                    {promo.minOrder && promo.minOrder > 0 && (
                      <p className="text-xs text-gray-600">
                        Áp dụng cho đơn từ {promo.minOrder.toLocaleString('vi-VN')}₫
                      </p>
                    )}
                  </div>

                  {/* Conditions */}
                  <div className="space-y-2 mb-4">
                    {promo.applicableCategories && promo.applicableCategories.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-semibold">Danh mục:</span>
                        <span>{promo.applicableCategories.join(', ')}</span>
                      </div>
                    )}
                    {(!promo.applicableCategories || promo.applicableCategories.length === 0) && 
                     (!promo.applicableBooks || promo.applicableBooks.length === 0) && (
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">Áp dụng:</span> Tất cả sản phẩm
                      </div>
                    )}
                  </div>

                  {/* Date Range */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div>
                        <span className="font-semibold">Bắt đầu:</span> {formatDate(promo.startDate)}
                      </div>
                      <div>
                        <span className="font-semibold">Kết thúc:</span> {formatDate(promo.endDate)}
                      </div>
                    </div>
                  </div>

                  {/* Action Button - bỏ nút Mua ngay, chỉ giữ thông tin khuyến mãi */}
                  {isUpcoming && (
                    <button
                      disabled
                      className="mt-4 w-full bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg cursor-not-allowed"
                    >
                      Sắp diễn ra
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredPromotions.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🔥</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Không có đợt giảm giá</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'active' 
                ? 'Hiện tại không có đợt giảm giá nào đang diễn ra' 
                : 'Không tìm thấy đợt giảm giá phù hợp'}
            </p>
            <Link
              href="/"
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              Về trang chủ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

