"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VNPayReturn() {
  const router = useRouter();

  useEffect(() => {
    const query = window.location.search; // ?vnp_Amount=...&vnp_TxnRef=...&vnp_SecureHash=...

    fetch("http://localhost:8080/api/vnpay/return" + query)
      .then((res) => res.text())
      .then((result) => {
        alert(result); // Thanh toán thành công / thất bại / hash không hợp lệ
        router.push("/hoa-don"); // hoặc trang đơn hàng
      });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Đang xử lý thanh toán...
    </div>
  );
}
