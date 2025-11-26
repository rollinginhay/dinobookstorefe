"use client";

import { useState } from "react";

interface Props {
  amount: number;
  onClose: () => void;
  onConfirm: (data: any) => void;
}

export default function PaymentMethodPopup({
  amount,
  onClose,
  onConfirm,
}: Props) {
  const [method, setMethod] = useState<"cash" | "bank">("cash");

  // ==========================
  //  FORMAT TIỀN + KHÔNG CHO NHẬP CHỮ
  // ==========================
  const [paid, setPaid] = useState(amount.toLocaleString());
  const [bankCode, setBankCode] = useState("");

  const handleMoneyInput = (value: string) => {
    // bỏ dấu phẩy
    const numeric = value.replace(/,/g, "");

    // chỉ cho nhập số
    if (!/^\d*$/.test(numeric)) return;

    // thêm dấu phẩy lại
    const formatted = numeric === "" ? "" : Number(numeric).toLocaleString();
    setPaid(formatted);
  };

  const paidNumber = Number(paid.replace(/,/g, "")) || 0;
  const thiếu = amount - paidNumber;

  return (
    <>
      {/* Overlay nền tối */}
      <div
        className="fixed inset-0 bg-black/60 z-[900]"
        onClick={onClose}
      ></div>

      {/* POPUP */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                      w-[700px] bg-white rounded-xl shadow-lg p-6 z-[999]">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-xl">Thanh toán</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Tổng tiền */}
        <div className="flex justify-between mb-3 text-[17px]">
          <span>Tổng tiền cần thanh toán:</span>
          <span className="font-bold text-red-600">
            {amount.toLocaleString()}đ
          </span>
        </div>

        {/* Nhập số tiền */}
        <label className="font-medium">Số tiền:</label>
        <input
          type="text"
          className="w-full border p-2 rounded mb-3"
          value={paid}
          placeholder="0"
          onChange={(e) => handleMoneyInput(e.target.value)}
        />

        {/* Mã giao dịch (khi chuyển khoản) */}
        {method === "bank" && (
          <div className="mb-3">
            <label className="font-medium">Mã giao dịch:</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              placeholder="Nhập mã giao dịch..."
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
            />
          </div>
        )}

        {/* Tiền thiếu */}
        <div className="flex justify-between mb-4">
          <span>Tiền thiếu:</span>
          <span className="font-semibold text-red-600">
            {thiếu.toLocaleString()}đ
          </span>
        </div>

        {/* Phương thức */}
        <div className="flex gap-3 mb-4">
          <button
            className={`flex-1 py-2 rounded font-medium ${
              method === "cash"
                ? "bg-green-500 text-white"
                : "bg-gray-200"
            }`}
            onClick={() => setMethod("cash")}
          >
            Tiền mặt
          </button>

          <button
            className={`flex-1 py-2 rounded font-medium ${
              method === "bank"
                ? "bg-blue-600 text-white"
                : "bg-gray-200"
            }`}
            onClick={() => setMethod("bank")}
          >
            Chuyển khoản
          </button>
        </div>
        {/* Buttons */}
        <div className="flex justify-end mt-6 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>

          <button
            onClick={() =>
              onConfirm({
                method,
                amount: paidNumber,
                bankCode,
              })
            }
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </>
  );
}
