"use client";

import { CartItem, useCart } from "@/contexts/CartContext";
import Breadcrumb from "@/components/Breadcrumb";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Book } from "@/components/BookCard";

// Component để quản lý state expanded cho từng combo
function ComboItem({ item, handleQuantityChange, removeFromCart }: {
  item: CartItem;
  handleQuantityChange: (cartDetailId: number, quantity: number) => void;
  removeFromCart: (cartDetailId: number) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!item.isCombo || !item.comboBooks || item.comboBooks.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex gap-4">
        {/* Chỉ hiển thị ảnh sản phẩm chính (sách đầu tiên) */}
        <Link href={`/san-pham/${item.comboBooks[0].id}`}>
          <div className="aspect-[3/4] w-24 rounded-lg overflow-hidden relative cursor-pointer flex-shrink-0">
            <img
              src={item.comboBooks[0].image}
              alt={item.comboBooks[0].title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </Link>

        {/* Combo Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded font-bold">
                  COMBO
                </span>
                <h3 className="font-semibold text-lg text-gray-900">
                  {item.comboName || item.title}
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {item.comboBooks.map(b => b.title).join(", ").substring(0, 80)}
                {item.comboBooks.map(b => b.title).join(", ").length > 80 && "..."}
              </p>
              
              {/* Combo Price Info */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-600 font-bold text-lg">
                  {item.price.toLocaleString("vi-VN")} ₫
                </span>
                {item.comboOriginalPrice && (
                  <>
                    <span className="text-gray-400 text-sm line-through">
                      {item.comboOriginalPrice.toLocaleString("vi-VN")} ₫
                    </span>
                    {item.comboDiscount && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded">
                        -{item.comboDiscount}%
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Expand/Collapse button */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-600 text-sm hover:underline flex items-center gap-1"
              >
                {isExpanded ? "Ẩn" : "Xem"} chi tiết combo
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Expanded Combo Details */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="space-y-2">
                {item.comboBooks.map((book, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <Link href={`/san-pham/${book.id}`}>
                      <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={book.image}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>
                    <div className="flex-1">
                      <Link href={`/san-pham/${book.id}`}>
                        <p className="font-medium text-gray-900 hover:text-blue-600">
                          {book.title}
                        </p>
                      </Link>
                      <p className="text-gray-500 text-xs">{book.author}</p>
                    </div>
                    <span className="text-gray-600">
                      {book.price.toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Combo Price and Actions */}
      <div className="flex items-center justify-between mt-4">
        {/* Price */}
        <span className="text-2xl font-bold text-red-600">
          {item.amount.toLocaleString("vi-VN")} ₫
        </span>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Quantity Selector */}
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() =>
                handleQuantityChange(
                  item.cartDetailId,
                  item.quantity - 1
                )
              }
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
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
              value={isNaN(item.quantity) ? 1 : item.quantity}
              onChange={(e) =>
                handleQuantityChange(
                  item.cartDetailId,
                  parseInt(e.target.value) || 1
                )
              }
              className="w-16 text-center border-x border-gray-300 py-2 focus:outline-none focus:ring-0"
              min={1}
              max={10}
            />
            <button
              onClick={() =>
                handleQuantityChange(
                  item.cartDetailId,
                  item.quantity + 1
                )
              }
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
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

          {/* Delete Button */}
          <button
            onClick={() => removeFromCart(item.cartDetailId)}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GioHang() {
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
    totalItems,
    totalPrice,
  } = useCart();
  const currentBookList = localStorage.getItem("allBookData");
  console.log("currentBookList", currentBookList);
  // console.log("cartItems", cartItems);
  // Sử dụng cartDetailId để update quantity
  const handleQuantityChange = (cartDetailId: number, newQuantity: number) => {
    if (isNaN(newQuantity)) return;

    if (newQuantity < 1) newQuantity = 1;
    if (newQuantity > 10) newQuantity = 10;

    updateQuantity(cartDetailId, newQuantity);
  };
  const [currentCartItems, setCurrentCartItems] = useState<CartItem[]>([]);

  // Chỉ tính phí ship khi có sản phẩm được chọn
  const shipping = selectedTotalItems > 0 ? (selectedTotalPrice >= 299000 ? 0 : 30000) : 0;
  const finalTotal = selectedTotalPrice + shipping;
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
      authorName: foundBookDetail.author || NOT_AUTHORIZED,
    };
  };

  useEffect(() => {
    // Lấy combo metadata từ localStorage
    const comboMetadata = JSON.parse(localStorage.getItem('cartCombos') || '[]');
    
    // Tạo map để nhóm các items theo comboId
    const comboMap = new Map<string, CartItem[]>();
    const standaloneItems: CartItem[] = [];
    
    cartItems.forEach((item) => {
      // Kiểm tra xem item này có thuộc combo nào không
      const comboMeta = comboMetadata.find((cm: any) => 
        cm.cartDetailIds.includes(item.cartDetailId)
      );
      
      if (comboMeta) {
        // Item thuộc combo
        if (!comboMap.has(comboMeta.comboId)) {
          comboMap.set(comboMeta.comboId, []);
        }
        comboMap.get(comboMeta.comboId)!.push(item);
      } else {
        // Item đơn lẻ
        standaloneItems.push(item);
      }
    });
    
    // Tạo combo items từ comboMap
    const comboItems: CartItem[] = Array.from(comboMap.entries()).map(([comboId, items]) => {
      const comboMeta = comboMetadata.find((cm: any) => cm.comboId === comboId);
      if (!comboMeta) return null;
      
      // Lấy item đầu tiên làm đại diện
      const firstItem = items[0];
      
      return {
        ...firstItem,
        id: `combo-${comboId}` as any,
        title: comboMeta.comboName,
        price: comboMeta.comboPrice,
        amount: comboMeta.comboPrice * comboMeta.quantity,
        quantity: comboMeta.quantity,
        isCombo: true,
        comboBooks: comboMeta.books,
        comboName: comboMeta.comboName,
        comboOriginalPrice: comboMeta.comboOriginalPrice,
        comboDiscount: comboMeta.comboDiscount,
      } as CartItem;
    }).filter((item): item is CartItem => item !== null);
    
    // Gộp combo items và standalone items
    const allItems = [...comboItems, ...standaloneItems];
    
    // Nhóm các items đơn lẻ trùng lặp (giữ nguyên logic cũ)
    const previousData: { [id: number]: any } = {};
    allItems.forEach((item) => {
      // Bỏ qua combo items
      if (item.isCombo) return;
      
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

    setCurrentCartItems([...comboItems, ...groupedStandalone]);
  }, [cartItems]);
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
              {currentCartItems.map((item) => (
                <div
                  key={item.cartDetailId}
                  className="bg-white rounded-lg shadow-sm p-6"
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.cartDetailId)}
                      onChange={() => toggleSelectItem(item.cartDetailId)}
                      className="w-5 h-5 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      {item.isCombo && item.comboBooks && item.comboBooks.length > 0 ? (
                        <ComboItem
                          item={item}
                          handleQuantityChange={handleQuantityChange}
                          removeFromCart={removeFromCart}
                        />
                      ) : (
                        // Hiển thị sách đơn lẻ
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
                              <Link href={`/san-pham/${item.id}`}>
                                <h3 className="font-semibold text-lg text-gray-900 hover:text-blue-600 mb-1">
                                  {getBookDataByID(item.id).title}
                                </h3>
                              </Link>
                              <p className="text-gray-600 mb-2">
                                {getBookDataByID(item.id).authorName}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            {/* Price */}
                            <span className="text-2xl font-bold text-red-600">
                              {item.amount.toLocaleString("vi-VN")} ₫
                            </span>

                            {/* Actions */}
                            <div className="flex items-center gap-4">
                              {/* Quantity Selector */}
                              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.cartDetailId,
                                      item.quantity - 1
                                    )
                                  }
                                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
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
                                  value={isNaN(item.quantity) ? 1 : item.quantity}
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      item.cartDetailId,
                                      parseInt(e.target.value) || 1
                                    )
                                  }
                                  className="w-16 text-center border-x border-gray-300 py-2 focus:outline-none focus:ring-0"
                                  min={1}
                                  max={10}
                                />

                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      item.cartDetailId,
                                      item.quantity + 1
                                    )
                                  }
                                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
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
                                onClick={() => removeFromCart(item.cartDetailId)}
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

                          {/* Subtotal */}
                          <div className="text-right mt-2">
                            <span className="text-gray-600">Thành tiền: </span>
                            <span className="text-xl font-bold text-red-600">
                              {(item.price * item.quantity).toLocaleString("vi-VN")}{" "}
                              ₫
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
                      <div className="flex justify-between text-gray-600">
                        <span>Tạm tính ({selectedTotalItems} sản phẩm đã chọn)</span>
                        <span>{selectedTotalPrice.toLocaleString("vi-VN")} ₫</span>
                      </div>
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
                      {selectedTotalPrice > 0 && selectedTotalPrice < 299000 && (
                        <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                          Mua thêm {(299000 - selectedTotalPrice).toLocaleString("vi-VN")} ₫
                          để được miễn phí ship
                        </div>
                      )}
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
                  <Link
                    href="/thanh-toan"
                    className={`block w-full text-white text-center py-3 rounded-lg transition-colors font-semibold ${
                      selectedTotalItems > 0
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "bg-gray-400 cursor-not-allowed pointer-events-none"
                    }`}
                  >
                    {selectedTotalItems > 0
                      ? `Tiến hành đặt hàng (${selectedTotalItems} sản phẩm)`
                      : "Vui lòng chọn sản phẩm"}
                  </Link>
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
