"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Book } from "@/components/BookCard";
import { useCart } from "@/contexts/CartContext";
import Link from "next/link";

interface BookComboProps {
  mainBook: Book;
  relatedBooks: Book[];
}

export default function BookCombo({ mainBook, relatedBooks }: BookComboProps) {
  const { addToCart, addComboToCart } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showComboDetails, setShowComboDetails] = useState(false);

  // Tất cả sách có sẵn (sách chính + sách liên quan)
  const allBooks = [mainBook, ...relatedBooks].slice(0, 6); // Tối đa 6 cuốn
  const comboSize = allBooks.length;

  // Tính giá combo
  const comboOriginalPrice = allBooks.reduce((sum, book) => sum + book.price, 0);
  const comboDiscountPercent = 15; // Giảm 15% cho combo
  const comboPrice = Math.round(comboOriginalPrice * (1 - comboDiscountPercent / 100));
  const comboSaved = comboOriginalPrice - comboPrice;

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (isAdding) return;
    setIsAdding(true);

    try {
      // Thêm combo như một item duy nhất
      await addComboToCart(
        allBooks,
        `Combo ${comboSize} Cuốn`,
        comboPrice,
        comboOriginalPrice,
        comboDiscountPercent,
        quantity
      );
      alert(`Đã thêm combo ${comboSize} cuốn vào giỏ hàng!`);
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (isAdding) return;
    setIsAdding(true);

    try {
      // Thêm combo như một item duy nhất
      await addComboToCart(
        allBooks,
        `Combo ${comboSize} Cuốn`,
        comboPrice,
        comboOriginalPrice,
        comboDiscountPercent,
        quantity
      );
      // Chuyển đến trang thanh toán
      router.push("/thanh-toan");
    } catch (error) {
      console.error("Lỗi khi mua:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại!");
      setIsAdding(false);
    }
  };

  // Hiển thị combo nếu có ít nhất 1 sách liên quan (tổng 2 cuốn: sách chính + 1 liên quan)
  if (relatedBooks.length === 0) {
    return null;
  }
  
  // Đảm bảo có ít nhất 2 cuốn để tạo combo (sách chính + ít nhất 1 sách liên quan)
  const totalBooks = [mainBook, ...relatedBooks].length;
  if (totalBooks < 2) {
    return null;
  }

  const totalPrice = comboPrice * quantity;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 my-6">
      {/* Header gọn */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
            COMBO THEO THỂ LOẠI
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900">
          Combo {comboSize} Cuốn
        </h3>
      </div>

      {/* Bundle Card gọn - Chỉ hiển thị ảnh sản phẩm chính */}
      <div className="mb-4">
        <div className="p-3 border-2 border-red-500 bg-red-50 rounded-lg">
          <div className="flex items-center gap-3">
            {/* Ảnh sản phẩm chính */}
            <Link
              href={`/san-pham/${mainBook.id}`}
              className="w-20 aspect-[3/4] bg-gray-100 rounded overflow-hidden hover:shadow-md transition-shadow flex-shrink-0"
            >
              <img
                src={mainBook.image}
                alt={mainBook.title}
                className="w-full h-full object-cover"
              />
            </Link>
            
            {/* Thông tin combo */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 rounded-full border-2 border-red-500 bg-red-500 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="font-semibold text-gray-900 text-sm">
                  Combo {comboSize} Cuốn
                </div>
              </div>
              <div className="text-xs text-gray-600 truncate mb-2">
                {allBooks.map((b) => b.title).join(", ")}
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-red-600 font-bold text-base">
                    {comboPrice.toLocaleString("vi-VN")} ₫
                  </div>
                  <div className="text-gray-400 text-xs line-through">
                    {comboOriginalPrice.toLocaleString("vi-VN")} ₫
                  </div>
                </div>
                <div className="text-green-600 text-xs font-semibold bg-green-50 px-2 py-0.5 rounded">
                  -{comboDiscountPercent}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nút xem chi tiết combo */}
        <button
          onClick={() => setShowComboDetails(!showComboDetails)}
          className="w-full mt-2 flex items-center justify-between text-sm text-gray-600 hover:text-gray-900 transition-colors py-2"
        >
          <span>{showComboDetails ? "Ẩn chi tiết combo" : "Xem chi tiết combo"}</span>
          <svg
            className={`w-4 h-4 transition-transform ${showComboDetails ? "rotate-180" : ""}`}
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

        {/* Chi tiết combo (expandable) - Hiển thị TẤT CẢ các sách trong combo */}
        {showComboDetails && allBooks.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
            {allBooks.map((book) => (
              <div key={book.id} className="flex gap-3">
                <Link
                  href={`/san-pham/${book.id}`}
                  className="w-16 aspect-[3/4] bg-gray-100 rounded overflow-hidden hover:shadow-md transition-shadow flex-shrink-0"
                >
                  <img
                    src={book.image}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/san-pham/${book.id}`}
                    className="font-semibold text-gray-900 hover:text-blue-600 transition-colors block mb-1"
                  >
                    {book.title}
                  </Link>
                  <p className="text-sm text-gray-600">{book.author || "—"}</p>
                  <p className="text-sm font-medium text-red-600 mt-1">
                    {book.price.toLocaleString("vi-VN")} ₫
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Số lượng và Giá gộp lại */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Số lượng:</span>
          <div className="flex items-center border border-gray-300 rounded overflow-hidden">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                if (val >= 1 && val <= 10) setQuantity(val);
              }}
              className="w-12 text-center border-x border-gray-300 py-1 text-sm focus:outline-none"
              min={1}
              max={10}
            />
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= 10}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>

        {/* Price breakdown gọn */}
        <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Giá gốc:</span>
            <span className="text-gray-500 line-through">
              {(comboOriginalPrice * quantity).toLocaleString("vi-VN")} ₫
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Tiết kiệm:</span>
            <span className="text-green-600 font-semibold">
              -{(comboSaved * quantity).toLocaleString("vi-VN")} ₫
            </span>
          </div>
          <div className="border-t border-orange-200 pt-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">Tổng thanh toán:</span>
              <span className="text-xl font-bold text-red-600">
                {totalPrice.toLocaleString("vi-VN")} ₫
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Các nút hành động gọn */}
      <div className="flex gap-2">
        <button
          onClick={handleAddToCart}
          disabled={isAdding}
          className="flex-1 bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdding ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Đang thêm...
            </>
          ) : (
            <>
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
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Thêm vào giỏ hàng
            </>
          )}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={isAdding}
          className="px-4 py-3 border-2 border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdding ? "Đang xử lý..." : "Mua ngay"}
        </button>
      </div>
    </div>
  );
}
