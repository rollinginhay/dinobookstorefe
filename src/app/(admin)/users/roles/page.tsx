"use client";

import { useEffect, useState } from "react";
import { fetchRoles } from "@/lib/user/role.api";
import { toast } from "sonner";
import Link from "next/link";
import { getRoleDisplayName, getRoleColorClasses } from "@/lib/user/role.utils";

export default function RolesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchRoles();
      console.log("Fetched roles response:", res);
      
      if (!Array.isArray(res)) {
        console.warn("Response is not an array:", res);
        setData([]);
        return;
      }
      
      // Filter bỏ ROLE_USER (Khách hàng)
      const filteredRoles = res.filter((role: any) => {
        const roleName = role.name || role.attributes?.name || "";
        return roleName !== "ROLE_USER";
      });
      
      setData(filteredRoles);
    } catch (err: any) {
      console.error("Error fetching roles:", err);
      
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
      toast.error(errorMessage);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold">Phân quyền</h1>
          <p className="text-sm text-gray-500">
            Quản lý các vai trò và quyền trong hệ thống
          </p>
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
      ) : data.length === 0 ? (
        <div className="bg-white rounded-xl border p-6 text-center">
          <p className="text-gray-500">Chưa có vai trò nào</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50 text-sm">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Tên vai trò</th>
                <th className="px-4 py-3 text-left">Mô tả</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {data.map((role) => (
                <tr key={role.id} className="border-t text-sm">
                  <td className="px-4 py-3 font-medium">
                    {role.id}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRoleColorClasses(role.name)}`}>
                      {getRoleDisplayName(role.name)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {role.description || "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {role.enabled !== false ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                        Kích hoạt
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                        Vô hiệu hóa
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/users/roles/${role.id}`}
                      className="inline-flex items-center justify-center text-orange-500 hover:text-orange-600"
                      title="Chỉnh sửa"
                    >
                      ✏️
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

