"use client";

import { CartItem, useCart } from "@/contexts/CartContext";
import { useCampaign } from "@/contexts/CampaignContext";
import Breadcrumb from "@/components/Breadcrumb";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Book } from "@/components/BookCard";
import { useRouter } from "next/navigation";


export default function GioHang() {
  const router = useRouter();
  const {
    cartItems,
    selectedItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleSelectItem,
    toggleSelectAll,
    isAllSelected,
    selectedTotalItems,
    selectedTotalPrice,
    selectedCartItems, // ✅ Lấy selectedCartItems từ context
    totalItems,
    totalPrice,
  } = useCart();
  const { campaigns } = useCampaign(); // ✅ Để tính giảm giá theo đơn (PERCENTAGE_RECEIPT)
  const currentBookList = localStorage.getItem("allBookData");
  
  // ✅ Tính giảm giá theo đơn (PERCENTAGE_RECEIPT) - giống POS admin
  const calculateOrderDiscount = (subtotal: number) => {
    if (!campaigns || campaigns.length === 0 || subtotal <= 0) return 0;
    
    // Tìm campaign PERCENTAGE_RECEIPT đủ điều kiện
    const orderCampaigns = campaigns.filter(
      (c) => c.type === "PERCENTAGE_RECEIPT" && subtotal >= c.minTotal
    );
    
    if (orderCampaigns.length === 0) return 0;
    
    // Lấy campaign tốt nhất (giảm nhiều nhất)
    const bestCampaign = orderCampaigns.reduce((best, current) => {
      const bestDiscount = (subtotal * best.value) / 100;
      const currentDiscount = (subtotal * current.value) / 100;
      const bestFinal = Math.min(bestDiscount, best.maxDiscount || bestDiscount);
      const currentFinal = Math.min(currentDiscount, current.maxDiscount || currentDiscount);
      return currentFinal > bestFinal ? current : best;
    });
    
    // Tính discount: (subtotal * percentage) / 100, tối đa maxDiscount
    const rawDiscount = (subtotal * bestCampaign.value) / 100;
    const finalDiscount = Math.min(rawDiscount, bestCampaign.maxDiscount || rawDiscount);
    
    return Math.round(finalDiscount);
  };
  
  const handleQuantityChange = (cartDetailId: number, newQuantity: number) => {
    if (isNaN(newQuantity)) return;

    if (newQuantity < 1) newQuantity = 1;
    if (newQuantity > 10) newQuantity = 10;

    updateQuantity(cartDetailId, newQuantity);
  };
  const [currentCartItems, setCurrentCartItems] = useState<CartItem[]>([]);
  // ✅ Lưu stock info cho từng item: Map<bookDetailId, stock>
  const [itemStocks, setItemStocks] = useState<Map<number, number>>(new Map());

  // Chỉ tính phí ship khi có sản phẩm được chọn
  const shipping =
    selectedTotalItems > 0 ? (selectedTotalPrice >= 299000 ? 0 : 30000) : 0;
  
  // ✅ Tính giảm giá theo đơn (PERCENTAGE_RECEIPT)
  const orderDiscount = calculateOrderDiscount(selectedTotalPrice);
  
  // ✅ Tổng cộng = subtotal - giảm giá theo đơn + phí ship
  const finalTotal = selectedTotalPrice - orderDiscount + shipping;
  const getBookDataByID = (
    id: number
  ): { authorName: string; title: string } => {
    const NOT_FOUND_BOOK_ID = "Incoming soon";
    const NOT_AUTHORIZED = "Not Authorized";

    if (!currentBookList || !JSON.parse(currentBookList)?.length) {
      return { authorName: NOT_AUTHORIZED, title: NOT_FOUND_BOOK_ID };
    }
    const listAllBook = JSON.parse(currentBookList);
    const foundBookDetail = listAllBook.find(
      (item: any) => item?.id === id.toString()
    );
    return {
      title: foundBookDetail?.title || NOT_FOUND_BOOK_ID,
      authorName: foundBookDetail?.author || NOT_AUTHORIZED,
    };
  };

  useEffect(() => {
    // Nhóm các items đơn lẻ trùng lặp
    const previousData: { [id: number]: any } = {};
    cartItems.forEach((item) => {
      if (!previousData[item.id]) {
        previousData[item.id] = { ...item };
        return;
      }
      previousData[item.id].quantity += item.quantity;
      previousData[item.id].amount += item.amount;
    });

    const groupedStandalone = Object.keys(previousData).map((item) => ({
      id: Number(item),
      ...previousData[Number(item)],
    }));

    setCurrentCartItems(groupedStandalone);
  }, [cartItems]);

  // ✅ Fetch stock cho tất cả items khi cartItems thay đổi
  useEffect(() => {
    const fetchStocks = async () => {
      const token = localStorage.getItem("jwtToken");
      if (!token) return;

      const BASE_URL = "http://localhost:8080";
      const stockMap = new Map<number, number>();

      // Lấy tất cả bookDetailIds từ currentCartItems
      const bookDetailIds = new Set<number>();

      for (const item of currentCartItems) {
        // Sách lẻ
        const bookDetailId = item.bookDetailId || item.id;
        const numId = typeof bookDetailId === "string" ? Number(bookDetailId) : bookDetailId;
        if (!isNaN(numId)) bookDetailIds.add(numId);
      }

      // Fetch stock cho từng bookDetailId
      for (const bookDetailId of bookDetailIds) {
        try {
          const res = await fetch(
            `${BASE_URL}/v1/bookDetail/${bookDetailId}?e=true`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (res.ok) {
            const data = await res.json();
            const stock = data.data?.attributes?.stock || 0;
            stockMap.set(bookDetailId, stock);
          }
        } catch (err) {
          console.error("Failed to fetch stock for bookDetail", bookDetailId, err);
        }
      }

      setItemStocks(stockMap);
    };

    if (currentCartItems.length > 0) {
      fetchStocks();
    }
  }, [currentCartItems]);

  // ✅ Helper: Lấy stock của một item
  const getItemStock = (item: CartItem): number => {
    // Sách lẻ
    const bookDetailId = item.bookDetailId || item.id;
    const numId = typeof bookDetailId === "string" ? Number(bookDetailId) : bookDetailId;
    return isNaN(numId) ? 0 : (itemStocks.get(numId) ?? 0);
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb
        items={[{ label: "Trang chủ", href: "/" }, { label: "Giỏ hàng" }]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Giỏ hàng của bạn
        </h1>

        {currentCartItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="flex justify-center mb-4">
              <svg
                className="w-24 h-24 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Giỏ hàng trống
            </h2>
            <p className="text-gray-600 mb-6">
              Bạn chưa có sản phẩm nào trong giỏ hàng
            </p>
            <Link
              href="/"
              className="inline-block bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Select All and Clear Cart Button */}
              <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Chọn tất cả ({currentCartItems.length} sản phẩm)
                  </span>
                </label>
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Xóa toàn bộ giỏ hàng
                </button>
              </div>

              {/* Cart Items List */}
              {currentCartItems.map((item) => {
                const stock = getItemStock(item);
                const isOutOfStock = stock === 0;
                
                return (
                <div
                  key={item.cartDetailId}
                  className={`bg-white rounded-lg shadow-sm p-6 ${
                    isOutOfStock ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.cartDetailId)}
                      onChange={() => toggleSelectItem(item.cartDetailId)}
                      disabled={isOutOfStock}
                      className={`w-5 h-5 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
                        isOutOfStock ? "cursor-not-allowed opacity-50" : ""
                      }`}
                    />
                    {/* Info */}
                    <div className="flex-1">
                      {/* Hiển thị sách đơn lẻ */}
                      <>
                          <div className="flex gap-4">
                            {/* Image */}
                            <Link href={`/san-pham/${item.id}`}>
                              <div className="aspect-[3/4] w-24 rounded-lg overflow-hidden relative cursor-pointer flex-shrink-0">
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              </div>
                            </Link>

                            {/* Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Link href={`/san-pham/${item.id}`}>
                                  <h3 className="font-semibold text-lg text-gray-900 hover:text-blue-600">
                                    {getBookDataByID(item.id).title}
                                  </h3>
                                </Link>
                                {isOutOfStock && (
                                  <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded font-medium">
                                    Hết hàng
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 mb-2">
                                {getBookDataByID(item.id).authorName}
                              </p>
                              {/* Price - Hiển thị giá sale (đỏ, to) và giá gốc (gạch ngang) - dưới tên tác giả */}
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl font-bold text-red-600">
                                  {(item.price * item.quantity).toLocaleString(
                                    "vi-VN"
                                  )}{" "}
                                  ₫
                                </span>
                                {/* ✅ Hiển thị giá gốc (supplyPrice) nếu có */}
                                {item.originalPrice && item.originalPrice > item.price && (
                                  <span className="text-gray-400 text-sm line-through">
                                    {(item.originalPrice * item.quantity).toLocaleString("vi-VN")} ₫
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end mt-4">
                            {/* Actions */}
                            <div className="flex items-center gap-4">
                              {/* Quantity Selector */}
                              <div className={`flex items-center border border-gray-300 rounded-lg overflow-hidden ${
                                isOutOfStock ? "opacity-50" : ""
                              }`}>
                                <button
                                  onClick={() =>
                                    !isOutOfStock &&
                                    handleQuantityChange(
                                      item.cartDetailId,
                                      item.quantity - 1
                                    )
                                  }
                                  disabled={isOutOfStock}
                                  className={`px-3 py-2 text-gray-600 transition-colors ${
                                    isOutOfStock
                                      ? "cursor-not-allowed"
                                      : "hover:bg-gray-100"
                                  }`}
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M20 12H4"
                                    />
                                  </svg>
                                </button>
                                <input
                                  type="number"
                                  value={
                                    isNaN(item.quantity) ? 1 : item.quantity
                                  }
                                  onChange={(e) =>
                                    !isOutOfStock &&
                                    handleQuantityChange(
                                      item.cartDetailId,
                                      parseInt(e.target.value) || 1
                                    )
                                  }
                                  disabled={isOutOfStock}
                                  className={`w-16 text-center border-x border-gray-300 py-2 focus:outline-none focus:ring-0 ${
                                    isOutOfStock ? "cursor-not-allowed" : ""
                                  }`}
                                  min={1}
                                  max={10}
                                />

                                <button
                                  onClick={() =>
                                    !isOutOfStock &&
                                    handleQuantityChange(
                                      item.cartDetailId,
                                      item.quantity + 1
                                    )
                                  }
                                  disabled={isOutOfStock}
                                  className={`px-3 py-2 text-gray-600 transition-colors ${
                                    isOutOfStock
                                      ? "cursor-not-allowed"
                                      : "hover:bg-gray-100"
                                  }`}
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 4v16m8-8H4"
                                    />
                                  </svg>
                                </button>
                              </div>

                              {/* Remove Button */}
                              <button
                                onClick={() =>
                                  removeFromCart(item.cartDetailId)
                                }
                                className="text-red-600 hover:text-red-700 p-2"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                      </>
                    </div>
                  </div>
                </div>
              )})}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Tóm tắt đơn hàng
                </h2>

                <div className="space-y-4 mb-6">
                  {selectedTotalItems > 0 ? (
                    <>
                      {/* Tạm tính */}
                      <div className="flex justify-between text-gray-600">
                        <span>Tạm tính ({selectedTotalItems} sản phẩm)</span>
                        <span>{selectedTotalPrice.toLocaleString("vi-VN")} ₫</span>
                      </div>
                      {/* Giảm giá theo đơn (PERCENTAGE_RECEIPT) */}
                      {orderDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Giảm giá theo đơn</span>
                          <span>-{orderDiscount.toLocaleString("vi-VN")} ₫</span>
                        </div>
                      )}
                      {/* Phí vận chuyển */}
                      <div className="flex justify-between text-gray-600">
                        <span>Phí vận chuyển</span>
                        <span>
                          {shipping === 0 ? (
                            <span className="text-green-600 font-medium">
                              Miễn phí
                            </span>
                          ) : (
                            <span>{shipping.toLocaleString("vi-VN")} ₫</span>
                          )}
                        </span>
                      </div>
                      {/* Thông báo miễn phí ship */}
                      {selectedTotalPrice > 0 &&
                        selectedTotalPrice < 299000 && (
                          <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                            Mua thêm{" "}
                            {(299000 - selectedTotalPrice).toLocaleString(
                              "vi-VN"
                            )}{" "}
                            ₫ để được miễn phí ship
                          </div>
                        )}
                      {/* Tổng cộng */}
                      <div className="border-t pt-4">
                        <div className="flex justify-between text-lg font-bold text-gray-900">
                          <span>Tổng cộng</span>
                          <span className="text-red-600">
                            {finalTotal.toLocaleString("vi-VN")} ₫
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Vui lòng chọn sản phẩm để xem tổng tiền</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <button
                    onClick={async () => {
                      if (selectedTotalItems === 0) return;

                      // ✅ Validate tồn kho trước khi chuyển trang
                      const token = localStorage.getItem("jwtToken");
                      if (!token) {
                        router.push("/dang-nhap");
                        return;
                      }

                      const BASE_URL = "http://localhost:8080";

                      // Đếm tổng số lượng từng BookDetail trong selectedCartItems
                      const bookDetailCounts = new Map<number, number>();

                      for (const item of selectedCartItems) {
                        // Sách lẻ
                        const bookDetailId = item.bookDetailId || item.id;
                        const numId = typeof bookDetailId === "string" ? Number(bookDetailId) : bookDetailId;
                        if (!isNaN(numId)) {
                          const current = bookDetailCounts.get(numId) || 0;
                          bookDetailCounts.set(numId, current + item.quantity);
                        }
                      }

                      // Check stock cho từng BookDetail
                      const outOfStockBooks: string[] = []; // Hết hàng (stock = 0)
                      const insufficientStockBooks: string[] = []; // Vượt stock (> stock)

                      for (const [bookDetailId, totalQuantity] of bookDetailCounts.entries()) {
                        try {
                          const res = await fetch(
                            `${BASE_URL}/v1/bookDetail/${bookDetailId}?e=true`,
                            {
                              headers: { Authorization: `Bearer ${token}` },
                            }
                          );
                          if (res.ok) {
                            const data = await res.json();
                            const stock = data.data?.attributes?.stock || 0;
                            
                            // Lấy tên sách từ included hoặc từ cartItem
                            let bookName = `Sách ID ${bookDetailId}`;
                            const included = data.included || [];
                            const book = included.find((x: any) => x.type === "book");
                            if (book?.attributes?.title) {
                              bookName = book.attributes.title;
                            } else {
                              // Fallback: tìm trong selectedCartItems
                              const foundItem = selectedCartItems.find(
                                (item) =>
                                  (item.bookDetailId || item.id) === bookDetailId
                              );
                              if (foundItem) {
                                bookName = foundItem.title || bookName;
                              }
                            }

                            if (stock === 0) {
                              // Hết hàng
                              outOfStockBooks.push(bookName);
                            } else if (totalQuantity > stock) {
                              // Vượt stock
                              insufficientStockBooks.push(
                                `${bookName} - Hiện chỉ còn ${stock} sản phẩm trong kho`
                              );
                            }
                          }
                        } catch (err) {
                          console.error("Failed to check stock for bookDetail", bookDetailId, err);
                        }
                      }

                      // ✅ Nếu có sản phẩm hết hàng → báo reload
                      if (outOfStockBooks.length > 0) {
                        alert(
                          `Có cập nhật ở giỏ hàng. Một số sản phẩm đã hết hàng:\n\n${outOfStockBooks.join("\n")}\n\nVui lòng reload lại trang để cập nhật.`
                        );
                        window.location.reload();
                        return;
                      }

                      // ✅ Nếu có sản phẩm vượt stock → báo điều chỉnh
                      if (insufficientStockBooks.length > 0) {
                        alert(
                          `Rất tiếc, một số sản phẩm trong giỏ hàng của bạn không đủ số lượng:\n\n${insufficientStockBooks.join("\n")}\n\nVui lòng điều chỉnh lại giỏ hàng trước khi thanh toán.`
                        );
                        return; // Không chuyển trang
                      }

                      // ✅ Tất cả đều OK, chuyển sang trang thanh toán
                      router.push("/thanh-toan");
                    }}
                    disabled={selectedTotalItems === 0}
                    className={`block w-full text-white text-center py-3 rounded-lg transition-colors font-semibold ${
                      selectedTotalItems > 0
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "bg-gray-400 cursor-not-allowed pointer-events-none"
                    }`}
                  >
                    {selectedTotalItems > 0
                      ? `Tiến hành đặt hàng (${selectedTotalItems} sản phẩm)`
                      : "Vui lòng chọn sản phẩm"}
                  </button>
                  <Link
                    href="/"
                    className="block w-full border border-gray-300 text-gray-700 text-center py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Tiếp tục mua sắm
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
