"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Book } from "@/components/BookCard";

export interface CartItem extends Book {
  quantity: number;
  bookDetailId: number;
  copyId: number;
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

  // Load cart từ localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        const parsed: CartItem[] = JSON.parse(savedCart);

        // đảm bảo có bookDetailId & copyId
        const normalized = parsed.map((item) => {
          const safeId =
            item.bookDetailId ?? (item as any).copyId ?? (item as any).id; // fallback cuối cùng

          return {
            ...item,
            bookDetailId: Number(safeId),
            copyId: Number(safeId),
          };
        });

        setCartItems(normalized);
      }
    } catch (e) {
      console.error("Error loading cart", e);
    }
  }, []);

  // Save cart
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (book: Book, quantity: number = 1) => {
    setCartItems((prev) => {
      // 🔹 Tính id an toàn cho BookDetail
      const safeId =
        (book as any).bookDetailId ?? (book as any).copyId ?? book.id; // fallback cuối cùng

      const existing = prev.find((i) => i.id === book.id);

      if (existing) {
        return prev.map((i) =>
          i.id === book.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      const safeDetailId = book.id;
      const item: CartItem = {
        ...book,
        quantity,
        bookDetailId: safeDetailId,
        copyId: safeDetailId,
      };

      console.log("🛒 Add to cart item:", item); // để bạn tự check
      return [...prev, item];
    });
  };

  const removeFromCart = (bookId: number) => {
    setCartItems((prev) => prev.filter((i) => i.id !== bookId));
  };

  const updateQuantity = (bookId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(bookId);
      return;
    }
    setCartItems((prev) =>
      prev.map((i) => (i.id === bookId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setCartItems([]);

  const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cartItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

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
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
