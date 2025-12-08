'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Book } from '@/components/BookCard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface CartItem extends Book {
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (book: Book, quantity?: number) => void;
  removeFromCart: (bookId: number) => void;
  updateQuantity: (bookId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (book: Book, quantity: number = 1) => {
    // 1. Cập nhật giỏ hàng local (hoạt động cả khi chưa login)
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === book.id);

      if (existingItem) {
        return prevItems.map(item =>
          item.id === book.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prevItems, { ...book, quantity }];
    });

    // 2. Gọi API để đồng bộ giỏ hàng (luôn gọi dù đã login hay chưa)
    if (typeof window === 'undefined') return;
    const accessToken = window.localStorage.getItem('accessToken');
    const guestIdKey = 'guestId';

    // Tạo guest id nếu chưa có — giúp backend nhận diện giỏ hàng khách......
    let guestId = window.localStorage.getItem(guestIdKey);
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      window.localStorage.setItem(guestIdKey, guestId);
    }

    if (!API_BASE_URL) return;

    // Gửi request nền, không chặn UI. Gửi header Authorization chỉ khi có token.....
    (async () => {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Guest-Id': guestId,
        };

        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`;
        }

        const res = await fetch(`${API_BASE_URL}/v1/cart/items`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ bookId: book.id, quantity }),
        });

        // Nếu backend trả về giỏ hàng đồng bộ (ví dụ { items: [...] } ),
        // cập nhật lại local state để giữ nhất quán.
        if (res.ok) {
          try {
            const data = await res.json();
            // Hỗ trợ nhiều dạng response: items array hoặc data.data
            const items = data?.items || data?.data || null;
            if (Array.isArray(items)) {
              // Nếu items có cấu trúc khác, bạn có thể map lại cho phù hợp.
              setCartItems(items);
            }
          } catch (e) {
            // Không parse được JSON — bỏ qua, không chặn UI
          }
        }
      } catch (e) {
        // Nếu API lỗi, vẫn giữ giỏ hàng local, không chặn flow người dùng.
      }
    })();
  };

  const removeFromCart = (bookId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== bookId));
  };

  const updateQuantity = (bookId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(bookId);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === bookId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };
const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}