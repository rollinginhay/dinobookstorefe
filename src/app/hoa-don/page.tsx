"use client";

import { useEffect, useState } from "react";

export default function HoaDon() {
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem("latestOrder");
    if (data) setOrder(JSON.parse(data));
  }, []);

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        Không tìm thấy dữ liệu đơn hàng!
      </div>
    );
  }

  const { info, items, shipping, voucherDiscount, finalTotal, createdAt } =
    order;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6 flex justify-center">
      <div className="w-full max-w-3xl bg-white shadow-lg rounded-xl p-10">
        {/* Header */}
        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hóa Đơn</h1>
            <p className="text-gray-500">
              Ngày: {new Date(createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Thông tin khách hàng
        </h2>
        <div className="space-y-1 text-gray-700 mb-8">
          <p>
            <b>Họ tên:</b> {info.fullName}
          </p>
          <p>
            <b>Điện thoại:</b> {info.phone}
          </p>
          <p>
            <b>Email:</b> {info.email || "—"}
          </p>
          <p>
            <b>Địa chỉ:</b> {info.address}, {info.ward}, {info.district},{" "}
            {info.city}
          </p>
          <p>
            <b>Phương thức thanh toán:</b> {info.paymentMethod.toUpperCase()}
          </p>
        </div>

        {/* Items */}
        <h2 className="text-xl font-bold mb-4 text-gray-800">Sản phẩm</h2>
        <div className="space-y-3 mb-8">
          {items.map((item: any) => (
            <div key={item.id} className="flex justify-between border-b pb-3">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-gray-600">
                  Số lượng: {item.quantity}
                </p>
              </div>
              <div className="font-semibold">
                {(item.price * item.quantity).toLocaleString("vi-VN")} ₫
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Tổng kết đơn hàng
        </h2>
        <div className="space-y-3 text-gray-700">
          <div className="flex justify-between">
            <span>Phí vận chuyển:</span>
            <span>
              {shipping === 0 ? (
                <span className="text-green-600 font-semibold">Miễn phí</span>
              ) : (
                `${shipping.toLocaleString("vi-VN")} ₫`
              )}
            </span>
          </div>

          {voucherDiscount > 0 && (
            <div className="flex justify-between text-green-600 font-semibold">
              <span>Giảm giá:</span>
              <span>-{voucherDiscount.toLocaleString("vi-VN")} ₫</span>
            </div>
          )}

          <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
            <span>Tổng cộng:</span>
            <span className="text-red-600">
              {finalTotal.toLocaleString("vi-VN")} ₫
            </span>
          </div>
        </div>

        <div className="mt-10 text-center text-gray-500 text-sm">
          Cảm ơn bạn đã mua hàng tại Dino Bookstore! 📚✨
        </div>
      </div>
    </div>
  );
}
