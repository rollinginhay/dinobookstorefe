"use client";

import { useEffect, useRef } from "react";

/**
 * Component tự động clear tất cả dữ liệu đăng nhập CHỈ LẦN ĐẦU KHI MỞ LOCALHOST
 * Sau khi clear 1 lần rồi thì không clear nữa, giữ nguyên trạng thái đăng nhập
 */
export default function ClearAuthOnMount() {
  const hasRunRef = useRef(false);

  useEffect(() => {
    // Kiểm tra xem đã clear lần đầu chưa
    const hasClearedBefore = localStorage.getItem("auth_cleared_on_mount");
    
    // Nếu đã clear rồi thì không làm gì cả, giữ nguyên trạng thái đăng nhập
    if (hasClearedBefore === "true") {
      return;
    }

    // Chỉ chạy 1 lần trong session này
    if (hasRunRef.current) {
      return;
    }

    // Đánh dấu đã chạy
    hasRunRef.current = true;

    // Clear tất cả dữ liệu authentication (chỉ lần đầu mở localhost)
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    localStorage.removeItem("userAvatar");
    localStorage.removeItem("localUser");

    // Clear dữ liệu giỏ hàng
    localStorage.removeItem("guest_cart");

    // Clear dữ liệu voucher
    localStorage.removeItem("savedVouchers");

    // Clear dữ liệu yêu thích
    localStorage.removeItem("favorites");

    // Clear dữ liệu đơn hàng
    localStorage.removeItem("latestOrder");

    // Clear dữ liệu sách
    localStorage.removeItem("allBookData");

    // Clear guest ID nếu có
    localStorage.removeItem("guestId");

    // Đánh dấu đã clear lần đầu (dùng localStorage để persist qua refresh)
    localStorage.setItem("auth_cleared_on_mount", "true");

    console.log("✅ Đã clear tất cả dữ liệu đăng nhập và trạng thái (chỉ lần đầu khi mở localhost)");
  }, []); // Chỉ chạy 1 lần khi mount

  return null; // Component không render gì
}

