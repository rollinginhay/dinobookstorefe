"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { BookDetail } from "./ReceiptContext";
import { calculateDiscountedPrice, fetchCampaigns, Campaign } from "@/utils/campaign.utils";

// Định nghĩa kiểu Book (DTO kết hợp dữ liệu từ bảng book + bookDetail)
// ⚠️ LƯU Ý: price ở đây KHÔNG phải từ bảng book (bảng book không có cột giá)
//           mà là từ bookDetail.salePrice hoặc giá đã giảm từ cartDetail
export interface Book {
  id: number; // bookDetailId (không phải bookId)
  title: string; // từ book.title
  author: string; // từ book.author
  price: number; // từ bookDetail.salePrice hoặc cartDetail.price (giá đã giảm)
  image?: string; // từ book.imageUrl
}

// Kiểu dữ liệu cho CartItem
export interface CartItem extends Book {
  quantity: number;
  cartDetailId: number;
  amount: number; // tong gia (đã giảm)
  price: number; // don gia (đã giảm)
  originalPrice?: number; // ✅ Giá gốc (salePrice) - để hiển thị ở giỏ hàng
  bookDetailId: number;
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
  selectedItems: Set<number>; // Set chứa cartDetailId của các sản phẩm đã chọn
  addToCart: (book: Book, quantity?: number) => Promise<void>;
  removeFromCart: (cartDetailId: number) => Promise<void>;
  updateQuantity: (cartDetailId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  clearAllCartFromBackend: () => Promise<void>; // Xóa tất cả giỏ hàng từ backend
  toggleSelectItem: (cartDetailId: number) => void;
  toggleSelectAll: () => void;
  isAllSelected: boolean;
  selectedCartItems: CartItem[]; // Danh sách các sản phẩm đã chọn
  totalItems: number;
  totalPrice: number;
  selectedTotalItems: number; // Tổng số lượng sản phẩm đã chọn
  selectedTotalPrice: number; // Tổng giá trị các sản phẩm đã chọn
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [userId, setUserId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [guestCart, setGuestCart] = useState<CartItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const BASE_URL = "http://localhost:8080";
  
  // ✅ Fetch campaigns để tính giảm giá PERCENTAGE_PRODUCT
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setCampaignsLoading(true);
        const data = await fetchCampaigns();
        setCampaigns(data);
        console.log("✅ [CartContext] Loaded campaigns:", data.length);
      } catch (error) {
        console.error("Lỗi fetch campaigns trong CartContext:", error);
        setCampaigns([]);
      } finally {
        setCampaignsLoading(false);
      }
    };
    loadCampaigns();
  }, []);
  // Lấy token & decode userId
  useEffect(() => {
    const t = localStorage.getItem("jwtToken");
    if (!t) {
      setToken(null);
      setUserId(null);
      setCartItems([]); // Xóa giỏ hàng khi không có token
      setSelectedItems(new Set());
      return;
    }
    setToken(t);
    try {
      const decoded = jwtDecode<JwtPayload>(t);
      if (decoded.id) setUserId(decoded.id);
    } catch (err) {
      console.error("Invalid token", err);
      setToken(null);
      setUserId(null);
      setCartItems([]);
      setSelectedItems(new Set());
    }
  }, []);

  // Lắng nghe thay đổi token (khi đăng nhập/đăng xuất)
  useEffect(() => {
    const handleStorageChange = () => {
      const t = localStorage.getItem("jwtToken");
      if (!t) {
        // Token bị xóa (đăng xuất) - xóa giỏ hàng
        setToken(null);
        setUserId(null);
        setCartItems([]);
        setSelectedItems(new Set());
      } else {
        try {
          const decoded = jwtDecode<JwtPayload>(t);
          if (decoded.id) {
            setToken(t);
            setUserId(decoded.id);
          }
        } catch (err) {
          console.error("Invalid token", err);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    // Kiểm tra token mỗi giây để phát hiện đăng xuất
    const interval = setInterval(() => {
      const t = localStorage.getItem("jwtToken");
      if (!t && token) {
        // Token bị xóa (đăng xuất)
        handleStorageChange();
      } else if (t && !token) {
        // Token mới xuất hiện (đăng nhập)
        handleStorageChange();
      }
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [token]);
  useEffect(() => {
    if (token) return;

    const saved = localStorage.getItem("guest_cart");
    if (saved) {
      setCartItems(JSON.parse(saved));
      setGuestCart(JSON.parse(saved));
    }
  }, [token]);
  //guest save
  useEffect(() => {
    if (!token) {
      localStorage.setItem("guest_cart", JSON.stringify(cartItems));
    }
  }, [cartItems, token]);

  // Lấy giỏ hàng và bookDetail
  useEffect(() => {
    if (!userId || !token) return;
    //guest load

    // Kiểm tra xem giỏ hàng vừa được xóa không (trong vòng 5 giây)
    const cartJustCleared = localStorage.getItem("cartJustCleared");
    if (cartJustCleared) {
      const clearedTime = parseInt(cartJustCleared);
      const now = Date.now();
      // Nếu vừa xóa trong vòng 5 giây, không fetch lại
      if (now - clearedTime < 5000) {
        console.log(
          "⏸️ Giỏ hàng vừa được xóa, bỏ qua fetch (còn",
          Math.round((5000 - (now - clearedTime)) / 1000),
          "giây)"
        );
        // Không xóa flag ngay, để tránh fetch lại khi component re-render
        return;
      }
      // Sau 5 giây, xóa flag
      localStorage.removeItem("cartJustCleared");
      console.log("🔄 Đã hết thời gian chờ, cho phép fetch lại giỏ hàng");
    }

    const getBookDetailById = (id: number): any => {
      const existedList = localStorage.getItem("allBookData");
      if (!existedList) {
        return null;
      }
      return JSON.parse(existedList).find((item: any) => item?.id === id);
    };
    const fetchCart = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/v1/user/${userId}/relationships/cartDetail`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) {
          console.error("Failed to fetch cart:", res.status);
          setCartItems([]);
          return;
        }

        const data = await res.json();

        // Nếu không có items, không cần fetch thêm
        if (!data.data || data.data.length === 0) {
          setCartItems([]);
          return;
        }
        const items: CartItem[] = await Promise.all(
          data.data.map(async (item: any) => {
            try {
              // Fetch bookDetail với ?e=true để lấy book trong included
              const bookDetailRes = await fetch(
                `${BASE_URL}/v1/bookDetail/${item.attributes.bookDetailId}?e=true`,
                { headers: { Authorization: `Bearer ${token}` } }
              );

              if (!bookDetailRes.ok) {
                console.warn(
                  "Failed to fetch bookDetail:",
                  item.attributes.bookDetailId
                );
                return null;
              }

              const bookDetailData = await bookDetailRes.json();

              // Tìm book trong included
              const included = bookDetailData.included || [];
              let book = included.find((x: any) => x.type === "book");

              // Nếu không có book trong included, fetch từ relationships
              if (!book && bookDetailData.data?.relationships?.book?.data?.id) {
                try {
                  const bookId = bookDetailData.data.relationships.book.data.id;
                  const bookRes = await fetch(`${BASE_URL}/v1/book/${bookId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (bookRes.ok) {
                    const bookJson = await bookRes.json();
                    book = bookJson.data;
                  }
                } catch (err) {
                  console.warn("Failed to fetch book from relationships:", err);
                }
              }

              const bookDetailAttrs = bookDetailData.data?.attributes || {};
              
              // ✅ LẤY SUPPLY_PRICE LÀM GIÁ GỐC (KHÔNG BAO GIỜ dùng salePrice)
              const supplyPrice = Number(bookDetailAttrs.supplyPrice || 0);
              const bookDetailId = Number(bookDetailData.data.id);
              
              // ✅ Tính giá đã giảm từ campaign PERCENTAGE_PRODUCT
              const priceInfo = calculateDiscountedPrice(bookDetailId, supplyPrice, campaigns);
              const discountedPrice = priceInfo.discountedPrice;
              const hasDiscount = priceInfo.hasDiscount;
              
              // ✅ Giá hiển thị: LUÔN tính từ supplyPrice và campaign, KHÔNG dùng item.attributes.price hoặc salePrice
              const displayPrice = hasDiscount ? discountedPrice : supplyPrice;
              
              // ✅ Giá gốc: LUÔN là supplyPrice, chỉ set nếu supplyPrice > displayPrice (đơn giản như trang chủ)
              const originalPrice = supplyPrice > displayPrice ? supplyPrice : undefined;
              
              // ✅ Debug để kiểm tra
              if (supplyPrice > 0 && displayPrice < supplyPrice) {
                console.log("✅ [CartContext] Sản phẩm có giảm giá:", {
                  bookDetailId,
                  supplyPrice,
                  displayPrice,
                  originalPrice,
                  hasDiscount
                });
              }

              // ✅ Lấy title và author
              const bookTitle = book?.attributes?.title || "Sách";
              const bookAuthor = book?.attributes?.author || "—";
              const quantity = Number(item.attributes.quantity ?? 1);

              return {
                cartDetailId: Number(item.id),
                quantity: quantity,
                amount: displayPrice * quantity, // ✅ Tính lại amount từ price mới
                id: Number(bookDetailData.data.id), // bookDetailId
                title: bookTitle,
                author: bookAuthor,
                price: displayPrice, // ✅ Giá đã giảm (từ campaign hoặc supplyPrice)
                image:
                  book?.attributes?.imageUrl ||
                  getBookDetailById(item.attributes.bookDetailId)?.image ||
                  "/default-book.jpg",
                bookDetailId: Number(bookDetailData.data.id),
                originalPrice: originalPrice, // ✅ Chỉ set originalPrice nếu có giảm giá
              };
            } catch (err) {
              console.error("Error fetching bookDetail:", err);
              return null;
            }
          })
        );

        // Lọc bỏ các items null
        let validItems = items.filter(
          (item): item is CartItem => item !== null
        );


        console.log("📦 Fetched cart items:", validItems.length);
        setCartItems(validItems);
      } catch (err) {
        console.error("Failed to fetch cart", err);
        setCartItems([]);
      }
    };
    fetchCart();
  }, [userId, token, campaigns, campaignsLoading]); // ✅ Re-run khi campaigns load xong để tính lại giá

  // Thêm vào giỏ
  const addToCart = async (book: Book, quantity: number = 1) => {
    // =====================
    // 🟡 CHƯA LOGIN → LOCAL
    // =====================
    if (!token || !userId) {
      setCartItems((prev) => {
        const exist = prev.find((i) => i.id === book.id);
        if (exist) {
          return prev.map((i) =>
            i.id === book.id
              ? {
                  ...i,
                  quantity: i.quantity + quantity,
                  amount: (i.quantity + quantity) * i.price,
                }
              : i
          );
        }

        return [
          ...prev,
          {
            ...book,
            quantity,
            amount: book.price * quantity,
            cartDetailId: -Date.now(), // fake id cho guest
            bookDetailId: (book as any).bookDetailId || book.id, // Sử dụng bookDetailId nếu có, không thì dùng id
            originalPrice: (book as any).originalPrice, // ✅ Giữ lại originalPrice từ Book (đã được tính từ trang chủ)
          },
        ];
      });
      return;
    }

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
        // ✅ LUÔN fetch bookDetail để lấy supplyPrice và tính lại giá (KHÔNG dùng book.price từ trang chủ)
        // ✅ Đảm bảo luôn lấy từ supplyPrice trong DB, không dùng salePrice
        let displayPrice = book.price; // Fallback nếu không fetch được
        let originalPrice = (book as any).originalPrice;
        
        // ✅ LUÔN fetch lại từ DB để đảm bảo lấy supplyPrice, không dùng giá từ book object
        // ✅ Đợi campaigns load xong để tính giá giảm chính xác
        try {
          // Đợi campaigns load xong (nếu đang loading)
          if (campaignsLoading) {
            await new Promise((resolve) => {
              const checkInterval = setInterval(() => {
                if (!campaignsLoading) {
                  clearInterval(checkInterval);
                  resolve(null);
                }
              }, 100);
              // Timeout sau 5 giây
              setTimeout(() => {
                clearInterval(checkInterval);
                resolve(null);
              }, 5000);
            });
          }
          
          const bookDetailRes = await fetch(
            `${BASE_URL}/v1/bookDetail/${book.id}?e=true`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (bookDetailRes.ok) {
            const bookDetailData = await bookDetailRes.json();
            const bookDetailAttrs = bookDetailData.data?.attributes || {};
            // ✅ LẤY SUPPLY_PRICE LÀM GIÁ GỐC (KHÔNG BAO GIỜ dùng salePrice)
            const supplyPrice = Number(bookDetailAttrs.supplyPrice || 0);
            
            if (supplyPrice > 0) {
              // ✅ Tính giá đã giảm từ campaign PERCENTAGE_PRODUCT
              const priceInfo = calculateDiscountedPrice(book.id, supplyPrice, campaigns);
              displayPrice = priceInfo.discountedPrice;
              // ✅ Giá gốc: supplyPrice nếu supplyPrice > displayPrice
              originalPrice = supplyPrice > displayPrice ? supplyPrice : undefined;
            } else {
              // Nếu supplyPrice = 0, dùng giá từ book object (fallback)
              console.warn("⚠️ [CartContext] supplyPrice = 0, dùng giá từ book object:", book.id);
            }
          }
        } catch (err) {
          console.warn("Failed to fetch bookDetail in addToCart, using book data:", err);
          // Fallback: dùng giá từ book object (từ trang chủ đã tính từ supplyPrice)
        }
        
        const body = {
          data: {
            type: "cartDetail",
            attributes: {
              userId,
              bookDetailId: book.id,
              quantity,
              amount: displayPrice * quantity,
              price: displayPrice,
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
          amount: displayPrice * quantity,
          price: displayPrice, // ✅ Giá đã giảm (từ campaign hoặc supplyPrice)
          bookDetailId: (book as any).bookDetailId || book.id,
          originalPrice: originalPrice || (book as any).originalPrice, // ✅ Giữ lại originalPrice từ book nếu có
        };

        setCartItems((prev) => [...prev, newItem]);
      } catch (err) {
        console.error("Failed to add to cart", err);
      }
    }
  };

  // Xóa khỏi giỏ
  const removeFromCart = async (cartDetailId: number) => {
    if (!token || !userId) {
      setCartItems((prev) =>
        prev.filter((i) => i.cartDetailId !== cartDetailId)
      );
      return;
    }

    try {
      // Xóa item đơn lẻ
      await fetch(`${BASE_URL}/v1/cartDetail/${cartDetailId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setCartItems((prev) =>
        prev.filter((item) => item.cartDetailId !== cartDetailId)
      );

      // Xóa khỏi selectedItems
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cartDetailId);
        return newSet;
      });
    } catch (err) {
      console.error("Failed to remove from cart", err);
    }
  };

  // Cập nhật số lượng
  const updateQuantity = async (cartDetailId: number, quantity: number) => {
    if (!token || !userId) {
      setCartItems((prev) =>
        prev.map((i) =>
          i.cartDetailId === cartDetailId
            ? { ...i, quantity, amount: i.price * quantity }
            : i
        )
      );
      return;
    }

    if (quantity <= 0) return removeFromCart(cartDetailId);

    try {
      // Cập nhật item đơn lẻ
      const body = { data: { id: cartDetailId, attributes: { quantity } } };

      await fetch(`${BASE_URL}/v1/cartDetail/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      // ✅ Sau khi update quantity, cần tính lại giá từ supplyPrice và campaign
      // Fetch lại bookDetail để lấy supplyPrice mới nhất
      const currentItem = cartItems.find(item => item.cartDetailId === cartDetailId);
      if (currentItem) {
        try {
          const bookDetailRes = await fetch(
            `${BASE_URL}/v1/bookDetail/${currentItem.bookDetailId}?e=true`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (bookDetailRes.ok) {
            const bookDetailData = await bookDetailRes.json();
            const bookDetailAttrs = bookDetailData.data?.attributes || {};
            const supplyPrice = Number(bookDetailAttrs.supplyPrice || 0);
            
            if (supplyPrice > 0) {
              // ✅ Tính giá đã giảm từ campaign PERCENTAGE_PRODUCT
              const priceInfo = calculateDiscountedPrice(currentItem.bookDetailId, supplyPrice, campaigns);
              const displayPrice = priceInfo.discountedPrice;
              const originalPrice = supplyPrice > displayPrice ? supplyPrice : undefined;
              
              setCartItems((prev) =>
                prev.map((item) =>
                  item.cartDetailId === cartDetailId
                    ? {
                        ...item,
                        quantity,
                        price: displayPrice,
                        originalPrice: originalPrice,
                        amount: displayPrice * quantity,
                      }
                    : item
                )
              );
              return;
            }
          }
        } catch (err) {
          console.warn("Failed to refetch bookDetail in updateQuantity:", err);
        }
      }

      // Fallback: dùng giá hiện tại nếu không fetch được
      setCartItems((prev) =>
        prev.map((item) =>
          item.cartDetailId === cartDetailId
            ? {
                ...item,
                quantity,
                amount: item.price * quantity,
              }
            : item
        )
      );
    } catch (err) {
      console.error("Failed to update quantity", err);
    }
  };


  // Xóa toàn bộ giỏ hàng từ backend (fetch tất cả items trước khi xóa)
  const clearAllCartFromBackend = async () => {
    if (!token || !userId) {
      console.warn("⚠️ Không có token hoặc userId để xóa giỏ hàng");
      return;
    }

    try {
      // Fetch tất cả cartDetail từ backend
      const res = await fetch(
        `${BASE_URL}/v1/user/${userId}/relationships/cartDetail`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        console.warn("⚠️ Không thể fetch giỏ hàng để xóa:", res.status);
        // Vẫn xóa state local
        setCartItems([]);
        setSelectedItems(new Set());
        localStorage.removeItem("cartCombos");
        localStorage.setItem("cartJustCleared", Date.now().toString());
        return;
      }

      const data = await res.json();

      // Nếu không có items, chỉ cần xóa state local
      if (!data.data || data.data.length === 0) {
        console.log("✅ Giỏ hàng đã trống");
        setCartItems([]);
        setSelectedItems(new Set());
        localStorage.removeItem("cartCombos");
        localStorage.setItem("cartJustCleared", Date.now().toString());
        return;
      }

      console.log(
        "🧹 Đang xóa tất cả giỏ hàng từ backend:",
        data.data.length,
        "items"
      );

      // Xóa tất cả cartDetail với retry logic
      const deletePromises = data.data.map(async (item: any) => {
        let retries = 3;
        while (retries > 0) {
          try {
            const deleteRes = await fetch(
              `${BASE_URL}/v1/cartDetail/${item.id}`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (deleteRes.ok) {
              console.log("✅ Đã xóa cartDetail:", item.id);
              return true;
            } else {
              console.warn(
                `⚠️ Không thể xóa cartDetail ${item.id}, status:`,
                deleteRes.status
              );
              retries--;
              if (retries > 0) {
                await new Promise((resolve) => setTimeout(resolve, 500)); // Đợi 500ms trước khi retry
              }
            }
          } catch (err) {
            console.error("❌ Failed to remove cartDetail", item.id, err);
            retries--;
            if (retries > 0) {
              await new Promise((resolve) => setTimeout(resolve, 500));
            }
          }
        }
        return false;
      });

      const results = await Promise.all(deletePromises);
      const successCount = results.filter((r) => r === true).length;
      console.log(
        `✅ Đã xóa ${successCount}/${data.data.length} items từ backend`
      );

      // Đợi thêm một chút để đảm bảo backend đã xử lý xong
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Kiểm tra lại xem còn items nào không
      try {
        const verifyRes = await fetch(
          `${BASE_URL}/v1/user/${userId}/relationships/cartDetail`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          if (verifyData.data && verifyData.data.length > 0) {
            console.warn(
              "⚠️ Vẫn còn",
              verifyData.data.length,
              "items trong giỏ hàng sau khi xóa. Thử xóa lại..."
            );
            // Thử xóa lại những items còn lại
            await Promise.all(
              verifyData.data.map(async (item: any) => {
                try {
                  await fetch(`${BASE_URL}/v1/cartDetail/${item.id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                  });
                } catch (err) {
                  console.error(
                    "Failed to remove remaining cartDetail",
                    item.id,
                    err
                  );
                }
              })
            );
          } else {
            console.log("✅ Xác nhận: Giỏ hàng đã trống hoàn toàn");
          }
        }
      } catch (err) {
        console.warn("⚠️ Không thể xác minh giỏ hàng đã xóa:", err);
      }
    } catch (err) {
      console.error("❌ Failed to fetch and clear cart", err);
    }

    // Xóa state local
    setCartItems([]);
    setSelectedItems(new Set());

    // Đánh dấu đã xóa để tránh fetch lại ngay lập tức (tăng thời gian lên 5 giây)
    localStorage.setItem("cartJustCleared", Date.now().toString());

    console.log("✅ Đã xóa state local và đánh dấu cartJustCleared");
  };

  // Xóa toàn bộ giỏ (giữ lại để tương thích, nhưng dùng clearAllCartFromBackend khi đặt hàng)
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
    setSelectedItems(new Set());
  };

  // Toggle chọn/bỏ chọn một sản phẩm
  const toggleSelectItem = (cartDetailId: number) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cartDetailId)) {
        newSet.delete(cartDetailId);
      } else {
        newSet.add(cartDetailId);
      }
      return newSet;
    });
  };

  // Toggle chọn/bỏ chọn tất cả
  const toggleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map((item) => item.cartDetailId)));
    }
  };

  // Kiểm tra tất cả đã được chọn chưa
  const isAllSelected =
    cartItems.length > 0 && selectedItems.size === cartItems.length;

  // Lấy danh sách các sản phẩm đã chọn
  const getSelectedCartItems = (): CartItem[] => {
    if (selectedItems.size === 0) return [];

    const selectedIds = Array.from(selectedItems);
    const result: CartItem[] = [];

    // Xử lý từng selected cartDetailId
    for (const selectedId of selectedIds) {
      const item = cartItems.find((item) => item.cartDetailId === selectedId);
      if (item) {
        result.push(item);
      }
    }

    return result;
  };

  const selectedCartItems = getSelectedCartItems();

  // Tính tổng cho tất cả sản phẩm
  const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cartItems.reduce((sum, i) => sum + i.amount, 0);

  // Tính tổng cho các sản phẩm đã chọn
  const selectedTotalItems = selectedCartItems.reduce(
    (sum, i) => sum + i.quantity,
    0
  );
  const selectedTotalPrice = selectedCartItems.reduce(
    (sum, i) => sum + i.amount,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        selectedItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        clearAllCartFromBackend,
        toggleSelectItem,
        toggleSelectAll,
        isAllSelected,
        selectedCartItems,
        totalItems,
        totalPrice,
        selectedTotalItems,
        selectedTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
