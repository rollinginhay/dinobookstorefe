"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Voucher = {
  id: string;
  name: string;
  type: "MONEY" | "PERCENT";
  minOrder: number;
  discount: number;
  quantity: number;
  used: number;
  end: string;
};

export default function VoucherDetail() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [loaded, setLoaded] = useState(false);

  // useEffect 1: load dữ liệu
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = window.localStorage.getItem("vouchers");
      if (saved) {
        const list: Voucher[] = JSON.parse(saved);
        const found = list.find((v) => v.id === id);
        if (found) setVoucher(found);
      }
    } catch (err) {
      console.error("Load voucher detail error", err);
    } finally {
      setLoaded(true);
    }
  }, [id]);

  // 2 return này KHÔNG làm thay đổi số lượng hooks
  if (!loaded) {
    return (
      <div className="p-6 text-gray-500">
        Đang tải phiếu giảm giá...
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.push("/voucher/new")}
          className="px-4 py-2 bg-gray-100 border rounded-md hover:bg-gray-200"
        >
          ← Quay lại
        </button>

        <h2 className="section-title">Không tìm thấy phiếu giảm giá</h2>
        <p>Mã: {id}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/voucher/new")}
        className="px-4 py-2 bg-gray-100 border rounded-md hover:bg-gray-200"
      >
        ← Quay lại
      </button>

      <h2 className="section-title">
        Chi tiết phiếu giảm giá — {voucher.id}
      </h2>

      <div className="card space-y-3 max-w-xl">
        <div>
          <span className="font-medium">Tên phiếu: </span>
          {voucher.name}
        </div>
        <div>
          <span className="font-medium">Loại: </span>
          {voucher.type === "MONEY" ? "Tiền mặt" : "Phần trăm"}
        </div>
        <div>
          <span className="font-medium">Giá trị đơn tối thiểu: </span>
          {voucher.minOrder.toLocaleString()}đ
        </div>
        <div>
          <span className="font-medium">Giảm: </span>
          {voucher.type === "PERCENT"
            ? `${voucher.discount}%`
            : `${voucher.discount.toLocaleString()}đ`}
        </div>
        <div>
          <span className="font-medium">Số lượng: </span>
          {voucher.quantity}
        </div>
        <div>
          <span className="font-medium">Đã dùng: </span>
          {voucher.used}
        </div>
        <div>
          <span className="font-medium">Ngày hết hạn: </span>
          {new Date(voucher.end).toLocaleDateString("vi-VN")}
        </div>
      </div>
    </div>
  );
}
