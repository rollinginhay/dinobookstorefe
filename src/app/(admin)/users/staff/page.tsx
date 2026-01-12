"use client";

import {useEffect, useRef, useState} from "react";
import {usePathname, useRouter} from "next/navigation";
import UserTable from "@/components/user/UserTable";
import {fetchUsers} from "@/lib/user/user.api";
import {mapUserList} from "@/lib/user/user.mapper";
import {toast} from "sonner";

export default function StaffPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const hasCheckedReload = useRef(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchUsers();
      
      if (!Array.isArray(res)) {
        setData([]);
        setFilteredData([]);
        return;
      }
      
      // Filter lấy quản lý (ROLE_MANAGER) và nhân viên (ROLE_EMPLOYEE), lọ bỏ quản trị viên (ROLE_ADMIN)
      const mapped = mapUserList(res);
      const staffUsers = mapped.filter(user => {
        const roleNames = user.roles?.map(r => r.name) || [];
        // Hiển thị nếu có ROLE_MANAGER hoặc ROLE_EMPLOYEE, nhưng không có ROLE_ADMIN
        return (roleNames.includes("ROLE_MANAGER") || roleNames.includes("ROLE_EMPLOYEE")) 
               && !roleNames.includes("ROLE_ADMIN");
      });
      
      // Sắp xếp theo createdAt giảm dần (mới nhất lên đầu)
      const sortedStaffUsers = staffUsers.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Giảm dần (mới nhất lên đầu)
      });
      
      console.log(`Loaded ${sortedStaffUsers.length} staff users (managers + employees) from ${mapped.length} total users`);
      
      // 🔍 DEBUG: Kiểm tra user mới nhất có role gì
      const newest5 = mapped.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }).slice(0, 5);
      console.log("🔍 [StaffPage] 5 newest users:");
      newest5.forEach((user, i) => {
        const roleNames = user.roles?.map(r => r.name) || [];
        console.log(`  ${i+1}. ${user.username} (${user.email}): ${roleNames.join(', ')}`);
      });
      
      setData(sortedStaffUsers);
      setFilteredData(sortedStaffUsers);
    } catch (err: any) {
      console.error("Error fetching staff:", err);
      setError("Có lỗi xảy ra khi tải dữ liệu quản lý");
      toast.error("Có lỗi xảy ra khi tải dữ liệu quản lý");
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  // Check and reload when pathname changes (user navigates to this page)
  useEffect(() => {
    const checkAndReload = () => {
      const shouldReload = sessionStorage.getItem("shouldReloadStaff");
      if (shouldReload === "true") {
        console.log("✅ shouldReloadStaff flag detected, reloading data...");
        sessionStorage.removeItem("shouldReloadStaff");
        // Delay một chút để đảm bảo navigation đã hoàn tất
        setTimeout(() => {
          console.log("🔄 Calling loadData() after flag detected");
          loadData();
        }, 300);
        return true;
      }
      return false;
    };

    // Check when pathname changes to this page (hoặc khi có query param reload)
    if (pathname?.startsWith("/users/staff")) {
      console.log("📍 Pathname changed to:", pathname);
      // Luôn check flag khi quay lại trang này
      const flagFound = checkAndReload();
      
      // Nếu chưa từng load data (lần đầu mount), load ngay
      if (!hasCheckedReload.current) {
        hasCheckedReload.current = true;
        // Nếu không có flag, load data bình thường
        if (!flagFound) {
          console.log("🔄 Initial load (no flag)");
          loadData();
        }
      } else if (flagFound) {
        // Đã từng load rồi nhưng có flag -> đã reload ở trên
        console.log("✅ Reload triggered by flag");
      }
    }
  }, [pathname]);

  // Listen for shouldReloadStaff flag and reload when page becomes visible or when navigating back
  useEffect(() => {
    const checkAndReload = () => {
      const shouldReload = sessionStorage.getItem("shouldReloadStaff");
      if (shouldReload === "true") {
        console.log("shouldReloadStaff flag detected (from event), reloading data...");
        sessionStorage.removeItem("shouldReloadStaff");
        // Delay một chút để đảm bảo navigation đã hoàn tất
        setTimeout(() => {
          loadData();
        }, 200);
      }
    };

    // Check when page becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAndReload();
      }
    };

    // Check when window gains focus
    const handleFocus = () => {
      checkAndReload();
    };

    // Check on popstate (browser back/forward)
    const handlePopState = () => {
      setTimeout(() => {
        checkAndReload();
      }, 200);
    };

    // Polling: Check every 500ms for the first 5 seconds after mount (in case navigation is slow)
    let pollCount = 0;
    const maxPolls = 10; // 10 * 500ms = 5 seconds
    const pollInterval = setInterval(() => {
      pollCount++;
      checkAndReload();
      if (pollCount >= maxPolls) {
        clearInterval(pollInterval);
      }
    }, 500);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("popstate", handlePopState);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("popstate", handlePopState);
    };
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
  }, [searchTerm, data]);

  // Thêm STT cho mỗi user (từ lớn đến nhỏ, mới nhất = STT 1)
  const dataWithSTT = filteredData.map((user, index) => ({
    ...user,
    stt: index + 1
  }));
  
  // Không phân trang nữa, hiển thị tất cả
  const pageData = dataWithSTT;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold">Quản lý nhân viên</h1>
          {/* <p className="text-sm text-gray-500">
            Quản lý danh sách quản lý trong hệ thống
            {!loading && filteredData.length > 0 && (
              <span className="ml-2 text-gray-600">
                ({filteredData.length} {filteredData.length === 1 ? "người" : "người"})
              </span>
            )}
          </p> */}
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
          <button
            onClick={() => router.push("/users/staff/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Thêm nhân viên
          </button>
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
            {searchTerm ? "Không tìm thấy quản lý nào" : "Chưa có quản lý nào"}
          </p>
        </div>
      ) : (
        <>
          <UserTable data={pageData} basePath="/users/staff" />
        </>
      )}
    </div>
  );
}
