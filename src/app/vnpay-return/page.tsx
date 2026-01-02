"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function VnPayReturn() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [message, setMessage] = useState("Đang xử lý kết quả thanh toán...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = searchParams.toString();

    const callReturnApi = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/vnpay/return?${params}`,
          { method: "GET" }
        );
        console.log("callReturnApi", response);
        const text = await response.text();
        setMessage(text);
      } catch (error) {
        console.error(error);
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
  }, [searchParams]);

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

            <button
              onClick={() => router.push("/orders")}
              className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
            >
              Đơn hàng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
