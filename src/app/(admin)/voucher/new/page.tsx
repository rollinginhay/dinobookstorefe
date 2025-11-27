"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Voucher = {
  id: string;
  name: string;
  type: "MONEY" | "PERCENT";
  minOrder: number;
  discount: number;
  quantity: number;
  used: number;
  end: string; // ISO string
};

const DEMO_VOUCHERS: Voucher[] = [
  {
    id: "VC00001",
    name: "Giảm 10K",
    type: "MONEY",
    minOrder: 50000,
    discount: 10000,
    quantity: 50,
    used: 10,
    end: "2025-12-31",
  },
];

export default function VoucherList() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);

  // CHỈ CÓ 1 useEffect, chạy mọi lần render → không thể lỗi hooks
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const saved = window.localStorage.getItem("vouchers");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setVouchers(parsed);
          return;
        }
      }

      // Không có localStorage thì dùng demo
      setVouchers(DEMO_VOUCHERS);
    } catch (err) {
      console.error("Load vouchers error", err);
      setVouchers(DEMO_VOUCHERS);
    }
  }, []);

  const handleDelete = (id: string) => {
    if (!confirm("Xóa phiếu giảm giá này?")) return;

    const updated = vouchers.filter((v) => v.id !== id);
    setVouchers(updated);

    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("vouchers", JSON.stringify(updated));
      }
    } catch (err) {
      console.error("Save vouchers error", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="section-title">Danh sách phiếu giảm giá</h2>

        <Link href="/voucher/create" className="btn btn-primary">
          + Thêm mới
        </Link>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="table min-w-[900px]">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tên phiếu</th>
              <th>Loại</th>
              <th>Giá trị đơn tối thiểu</th>
              <th>Giảm</th>
              <th>Số lượng</th>
              <th>Đã dùng</th>
              <th>Ngày hết hạn</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {vouchers.length === 0 && (
              <tr>
                <td colSpan={9} className="py-6 text-center text-gray-500">
                  Chưa có phiếu giảm giá nào
                </td>
              </tr>
            )}

            {vouchers.map((v) => (
              <tr key={v.id}>
                <td>{v.id}</td>
                <td>{v.name}</td>
                <td>{v.type === "MONEY" ? "Tiền mặt" : "Phần trăm"}</td>
                <td>{v.minOrder.toLocaleString()}đ</td>
                <td>
                  {v.type === "PERCENT"
                    ? `${v.discount}%`
                    : `${v.discount.toLocaleString()}đ`}
                </td>
                <td>{v.quantity}</td>
                <td>{v.used}</td>
                <td>{new Date(v.end).toLocaleDateString("vi-VN")}</td>
                <td>
                  <div className="flex gap-3 text-lg">
                    <Link
                      href={`/voucher/${v.id}`}
                      className="text-blue-600"
                      title="Xem chi tiết"
                    >
                      ✏️
                    </Link>
                    <button
                      className="text-red-600"
                      onClick={() => handleDelete(v.id)}
                      title="Xóa"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
