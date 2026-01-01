'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Promotion {
  id: string;
  name: string;
  description: string;
  discount: number; // Phần trăm giảm giá
  discountType: 'percentage' | 'fixed'; // Loại giảm giá
  maxDiscount?: number; // Giảm tối đa (nếu là percentage)
  minOrder?: number; // Đơn tối thiểu
  startDate: string; // Ngày bắt đầu
  endDate: string; // Ngày kết thúc
  active: boolean; // Trạng thái kích hoạt
  applicableCategories?: string[]; // Danh mục áp dụng
  applicableBooks?: number[]; // ID sách áp dụng (nếu null thì áp dụng tất cả)
  image?: string; // Ảnh banner
}

interface PromotionContextType {
  promotions: Promotion[];
  activePromotions: Promotion[];
  getPromotionById: (promotionId: string) => Promotion | undefined;
  getPromotionForBook: (bookId: number, category?: string) => Promotion | undefined;
  calculatePromotionDiscount: (promotionId: string, totalAmount: number) => number;
  isPromotionActive: (promotionId: string) => boolean;
}

const PromotionContext = createContext<PromotionContextType | undefined>(undefined);

// Danh sách đợt giảm giá mẫu
export const availablePromotions: Promotion[] = [
  {
    id: 'promo-1',
    name: 'Siêu Sale Tháng 11',
    description: 'Giảm giá cực sốc cho tất cả sách trong tháng 11',
    discount: 20,
    discountType: 'percentage',
    maxDiscount: 100000,
    minOrder: 0,
    startDate: '2024-11-01',
    endDate: '2024-11-30',
    active: true,
    image: '/images/promo-1.jpg',
  },
  {
    id: 'promo-2',
    name: 'Flash Sale Sách Văn Học',
    description: 'Giảm 30% cho tất cả sách văn học',
    discount: 30,
    discountType: 'percentage',
    maxDiscount: 150000,
    minOrder: 100000,
    startDate: '2024-11-15',
    endDate: '2024-11-20',
    active: true,
    applicableCategories: ['Văn học', 'Tiểu thuyết'],
    image: '/images/promo-2.jpg',
  },
  {
    id: 'promo-3',
    name: 'Combo Deal - Mua 2 Tặng 1',
    description: 'Mua 2 cuốn bất kỳ, giảm thêm 50.000₫',
    discount: 50000,
    discountType: 'fixed',
    minOrder: 200000,
    startDate: '2024-11-10',
    endDate: '2024-11-25',
    active: true,
    image: '/images/promo-3.jpg',
  },
  {
    id: 'promo-4',
    name: 'Sale Sách Thiếu Nhi',
    description: 'Giảm 25% cho tất cả sách thiếu nhi',
    discount: 25,
    discountType: 'percentage',
    maxDiscount: 80000,
    minOrder: 50000,
    startDate: '2024-11-05',
    endDate: '2024-11-28',
    active: true,
    applicableCategories: ['Sách thiếu nhi'],
    image: '/images/promo-4.jpg',
  },
  {
    id: 'promo-5',
    name: 'Black Friday Sale',
    description: 'Giảm giá Black Friday - Giảm đến 50%',
    discount: 50,
    discountType: 'percentage',
    maxDiscount: 200000,
    minOrder: 300000,
    startDate: '2024-11-29',
    endDate: '2024-11-30',
    active: false, // Chưa bắt đầu
    image: '/images/promo-5.jpg',
  },
];

export function PromotionProvider({ children }: { children: ReactNode }) {
  const [promotions, setPromotions] = useState<Promotion[]>(availablePromotions);

  // Load promotions from localStorage nếu có
  useEffect(() => {
    const saved = localStorage.getItem('promotions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPromotions(parsed);
      } catch (e) {
        console.error('Failed to parse saved promotions', e);
      }
    }
  }, []);

  // Lọc các đợt giảm giá đang hoạt động
  const activePromotions = promotions.filter((promo) => {
    if (!promo.active) return false;
    
    const now = new Date();
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);
    end.setHours(23, 59, 59, 999); // Kết thúc vào cuối ngày
    
    return now >= start && now <= end;
  });

  const getPromotionById = (promotionId: string) => {
    return promotions.find((p) => p.id === promotionId);
  };

  // Lấy đợt giảm giá phù hợp cho một cuốn sách
  const getPromotionForBook = (bookId: number, category?: string): Promotion | undefined => {
    // Tìm đợt giảm giá phù hợp nhất
    const applicablePromos = activePromotions.filter((promo) => {
      // Nếu có danh sách sách cụ thể, kiểm tra xem sách có trong danh sách không
      if (promo.applicableBooks && promo.applicableBooks.length > 0) {
        return promo.applicableBooks.includes(bookId);
      }
      
      // Nếu có danh mục áp dụng, kiểm tra category
      if (promo.applicableCategories && promo.applicableCategories.length > 0) {
        if (!category) return false;
        return promo.applicableCategories.some((cat) => 
          category.toLowerCase().includes(cat.toLowerCase()) || 
          cat.toLowerCase().includes(category.toLowerCase())
        );
      }
      
      // Nếu không có điều kiện áp dụng cụ thể, áp dụng cho tất cả
      return true;
    });

    // Trả về đợt giảm giá có discount cao nhất
    if (applicablePromos.length === 0) return undefined;
    
    return applicablePromos.reduce((best, current) => {
      const bestDiscount = best.discountType === 'percentage' 
        ? (best.discount * (best.maxDiscount || 1000000) / 100)
        : best.discount;
      const currentDiscount = current.discountType === 'percentage'
        ? (current.discount * (current.maxDiscount || 1000000) / 100)
        : current.discount;
      
      return currentDiscount > bestDiscount ? current : best;
    });
  };

  const calculatePromotionDiscount = (promotionId: string, totalAmount: number): number => {
    const promotion = getPromotionById(promotionId);
    if (!promotion || !isPromotionActive(promotionId)) {
      return 0;
    }

    // Kiểm tra đơn tối thiểu
    if (promotion.minOrder && totalAmount < promotion.minOrder) {
      return 0;
    }

    if (promotion.discountType === 'fixed') {
      return promotion.discount;
    } else {
      const discount = (totalAmount * promotion.discount) / 100;
      return promotion.maxDiscount ? Math.min(discount, promotion.maxDiscount) : discount;
    }
  };

  const isPromotionActive = (promotionId: string): boolean => {
    const promotion = getPromotionById(promotionId);
    if (!promotion || !promotion.active) return false;

    const now = new Date();
    const start = new Date(promotion.startDate);
    const end = new Date(promotion.endDate);
    end.setHours(23, 59, 59, 999);

    return now >= start && now <= end;
  };

  return (
    <PromotionContext.Provider
      value={{
        promotions,
        activePromotions,
        getPromotionById,
        getPromotionForBook,
        calculatePromotionDiscount,
        isPromotionActive,
      }}
    >
      {children}
    </PromotionContext.Provider>
  );
}

export function usePromotion() {
  const context = useContext(PromotionContext);
  if (context === undefined) {
    throw new Error('usePromotion must be used within a PromotionProvider');
  }
  return context;
}

