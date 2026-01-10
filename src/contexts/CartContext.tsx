"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { BookDetail } from "./ReceiptContext";

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
  isCombo?: boolean; // Đánh dấu đây là combo
  comboBooks?: Book[]; // Danh sách sách trong combo (nếu là combo)
  comboName?: string; // Tên combo (ví dụ: "Combo 3 Cuốn")
  comboOriginalPrice?: number; // Giá gốc của combo (trước khi giảm)
  comboDiscount?: number; // Phần trăm giảm giá combo
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
  addComboToCart: (
    books: Book[],
    comboName: string,
    comboPrice: number,
    comboOriginalPrice: number,
    comboDiscount: number,
    quantity?: number
  ) => Promise<void>;
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
  const BASE_URL = "http://localhost:8080";
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
        localStorage.removeItem("cartCombos");
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

              return {
                cartDetailId: Number(item.id),
                quantity: Number(item.attributes.quantity ?? 1),
                amount: Number(item.attributes.amount || 0),
                id: Number(bookDetailData.data.id), // bookDetailId
                title: book?.attributes?.title || "Sách",
                author: book?.attributes?.author || "—",
                price: Number(
                  item.attributes.price || bookDetailAttrs.salePrice || 0
                ),
                image:
                  book?.attributes?.imageUrl ||
                  getBookDetailById(item.attributes.bookDetailId)?.image ||
                  "/default-book.jpg",
                bookDetailId: Number(bookDetailData.data.id),
                originalPrice:
                  bookDetailAttrs.salePrice ||
                  Number(item.attributes.price || 0),
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

        // ✅ Nhóm combo items từ localStorage metadata (giống BookCombo)
        const comboMetadata = JSON.parse(
          localStorage.getItem("cartCombos") || "[]"
        );

        if (comboMetadata.length > 0) {
          console.log("🔍 Tìm combo items từ metadata:", comboMetadata.length);

          const usedCartDetailIds = new Set<number>();
          const comboItems: CartItem[] = [];

          // Xử lý từng combo metadata
          for (const comboMeta of comboMetadata) {
            // ✅ Chuyển đổi cartDetailIds sang number để so sánh đúng
            const comboCartDetailIds = comboMeta.cartDetailIds.map((id: any) =>
              Number(id)
            );

            // Kiểm tra xem tất cả cartDetailIds của combo có trong validItems không
            const comboCartDetails = validItems.filter((item) =>
              comboCartDetailIds.includes(item.cartDetailId)
            );

            console.log("🔍 Combo:", comboMeta.comboName, {
              metadataIds: comboCartDetailIds,
              foundItems: comboCartDetails.map((i) => i.cartDetailId),
              matchCount: comboCartDetails.length,
            });

            if (comboCartDetails.length > 0) {
              // Tìm item đầu tiên làm đại diện (giống logic addComboToCart)
              const firstItem = comboCartDetails[0];

              // ✅ Sử dụng comboMeta.books nếu có, nếu không thì dùng firstItem
              const mainBook =
                comboMeta.books && comboMeta.books.length > 0
                  ? comboMeta.books[0]
                  : firstItem;

              // Tạo combo item (giống logic addComboToCart)
              const comboItem: CartItem = {
                ...mainBook,
                id: `combo-${comboMeta.comboId}` as any,
                title: comboMeta.comboName || firstItem.title,
                price: comboMeta.comboPrice,
                quantity: comboMeta.quantity || 1,
                amount: comboMeta.comboPrice * (comboMeta.quantity || 1),
                cartDetailId: comboCartDetailIds[0], // Dùng ID đầu tiên làm đại diện
                isCombo: true,
                comboBooks:
                  comboMeta.books ||
                  comboCartDetails.map((item) => ({
                    id: item.id,
                    title: item.title,
                    author: item.author,
                    price: item.price,
                    image: item.image,
                    bookDetailId: item.bookDetailId,
                  })),
                comboName: comboMeta.comboName,
                comboOriginalPrice: comboMeta.comboOriginalPrice,
                comboDiscount: comboMeta.comboDiscount,
                bookDetailId:
                  (mainBook as any).bookDetailId ||
                  mainBook.id ||
                  firstItem.bookDetailId,
              };

              comboItems.push(comboItem);

              // Đánh dấu các cartDetailIds đã được sử dụng
              comboCartDetailIds.forEach((id: number) =>
                usedCartDetailIds.add(id)
              );

              console.log(
                "✅ Đã nhóm combo:",
                comboMeta.comboName,
                "với",
                comboCartDetails.length,
                "items"
              );
            } else {
              console.warn(
                "⚠️ Không tìm thấy items cho combo:",
                comboMeta.comboName,
                "IDs:",
                comboCartDetailIds
              );
            }
          }

          // Lọc bỏ các items đã được nhóm vào combo, chỉ giữ lại items đơn lẻ
          const standaloneItems = validItems.filter(
            (item) => !usedCartDetailIds.has(item.cartDetailId)
          );

          // Kết hợp combo items và standalone items
          validItems = [...comboItems, ...standaloneItems];

          console.log("📦 Final cart items:", {
            combos: comboItems.length,
            standalone: standaloneItems.length,
            total: validItems.length,
          });
        }

        console.log("📦 Fetched cart items:", validItems.length);
        setCartItems(validItems);
      } catch (err) {
        console.error("Failed to fetch cart", err);
        setCartItems([]);
      }
    };
    fetchCart();
  }, [userId, token]);

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
            originalPrice: book.price, // Lưu giá (vì Book không có originalPrice)
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
          bookDetailId: (book as any).bookDetailId || book.id, // Sử dụng bookDetailId nếu có, không thì dùng id
          originalPrice: book.price, // Lưu giá (vì Book không có originalPrice)
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
      // Kiểm tra xem có phải là combo không
      const comboMetadata = JSON.parse(
        localStorage.getItem("cartCombos") || "[]"
      );
      const comboMeta = comboMetadata.find((cm: any) =>
        cm.cartDetailIds.includes(cartDetailId)
      );

      if (comboMeta) {
        // Xóa tất cả các cartDetail trong combo
        for (const id of comboMeta.cartDetailIds) {
          try {
            await fetch(`${BASE_URL}/v1/cartDetail/${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
          } catch (err) {
            console.error("Failed to remove combo item", err);
          }
        }

        // Xóa combo metadata
        const updatedCombos = comboMetadata.filter(
          (cm: any) => cm.comboId !== comboMeta.comboId
        );
        localStorage.setItem("cartCombos", JSON.stringify(updatedCombos));

        // Xóa tất cả items của combo khỏi state
        setCartItems((prev) =>
          prev.filter(
            (item) => !comboMeta.cartDetailIds.includes(item.cartDetailId)
          )
        );

        // Xóa khỏi selectedItems
        setSelectedItems((prev) => {
          const newSet = new Set(prev);
          comboMeta.cartDetailIds.forEach((id: number) => newSet.delete(id));
          return newSet;
        });
      } else {
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
      }
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
      // Kiểm tra xem có phải là combo không
      const comboMetadata = JSON.parse(
        localStorage.getItem("cartCombos") || "[]"
      );
      const comboMeta = comboMetadata.find((cm: any) =>
        cm.cartDetailIds.includes(cartDetailId)
      );

      if (comboMeta) {
        // Cập nhật số lượng cho tất cả các cartDetail trong combo
        const comboPricePerItem =
          comboMeta.comboPrice / comboMeta.cartDetailIds.length;

        for (const id of comboMeta.cartDetailIds) {
          const body = { data: { id, attributes: { quantity } } };

          try {
            await fetch(`${BASE_URL}/v1/cartDetail/update`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(body),
            });
          } catch (err) {
            console.error("Failed to update combo item quantity", err);
          }
        }

        // Cập nhật combo metadata
        comboMeta.quantity = quantity;
        const updatedCombos = comboMetadata.map((cm: any) =>
          cm.comboId === comboMeta.comboId ? comboMeta : cm
        );
        localStorage.setItem("cartCombos", JSON.stringify(updatedCombos));

        // Cập nhật state
        setCartItems((prev) =>
          prev.map((item) =>
            comboMeta.cartDetailIds.includes(item.cartDetailId)
              ? {
                  ...item,
                  quantity,
                  amount: comboPricePerItem * quantity,
                }
              : item
          )
        );
      } else {
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
      }
    } catch (err) {
      console.error("Failed to update quantity", err);
    }
  };

  // Thêm combo vào giỏ hàng
  const addComboToCart = async (
    books: Book[],
    comboName: string,
    comboPrice: number,
    comboOriginalPrice: number,
    comboDiscount: number,
    quantity: number = 1
  ) => {
    if (!token || !userId || books.length === 0) return;

    try {
      // Tạo một CartItem đặc biệt cho combo
      // Sử dụng sách đầu tiên làm đại diện, nhưng lưu thông tin combo
      const mainBook = books[0];

      // Tạo combo item với thông tin đặc biệt
      const comboItem: CartItem = {
        ...mainBook,
        id: `combo-${Date.now()}` as any, // ID đặc biệt cho combo
        title: comboName,
        price: comboPrice,
        quantity,
        amount: comboPrice * quantity,
        cartDetailId: 0, // Sẽ được set sau khi tạo
        isCombo: true,
        comboBooks: books,
        comboName,
        comboOriginalPrice,
        comboDiscount,
        bookDetailId: (mainBook as any).bookDetailId || mainBook.id, // Sử dụng bookDetailId nếu có, không thì dùng id
      };

      // Thêm từng sách trong combo vào backend (để backend xử lý)
      // Nhưng lưu metadata để frontend hiển thị như một combo
      const cartDetailIds: number[] = [];

      // ✅ Tính amount cho từng sách: chia đều và làm tròn
      const pricePerBook = Math.round(comboPrice / books.length); // Làm tròn giá mỗi sách
      const amountPerBook = pricePerBook * quantity; // Tổng amount cho mỗi sách

      // ✅ Điều chỉnh để tổng amount = comboPrice * quantity (tránh sai số do làm tròn)
      const totalAmount = comboPrice * quantity;
      const calculatedTotalAmount = amountPerBook * books.length;
      const adjustment = totalAmount - calculatedTotalAmount; // Số tiền cần điều chỉnh

      for (let i = 0; i < books.length; i++) {
        const book = books[i];
        // ✅ Thêm adjustment vào sách cuối cùng để tổng đúng
        const finalAmount =
          i === books.length - 1 ? amountPerBook + adjustment : amountPerBook;

        const body = {
          data: {
            type: "cartDetail",
            attributes: {
              userId,
              bookDetailId: (book as any).bookDetailId || book.id,
              quantity,
              amount: Math.round(finalAmount), // ✅ Làm tròn để đảm bảo là Long
              price: pricePerBook, // ✅ Giá đã làm tròn
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

        if (res.ok) {
          const data = await res.json();
          cartDetailIds.push(Number(data.data.id));
        }
      }

      // Lưu combo metadata vào localStorage để frontend có thể nhóm lại
      const comboMetadata = {
        comboId: `combo-${Date.now()}`,
        cartDetailIds,
        books,
        comboName,
        comboPrice,
        comboOriginalPrice,
        comboDiscount,
        quantity,
      };

      const existingCombos = JSON.parse(
        localStorage.getItem("cartCombos") || "[]"
      );
      existingCombos.push(comboMetadata);
      localStorage.setItem("cartCombos", JSON.stringify(existingCombos));

      // Thêm combo item vào state (chỉ hiển thị 1 item thay vì nhiều items)
      comboItem.cartDetailId = cartDetailIds[0]; // Dùng ID đầu tiên làm đại diện
      setCartItems((prev) => [...prev, comboItem]);
    } catch (err) {
      console.error("Failed to add combo to cart", err);
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

    // Xóa combo metadata
    localStorage.removeItem("cartCombos");
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

    // Xóa combo metadata
    localStorage.removeItem("cartCombos");
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
  // Với combo items, cần xử lý đặc biệt vì một combo có nhiều cartDetailIds
  const getSelectedCartItems = (): CartItem[] => {
    if (selectedItems.size === 0) return [];

    // Lấy combo metadata
    const comboMetadata = JSON.parse(
      localStorage.getItem("cartCombos") || "[]"
    );
    const selectedIds = Array.from(selectedItems);
    const result: CartItem[] = [];
    const processedComboIds = new Set<string>();

    // Xử lý từng selected cartDetailId
    for (const selectedId of selectedIds) {
      // Kiểm tra xem có thuộc combo nào không
      const comboMeta = comboMetadata.find((cm: any) =>
        cm.cartDetailIds.includes(selectedId)
      );

      if (comboMeta && !processedComboIds.has(comboMeta.comboId)) {
        // Đây là combo, tìm tất cả items trong combo
        const comboItems = cartItems.filter((item) =>
          comboMeta.cartDetailIds.includes(item.cartDetailId)
        );

        if (comboItems.length > 0) {
          // Tạo một item đại diện cho combo với giá trị tổng hợp
          const firstItem = comboItems[0];
          const comboItem: CartItem = {
            ...firstItem,
            id: `combo-${comboMeta.comboId}` as any,
            title: comboMeta.comboName || firstItem.title,
            price: comboMeta.comboPrice,
            amount: comboMeta.comboPrice * comboMeta.quantity,
            quantity: comboMeta.quantity,
            cartDetailId: selectedId, // Sử dụng selectedId làm đại diện
            isCombo: true,
            comboBooks: comboMeta.books,
            comboName: comboMeta.comboName,
            comboOriginalPrice: comboMeta.comboOriginalPrice,
            comboDiscount: comboMeta.comboDiscount,
            bookDetailId: firstItem.bookDetailId || firstItem.id, // Đảm bảo có bookDetailId hợp lệ
          };
          result.push(comboItem);
          processedComboIds.add(comboMeta.comboId);
        }
      } else if (!comboMeta) {
        // Item đơn lẻ
        const item = cartItems.find((item) => item.cartDetailId === selectedId);
        if (item) {
          result.push(item);
        }
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
        addComboToCart,
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
