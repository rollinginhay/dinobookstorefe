'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Voucher {
  id: string;
  code: string;
  discount: number;
  discountType: 'fixed' | 'percentage';
  minOrder: number;
  maxDiscount?: number;
  description: string;
  expiryDate: string;
  available: boolean;
}

interface VoucherContextType {
  vouchers: Voucher[];
  savedVouchers: string[];
  saveVoucher: (voucherId: string) => void;
  removeVoucher: (voucherId: string) => void;
  isVoucherSaved: (voucherId: string) => boolean;
  getVoucherById: (voucherId: string) => Voucher | undefined;
  calculateDiscount: (voucherId: string, totalAmount: number) => number;
}

const VoucherContext = createContext<VoucherContextType | undefined>(undefined);

// Danh sách voucher
export const availableVouchers: Voucher[] = [
  {
    id: 'voucher-1',
    code: 'GIAM10K',
    discount: 10000,
    discountType: 'fixed',
    minOrder: 120000,
    description: 'Giảm 10.000₫ cho đơn hàng từ 120.000₫',
    expiryDate: '2025-11-30',
    available: true,
  },
  {
    id: 'voucher-2',
    code: 'GIAM20K',
    discount: 20000,
    discountType: 'fixed',
    minOrder: 160000,
    description: 'Giảm 20.000₫ cho đơn hàng từ 160.000₫',
    expiryDate: '2025-11-30',
    available: true,
  },
  {
    id: 'voucher-3',
    code: 'GIAM25K',
    discount: 25000,
    discountType: 'fixed',
    minOrder: 250000,
    description: 'Giảm 25.000₫ cho đơn hàng từ 250.000₫',
    expiryDate: '2025-11-30',
    available: false,
  },
  {
    id: 'voucher-4',
    code: 'SALE10',
    discount: 10,
    discountType: 'percentage',
    minOrder: 200000,
    maxDiscount: 50000,
    description: 'Giảm 10% tối đa 50.000₫ cho đơn hàng từ 200.000₫',
    expiryDate: '2025-11-30',
    available: true,
  },
  {
    id: 'voucher-5',
    code: 'SALE20',
    discount: 20,
    discountType: 'percentage',
    minOrder: 300000,
    maxDiscount: 100000,
    description: 'Giảm 20% tối đa 100.000₫ cho đơn hàng từ 300.000₫',
    expiryDate: '2025-11-30',
    available: true,
  },
  {
    id: 'voucher-6',
    code: 'SALE50',
    discount: 50,
    discountType: 'percentage',
    minOrder: 500000,
    maxDiscount: 200000,
    description: 'Giảm 50% tối đa 200.000₫ cho đơn hàng từ 500.000₫',
    expiryDate: '2025-11-30',
    available: true,
  },
  {
    id: 'voucher-7',
    code: 'FREESHIP',
    discount: 0,
    discountType: 'fixed',
    minOrder: 299000,
    description: 'Miễn phí vận chuyển cho đơn hàng từ 299.000₫',
    expiryDate: '2025-11-30',
    available: true,
  },
];

export function VoucherProvider({ children }: { children: ReactNode }) {
  const [savedVouchers, setSavedVouchers] = useState<string[]>([]);

  // Load saved vouchers from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedVouchers');
    if (saved) {
      setSavedVouchers(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('savedVouchers', JSON.stringify(savedVouchers));
  }, [savedVouchers]);

  const saveVoucher = (voucherId: string) => {
    if (!savedVouchers.includes(voucherId)) {
      setSavedVouchers([...savedVouchers, voucherId]);
    }
  };

  const removeVoucher = (voucherId: string) => {
    setSavedVouchers(savedVouchers.filter(id => id !== voucherId));
  };

  const isVoucherSaved = (voucherId: string) => {
    return savedVouchers.includes(voucherId);
  };

  const getVoucherById = (voucherId: string) => {
    return availableVouchers.find(v => v.id === voucherId);
  };

  const calculateDiscount = (voucherId: string, totalAmount: number): number => {
    const voucher = getVoucherById(voucherId);
    if (!voucher || !voucher.available || totalAmount < voucher.minOrder) {
      return 0;
    }

    if (voucher.discountType === 'fixed') {
      return voucher.discount;
    } else {
      const discount = (totalAmount * voucher.discount) / 100;
      return voucher.maxDiscount ? Math.min(discount, voucher.maxDiscount) : discount;
    }
  };

  return (
    <VoucherContext.Provider
      value={{
        vouchers: availableVouchers,
        savedVouchers,
        saveVoucher,
        removeVoucher,
        isVoucherSaved,
        getVoucherById,
        calculateDiscount,
      }}
    >
      {children}
    </VoucherContext.Provider>
  );
}

export function useVoucher() {
  const context = useContext(VoucherContext);
  if (context === undefined) {
    throw new Error('useVoucher must be used within a VoucherProvider');
  }
  return context;
}

