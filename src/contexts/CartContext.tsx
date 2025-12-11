"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

// Định nghĩa kiểu Book
export interface Book {
  id: number;
  title: string;
  author: string;
  price: number;
  image?: string;
}

// Kiểu dữ liệu cho CartItem
export interface CartItem extends Book {
  quantity: number;
  cartDetailId: number;
  amount: number; // tong gia
  price: number; // don gia
}

// JWT payload
interface JwtPayload {
  sub: string;
  id: number;
  name?: string;
}

// Kiểu dữ liệu context
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (book: Book, quantity?: number) => Promise<void>;
  removeFromCart: (cartDetailId: number) => Promise<void>;
  updateQuantity: (cartDetailId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const BASE_URL = "http://localhost:8080";
  // Lấy token & decode userId
  useEffect(() => {
    console.log();
    const t = localStorage.getItem("jwtToken");
    if (!t) return;
    setToken(t);
    try {
      const decoded = jwtDecode<JwtPayload>(t);
      if (decoded.id) setUserId(decoded.id);
    } catch (err) {
      console.error("Invalid token", err);
    }
  }, []);

  // Lấy giỏ hàng và bookDetail
  useEffect(() => {
    if (!userId || !token) return;

    const fetchCart = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/v1/user/${userId}/relationships/cartDetail`,
          { headers: { Authorization: `Bearer ${token}` } }
          // const addToCart = (book: Book, quantity: number = 1) => {
          //   // 1. Cập nhật giỏ hàng local (hoạt động cả khi chưa login)
          //   setCartItems(prevItems => {
          //     const existingItem = prevItems.find(item => item.id === book.id);

          //     if (existingItem) {
          //       return prevItems.map(item =>
          //         item.id === book.id
          //           ? { ...item, quantity: item.quantity + quantity }
          //           : item
        );
        const data = await res.json();

        const items: CartItem[] = await Promise.all(
          data.data.map(async (item: any) => {
            const bookRes = await fetch(
              `${BASE_URL}/v1/bookDetail/${item.attributes.bookDetailId}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const bookData = await bookRes.json();
            return {
              cartDetailId: Number(item.id),
              quantity: Number(item.quantity ?? 1),
              amount: Number(item.attributes.amount),
              id: Number(bookData.data.id),
              title: bookData.data.attributes.title,
              author: bookData.data.attributes.author,
              price: Number(
                String(bookData.data.attributes.supplyPrice).replace(
                  /[^0-9]/g,
                  ""
                )
              ),
              image: bookData.data.attributes.image,
              abc: console.log(
                "bookData",
                bookData.data.attributes.supplyPrice
              ),
            };
          })
        );
        console.log("items", items);

        setTimeout(() => setCartItems(items), 1000);
      } catch (err) {
        console.error("Failed to fetch cart", err);
      }
    };
    fetchCart();
  }, [userId, token]);
  // Thêm vào giỏ
  const addToCart = async (book: Book, quantity: number = 1) => {
    if (!token || !userId) return;

    //     return [...prevItems, { ...book, quantity }];
    //   });

    //   // 2. Gọi API để đồng bộ giỏ hàng (luôn gọi dù đã login hay chưa)
    //   if (typeof window === 'undefined') return;
    //   const accessToken = window.localStorage.getItem('accessToken');
    //   const guestIdKey = 'guestId';

    //   // Tạo guest id nếu chưa có — giúp backend nhận diện giỏ hàng khách......
    //   let guestId = window.localStorage.getItem(guestIdKey);
    //   if (!guestId) {
    //     guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    //     window.localStorage.setItem(guestIdKey, guestId);
    //   }

    //   if (!API_BASE_URL) return;

    //   // Gửi request nền, không chặn UI. Gửi header Authorization chỉ khi có token.....
    //   (async () => {
    //     try {
    //       const headers: Record<string, string> = {
    //         'Content-Type': 'application/json',
    //         'X-Guest-Id': guestId,
    //       };

    //       if (accessToken) {
    //         headers.Authorization = `Bearer ${accessToken}`;
    //       }

    //       const res = await fetch(`${API_BASE_URL}/v1/cart/items`, {
    //         method: 'POST',
    //         headers,
    //         body: JSON.stringify({ bookId: book.id, quantity }),
    //       });

    //       // Nếu backend trả về giỏ hàng đồng bộ (ví dụ { items: [...] } ),
    //       // cập nhật lại local state để giữ nhất quán.
    //       if (res.ok) {
    //         try {
    //           const data = await res.json();
    //           // Hỗ trợ nhiều dạng response: items array hoặc data.data
    //           const items = data?.items || data?.data || null;
    //           if (Array.isArray(items)) {
    //             // Nếu items có cấu trúc khác, bạn có thể map lại cho phù hợp.
    //             setCartItems(items);
    //           }
    //         } catch (e) {
    //           // Không parse được JSON — bỏ qua, không chặn UI
    //         }
    //       }
    //     } catch (e) {
    //       // Nếu API lỗi, vẫn giữ giỏ hàng local, không chặn flow người dùng.
    //     }
    //   })();
    // };

    // Kiểm tra sản phẩm đã có trong giỏ chưa
    const existingItem = cartItems.find((item) => item.id === book.id);

    if (existingItem) {
      // Nếu đã có → cộng dồn số lượng
      const newQuantity = existingItem.quantity + quantity;
      await updateQuantity(existingItem.cartDetailId, newQuantity);

      // Update state local sau khi backend xong
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === book.id
            ? {
                ...item,
                quantity: newQuantity,
                amount: item.price * newQuantity,
              }
            : item
        )
      );
    } else {
      // Nếu chưa có → tạo mới
      try {
        const body = {
          data: {
            type: "cartDetail",
            attributes: {
              userId,
              bookDetailId: book.id,
              quantity,
              amount: book.price * quantity,
              price: book.price,
              enabled: true,
            },
          },
        };

        const res = await fetch(`${BASE_URL}/v1/cartDetail/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        const newItem: CartItem = {
          ...book,
          cartDetailId: Number(data.data.id),
          quantity,
          amount: book.price * quantity,
          price: book.price,
        };

        setCartItems((prev) => [...prev, newItem]);
      } catch (err) {
        console.error("Failed to add to cart", err);
      }
    }
  };

  // Xóa khỏi giỏ
  const removeFromCart = async (cartDetailId: number) => {
    if (!token || !userId) return;

    try {
      await fetch(`${BASE_URL}/v1/cartDetail/${cartDetailId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setCartItems((prev) =>
        prev.filter((item) => item.cartDetailId !== cartDetailId)
      );
    } catch (err) {
      console.error("Failed to remove from cart", err);
    }
  };

  // Cập nhật số lượng
  const updateQuantity = async (cartDetailId: number, quantity: number) => {
    if (!token || !userId) return;

    if (quantity <= 0) return removeFromCart(cartDetailId);

    const body = { data: { id: cartDetailId, attributes: { quantity } } };

    try {
      await fetch(`${BASE_URL}/v1/cartDetail/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      console.log("");
      setCartItems((prev) =>
        prev.map((item) =>
          item.cartDetailId === cartDetailId
            ? {
                ...item,
                quantity,
                amount: item.price * quantity, // FIX QUAN TRỌNG
              }
            : item
        )
      );
    } catch (err) {
      console.error("Failed to update quantity", err);
    }
  };

  // Xóa toàn bộ giỏ
  const clearCart = async () => {
    if (!token || !userId) return;

    for (const item of cartItems) {
      try {
        await fetch(`${BASE_URL}/v1/cartDetail/${item.cartDetailId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Failed to remove item", err);
      }
    }

    setCartItems([]);
  };

  const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cartItems.reduce((sum, i) => sum + i.amount, 0);
  // const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  //   const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
  console.log("--------------------", context);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
