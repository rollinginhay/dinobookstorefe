"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type BackendUser = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  defaultAddress?: {
    receiverName?: string;
    phone?: string;
    addressLine?: string;
    ward?: string;
    district?: string;
    city?: string;
  };
};

type OrderHistoryItem = {
  id: string;
  code: string;
  createdAt: string;
  status: string;
  totalAmount: number;
};

const MOCK_USER: BackendUser = {
  id: "mock-1",
  fullName: "Nguyễn Văn A",
  email: "nguyenvana@example.com",
  phoneNumber: "0901234567",
  defaultAddress: {
    receiverName: "Nguyễn Văn A",
    phone: "0901234567",
    addressLine: "123 Đường Lê Lợi",
    ward: "Phường Bến Thành",
    district: "Quận 1",
    city: "TP. Hồ Chí Minh",
  },
};

const MOCK_ORDERS: OrderHistoryItem[] = [
  {
    id: "order-001",
    code: "DB-2025-0001",
    createdAt: new Date().toISOString(),
    status: "DELIVERED",
    totalAmount: 350000,
  },
  {
    id: "order-002",
    code: "DB-2025-0002",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: "SHIPPING",
    totalAmount: 520000,
  },
];

export default function TrangTaiKhoan() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const isMock = searchParams?.get("mock") === "1";
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Chế độ mock: luôn dùng tài khoản & đơn hàng cố định, không gọi API, không cần đăng nhập
    if (isMock) {
      setBackendUser(MOCK_USER);
      setOrders(MOCK_ORDERS);
      setLoadingProfile(false);
      setLoadingOrders(false);
      return;
    }

    if (!session) return;
    if (!API_BASE_URL) {
      setLoadingProfile(false);
      setLoadingOrders(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        // TODO: chỉnh endpoint/profile theo backend thực tế, ví dụ: /v1/users/me
        const res = await fetch(`${API_BASE_URL}/v1/users/me`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Không lấy được thông tin tài khoản.");
        const data = await res.json();
        setBackendUser({
          id: data.id ?? data.data?.id ?? "",
          fullName:
            data.fullName ?? data.data?.attributes?.fullName ??
            (session.user?.name || "Người dùng"),
          email:
            data.email ?? data.data?.attributes?.email ??
            (session.user?.email || ""),
          phoneNumber:
            data.phoneNumber ?? data.data?.attributes?.phoneNumber ?? "",
          defaultAddress:
            data.defaultAddress ?? data.data?.attributes?.defaultAddress ?? null,
        } as BackendUser);
      } catch (err: any) {
        console.error("Lỗi fetch profile:", err);
        setError(err.message || "Không lấy được thông tin tài khoản.");
      } finally {
        setLoadingProfile(false);
      }
    };

    const fetchOrders = async () => {
      try {
        setLoadingOrders(true);
        // TODO: chỉnh endpoint history đơn hàng theo backend thực tế, ví dụ: /v1/orders/my
        const res = await fetch(`${API_BASE_URL}/v1/orders/my`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Không lấy được lịch sử đơn hàng.");
        const data = await res.json();
        const items: OrderHistoryItem[] =
          data.data?.map((item: any) => ({
            id: item.id?.toString(),
            code: item.attributes?.code || `ORDER-${item.id}`,
            createdAt: item.attributes?.createdAt || new Date().toISOString(),
            status: item.attributes?.status || "PENDING",
            totalAmount: item.attributes?.totalAmount || 0,
          })) ?? [];
        setOrders(items);
      } catch (err: any) {
        console.error("Lỗi fetch orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchProfile();
    fetchOrders();
  }, [session, isMock]);

  if (status === "loading" && !isMock) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Đang tải thông tin tài khoản...
      </div>
    );
  }

  if (!session && !isMock) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Bạn chưa đăng nhập
          </h1>
          <p className="text-gray-600">
            Vui lòng đăng nhập để xem và quản lý trang cá nhân của bạn tại Dino
            Bookstore.
          </p>
          <button
            onClick={() => signIn(undefined, { callbackUrl: "/tai-khoan" })}
            className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
          >
            Đăng nhập ngay
          </button>
          <p className="text-xs text-gray-400">
            Sau khi đăng nhập, bạn có thể xem thông tin cá nhân, lịch sử đơn
            hàng và danh sách yêu thích.
          </p>
        </div>
      </div>
    );
  }

  const user = ((session && session.user) || {}) as {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    provider?: string;
  };

  const displayName =
    backendUser?.fullName || user.name || backendUser?.email || "Người dùng";
  const displayEmail = backendUser?.email || user.email || "";

  const activeColor =
    "bg-red-50 text-red-700 border-red-200 shadow-sm font-semibold";

  const scrollToSection = (id: string) => {
    if (typeof window === "undefined") return;
    const el = document.getElementById(id);
    if (!el) return;
    const y =
      el.getBoundingClientRect().top + window.scrollY - 120; // chừa chỗ cho header & navbar
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Tài khoản" },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Trang cá nhân
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr] gap-8 items-start">
          {/* Sidebar profile đẹp */}
          <aside className="bg-white rounded-2xl shadow-sm p-6 sticky top-24 space-y-6 border border-gray-100">
            <div className="flex flex-col items-center text-center space-y-4">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image as string}
                  alt={(displayName as string) ?? "User avatar"}
                  className="w-24 h-24 rounded-2xl border-4 border-red-100 shadow-md object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-3xl font-bold text-white shadow-md">
                  {(displayName?.[0] || "U").toUpperCase()}
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-red-500 uppercase tracking-[0.2em]">
                  Dino Member
                </p>
                <h2 className="text-xl font-bold text-gray-900 mt-1">
                  {displayName}
                </h2>
                {displayEmail && (
                  <p className="text-xs text-gray-500 mt-1 break-all">
                    {displayEmail}
                  </p>
                )}
              </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
              <span>Đang hoạt động</span>
            </div>
            </div>

            <nav className="space-y-1 text-sm">
              <button
                type="button"
                onClick={() => scrollToSection("section-profile")}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-colors ${activeColor}`}
              >
                <span className="flex items-center gap-2">
                  <span>👤</span>
                  <span>Thông tin cá nhân</span>
                </span>
                <span className="text-[10px] uppercase tracking-wide text-red-500">
                  Mặc định
                </span>
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("section-orders")}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-100 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span>📦</span>
                <span>Lịch sử đơn hàng</span>
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("section-address")}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-100 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span>📍</span>
                <span>Địa chỉ giao hàng</span>
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("section-favorites")}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-100 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span>❤️</span>
                <span>Sách yêu thích</span>
              </button>
            </nav>

            <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 p-4 text-xs text-amber-800 space-y-1">
              <p className="font-semibold flex items-center gap-2">
                <span>🎁</span>
                <span>Ưu đãi thành viên</span>
              </p>
              <p>
                Tích lũy đơn hàng để nhận nhiều voucher, freeship và quà tặng từ
                Dino Bookstore.
              </p>
            </div>
          </aside>

          {/* Nội dung chính */}
          <main className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Thông tin cá nhân + địa chỉ giao hàng */}
            <section
              id="section-profile"
              className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 space-y-6 scroll-mt-32"
            >
              <header className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Thông tin cá nhân & địa chỉ giao hàng
                  </h3>
                  <p className="text-sm text-gray-500">
                    Đồng bộ từ tài khoản đăng nhập và backend của bạn.
                  </p>
                </div>
                {loadingProfile && (
                  <span className="text-xs text-gray-400">
                    Đang đồng bộ dữ liệu...
                  </span>
                )}
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">
                      Họ tên
                    </p>
                    <p className="mt-1 font-medium">{displayName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">
                      Email
                    </p>
                    <p className="mt-1 break-all">{displayEmail || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase">
                      Số điện thoại
                    </p>
                    <p className="mt-1">
                      {backendUser?.phoneNumber || "Chưa cập nhật"}
                    </p>
                  </div>
                  {user.provider && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase">
                        Hình thức đăng nhập
                      </p>
                      <p className="mt-1 uppercase">{user.provider}</p>
                    </div>
                  )}
                </div>

                <div
                  id="section-address"
                  className="space-y-3 scroll-mt-32"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Địa chỉ giao hàng mặc định
                    </h4>
                    <span className="text-[11px] text-gray-400 italic">
                      (Lấy từ backend nếu có)
                    </span>
                  </div>
                  {backendUser?.defaultAddress ? (
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-1 text-sm">
                      {backendUser.defaultAddress.receiverName && (
                        <p className="font-semibold">
                          {backendUser.defaultAddress.receiverName}
                        </p>
                      )}
                      {backendUser.defaultAddress.phone && (
                        <p className="text-gray-600">
                          ĐT: {backendUser.defaultAddress.phone}
                        </p>
                      )}
                      <p className="text-gray-700">
                        {backendUser.defaultAddress.addressLine},{" "}
                        {backendUser.defaultAddress.ward},{" "}
                        {backendUser.defaultAddress.district},{" "}
                        {backendUser.defaultAddress.city}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                      Chưa có địa chỉ giao hàng mặc định. Địa chỉ bạn nhập trong
                      lần thanh toán tiếp theo có thể được dùng để đồng bộ lên
                      hồ sơ này.
                    </div>
                  )}

                  <p className="text-xs text-gray-400">
                    Trong tương lai có thể thêm chức năng thêm/sửa/xóa nhiều địa
                    chỉ (nhà riêng, công ty, người thân,...).
                  </p>
                </div>
              </div>
            </section>

            {/* Lịch sử đơn hàng */}
            <section
              id="section-orders"
              className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 space-y-4 scroll-mt-32"
            >
              <header className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Lịch sử đơn hàng
                  </h3>
                  <p className="text-sm text-gray-500">
                    Những đơn hàng bạn đã đặt tại Dino Bookstore.
                  </p>
                </div>
                {loadingOrders && (
                  <span className="text-xs text-gray-400">
                    Đang tải lịch sử...
                  </span>
                )}
              </header>

              {orders.length === 0 && !loadingOrders ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                  Chưa tìm thấy đơn hàng nào. Hãy thử đặt sách để xem lịch sử
                  tại đây nhé!
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-500">
                          Mã đơn
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-500">
                          Ngày đặt
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-500">
                          Trạng thái
                        </th>
                        <th className="px-4 py-2 text-right font-semibold text-gray-500">
                          Tổng tiền
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-semibold text-gray-800">
                            {order.code}
                          </td>
                          <td className="px-4 py-2 text-gray-600">
                            {new Date(order.createdAt).toLocaleString("vi-VN")}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700"
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right font-semibold text-red-600">
                            {order.totalAmount.toLocaleString("vi-VN")} ₫
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Danh sách yêu thích + CTA */}
            <section
              id="section-favorites"
              className="grid grid-cols-1 md:grid-cols-2 gap-6 scroll-mt-32"
            >
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Danh sách yêu thích
                </h3>
                <p className="text-sm text-gray-600">
                  Truy cập nhanh những cuốn sách bạn đã thả tim để cân nhắc mua
                  sau.
                </p>
                <Link
                  href="/yeu-thich"
                  className="inline-flex items-center gap-2 mt-1 text-sm font-semibold text-red-600 hover:text-red-700"
                >
                  Xem sách yêu thích
                  <span aria-hidden>❤</span>
                </Link>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-red-800">
                    Gợi ý dành riêng cho {displayName || "bạn"}
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    Khám phá thêm nhiều tựa sách mới, ưu đãi đặc biệt đang chờ
                    bạn tại Dino Bookstore.
                  </p>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                  Tiếp tục mua sắm
                </Link>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

