'use client';

import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import { useVoucher } from '@/contexts/VoucherContext';
import Link from 'next/link';

export default function VoucherPage() {
  const { vouchers, saveVoucher, isVoucherSaved } = useVoucher();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'saved' | 'available'>('all');

  const handleSaveVoucher = (voucherId: string) => {
    saveVoucher(voucherId);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredVouchers = vouchers.filter(voucher => {
    if (filter === 'saved') return isVoucherSaved(voucher.id);
    if (filter === 'available') return voucher.available;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb 
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Mã giảm giá' }
        ]} 
      />

      <div className="bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-3">🎁 Mã Giảm Giá</h1>
          <p className="text-lg text-yellow-100">
            Lưu mã ngay để nhận nhiều ưu đãi hấp dẫn
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
          <div className="flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả ({vouchers.length})
            </button>
            <button
              onClick={() => setFilter('saved')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                filter === 'saved'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đã lưu ({vouchers.filter(v => isVoucherSaved(v.id)).length})
            </button>
            <button
              onClick={() => setFilter('available')}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                filter === 'available'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Có thể dùng ({vouchers.filter(v => v.available).length})
            </button>
          </div>
        </div>

        {/* Vouchers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVouchers.map((voucher) => {
            const isSaved = isVoucherSaved(voucher.id);
            return (
              <div
                key={voucher.id}
                className={`bg-white border-2 border-dashed rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 ${
                  voucher.available 
                    ? isSaved 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-yellow-400'
                    : 'border-gray-300 opacity-60'
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`text-5xl ${voucher.available ? '' : 'grayscale opacity-50'}`}>
                    {voucher.discountType === 'percentage' ? '🎯' : voucher.discount === 0 ? '🚚' : '💰'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-2xl text-gray-900">
                        {voucher.discountType === 'percentage' 
                          ? `Giảm ${voucher.discount}%`
                          : voucher.discount === 0
                          ? 'FREESHIP'
                          : `Giảm ${voucher.discount.toLocaleString('vi-VN')}₫`
                        }
                      </h3>
                      {isSaved && (
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                          Đã lưu
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{voucher.description}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg font-mono">
                        {voucher.code}
                      </span>
                      <button
                        onClick={() => handleCopyCode(voucher.code)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
                      >
                        {copiedCode === voucher.code ? '✓ Đã copy' : 'Copy'}
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      <p>Đơn tối thiểu: <span className="font-semibold">{voucher.minOrder.toLocaleString('vi-VN')}₫</span></p>
                      {voucher.maxDiscount && (
                        <p>Tối đa: <span className="font-semibold">{voucher.maxDiscount.toLocaleString('vi-VN')}₫</span></p>
                      )}
                      <p className="mt-1">HSD: {voucher.expiryDate}</p>
                    </div>
                  </div>
                </div>
                {voucher.available ? (
                  <button
                    onClick={() => handleSaveVoucher(voucher.id)}
                    className={`w-full font-semibold py-3 px-4 rounded-lg transition-colors ${
                      isSaved
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isSaved ? '✓ Đã lưu mã' : 'Lưu mã'}
                  </button>
                ) : (
                  <button className="w-full bg-gray-300 text-gray-600 font-semibold py-3 px-4 rounded-lg cursor-not-allowed" disabled>
                    HẾT MÃ
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {filteredVouchers.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🎁</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Không có mã giảm giá</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'saved' 
                ? 'Bạn chưa lưu mã giảm giá nào' 
                : 'Không có mã giảm giá khả dụng'}
            </p>
            <Link
              href="/"
              className="inline-block bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
            >
              Về trang chủ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

