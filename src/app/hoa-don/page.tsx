"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function HoaDon() {
  const searchParams = useSearchParams();
  const receiptId = searchParams.get("receiptId");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!receiptId) return;

    const fetchReceipt = async () => {
      try {
        // 1) LẤY HÓA ĐƠN
        const resReceipt = await fetch(
          `http://localhost:8080/v1/receipt/${receiptId}`
        );
        const receiptJson = await resReceipt.json();

        const createdAt =
          receiptJson.data.attributes.createdAt || new Date().toISOString();

        // 2) LẤY CÁC CHI TIẾT HÓA ĐƠN
        const resDetails = await fetch(
          `http://localhost:8080/v1/receipt/${receiptId}/relationships/receiptDetail`
        );
        const detailsJson = await resDetails.json();

        const detailItems = detailsJson.data; // [{id:..., type:...}]

        const productList: any[] = [];

        // 3) LẤY THÔNG TIN TỪNG CHI TIẾT
        for (const detail of detailItems) {
          const detailRes = await fetch(
            `http://localhost:8080/v1/receiptDetail/${detail.id}`
          );
          const detailData = await detailRes.json();

          const { price, quantity, bookDetailId } = detailData.data.attributes;

          // Lấy bookDetail
          const bookDetailRes = await fetch(
            `http://localhost:8080/v1/bookDetail/${bookDetailId}`
          );
          const bookDetailJson = await bookDetailRes.json();
          const bookId = bookDetailJson.data.attributes.bookId;

          // Lấy book
          const bookRes = await fetch(
            `http://localhost:8080/v1/book/${bookId}`
          );
          const bookJson = await bookRes.json();

          productList.push({
            id: detail.id,
            title: bookJson.data.attributes.title,
            price,
            quantity,
          });
        }

        // 4) TÍNH TỔNG TIỀN
        const total = productList.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        const orderData = {
          info: {
            fullName: "Khách hàng",
            phone: "—",
            email: "—",
            address: "—",
            ward: "—",
            district: "—",
            city: "—",
            paymentMethod: "CASH",
          },
          items: productList,
          shipping: 0,
          voucherDiscount: 0,
          finalTotal: total,
          createdAt,
        };

        setOrder(orderData);
      } catch (err) {
        console.error("Lỗi tải hóa đơn:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [receiptId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Đang tải hóa đơn...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        Không tìm thấy dữ liệu hóa đơn!
      </div>
    );
  }

  const { info, items, shipping, voucherDiscount, finalTotal, createdAt } =
    order;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6 flex justify-center">
      <div className="w-full max-w-3xl bg-white shadow-lg rounded-xl p-10">
        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hóa Đơn</h1>
            <p className="text-gray-500">
              Ngày: {new Date(createdAt).toLocaleString()}
            </p>
          </div>
        </div>

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
            <b>Email:</b> {info.email}
          </p>
          <p>
            <b>Địa chỉ:</b> {info.address}, {info.ward}, {info.district},{" "}
            {info.city}
          </p>
          <p>
            <b>Phương thức thanh toán:</b> {info.paymentMethod.toUpperCase()}
          </p>
        </div>

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

        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Tổng kết đơn hàng
        </h2>
        <div className="space-y-3 text-gray-700">
          <div className="flex justify-between">
            <span>Phí vận chuyển:</span>
            <span className="text-green-600 font-semibold">Miễn phí</span>
          </div>

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
