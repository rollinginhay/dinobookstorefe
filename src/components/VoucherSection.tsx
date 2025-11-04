'use client';

import { useState } from 'react';
import { useVoucher } from '@/contexts/VoucherContext';
import Link from 'next/link';

export default function VoucherSection() {
  const { vouchers, saveVoucher, isVoucherSaved } = useVoucher();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleSaveVoucher = (voucherId: string) => {
    saveVoucher(voucherId);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Hiển thị 6 voucher đầu tiên
  const displayVouchers = vouchers.slice(0, 6);

  return (
    <section className="bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            🎁 ƯU ĐÃI ĐẶC BIỆT
          </h2>
          <Link
            href="/voucher"
            className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 group"
          >
            Xem tất cả
            <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayVouchers.map((voucher) => {
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
                    {voucher.discountType === 'percentage' ? '🎯' : '💰'}
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
                    <p className="text-sm text-gray-600 mb-1">{voucher.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                        {voucher.code}
                      </span>
                      <button
                        onClick={() => handleCopyCode(voucher.code)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {copiedCode === voucher.code ? '✓ Đã copy' : 'Copy mã'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">HSD: {voucher.expiryDate}</p>
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
      </div>
    </section>
  );
}

