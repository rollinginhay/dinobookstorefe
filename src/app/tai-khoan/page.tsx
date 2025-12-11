"use client";

import { useEffect, useState, FormEvent } from "react";
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

export default function TrangTaiKhoan() {
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Form address state
  const [newAddress, setNewAddress] = useState({
    receiverName: "",
    phone: "",
    addressLine: "",
    ward: "",
    district: "",
    city: "",
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressMessage, setAddressMessage] = useState<string | null>(null);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await fetch("https://provinces.open-api.vn/api/p/");
        const data = await res.json();
        setCities(data);
      } catch (err) {
        console.error("Lỗi tải danh sách tỉnh/thành:", err);
      }
    };
    fetchCities();
  }, []);

  // Xử lý onchange của dropdown
  const handleCityChange = async (provinceCode: string) => {
    setNewAddress({
      ...newAddress,
      city: provinceCode,
      district: "",
      ward: "",
    });
    setDistricts([]);
    setWards([]);
    if (!provinceCode) return;

    try {
      const res = await fetch(
        `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`
      );
      const data = await res.json();
      setDistricts(data.districts || []);
    } catch (err) {
      console.error("Lỗi tải quận/huyện:", err);
    }
  };

  const handleDistrictChange = async (districtCode: string) => {
    setNewAddress({ ...newAddress, district: districtCode, ward: "" });
    setWards([]);
    if (!districtCode) return;

    try {
      const res = await fetch(
        `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`
      );
      const data = await res.json();
      setWards(data.wards || []);
    } catch (err) {
      console.error("Lỗi tải phường/xã:", err);
    }
  };
  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setIsLoggedIn(false);
      setLoadingProfile(false);
      setLoadingOrders(false);
      return;
    }
    setIsLoggedIn(true);

    const username = localStorage.getItem("username") || "Người dùng";
    const userEmail = localStorage.getItem("email") || "";

    setBackendUser({
      id: "local",
      fullName: username,
      email: userEmail,
    });
    setLoadingProfile(false);

    const fetchOrders = async () => {
      if (!API_BASE_URL) {
        setOrders([]);
        setLoadingOrders(false);
        return;
      }
      try {
        setLoadingOrders(true);
        const res = await fetch(`${API_BASE_URL}/v1/orders/my`, {
          headers: { Authorization: `Bearer ${token}` },
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
    fetchOrders();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("username");
    localStorage.removeItem("userAvatar");
    localStorage.removeItem("email");
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
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
          <Link
            href="/dang-nhap"
            className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors block"
          >
            Đăng nhập ngay
          </Link>
          <p className="text-xs text-gray-400">
            Sau khi đăng nhập, bạn có thể xem thông tin cá nhân, lịch sử đơn
            hàng và danh sách yêu thích.
          </p>
        </div>
      </div>
    );
  }

  const displayName =
    backendUser?.fullName || backendUser?.email || "Người dùng";
  const displayEmail = backendUser?.email || "";

  const activeColor =
    "bg-red-50 text-red-700 border-red-200 shadow-sm font-semibold";

  const scrollToSection = (id: string) => {
    if (typeof window === "undefined") return;
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  // Handle add new address
  const handleAddAddress = async (e: FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    setAddressMessage(null);

    try {
      const token = localStorage.getItem("jwtToken");
      if (!token || !API_BASE_URL) throw new Error("Không tìm thấy token/API");

      const res = await fetch(`${API_BASE_URL}/v1/user/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAddress),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Thêm địa chỉ thất bại");
      }

      const data = await res.json();

      // Update local backendUser
      setBackendUser((prev) => ({
        ...prev!,
        defaultAddress: data.data, // assuming backend trả về address object
      }));

      setAddressMessage("Đã thêm địa chỉ thành công!");
      setNewAddress({
        receiverName: "",
        phone: "",
        addressLine: "",
        ward: "",
        district: "",
        city: "",
      });
    } catch (err: any) {
      console.error("Lỗi thêm địa chỉ:", err);
      setAddressMessage(err.message);
    } finally {
      setSavingAddress(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb
        items={[{ label: "Trang chủ", href: "/" }, { label: "Tài khoản" }]}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Trang cá nhân</h1>

        <div className="grid grid-cols-[260px_1fr] gap-8 items-start">
          {/* Sidebar */}
          <aside className="bg-white rounded-2xl shadow-sm p-6 sticky top-24 space-y-6 border border-gray-100">
            <div className="flex flex-col items-center text-center space-y-4">
              {backendUser && (
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
            </nav>

            <button
              onClick={handleLogout}
              className="w-full mt-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
            >
              Đăng xuất
            </button>
          </aside>

          {/* Main */}
          <main className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Profile + Address */}
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
                    Đồng bộ từ localStorage.
                  </p>
                </div>
                {loadingProfile && (
                  <span className="text-xs text-gray-400">
                    Đang đồng bộ dữ liệu...
                  </span>
                )}
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
                {/* Thông tin cá nhân */}
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
                </div>

                {/* Địa chỉ */}
                <div id="section-address" className="space-y-3 scroll-mt-32">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Địa chỉ giao hàng mặc định
                  </h4>

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
                      Chưa có địa chỉ giao hàng mặc định.
                    </div>
                  )}

                  {/* Form thêm địa chỉ */}
                  <form
                    className="mt-4 space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100"
                    onSubmit={handleAddAddress}
                  >
                    <h5 className="text-sm font-semibold text-gray-900">
                      Thêm địa chỉ mới
                    </h5>
                    {addressMessage && (
                      <p className="text-xs text-green-600">{addressMessage}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Tên người nhận"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        value={newAddress.receiverName}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            receiverName: e.target.value,
                          })
                        }
                        required
                      />
                      <input
                        type="text"
                        placeholder="Số điện thoại"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        value={newAddress.phone}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            phone: e.target.value,
                          })
                        }
                        required
                      />
                      <input
                        type="text"
                        placeholder="Địa chỉ chi tiết (số nhà, tên đường)"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2"
                        value={newAddress.addressLine}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            addressLine: e.target.value,
                          })
                        }
                        required
                      />

                      {/* Dropdown Tỉnh/Thành */}
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        value={newAddress.city}
                        onChange={(e) => handleCityChange(e.target.value)}
                        required
                      >
                        <option value="">Chọn tỉnh/thành</option>
                        {cities.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>

                      {/* Dropdown Quận/Huyện */}
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        value={newAddress.district}
                        onChange={(e) => handleDistrictChange(e.target.value)}
                        required
                        disabled={!districts.length}
                      >
                        <option value="">Chọn quận/huyện</option>
                        {districts.map((d) => (
                          <option key={d.code} value={d.code}>
                            {d.name}
                          </option>
                        ))}
                      </select>

                      {/* Dropdown Phường/Xã */}
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        value={newAddress.ward}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, ward: e.target.value })
                        }
                        required
                        disabled={!wards.length}
                      >
                        <option value="">Chọn phường/xã</option>
                        {wards.map((w) => (
                          <option key={w.code} value={w.name}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={savingAddress}
                      className="w-full py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors text-sm"
                    >
                      {savingAddress ? "Đang lưu..." : "Lưu địa chỉ"}
                    </button>
                  </form>
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
                    Những đơn hàng bạn đã đặt.
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
                  Chưa tìm thấy đơn hàng nào.
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
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
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
          </main>
        </div>
      </div>
    </div>
  );
}
