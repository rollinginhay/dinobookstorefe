"use client";

import { useState } from "react";
import PaymentMethodPopup from "./PaymentMethodPopup";

export default function Payment({ cartItems }: { cartItems: any[] }) {
  // ====================
  // TÍNH TỔNG TIỀN
  // ====================
  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  // ====================
  // GIẢM GIÁ
  // ====================
  const [discountCode, setDiscountCode] = useState("");
  const [discountValue, setDiscountValue] = useState(0);
  const [hasApplied, setHasApplied] = useState(false);

  const finalAmount = total - discountValue;

  // ====================
  // POPUP THANH TOÁN
  // ====================
  const [showPay, setShowPay] = useState(false);

  return (
    <div className="p-4 border rounded bg-white shadow-sm">

      <h4 className="font-semibold mb-3">Thông tin thanh toán</h4>

      {/* ================== MÃ GIẢM GIÁ ================== */}
      <div className="border p-3 rounded mb-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Mã giảm giá"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value)}
          className="border px-3 py-2 rounded w-full"
        />

        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => {
            // MOCK giảm 10%
            const discount = total * 0.1;
            setDiscountValue(discount);
            setHasApplied(true);
          }}
        >
          Chọn mã
        </button>
      </div>

      {/* ================== ALERT GIẢM GIÁ ================== */}
      {hasApplied && (
        <div className="bg-green-100 border border-green-300 text-green-700 px-3 py-2 rounded mb-3 text-sm">
          Áp dụng thành công phiếu giảm giá
          <br />
          Giảm 10% tối đa 100,000đ
        </div>
      )}

      {/* ================== TÍNH TIỀN ================== */}
      <div className="flex justify-between mb-2">
        <span>Tiền hàng:</span>
        <span className="font-semibold">{total.toLocaleString()}đ</span>
      </div>

      <div className="flex justify-between mb-2">
        <span>Giảm giá:</span>
        <span className="font-semibold text-red-500">
          - {discountValue.toLocaleString()}đ
        </span>
      </div>

      <hr className="my-3" />

      <div className="flex justify-between mb-3">
        <span className="font-semibold">Khách thanh toán:</span>
        <span className="font-semibold">0đ</span>
      </div>

      <div className="flex justify-between mb-4">
        <span className="font-semibold">Tiền thiếu:</span>
        <span className="font-semibold text-red-500">
          {finalAmount.toLocaleString()}đ
        </span>
      </div>

      {/* ================== NÚT THANH TOÁN ================== */}
      <button
        className="w-full py-2 bg-blue-600 text-white rounded"
        onClick={() => setShowPay(true)}
      >
        Thanh toán
      </button>

      {/* ================== POPUP THANH TOÁN ================== */}
      {showPay && (
        <PaymentMethodPopup
          amount={finalAmount}
          onClose={() => setShowPay(false)}
          onConfirm={(data) => {
            console.log("Dữ liệu thanh toán:", data);
            // sau này m có thể xử lý logic lưu giao dịch
            setShowPay(false);
          }}
        />
      )}
    </div>
  );
}
