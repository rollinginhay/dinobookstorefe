"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HoaDonPage() {
  const router = useRouter();

  useEffect(() => {
    // Lấy hóa đơn mới nhất từ localStorage
    const latestOrderStr = localStorage.getItem("latestOrder");
    
    if (latestOrderStr) {
      try {
        const latestOrder = JSON.parse(latestOrderStr);
        const receiptId = latestOrder?.data?.id;
        
        if (receiptId) {
          // Redirect đến trang chi tiết hóa đơn với ID
          router.push(`/hoa-don/${receiptId}`);
          return;
        }
      } catch (err) {
        console.error("Lỗi parse latestOrder:", err);
      }
    }
    
    // Nếu không có hóa đơn mới nhất, có thể:
    // 1. Hiển thị danh sách hóa đơn
    // 2. Hoặc redirect về trang chủ
    // 3. Hoặc hiển thị thông báo
    
    // Tạm thời redirect về trang chủ nếu không có hóa đơn
    router.push("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-600">
      Đang chuyển hướng...
    </div>
  );
}
