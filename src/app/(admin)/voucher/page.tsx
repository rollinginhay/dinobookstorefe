"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import DiscountTable from "@/components/discount/DiscountTable";
import {fetchDiscounts} from "@/lib/discount/discount.api";
import {mapDiscountList} from "@/lib/discount/discount.mapper";
import {CampaignStatus, getCampaignStatus} from "@/lib/discount/discount.utils";

const PAGE_SIZE = 5;

export default function VoucherPage() {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "ALL">("ALL");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchDiscounts();
      console.log("Fetched discounts response:", res);
      
      // Đảm bảo res là array
      if (!Array.isArray(res)) {
        console.warn("Response is not an array:", res);
        setData([]);
        return;
      }
      
      const mapped = mapDiscountList(res);
      console.log("Mapped discounts:", mapped);
      setData(mapped);
      setFilteredData(mapped);
    } catch (err: any) {
      console.error("Error fetching discounts:", err);
      console.error("Error details:", {
        message: err?.message,
        response: err?.response,
        status: err?.response?.status,
        data: err?.response?.data,
      });
      
      // Hiển thị error message chi tiết hơn
      let errorMessage = "Có lỗi xảy ra khi tải dữ liệu";
      if (err?.response?.status === 500) {
        errorMessage = "Lỗi máy chủ (500). Vui lòng kiểm tra backend hoặc thử lại sau.";
      } else if (err?.response?.data?.errors?.[0]?.title) {
        errorMessage = err.response.data.errors[0].title;
      } else if (err?.response?.data?.errors?.[0]?.detail) {
        errorMessage = err.response.data.errors[0].detail;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter data khi searchTerm hoặc statusFilter thay đổi
  useEffect(() => {
    let filtered = [...data];

    // Filter theo trạng thái
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((item) => {
        const status = getCampaignStatus(item.startDate, item.endDate);
        return status === statusFilter;
      });
    }

    // Filter theo search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((item) => {
        return (
          item.name?.toLowerCase().includes(searchLower) ||
          item.id?.toString().includes(searchLower) ||
          item.note?.toLowerCase().includes(searchLower)
        );
      });
    }

    setFilteredData(filtered);
    setPage(1); // Reset về trang 1 khi filter thay đổi
  }, [searchTerm, statusFilter, data]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const pageData = filteredData.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold">Đợt giảm giá</h1>
          <p className="text-sm text-gray-500">
            Quản lý các chương trình giảm giá theo thời gian
          </p>
        </div>

        <Link href="/voucher/new">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            + Thêm mới
          </button>
        </Link>
      </div>

      {/* Bộ lọc tìm kiếm và trạng thái */}
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên, mã hoặc ghi chú..."
              className="input w-full"
            />
          </div>
        </div>

        {/* Bộ lọc trạng thái */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Lọc theo trạng thái:</span>
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === "ALL"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setStatusFilter("UPCOMING")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === "UPCOMING"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Chưa bắt đầu
          </button>
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === "ACTIVE"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Đang diễn ra
          </button>
          <button
            onClick={() => setStatusFilter("EXPIRED")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === "EXPIRED"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Đã kết thúc
          </button>
        </div>

        {(searchTerm || statusFilter !== "ALL") && (
          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-xs text-gray-500">
              Tìm thấy {filteredData.length} đợt giảm giá
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border p-6 text-center">
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border p-6 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="bg-white rounded-xl border p-6 text-center">
          <p className="text-gray-500">
            {searchTerm ? "Không tìm thấy đợt giảm giá nào" : "Chưa có đợt giảm giá nào"}
          </p>
        </div>
      ) : (
        <>
          <DiscountTable data={pageData} />

          {/* PAGINATION */}
          {totalPages > 0 && (
            <div className="flex items-center justify-between bg-white rounded-xl border p-4">
              {/* Page indicator bên trái */}
              <div className="text-sm text-gray-700 font-medium">
                Trang {page} / {totalPages}
              </div>

              {/* Navigation buttons bên phải */}
              <div className="flex items-center gap-1">
                {/* First page button */}
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  title="Trang đầu"
                >
                  «
                </button>

                {/* Previous page button */}
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  title="Trang trước"
                >
                  ‹
                </button>

                {/* Page number buttons */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      page === pageNum
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                {/* Next page button */}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  title="Trang sau"
                >
                  ›
                </button>

                {/* Last page button */}
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  title="Trang cuối"
                >
                  »
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
