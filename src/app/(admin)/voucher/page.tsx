"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";

export default function VoucherList() {
  const router = useRouter();

  const [vouchers, setVouchers] = useState<any[]>([]);

  // ======== LOAD VOUCHERS FROM LOCAL STORAGE =========
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem("vouchers");

      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) {
          setVouchers(list);
          return;
        }
      }

      // Nếu không có thì dùng mẫu mặc định
      setVouchers([
        {
          id: "VC00001",
          name: "Giảm 10K",
          minOrder: 50000,
          discount: 10000,
          type: "MONEY",
          quantity: 50,
          used: 10,
          start: "2025-01-01",
          end: "2025-12-31",
        },
      ]);
    } catch (err) {
      console.error("Voucher load error:", err);
    }
  }, []);

  // ======== DELETE VOUCHER =========
  const deleteVoucher = (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa phiếu này?")) return;

    const updated = vouchers.filter((v) => v.id !== id);
    setVouchers(updated);

    if (typeof window !== "undefined") {
      localStorage.setItem("vouchers", JSON.stringify(updated));
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
                <td colSpan={9} className="text-center py-6 text-gray-500">
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
                  {v.type === "MONEY"
                    ? v.discount.toLocaleString() + "đ"
                    : v.discount + "%"}
                </td>
                <td>{v.quantity}</td>
                <td>{v.used}</td>
                <td>{new Date(v.end).toLocaleDateString("vi-VN")}</td>

                <td>
                  <div className="flex gap-3 text-lg">
                    <button
                      onClick={() => router.push(`/voucher/${v.id}`)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Xem chi tiết"
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => deleteVoucher(v.id)}
                      className="text-red-600 hover:text-red-800"
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
