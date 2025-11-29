"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useVoucher } from "@/contexts/VoucherContext";
import Breadcrumb from "@/components/Breadcrumb";
import { useRouter } from "next/navigation";

export default function ThanhToan() {
  const router = useRouter();
  const { cartItems, clearCart, totalPrice } = useCart();
  const { savedVouchers, getVoucherById, calculateDiscount } = useVoucher();

  const [selectedVoucherId, setSelectedVoucherId] = useState<string>("");
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/p/")
      .then((res) => res.json())
      .then((data) => setProvinces(data));
  }, []);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    district: "",
    ward: "",
    paymentMethod: "cod",
    note: "",
  });

  const shipping = totalPrice >= 299000 ? 0 : 30000;
  const subtotal = totalPrice + shipping;
  const voucherDiscount = selectedVoucherId
    ? calculateDiscount(selectedVoucherId, subtotal)
    : 0;
  const finalTotal = subtotal - voucherDiscount;

  // ===============================
  // 🔥 FIX: Các handler phải nằm bên ngoài handleSubmit
  // ===============================
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const selected = provinces.find((p) => p.code == code);

    setFormData((prev) => ({
      ...prev,
      city: selected?.name || "",
      district: "",
      ward: "",
    }));

    fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`)
      .then((res) => res.json())
      .then((data) => {
        setDistricts(data.districts || []);
        setWards([]);
      });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const selected = districts.find((d) => d.code == code);

    setFormData((prev) => ({
      ...prev,
      district: selected?.name || "",
      ward: "",
    }));

    fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`)
      .then((res) => res.json())
      .then((data) => {
        setWards(data.wards || []);
      });
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = wards.find((w) => w.code == e.target.value);

    setFormData((prev) => ({
      ...prev,
      ward: selected?.name || "",
    }));
  };

  // ===============================
  // 🔥 HANDLE SUBMIT
  // ===============================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      fullName: formData.fullName,
      phone: formData.phone,
      email: formData.email,
      address: `${formData.address}, ${formData.ward}, ${formData.district}, ${formData.city}`,
      note: formData.note,
      paymentMethod: formData.paymentMethod,
      items: cartItems.map((item) => ({
        bookDetailId: item.copyId,
        quantity: item.quantity,
        pricePerUnit: item.price,
      })),
    };

    console.log("📦 PAYLOAD gửi BE:", payload);
    console.log("🛒 CART:", cartItems);

    try {
      const res = await fetch("http://localhost:8080/v1/orders/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("❌ Lỗi tạo đơn hàng", res.status);
        alert("Đặt hàng thất bại, vui lòng thử lại!");
        return;
      }

      const data = await res.json();
      console.log("✅ ORDER RESPONSE:", data);

      alert("Đặt hàng thành công! Kiểm tra email nhé ❤️");
      clearCart();
      router.push("/");
    } catch (err) {
      console.error("❌ ERROR:", err);
      alert("Không thể kết nối server!");

      const confirmOrder = window.confirm(
        "Bạn có chắc chắn muốn đặt hàng không?"
      );
      if (!confirmOrder) return;

      const orderData = {
        info: formData,
        items: cartItems,
        shipping,
        voucherDiscount,
        finalTotal,
        voucherId: selectedVoucherId,
        createdAt: new Date().toISOString(),
      };

      if (formData.paymentMethod === "cod") {
        localStorage.setItem("latestOrder", JSON.stringify(orderData));
        clearCart();
        alert("Đặt hàng thành công!");
        router.push("/hoa-don");
      } else if (formData.paymentMethod === "banking") {
        try {
          const res = await fetch(
            "http://localhost:8080/api/vnpay/create-payment",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                amount: finalTotal,
                orderInfo: "Đơn hàng #" + new Date().getTime(),
                returnUrl: "http://localhost:3000/vnpay-return",
              }),
            }
          );

          const data = await res.json();

          if (data.paymentUrl) {
            window.location.href = data.paymentUrl;
          } else {
            alert("Không tạo được URL thanh toán VNPay!");
          }
        } catch (err) {
          console.error(err);
          alert("Lỗi kết nối VNPay");
        }
      } else if (formData.paymentMethod === "momo") {
        alert("Chức năng thanh toán Momo đang phát triển");
      }
    }
  };

  // ===================================================
  // 🔥 RETURN JSX NẰM NGOÀI handleSubmit – FIX MẤT UI
  // ===================================================
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Giỏ hàng trống
          </h2>
          <button
            onClick={() => router.push("/")}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
          >
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Giỏ hàng", href: "/gio-hang" },
          { label: "Thanh toán" },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Thanh toán</h1>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Thông tin giao hàng
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0912345678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Tỉnh / Thành phố */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tỉnh/Thành phố <span className="text-red-600">*</span>
                    </label>
                    <select
                      required
                      value={
                        provinces.find((p) => p.name === formData.city)?.code ||
                        ""
                      }
                      onChange={handleProvinceChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Chọn tỉnh/thành</option>
                      {provinces.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quận / Huyện */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quận/Huyện <span className="text-red-600">*</span>
                    </label>
                    <select
                      required
                      disabled={!districts.length}
                      value={
                        districts.find((d) => d.name === formData.district)
                          ?.code || ""
                      }
                      onChange={handleDistrictChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                    >
                      <option value="">Chọn quận/huyện</option>
                      {districts.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Phường / Xã */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phường/Xã <span className="text-red-600">*</span>
                    </label>
                    <select
                      required
                      disabled={!wards.length}
                      value={
                        wards.find((w) => w.name === formData.ward)?.code || ""
                      }
                      onChange={handleWardChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                    >
                      <option value="">Chọn phường/xã</option>
                      {wards.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú đơn hàng
                  </label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ghi chú thêm (không bắt buộc)"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Phương thức thanh toán
              </h2>

              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={formData.paymentMethod === "cod"}
                    onChange={handleChange}
                    className="mr-3 text-blue-600"
                  />
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-900">
                        Thanh toán khi nhận hàng (COD)
                      </div>
                      <div className="text-sm text-gray-600">
                        Thanh toán bằng tiền mặt khi nhận hàng
                      </div>
                    </div>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="banking"
                    checked={formData.paymentMethod === "banking"}
                    onChange={handleChange}
                    className="mr-3 text-blue-600"
                  />
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-8 h-8 text-pink-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-900">
                        Ví Điện tử VNPay
                      </div>
                      <div className="text-sm text-gray-600">
                        Thanh toán qua ví điện tử VNPay
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Đơn hàng</h2>

              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    <div className="w-12 h-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 line-clamp-1">
                        {item.title}
                      </div>
                      <div className="text-gray-600">
                        Số lượng: {item.quantity}
                      </div>
                    </div>
                    <div className="font-semibold text-gray-900">
                      {(item.price * item.quantity).toLocaleString("vi-VN")} ₫
                    </div>
                  </div>
                ))}
              </div>

              {/* Voucher Section */}
              <div className="border-t pt-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Mã giảm giá
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowVoucherModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {selectedVoucherId ? "Đổi mã" : "Chọn mã"}
                  </button>
                </div>
                {selectedVoucherId && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-green-800">
                        {getVoucherById(selectedVoucherId)?.code}
                      </span>
                      <span className="text-xs text-green-600">
                        -{voucherDiscount.toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVoucherId("");
                        setShowVoucherModal(false);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span>
                  <span>{totalPrice.toLocaleString("vi-VN")} ₫</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-green-600 font-medium">
                        Miễn phí
                      </span>
                    ) : (
                      <span>{shipping.toLocaleString("vi-VN")} ₫</span>
                    )}
                  </span>
                </div>
                {voucherDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá</span>
                    <span className="font-semibold">
                      -{voucherDiscount.toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Tổng cộng</span>
                    <span className="text-red-600">
                      {finalTotal.toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-orange-500 text-white py-4 px-6 rounded-lg hover:bg-orange-600 transition-colors font-semibold text-lg mt-6"
              >
                Đặt hàng ngay
              </button>

              <div className="mt-4 text-sm text-gray-600">
                Bằng việc đặt hàng, bạn đồng ý với{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Điều khoản dịch vụ
                </a>{" "}
                của chúng tôi
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Voucher Modal */}
      {showVoucherModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Chọn mã giảm giá
              </h2>
              <button
                onClick={() => setShowVoucherModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              {savedVouchers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎁</div>
                  <p className="text-gray-600 mb-4">
                    Bạn chưa có mã giảm giá nào
                  </p>
                  <a
                    href="/voucher"
                    className="text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Xem tất cả mã giảm giá →
                  </a>
                </div>
              ) : (
                savedVouchers.map((voucherId) => {
                  const voucher = getVoucherById(voucherId);
                  if (!voucher || !voucher.available) return null;
                  const discount = calculateDiscount(voucherId, subtotal);
                  const isSelected = selectedVoucherId === voucherId;
                  const canUse = subtotal >= voucher.minOrder;

                  return (
                    <div
                      key={voucherId}
                      className={`border-2 rounded-xl p-4 transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50"
                          : canUse
                          ? "border-gray-200 hover:border-blue-300 cursor-pointer"
                          : "border-gray-200 opacity-50 cursor-not-allowed"
                      }`}
                      onClick={() => {
                        if (canUse) {
                          setSelectedVoucherId(voucherId);
                          setShowVoucherModal(false);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-lg text-gray-900">
                              {voucher.code}
                            </span>
                            {isSelected && (
                              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                                Đã chọn
                              </span>
                            )}
                            {!canUse && (
                              <span className="bg-gray-400 text-white text-xs px-2 py-1 rounded-full font-bold">
                                Chưa đủ điều kiện
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {voucher.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            Đơn hàng tối thiểu:{" "}
                            {voucher.minOrder.toLocaleString("vi-VN")}₫
                            {discount > 0 && canUse && (
                              <span className="ml-2 text-green-600 font-semibold">
                                (Giảm {discount.toLocaleString("vi-VN")}₫)
                              </span>
                            )}
                          </p>
                        </div>
                        {canUse && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVoucherId(voucherId);
                              setShowVoucherModal(false);
                            }}
                            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                              isSelected
                                ? "bg-blue-600 text-white"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                          >
                            {isSelected ? "Đã chọn" : "Áp dụng"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
