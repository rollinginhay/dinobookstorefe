"use client";

import { useEffect, useState } from "react";
import UserTable from "@/components/user/UserTable";
import { fetchUsers } from "@/lib/user/user.api";
import { mapUserList } from "@/lib/user/user.mapper";
import { toast } from "sonner";

const PAGE_SIZE = 10;

export default function StaffPage() {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchUsers();
      
      if (!Array.isArray(res)) {
        setData([]);
        return;
      }
      
      // Filter chỉ lấy staff (ROLE_EMPLOYEE)
      const mapped = mapUserList(res);
      const staffUsers = mapped.filter(user => 
        user.roles?.some((role) => role.name === "ROLE_EMPLOYEE")
      );
      
      setData(staffUsers);
      setFilteredData(staffUsers);
    } catch (err: any) {
      console.error("Error fetching staff:", err);
      setError("Có lỗi xảy ra khi tải dữ liệu nhân viên");
      toast.error("Có lỗi xảy ra khi tải dữ liệu nhân viên");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = [...data];

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((item) => {
        return (
          item.personName?.toLowerCase().includes(searchLower) ||
          item.username?.toLowerCase().includes(searchLower) ||
          item.email?.toLowerCase().includes(searchLower) ||
          item.phoneNumber?.toLowerCase().includes(searchLower)
        );
      });
    }

    setFilteredData(filtered);
    setPage(1);
  }, [searchTerm, data]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const pageData = filteredData.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold">Nhân viên</h1>
          <p className="text-sm text-gray-500">
            Quản lý danh sách nhân viên trong hệ thống
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              className="input w-full"
            />
          </div>
        </div>
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
            {searchTerm ? "Không tìm thấy nhân viên nào" : "Chưa có nhân viên nào"}
          </p>
        </div>
      ) : (
        <>
          <UserTable data={pageData} />

          {totalPages > 0 && (
            <div className="flex items-center justify-between bg-white rounded-xl border p-4">
              <div className="text-sm text-gray-700 font-medium">
                Trang {page} / {totalPages}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  «
                </button>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  ‹
                </button>
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
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  ›
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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

