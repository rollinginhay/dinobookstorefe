"use client";

import { useState } from "react";
import ProductSelector from "./ProductSelector";
import CustomerSelector from "./CustomerSelector";
import PaymentMethodPopup from "./PaymentMethodPopup";
import { useRouter } from "next/navigation";
import {useEffect } from "react";

// ===============================
// DEMO VOUCHER LIST (POS PANEL)
// ===============================
const DEMO_VOUCHERS = [
  {
    code: "VC000004",
    label: "20%",
    description: "Giảm 20% tối đa 150.000đ",
    minTotal: 1000000,
    type: "PERCENT",
    value: 20,
    maxDiscount: 150000,
  },
  {
    code: "VC000006",
    label: "5M",
    description: "Giảm 5.000.000đ cho đơn từ 15.000.000đ",
    minTotal: 15000000,
    type: "FIXED",
    value: 5000000,
    maxDiscount: 5000000,
  },
];

// chuẩn hoá tất cả voucher lấy từ localStorage để POS không crash
const normalizeVoucher = (v: any) => ({
  code: v.code || v.id,
  type: v.type === "MONEY" ? "FIXED" : v.type,
  minTotal: v.minTotal || v.minOrder || 0,
  value: v.value || v.discount || 0,
  maxDiscount: v.maxDiscount || v.discount || v.value || 0,
  label:
    v.label ||
    (v.type === "PERCENT"
      ? `${v.discount || v.value}%`
      : `${(v.discount || v.value).toLocaleString()}đ`),
  description:
    v.description ||
    `Giảm ${(v.discount || v.value).toLocaleString()}${
      v.type === "PERCENT" ? "%" : "đ"
    }`,
});

// Lấy danh sách voucher từ localStorage
// ===============================
// ORDER MODEL
// ===============================
const createEmptyOrder = () => ({
  id: Date.now(), // ID duy nhất
  items: [], // Giỏ hàng
  customer: null, // Khách hàng
  voucherCode: "", // Mã đã áp dụng
  discountAmount: 0, // Số tiền giảm
});

export default function Page() {
  const router = useRouter();

  // 1) Tạo state rỗng trước
  const [orders, setOrders] = useState<any[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);

  // 2) Load data từ localStorage khi mở POS
  useEffect(() => {
    const saved = localStorage.getItem("posOrders");

    if (saved) {
      const parsed = JSON.parse(saved);
      setOrders(parsed);
      setActiveOrderId(parsed[0]?.id || null); // chọn hoá đơn đầu tiên
    } else {
      // nếu lần đầu mở POS → tạo hóa đơn mới
      const newOrder = createEmptyOrder();
      setOrders([newOrder]);
      setActiveOrderId(newOrder.id);
    }
  }, []);

  // 3) Lưu vào localStorage mỗi khi orders thay đổi
  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem("posOrders", JSON.stringify(orders));
    }
  }, [orders]);


  // Popup
  const [showProductPopup, setShowProductPopup] = useState(false);
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);

  // Nhận hàng
  const [shippingMethod, setShippingMethod] = useState<"STORE" | "DELIVERY">(
    "STORE"
  );
  // ➤ Thông tin giao hàng (delivery)
const [shippingInfo, setShippingInfo] = useState({
  name: "",
  phone: "",
  address: "",
});

  // Ô nhập mã voucher
  const [voucherInput, setVoucherInput] = useState("");
  // Search sản phẩm (gợi ý bên dưới ô tìm kiếm)
  const [searchText, setSearchText] = useState("");

  // Có thể trùng với demo trong ProductSelector cho dễ test
  const SEARCH_PRODUCTS = [
    {
      id: 1,
      code: "SP001",
      name: "Áo sơ mi trắng",
      price: 150000,
      image: "https://cdn-icons-png.flaticon.com/512/892/892458.png",
    },
    {
      id: 2,
      code: "SP002",
      name: "Quần jean xanh",
      price: 250000,
      image: "https://cdn-icons-png.flaticon.com/512/892/892403.png",
    },
    {
      id: 3,
      code: "SP003",
      name: "Giày sneaker",
      price: 500000,
      image: "https://cdn-icons-png.flaticon.com/512/892/892781.png",
    },
  ];
const [vouchersFromLocalStorage, setVouchersFromLocalStorage] = useState<any[]>([]);

useEffect(() => {
  const saved = localStorage.getItem("vouchers");
  if (!saved) return;

  const raw = JSON.parse(saved);
  setVouchersFromLocalStorage(raw.map((v: any) => normalizeVoucher(v)));
}, []);

  // Lấy đơn hàng hiện tại
  const activeOrder = orders.find((o) => o.id === activeOrderId);
  // ➤ Khi đổi khách hàng → tự điền tên + sđt vào form giao hàng
useEffect(() => {
  if (activeOrder?.customer) {
    setShippingInfo({
      name: activeOrder.customer.name || "",
      phone: activeOrder.customer.phone || "",
      address: "",
    });
  } else {
    setShippingInfo({
      name: "",
      phone: "",
      address: "",
    });
  }
}, [activeOrder?.customer]);

  // Nếu vì lý do gì đó không tìm thấy activeOrder
  if (!activeOrder) {
    return <div className="card">Không tìm thấy đơn hàng.</div>;
  }

  // ===============================
  // ORDER OPERATIONS
  // ===============================
  const updateOrder = (newData: any) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === activeOrderId ? { ...o, ...newData } : o))
    );
  };

  const addNewOrder = () => {
    // Giới hạn 5 đơn hàng
    if (orders.length >= 5) {
      window.confirm(
        "Bạn đã tạo tối đa 5 đơn hàng.\nVui lòng đóng bớt hóa đơn trước khi tạo mới."
      );
      return;
    }

    const newOrder = createEmptyOrder();
    setOrders([...orders, newOrder]);
    setActiveOrderId(newOrder.id);
  };

  const closeOrder = (id: number) => {
    if (orders.length === 1) return; // không cho đóng khi chỉ còn 1 đơn

    const filtered = orders.filter((o) => o.id !== id);
    setOrders(filtered);

    // Nếu đóng đúng tab đang mở → chọn tab đầu tiên
    if (id === activeOrderId && filtered.length > 0) {
      setActiveOrderId(filtered[0].id);
    }
  };

  // ===============================
  // CART FUNCTIONS
  // ===============================
  const addProduct = (product: any) => {
    const exists = activeOrder.items.find((i: any) => i.id === product.id);

    let updatedItems;
    if (exists) {
      updatedItems = activeOrder.items.map((i: any) =>
        i.id === product.id ? { ...i, qty: i.qty + 1 } : i
      );
    } else {
      updatedItems = [...activeOrder.items, { ...product, qty: 1 }];
    }

    updateOrder({ items: updatedItems });
  };

  const changeQty = (id: number, number: number) => {
    const updatedItems = activeOrder.items
      .map((i: any) =>
        i.id === id ? { ...i, qty: Math.max(1, i.qty + number) } : i
      )
      .filter((i: any) => i.qty > 0);

    updateOrder({ items: updatedItems });
  };

  const removeItem = (id: number) => {
    updateOrder({
      items: activeOrder.items.filter((i: any) => i.id !== id),
    });
  };
    // ===============================
  // PAYMENT
  // ===============================
  const total = activeOrder.items.reduce(
    (s: number, i: any) => s + i.price * i.qty,
    0
  );
  const orderDiscount = activeOrder.discountAmount ?? 0;
  const shippingFee = shippingMethod === "DELIVERY" ? 30000 : 0;
  const final = Math.max(0, total + shippingFee - orderDiscount);
  // ===============================
  // VOUCHER / DISCOUNT
  // ===============================
  const calcDiscountFromVoucher = (voucher: any, total: number) => {
    if (total < voucher.minTotal) return 0;

    if (voucher.type === "PERCENT") {
      const raw = (total * voucher.value) / 100;
      return Math.min(raw, voucher.maxDiscount ?? raw);
    }

    if (voucher.type === "FIXED") {
      return Math.min(voucher.value, total);
    }

    return 0;
  };

  
  const applyVoucherByCode = (code: string) => {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) {
    alert("Vui lòng nhập mã!");
    return;
  }

const allVouchers = [
  ...DEMO_VOUCHERS.map((v) => normalizeVoucher(v)),
  ...vouchersFromLocalStorage.map((v) => normalizeVoucher(v)),
];


  const voucher = allVouchers.find((v) => v.code === trimmed);
  if (!voucher) {
    alert("❌ Mã giảm giá không hợp lệ.");
    return;
  }

  const discount = calcDiscountFromVoucher(voucher, total);
  if (discount <= 0) {
    alert(`❌ Đơn hàng chưa đạt đơn tối thiểu ${voucher.minTotal.toLocaleString()}đ`);
    return;
  }

  updateOrder({ voucherCode: voucher.code, discountAmount: discount });
  alert(`✔ Đã áp dụng mã ${voucher.code}`);
  setVoucherInput("");
};

// Lọc sản phẩm theo nội dung tìm kiếm
const filteredSearch =
  searchText.trim() === ""
    ? []
    : SEARCH_PRODUCTS.filter((p) => {
        const keyword = searchText.toLowerCase();
        return (
          p.name.toLowerCase().includes(keyword) ||
          p.code.toLowerCase().includes(keyword)
        );
      });

  // ===============================
  // RENDER
  // ===============================
  return (
    <div className="space-y-6">
      <h2 className="section-title">Bán hàng tại quầy</h2>

      {/* ============ MAIN LAYOUT ============ */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
        {/* =======================================
            LEFT COLUMN: CART + SHIPPING
        ======================================== */}
        <div className="space-y-4">
          {/* TABS + SEARCH + CART */}
          <div className="card">
            {/* HOÁ ĐƠN TABS */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex flex-wrap gap-2">
                {orders.map((order, index) => (
                  <button
                    key={order.id}
                    type="button"
                    className={`px-4 py-2 rounded-md text-sm font-medium border flex items-center gap-2 ${
                      order.id === activeOrderId
                        ? "bg-[var(--sidebar-primary)] text-white border-[var(--sidebar-primary)]"
                        : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                    }`}
                    onClick={() => setActiveOrderId(order.id)}
                  >
                    <span>Hóa đơn {index + 1}</span>
                    {orders.length > 1 && (
                      <span
                        className="text-xs opacity-80 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeOrder(order.id);
                        }}
                      >
                        ✕
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={addNewOrder}
                className="btn btn-success bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                + Thêm
              </button>
            </div>

            {/* SEARCH BAR + GỢI Ý SẢN PHẨM */}
<div className="flex flex-wrap items-center gap-3 mb-4">
  {/* Nút quét mã – tạm thời chỉ để chỗ */}
  <button
    type="button"
    className="btn btn-secondary text-sm flex items-center gap-1"
    onClick={() => {
      alert("Chức năng quét mã đang phát triển");
    }}
  >
    📷 Quét mã
  </button>
</div>


            {/* GIỎ HÀNG TABLE */}
            <div className="rounded border border-gray-200 overflow-x-auto">
              <table className="table min-w-[700px]">
                <thead>
                  <tr>
                    <th className="w-[50px] text-center">#</th>
                    <th className="w-[120px] text-center">Ảnh</th>
                    <th className="w-[280px]">Sản phẩm</th>
                    <th className="w-[140px] text-center">Số lượng</th>
                    <th className="w-[140px] text-right">Tổng tiền</th>
                    <th className="w-[60px] text-center">Xóa</th>
                  </tr>
                </thead>

                <tbody>
                  {activeOrder.items.length === 0 && (
                    <tr>
                      <td
                        className="py-6 text-center text-gray-500"
                        colSpan={6}
                      >
                        Giỏ hàng trống
                      </td>
                    </tr>
                  )}

                  {activeOrder.items.map((item: any, index: number) => (
                    <tr key={item.id}>
                      <td className="text-center">{index + 1}</td>

                      <td className="text-center">
                        <img
                          src={item.image}
                          className="w-16 h-16 object-cover mx-auto rounded"
                          alt={item.name}
                        />
                      </td>

                      <td>
                        <div className="flex flex-col justify-center">
                          <span className="font-semibold">{item.name}</span>
                          <span className="text-gray-500 text-xs mt-1">
                            Đơn giá:{" "}
                            <b className="text-red-500">
                              {item.price.toLocaleString()}đ
                            </b>
                          </span>
                        </div>
                      </td>

                      <td className="text-center">
                        <div className="inline-flex gap-2 items-center">
                          <button
                            type="button"
                            className="w-8 h-8 border border-gray-300 rounded-md text-sm"
                            onClick={() => changeQty(item.id, -1)}
                          >
                            -
                          </button>

                          <span className="w-10 text-center font-medium">
                            {item.qty}
                          </span>

                          <button
                            type="button"
                            className="w-8 h-8 border border-gray-300 rounded-md text-sm"
                            onClick={() => changeQty(item.id, +1)}
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="text-right font-semibold text-blue-600">
                        {(item.qty * item.price).toLocaleString()}đ
                      </td>

                      <td className="text-center">
                        <button
                          type="button"
                          className="text-red-500 text-lg"
                          onClick={() => removeItem(item.id)}
                          title="Xóa sản phẩm"
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              className="btn btn-primary mt-4"
              onClick={() => setShowProductPopup(true)}
            >
              + Chọn sản phẩm
            </button>
          </div>

          {/* NHẬN HÀNG */}
          <div className="card">
            <h3 className="card-title mb-4">Nhận hàng</h3>
            <div className="space-y-3 text-sm">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  className="checkbox mt-0.5"
                  checked={shippingMethod === "STORE"}
                  onChange={() => setShippingMethod("STORE")}
                />
                <div>
                  <div className="font-medium text-gray-800">Tại quầy</div>
                  <div className="text-gray-500">
                    Có thể nhận hàng từ 7h30 đến 22h30 mỗi ngày tại cửa hàng
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="radio"
                  className="checkbox mt-0.5"
                  checked={shippingMethod === "DELIVERY"}
                  onChange={() => setShippingMethod("DELIVERY")}
                />
                <div>
                  <div className="font-medium text-gray-800">Chuyển phát</div>
                  <div className="text-gray-500">
                    Giao hàng toàn quốc từ 1–2 ngày
                  </div>
                  {shippingMethod === "DELIVERY" && (
  <div className="mt-4 p-4 border rounded-lg bg-gray-50 space-y-3 ml-6">

    {/* Tên người nhận */}
    <div>
      <label className="text-sm font-medium">Tên người nhận</label>
      <input
        type="text"
        className="input w-full mt-1"
        value={shippingInfo.name}
        onChange={(e) =>
          setShippingInfo({ ...shippingInfo, name: e.target.value })
        }
        placeholder="Nhập tên người nhận"
      />
    </div>

    {/* Số điện thoại */}
    <div>
      <label className="text-sm font-medium">Số điện thoại</label>
      <input
        type="text"
        className="input w-full mt-1"
        value={shippingInfo.phone}
        onChange={(e) =>
          setShippingInfo({ ...shippingInfo, phone: e.target.value })
        }
        placeholder="Nhập số điện thoại"
      />
    </div>

    {/* Địa chỉ nhận hàng */}
    <div>
      <label className="text-sm font-medium">Địa chỉ nhận hàng</label>
      <textarea
        className="input w-full mt-1 h-20"
        value={shippingInfo.address}
        onChange={(e) =>
          setShippingInfo({ ...shippingInfo, address: e.target.value })
        }
        placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
      ></textarea>
    </div>

  </div>
)}

                </div>
              </label>
            </div>
          </div>
        </div>

        {/* =======================================
            RIGHT COLUMN: CUSTOMER + VOUCHER + SUMMARY
        ======================================== */}
        <div className="space-y-4">
          {/* KHÁCH HÀNG */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="card-title mb-0">Khách hàng</h3>
              <button
                type="button"
                className="btn btn-primary text-sm"
                onClick={() => setShowCustomerPopup(true)}
              >
                Chọn khách hàng
              </button>
            </div>

            {!activeOrder.customer && (
              <div className="text-sm text-gray-700">Khách hàng lẻ</div>
            )}

            {activeOrder.customer && (
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div>
                  <div className="text-gray-500">Tên khách hàng</div>
                  <div className="font-medium">
                    {activeOrder.customer.name}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Ngày sinh</div>
                  <div>{activeOrder.customer.dob}</div>
                </div>
                <div>
                  <div className="text-gray-500">Email</div>
                  <div>{activeOrder.customer.email}</div>
                </div>
                <div>
                  <div className="text-gray-500">SĐT</div>
                  <div>{activeOrder.customer.phone}</div>
                </div>

                <button
                  type="button"
                  className="text-red-500 text-xs underline mt-1 justify-self-start"
                  onClick={() => updateOrder({ customer: null })}
                >
                  Đổi khách hàng
                </button>
              </div>
            )}
          </div>

          {/* VOUCHER + TỔNG TIỀN */}
          <div className="card space-y-4">
            {/* Ô nhập mã */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Nhập mã"
                  className="input flex-1"
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => applyVoucherByCode(voucherInput)}
                >
                  Áp dụng
                </button>
              </div>

              {/* DANH SÁCH VOUCHER DEMO */}
              <div className="space-y-3 max-h-[260px] overflow-y-auto custom-scrollbar">
                {DEMO_VOUCHERS.map((v) => {
                  const isApplied = activeOrder.voucherCode === v.code;
                  return (
                    <button
                      key={v.code}
                      type="button"
                      onClick={() => applyVoucherByCode(v.code)}
                      className={`w-full flex border rounded-lg px-3 py-3 text-left items-center gap-3 ${
                        isApplied
                          ? "border-[var(--sidebar-primary)] bg-[var(--sidebar-primary-soft)]"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-sm">
                          {v.code}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {v.description}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1">
                          Đơn tối thiểu{" "}
                          {v.minTotal.toLocaleString("vi-VN")}đ
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-between h-full text-center min-w-[48px]">
                        <span className="text-xs text-gray-500 uppercase">
                          Mã giảm giá
                        </span>
                        <span className="text-base font-semibold text-[var(--sidebar-primary)]">
                          {v.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TỔNG KẾT THANH TOÁN */}
            <div className="divider" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Tổng:</span>
                <b>{total.toLocaleString()}đ</b>
              </div>

              <div className="flex justify-between">
                <span>Phí ship:</span>
                <b>
                  {shippingFee === 0
                    ? "Miễn phí"
                    : shippingFee.toLocaleString() + "đ"}
                </b>
              </div>

              <div className="flex justify-between text-red-500">
                <span>Giảm giá:</span>
                <b>
                  {orderDiscount > 0
                    ? `-${orderDiscount.toLocaleString()}đ`
                    : "0đ"}
                </b>
              </div>

              <div className="flex justify-between font-semibold mt-2">
                <span>Thực thu:</span>
                <b>{final.toLocaleString()}đ</b>
              </div>
            </div>

            {/* GIỮ LẠI CHỨC NĂNG CŨ */}
            <button
              type="button"
              className="btn bg-emerald-500 hover:bg-emerald-600 text-white w-full mt-4"
              onClick={() => setShowPaymentPopup(true)}
            >
              Phương thức thanh toán
            </button>

            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={() => {
                // gọi API tạo hóa đơn (demo)
                fetch("/api/orders", {
                  method: "POST",
                  body: JSON.stringify(activeOrder),
                })
                  .then((res) => res.json())
                  .then((bill) => {
                    router.push(`/invoice/${bill.id}`); // chuyển sang trang in
                  })
                  .catch(() => {
                    alert("Gửi đơn hàng demo thất bại (API chưa sẵn).");
                  });
              }}
            >
              Xác nhận đơn hàng
            </button>
          </div>
        </div>
      </div>

      {/* =======================
          POPUPS
      ======================== */}
      {showProductPopup && (
        <ProductSelector
          onClose={() => setShowProductPopup(false)}
          onSelect={(p) => {
            addProduct(p);
            setShowProductPopup(false);
          }}
        />
      )}

      {showCustomerPopup && (
        <CustomerSelector
          onClose={() => setShowCustomerPopup(false)}
          onSelect={(c) => {
            updateOrder({ customer: c });
            setShowCustomerPopup(false);
          }}
        />
      )}

      {showPaymentPopup && (
        <PaymentMethodPopup
          amount={final}
          onClose={() => setShowPaymentPopup(false)}
          onConfirm={(data) => {
            console.log("Thanh toán:", data);
            setShowPaymentPopup(false);
          }}
        />
      )}
    </div>
  );
}
