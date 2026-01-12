"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";

export default function VnPayReturn() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearAllCartFromBackend } = useCart();

  const [message, setMessage] = useState("Đang xử lý kết quả thanh toán...");
  const [loading, setLoading] = useState(true);
  const [receiptId, setReceiptId] = useState<string | null>(null);

  useEffect(() => {
    const params = searchParams.toString();
    
    // ✅ Lấy receiptId từ URL params (được thêm vào returnUrl bởi VNPayService)
    // Theo VNPayService.java: returnUrl = returnBaseUrl + "?receiptId=" + receiptId + "&txnRef=" + txnRef
    const receiptIdFromUrl = searchParams.get("receiptId");
    
    console.log("📦 [VNPAY RETURN] URL params:", params);
    console.log("📦 [VNPAY RETURN] receiptId từ URL:", receiptIdFromUrl);
    
    // ✅ Set receiptId ngay từ đầu (không cần đợi API response)
    if (receiptIdFromUrl) {
      setReceiptId(receiptIdFromUrl);
      console.log("✅ [VNPAY RETURN] Đã lấy receiptId:", receiptIdFromUrl);
    } else {
      console.warn("⚠️ [VNPAY RETURN] Không tìm thấy receiptId trong URL params!");
    }

    const callReturnApi = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/vnpay/return?${params}`,
          { method: "GET" }
        );
        console.log("📦 [VNPAY RETURN] API response:", response);
        const text = await response.text();
        setMessage(text);
        
        // Nếu thanh toán thành công, xóa các sản phẩm đã thanh toán khỏi giỏ hàng
        if (text.includes("thành công")) {
          console.log("✅ Thanh toán thành công, đang xóa giỏ hàng...");
          try {
            await clearAllCartFromBackend();
            console.log("✅ Đã xóa giỏ hàng sau khi thanh toán thành công");
          } catch (error) {
            console.error("❌ Lỗi khi xóa giỏ hàng:", error);
          }
        }
      } catch (error) {
        console.error("❌ [VNPAY RETURN] Lỗi:", error);
        setMessage("Có lỗi xảy ra khi xác nhận thanh toán");
      } finally {
        setLoading(false);
      }
    };

    if (params) {
      callReturnApi();
    } else {
      setMessage("Không tìm thấy thông tin thanh toán");
      setLoading(false);
    }
  }, [searchParams, clearAllCartFromBackend]);

  const isSuccess = message.includes("thành công");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-semibold mb-4">Kết quả thanh toán</h2>

        {loading ? (
          <p className="text-gray-500 animate-pulse">
            ⏳ Đang xác minh giao dịch...
          </p>
        ) : (
          <p
            className={`text-lg font-bold ${
              isSuccess ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}

        {!loading && (
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Trang chủ
            </button>

            {receiptId ? (
              <button
                onClick={() => router.push(`/hoa-don/${receiptId}`)}
                className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
              >
                Xem đơn
              </button>
            ) : (
              <button
                onClick={() => router.push("/hoa-don")}
                className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
              >
                Đơn hàng
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
