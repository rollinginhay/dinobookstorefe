"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

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
  returnRequest?: {
    type: string;
    note: string;
    createdAt: string;
  } | null;
  returnRejected?: {
    type: string;
    note: string;
    createdAt: string;
  } | null;
  returnApproved?: {
    type: string;
    createdAt: string;
  } | null;
};

const STATUS_MAP: Record<
  string,
  { label: string; color: string; dot: string; showReturnButton?: boolean }
> = {
  pending: { label: "Chờ xác nhận", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  authorized: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  in_transit: { label: "Đang vận chuyển", color: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500" },
  paid: { label: "Hoàn thành", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", showReturnButton: true },
  cancelled: { label: "Đã hủy", color: "bg-gray-200 text-gray-600", dot: "bg-gray-500" },
  failed: { label: "Giao thất bại", color: "bg-red-100 text-red-600", dot: "bg-red-500" },
  refunded: { label: "Hoàn tiền", color: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
};

export default function TrangTaiKhoan() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const isMock = searchParams?.get("mock") === "1";

  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showReturnConfirmModal, setShowReturnConfirmModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [selectedReturnOrder, setSelectedReturnOrder] = useState<OrderHistoryItem | null>(null);

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
    if (isMock) {
      // setBackendUser(MOCK_USER);
      // setOrders(MOCK_ORDERS);
      // setLoadingProfile(false);
      // setLoadingOrders(false);
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
        const token = localStorage.getItem("jwtToken");
        const res = await fetch(`${API_BASE_URL}/v1/users/me`, {
          headers: token ? {
            Authorization: `Bearer ${token}`,
          } : {},
          credentials: "include",
        });

        if (!res.ok) throw new Error("Không lấy được thông tin tài khoản.");

        const data = await res.json();
        const userData = data.data?.attributes || data;
        
        // Parse defaultAddress từ note field
        let defaultAddress = null;
        if (userData.note) {
          try {
            defaultAddress = JSON.parse(userData.note);
          } catch (e) {
            console.error("Lỗi parse defaultAddress từ note:", e);
          }
        }

        setBackendUser({
          id: data.id ?? data.data?.id ?? "",
          fullName:
            userData.personName ??
            userData.fullName ??
            (session.user?.name || "Người dùng"),
          email:
            userData.email ??
            (session.user?.email || ""),
          phoneNumber: userData.phoneNumber ?? "",
          defaultAddress: defaultAddress,
        } as BackendUser);
      } catch (err: any) {
        console.error("Lỗi fetch profile:", err);
        setError(err.message || "Không lấy được thông tin tài khoản.");
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

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
  const handleCityChange = async (
    provinceCode: string,
    prefill?: { districtName?: string; wardName?: string }
  ) => {
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
      const loadedDistricts = data.districts || [];
      setDistricts(loadedDistricts);
      if (prefill?.districtName) {
        const district = loadedDistricts.find((d: any) => d.name === prefill.districtName);
        if (district) {
          setNewAddress((prev) => ({
            ...prev,
            district: String(district.code),
          }));
          handleDistrictChange(String(district.code), { wardName: prefill.wardName });
        }
      }
    } catch (err) {
      console.error("Lỗi tải quận/huyện:", err);
    }
  };

  const handleDistrictChange = async (
    districtCode: string,
    prefill?: { wardName?: string }
  ) => {
    setNewAddress({ ...newAddress, district: districtCode, ward: "" });
    setWards([]);
    if (!districtCode) return;

    try {
      const res = await fetch(
        `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`
      );
      const data = await res.json();
      const loadedWards = data.wards || [];
      setWards(loadedWards);
      if (prefill?.wardName) {
        const ward = loadedWards.find((w: any) => w.name === prefill.wardName);
        if (ward) {
          setNewAddress((prev) => ({
            ...prev,
            ward: ward.name,
          }));
        }
      }
    } catch (err) {
      console.error("Lỗi tải phường/xã:", err);
    }
  };
  const normalizeStatus = (status?: string) => (status || "").toLowerCase();

  const fetchOrders = async () => {
    const token = localStorage.getItem("jwtToken");
    const userId = localStorage.getItem("userId");
    if (!token || !API_BASE_URL || !userId) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }
    try {
      setLoadingOrders(true);
      // Dùng endpoint receipts (có relationships) để lọc theo customer.id = userId
      const res = await fetch(
        `${API_BASE_URL}/v1/receipts?e=true&page=0&limit=100&sort=updatedAt;desc`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Không lấy được lịch sử đơn hàng.");

      const data = await res.json();
      const rawItems = data.data ?? [];

      const items: OrderHistoryItem[] = await Promise.all(
        rawItems
          .filter((item: any) => {
            const customerId = item.relationships?.customer?.data?.id;
            return customerId && String(customerId) === String(userId);
          })
          .map(async (item: any) => {
            const orderId = item.id?.toString();
            // Fetch receipt history để kiểm tra return request
            // Tạm thời bỏ qua vì endpoint chưa có, sẽ implement sau
            let returnRequest = null;
            let returnRejected = null;
            let returnApproved = null;
            // Endpoint /v1/receipt/{id}/history chưa có, skip để tránh lỗi 404
            // Sẽ implement sau khi BE có endpoint này
            // Tạm thời set các giá trị về null
            returnRequest = null;
            returnRejected = null;
            returnApproved = null;
            // Parse note từ receipt để check return request status
            const note = item.attributes?.note || "";
            const hasReturnRequestInNote = note.includes("RETURN_REQUEST:");
            const hasReturnRejectedInNote = note.includes("RETURN_REJECTED:");
            const hasReturnApprovedInNote = note.includes("RETURN_APPROVED:");
            
            // Parse thông tin từ chối từ note (format: RETURN_REJECTED:{reason}|{date})
            let rejectedReason = null;
            let rejectedDate = null;
            if (hasReturnRejectedInNote) {
              const rejectedMatch = note.match(/RETURN_REJECTED:([^|]+)\|(.+)/);
              if (rejectedMatch) {
                rejectedReason = rejectedMatch[1].trim();
                rejectedDate = rejectedMatch[2].trim();
              } else {
                // Fallback: lấy toàn bộ sau RETURN_REJECTED:
                const simpleMatch = note.match(/RETURN_REJECTED:(.+)/);
                if (simpleMatch) {
                  rejectedReason = simpleMatch[1].trim();
                }
              }
            }

            return {
              id: orderId,
              code: item.attributes?.orderCode || item.attributes?.code || `ORDER-${orderId}`,
              createdAt: item.attributes?.createdAt || new Date().toISOString(),
              status: normalizeStatus(item.attributes?.orderStatus || item.attributes?.status) || "pending",
              totalAmount: item.attributes?.grandTotal || item.attributes?.totalAmount || 0,
              note: note,
              returnRequest: hasReturnRequestInNote ? { type: "RETURN_REQUEST", note: note, createdAt: item.attributes?.createdAt || new Date().toISOString() } : null,
              returnRejected: hasReturnRejectedInNote ? { type: "RETURN_REJECTED", note: rejectedReason || "", createdAt: rejectedDate || item.attributes?.updatedAt || new Date().toISOString() } : null,
              returnApproved: hasReturnApprovedInNote ? { type: "RETURN_APPROVED", note: note, createdAt: item.attributes?.updatedAt || new Date().toISOString() } : null,
            };
          })
      );

      setOrders(items);
    } catch (err: any) {
      console.error("Lỗi fetch orders:", err);
      setActionError(err.message);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    const userId = localStorage.getItem("userId");
    if (!token || !userId) {
      setIsLoggedIn(false);
      setLoadingProfile(false);
      setLoadingOrders(false);
      return;
    }
    setIsLoggedIn(true);
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!backendUser || backendUser.defaultAddress) return;

    try {
      const saved = localStorage.getItem("defaultShippingInfo");
      if (!saved) return;
      const info = JSON.parse(saved);

      setBackendUser((prev) => ({
        ...(prev || { id: "local" }),
        fullName:
          prev?.fullName ||
          info.fullName ||
          info.receiverName ||
          "Người dùng",
        email: prev?.email || info.email || "",
        phoneNumber: prev?.phoneNumber || info.phone || "",
        defaultAddress: {
          receiverName:
            info.fullName ||
            info.receiverName ||
            prev?.defaultAddress?.receiverName ||
            prev?.fullName,
          phone: info.phone || prev?.defaultAddress?.phone,
          addressLine:
            info.addressLine ||
            info.address ||
            prev?.defaultAddress?.addressLine,
          ward: info.ward || prev?.defaultAddress?.ward,
          district: info.district || prev?.defaultAddress?.district,
          city: info.city || prev?.defaultAddress?.city,
        },
      }));
    } catch (err) {
      console.error("Lỗi đọc defaultShippingInfo:", err);
    }
  }, [backendUser]);

  // Prefill form thêm địa chỉ với địa chỉ mặc định (city/district/ward)
  useEffect(() => {
    const da = backendUser?.defaultAddress;
    if (!da || !cities.length) return;

    const province = cities.find((c) => c.name === da.city);
    const provinceCode = province?.code ? String(province.code) : "";

    setNewAddress((prev) => ({
      ...prev,
      receiverName: da.receiverName || prev.receiverName,
      phone: da.phone || prev.phone,
      addressLine: da.addressLine || prev.addressLine,
      city: provinceCode,
      district: "",
      ward: "",
    }));

    if (provinceCode) {
      handleCityChange(provinceCode, {
        districtName: da.district,
        wardName: da.ward,
      });
    }
  }, [backendUser?.defaultAddress, cities]);

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

      const selectedCityName =
        cities.find((c) => String(c.code) === String(newAddress.city))?.name ||
        newAddress.city;
      const selectedDistrictName =
        districts.find((d) => String(d.code) === String(newAddress.district))?.name ||
        newAddress.district;
      
      // Format JSON:API như backend expect
      const payload = {
        data: {
          type: "user",
          id: "0", // Backend sẽ lấy từ token
          attributes: {
            personName: newAddress.receiverName,
            phoneNumber: newAddress.phone,
            address: `${newAddress.addressLine}, ${newAddress.ward}, ${selectedDistrictName}, ${selectedCityName}`,
            // Lưu defaultAddress vào note field dưới dạng JSON string
            note: JSON.stringify({
              receiverName: newAddress.receiverName,
              phone: newAddress.phone,
              addressLine: newAddress.addressLine,
              city: selectedCityName,
              district: selectedDistrictName,
              ward: newAddress.ward,
            }),
          },
        },
      };

      const res = await fetch(`${API_BASE_URL}/v1/user/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/vnd.api+json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Thêm địa chỉ thất bại");
      }

      const data = await res.json();
      const userData = data.data?.attributes || data;

      // Parse defaultAddress từ note field
      let defaultAddress = null;
      if (userData.note) {
        try {
          defaultAddress = JSON.parse(userData.note);
        } catch (e) {
          console.error("Lỗi parse defaultAddress từ note:", e);
        }
      }

      // Update local backendUser
      setBackendUser((prev) => ({
        ...prev!,
        defaultAddress: defaultAddress,
        personName: userData.personName || prev?.personName,
        phoneNumber: userData.phoneNumber || prev?.phoneNumber,
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

  const renderStatusBadge = (status: string) => {
    const key = normalizeStatus(status);
    const meta = STATUS_MAP[key] || { label: status, color: "bg-gray-100 text-gray-700", dot: "bg-gray-400" };
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${meta.color}`}>
        <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
        {meta.label}
      </span>
    );
  };

  const handleCancelOrder = async (order: OrderHistoryItem) => {
    if (!API_BASE_URL) {
      setActionError("Không tìm thấy API_BASE_URL");
      return;
    }
    const st = normalizeStatus(order.status);
    if (!["pending", "confirmed"].includes(st)) return;

    const ok = confirm("Bạn có chắc muốn hủy đơn này?");
    if (!ok) return;

    try {
      setActionError(null);
      setActionLoadingId(order.id);
      const token = localStorage.getItem("jwtToken");
      const res = await fetch(`${API_BASE_URL}/v1/receipt/${order.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderStatus: "CANCELLED",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Hủy đơn thất bại");
      }
      await fetchOrders();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const openReturnModal = (order: OrderHistoryItem) => {
    setSelectedReturnOrder(order);
    setReturnReason("");
    setShowReturnModal(true);
  };

  const handleConfirmReturnRequest = () => {
    if (!returnReason.trim()) {
      setActionError("Vui lòng nhập lý do trả hàng");
      return;
    }
    setShowReturnConfirmModal(true);
  };

  const submitReturnRequest = async () => {
    if (!selectedReturnOrder) return;
    if (!returnReason.trim()) {
      setActionError("Vui lòng nhập lý do trả hàng");
      return;
    }
    if (!API_BASE_URL) {
      setActionError("Không tìm thấy API_BASE_URL");
      return;
    }
    // Kiểm tra status phải là PAID (theo spec: chỉ cho phép khi PAID)
    const statusKey = normalizeStatus(selectedReturnOrder.status);
    if (statusKey !== "paid") {
      setActionError("Chỉ có thể yêu cầu trả hàng khi đơn hàng đã hoàn thành");
      return;
    }
    // Kiểm tra xem đã có return request chưa (không cho gửi lại)
    if (selectedReturnOrder.returnRequest) {
      setActionError("Bạn đã gửi yêu cầu trả hàng cho đơn này rồi");
      return;
    }
    // Kiểm tra xem đã bị từ chối chưa (không cho gửi lại sau khi bị từ chối)
    if (selectedReturnOrder.returnRejected) {
      setActionError("Yêu cầu trả hàng đã bị từ chối, không thể gửi lại");
      return;
    }
    try {
      setReturnSubmitting(true);
      setActionError(null);
      const token = localStorage.getItem("jwtToken");
      // Gửi return request - ghi log RETURN_REQUEST:{reason} vào receipt.note (theo quy ước)
      // KHÔNG đổi order_status (theo spec)
      const res = await fetch(
        `${API_BASE_URL}/v1/receipt/${selectedReturnOrder.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/vnd.api+json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Không lấy được thông tin đơn hàng");
      const receiptData = await res.json();
      const currentNote = receiptData.data?.attributes?.note || "";
      const newNote = currentNote + (currentNote ? "\n" : "") + `RETURN_REQUEST:${returnReason.trim()}`;
      
      // Update receipt.note với log RETURN_REQUEST
      const updateRes = await fetch(
        `${API_BASE_URL}/v1/receipt/update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/vnd.api+json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            data: {
              type: "receipt",
              id: String(selectedReturnOrder.id),
              attributes: { note: newNote },
            },
          }),
        }
      );
      if (!updateRes.ok) {
        const data = await updateRes.json().catch(() => ({}));
        throw new Error(data.message || "Gửi yêu cầu trả hàng thất bại");
      }
      // Đóng modal và refresh danh sách (order_status KHÔNG đổi, chỉ có return_request được tạo)
      setShowReturnModal(false);
      setShowReturnConfirmModal(false);
      setReturnReason("");
      await fetchOrders();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setReturnSubmitting(false);
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

            <nav className="space-y-1 text-sm mt-4">
              <button
                type="button"
                onClick={() => scrollToSection("section-profile")}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border transition-colors ${activeColor}`}
              >
                <span className="flex items-center gap-2">
                  <span>👤</span>
                  <span>Thông tin cá nhân</span>
                </span>
                {/* <span className="text-[10px] uppercase tracking-wide text-red-500">
                  Mặc định
                </span> */}
              </button>
            {/* <button
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
               </button> */}
            </nav>

            <button
              onClick={handleLogout}
              className="w-full mt-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
            >
              Đăng xuất
            </button>
          </aside>

          {/* ⭐ FIX: add z-0 relative để tránh bị đè ⭐ */}
          <main className="space-y-6 relative z-0">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Profile + Address */}
            {/* SECTION: PROFILE */}
            <section
              id="section-profile"
              className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 space-y-6 scroll-mt-32"
            >
              <header className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Thông tin cá nhân & địa chỉ giao hàng
                  </h3>
                  {/* <p className="text-sm text-gray-500">
                    Đồng bộ từ localStorage.
                  </p> */}
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
                  {/* <h4 className="text-sm font-semibold text-gray-900">
                    Địa chỉ giao hàng mặc định
                  </h4> */}
                </div>
                {/* <div>
                  {user.provider && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase">Hình thức đăng nhập</p>
                      <p className="mt-1 uppercase">{user.provider}</p>
                    </div>
                  )}
                </div> */}

                <div id="section-address" className="space-y-3 scroll-mt-32">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Địa chỉ giao hàng mặc định
                    </h4>
                    {/* <span className="text-[11px] text-gray-400 italic">
                      (Lấy từ backend nếu có)
                    </span> */}
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
                      Chưa có địa chỉ giao hàng mặc định.
                    </div>
                  )}

                  {/* Form thêm địa chỉ */}
                  {/* <form
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
                      /> */}

                      {/* Dropdown Tỉnh/Thành */}
                      {/* <select
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
                      </select> */}

                      {/* Dropdown Quận/Huyện */}
                      {/* <select
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
                      </select> */}

                      {/* Dropdown Phường/Xã */}
                      {/* <select
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
                  </form> */}
                </div>
              </div>
            </section>

            {/* SECTION: ORDERS */}
            <section
              id="section-orders"
              className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 space-y-4 scroll-mt-32"
            >
              <header className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Lịch sử đơn hàng
                  </h3>
                </div>

                {loadingOrders && (
                  <span className="text-xs text-gray-400">
                    Đang tải lịch sử...
                  </span>
                )}
              </header>

              {actionError && (
                <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-2">
                  {actionError}
                </div>
              )}

              {orders.length === 0 && !loadingOrders ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                  Chưa tìm thấy đơn hàng nào. Hãy thử đặt sách để xem lịch sử
                  tại đây nhé!
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => {
                    const statusKey = normalizeStatus(order.status);
                    const canCancel = ["pending", "authorized"].includes(statusKey);
                    // Chỉ hiện nút "Yêu cầu trả hàng" khi status = PAID (theo spec)
                    const canReturn = statusKey === "paid";
                    // Kiểm tra xem đã có return request chưa
                    const hasReturnRequest = order.returnRequest !== null;
                    const isReturnRejected = order.returnRejected !== null;
                    const isReturnApproved = order.returnApproved !== null;
                    // Sau khi bị từ chối, không cho gửi lại yêu cầu
                    const canShowReturnButton = canReturn && !hasReturnRequest && !isReturnRejected;
                    return (
                      <div
                        key={order.id}
                        className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 sm:px-5 sm:py-4 shadow-sm"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3 text-sm text-gray-700">
                              <span className="font-semibold text-gray-900">Đơn hàng</span>
                              <Link
                                href={`/hoa-don/${order.id}`}
                                className="text-red-600 font-semibold hover:underline"
                              >
                                #{order.code}
                              </Link>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-600">
                                {new Date(order.createdAt).toLocaleString("vi-VN")}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              {renderStatusBadge(order.status)}
                              <span className="text-sm font-semibold text-red-600">
                                {order.totalAmount.toLocaleString("vi-VN")} ₫
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/hoa-don/${order.id}`}
                              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium hover:border-red-300"
                            >
                              Xem chi tiết
                            </Link>

                            <button
                              onClick={() => handleCancelOrder(order)}
                              disabled={!canCancel || actionLoadingId === order.id}
                              className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                                canCancel
                                  ? "bg-white text-red-600 border-red-200 hover:border-red-400"
                                  : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                              }`}
                            >
                              {actionLoadingId === order.id ? "Đang hủy..." : "Hủy đơn"}
                            </button>

                            {/* Chỉ hiện nút "Yêu cầu trả hàng" khi status = PAID và chưa có return request và chưa bị từ chối */}
                            {canShowReturnButton && (
                              <button
                                onClick={() => openReturnModal(order)}
                                disabled={actionLoadingId === order.id}
                                className="px-3 py-2 rounded-lg text-sm font-semibold border bg-white text-indigo-600 border-indigo-200 hover:border-indigo-400"
                              >
                                Yêu cầu trả hàng
                              </button>
                            )}
                            
                            {/* Hiển thị block read-only khi bị từ chối */}
                            {isReturnRejected && order.returnRejected && (
                              <div className="px-4 py-3 rounded-lg border border-red-200 bg-red-50">
                                <div className="text-sm font-semibold text-red-700 mb-2">
                                  Yêu cầu trả hàng đã bị từ chối
                                </div>
                                {order.returnRejected.note && (
                                  <div className="text-sm text-red-600 mb-1">
                                    <span className="font-medium">Lý do:</span> {order.returnRejected.note}
                                  </div>
                                )}
                                {order.returnRejected.createdAt && (
                                  <div className="text-xs text-red-500">
                                    Ngày xử lý: {new Date(order.returnRejected.createdAt).toLocaleString("vi-VN")}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Hiển thị trạng thái return request đang chờ xử lý */}
                            {hasReturnRequest && !isReturnRejected && !isReturnApproved && (
                              <span className="px-3 py-2 rounded-lg text-sm font-semibold border bg-orange-50 text-orange-600 border-orange-200">
                                Đã gửi yêu cầu trả hàng – đang chờ shop xử lý
                              </span>
                            )}
                            
                            {/* Hiển thị trạng thái đã duyệt */}
                            {isReturnApproved && (
                              <span className="px-3 py-2 rounded-lg text-sm font-semibold border bg-purple-50 text-purple-600 border-purple-200">
                                Đã duyệt - đang chờ hoàn tiền
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* SECTION: FAVORITES */}
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
                  Xem sách yêu thích <span aria-hidden>❤</span>
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

      {showReturnModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Yêu cầu trả hàng {selectedReturnOrder ? `#${selectedReturnOrder.code}` : ""}
              </h3>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="text-sm text-gray-700">
              Lý do trả hàng <span className="text-red-600">*</span>
            </div>
            <textarea
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-300 focus:border-red-400"
              placeholder="VD: Sản phẩm bị lỗi, giao sai, không đúng mô tả..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmReturnRequest}
                disabled={returnSubmitting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
              >
                {returnSubmitting ? "Đang gửi..." : "Gửi yêu cầu trả hàng"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm gửi yêu cầu trả hàng */}
      {showReturnConfirmModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 text-center">
              Bạn có muốn gửi yêu cầu trả hàng không?
            </h3>
            <p className="text-sm text-gray-600 text-center">
              Yêu cầu sẽ được gửi tới shop để xử lý. Đơn hàng hiện tại không đổi trạng thái.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowReturnConfirmModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={submitReturnRequest}
                disabled={returnSubmitting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
              >
                {returnSubmitting ? "Đang gửi..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
