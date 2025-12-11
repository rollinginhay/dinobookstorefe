// pages/vnpay-return.tsx (Next.js)
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VnPayReturn() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const vnp_ResponseCode = params.get("vnp_ResponseCode");
    // Xử lý kết quả, ví dụ hiển thị alert
    if (vnp_ResponseCode === "00") {
      alert("Thanh toán thành công!");
      router.push("/hoa-don");
    } else {
      alert("Thanh toán thất bại!");
    }
  }, []);

  return <div>Đang xử lý thanh toán...</div>;
}
