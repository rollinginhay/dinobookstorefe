"use client";

import {useParams, useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import {BillService} from "@/service/bill.service";

type OrderStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "PAID"
  | "IN_TRANSIT"
  | "CANCELLED"
  | "FAILED"
  | "REFUNDED"
  | "WAITING_REFUND_INFO"
  | "RETURNED"
  | "UNKNOWN";

type OrderType = "POS" | "ONLINE" | "UNKNOWN";

type PaymentType = "CASH" | "TRANSFER" | "COD";

interface BillItem {
    id: number; // id của receiptDetail
    bookDetailId: number;
    name: string;
    pricePerUnit: number; // Giá đã giảm (nếu có)
    originalPrice?: number; // ✅ Giá gốc từ bookDetail.supplyPrice
    quantity: number;
    stock: number;
    image: string;
}

interface CustomerInfo {
  code: string | null;
  name: string;
  email: string | null;
  phone: string;
  address: string;
  note: string;
}

interface PaymentHistoryItem {
  id: number;
  amount: number;
  paymentType: PaymentType | string;
  createdAt: string;
  note: string;
  provider: string;
  providerId: string;
}

interface ConfirmState {
  open: boolean;
  action: "NEXT" | "CANCEL" | "REFUND_CONFIRM" | "FAILED" | null;
  title?: string;
  message?: string;
}

interface RefundInfo {
  refundBankAccount: string | null;
  refundBankName: string | null;
  refundAccountHolder: string | null;
}

interface MockProduct {
    bookDetailId: number;
    name: string;
    sku: string;
    color: string;
    size: string;
    stock: number;
    price: number;
}

// Mock list sản phẩm để popup "Thêm sản phẩm"
const MOCK_PRODUCTS: MockProduct[] = [
    {
        bookDetailId: 30,
        name: "Sách A - Paperback",
        sku: "9780000000030",
        color: "Trắng",
        size: "13x20",
        stock: 15,
        price: 180_000,
    },
    {
        bookDetailId: 31,
        name: "Sách B - Bìa cứng",
        sku: "9780000000031",
        color: "Đỏ",
        size: "16x24",
        stock: 8,
        price: 250_000,
    },
    {
        bookDetailId: 32,
        name: "Sách C - Pocket",
        sku: "9780000000032",
        color: "Đen",
        size: "10x18",
        stock: 20,
        price: 135_000,
    },
];
function renderStatusBadge(status: OrderStatus) {
  switch (status) {
    case "PENDING":
      return (
        <span className="badge bg-yellow-100 text-yellow-600">
          Chờ xác nhận
        </span>
      );
    case "AUTHORIZED":
      return (
        <span className="badge bg-cyan-100 text-cyan-600">
          Đã xác nhận
        </span>
      );
    case "IN_TRANSIT":
      return (
        <span className="badge bg-blue-100 text-blue-600">
          Đang vận chuyển
        </span>
      );
    case "PAID":
      return (
        <span className="badge bg-green-100 text-green-600">Hoàn thành</span>
      );
    case "CANCELLED":
      return (
        <span className="badge bg-red-100 text-red-600">Đã hủy</span>
      );
    case "FAILED":
      return (
        <span className="badge bg-orange-100 text-orange-600">Thất bại</span>
      );
    case "REFUNDED":
      return (
        <span className="badge bg-gray-100 text-gray-600">Hoàn tiền</span>
      );
    case "WAITING_REFUND_INFO":
      return (
        <span className="badge bg-yellow-100 text-yellow-700">Chờ thông tin hoàn tiền</span>
      );
    default:
      return (
        <span className="badge bg-gray-200 text-gray-700">UNKNOWN</span>
      );
  }
}

function getNextStatus(
  current: OrderStatus,
  opts: { orderType: OrderType; paymentType: PaymentType; hasShipping: boolean }
): OrderStatus {

  const { orderType, paymentType, hasShipping } = opts;

  // ✅ MUA POS: Chỉ bán tại quầy, hoàn thành luôn (không qua trạng thái khác)
  // POS đã được set PAID ngay khi tạo, không có chuyển trạng thái
  if (orderType === "POS") {
    return current; // POS không có chuyển trạng thái, giữ nguyên
  }

  // ✅ MUA ONLINE (luôn có ship)
  // COD: PENDING -> AUTHORIZED -> IN_TRANSIT -> PAID
  // Chuyển khoản trước: PENDING -> AUTHORIZED (trừ số lượng luôn) -> IN_TRANSIT -> PAID
  if (orderType === "ONLINE") {
    if (current === "PENDING") return "AUTHORIZED";
    if (current === "AUTHORIZED") return "IN_TRANSIT";
    if (current === "IN_TRANSIT") return "PAID";
    return current;
  }

  return current;
}
function getNextActionLabel(
  current: OrderStatus,
  opts: { orderType: OrderType; paymentType: PaymentType; hasShipping: boolean }
): string | null {
  const { orderType } = opts;

  // ✅ MUA POS: Không có nút chuyển trạng thái (đã hoàn thành luôn khi tạo)
  if (orderType === "POS") {
    return null; // POS không có chuyển trạng thái
  }

  // ✅ MUA ONLINE: Luồng đầy đủ
  if (orderType === "ONLINE") {
    if (current === "PENDING") {
      return "Xác nhận đơn";
    }
    if (current === "AUTHORIZED") {
      return "Giao cho vận chuyển";
    }
    if (current === "IN_TRANSIT") {
      return "Xác nhận giao thành công";
    }
    return null;
  }

  return null;
}


// ✅ Mapping chữ hiển thị
const STATUS_TEXT: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  AUTHORIZED: "Đã xác nhận",
  IN_TRANSIT: "Đang vận chuyển",
  PAID: "Hoàn thành",
  CANCELLED: "Đã huỷ",
  REFUNDED: "Đã hoàn tiền",
  WAITING_REFUND_INFO: "Chờ thông tin hoàn tiền",
  FAILED: "Giao thất bại",
  RETURNED: "Trả hàng",
};

// ✅ Interface cho ReceiptHistory
interface ReceiptHistory {
  oldStatus: string | null;
  newStatus: string;
  updatedAt?: string;
  createdAt?: string;
}

// ✅ Build timeline - CỰC ĐƠN GIẢN
function buildTimeline(history: ReceiptHistory[]) {
  if (!history || history.length === 0) return [];
  
  return [...history]
    .sort(
      (a, b) =>
        new Date(a.updatedAt || a.createdAt || 0).getTime() -
        new Date(b.updatedAt || b.createdAt || 0).getTime()
    )
    .map(h => ({
      time: h.updatedAt || h.createdAt || "",
      text: STATUS_TEXT[h.newStatus] || h.newStatus,
    }));
}

// ✅ Component timeline - ngang với node tròn đẹp
function StatusTimeline({
  status,
  receiptHistory,
  orderType,
}: {
  status: OrderStatus;
  receiptHistory?: Array<{oldStatus: string | null, newStatus: string, createdAt: string, updatedAt?: string}>;
  orderType?: "ONLINE" | "POS" | "UNKNOWN";
}) {
  // Convert receiptHistory sang format chuẩn
  const history: ReceiptHistory[] = (receiptHistory || []).map((h) => ({
    oldStatus: h.oldStatus,
    newStatus: h.newStatus || "",
    updatedAt: h.updatedAt || h.createdAt,
    createdAt: h.createdAt || "",
  }));

  // Build timeline
  const timeline = buildTimeline(history);

  // Format datetime: HH:mm DD/MM/YYYY
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${hours}:${minutes} ${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Get icon cho từng trạng thái
  const getIcon = (statusText: string) => {
    if (statusText.includes("Chờ xác nhận")) return "📋";
    if (statusText.includes("Đã xác nhận") || statusText.includes("Chuẩn bị")) return "✓";
    if (statusText.includes("Đang vận chuyển") || statusText.includes("Đang giao")) return "🚚";
    if (statusText.includes("Hoàn thành")) return "✓";
    if (statusText.includes("Đã huỷ")) return "✕";
    if (statusText.includes("Giao thất bại")) return "⚠";
    if (statusText.includes("Đã hoàn tiền")) return "💰";
    return "•";
  };

  // Get màu cho node
  const getNodeColor = (statusText: string, isLast: boolean) => {
    if (statusText.includes("Đã huỷ") || statusText.includes("Giao thất bại")) {
      return "bg-red-500";
    }
    if (statusText.includes("Đã hoàn tiền")) {
      return "bg-purple-500";
    }
    if (isLast) {
      return "bg-green-600"; // Trạng thái cuối cùng - màu xanh lá đậm
    }
    return "bg-blue-500"; // Các trạng thái đã qua - màu xanh dương
  };

  if (timeline.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        Chưa có lịch sử trạng thái
      </div>
    );
  }

  return (
    <div className="py-6 px-4">
      <div className="flex items-center justify-center relative">
        {timeline.map((item, idx) => {
          const isLast = idx === timeline.length - 1;
          const isReached = true; // Tất cả items trong timeline đều đã reached
          const nodeColor = getNodeColor(item.text, isLast);
          
          return (
            <div key={idx} className="flex items-center">
              {/* Node circle */}
              <div className="flex flex-col items-center relative z-10">
                <div
                  className={`w-14 h-14 rounded-full ${nodeColor} text-white flex items-center justify-center text-xl font-semibold shadow-lg transition-all`}
                >
                  {getIcon(item.text)}
                </div>
                
                {/* Label và timestamp */}
                <div className="flex flex-col items-center mt-3 min-w-[140px] max-w-[160px]">
                  <span className="font-medium text-sm text-gray-800 text-center">
                    {item.text}
                  </span>
                  <span className="text-xs text-gray-500 mt-1 text-center">
                    {formatDateTime(item.time)}
                  </span>
                </div>
              </div>

              {/* Connector line */}
              {idx < timeline.length - 1 && (
                <div className={`w-20 h-1 mx-2 ${isReached ? "bg-green-500" : "bg-gray-300"} transition-all`}></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConfirmDialog({
  state,
  onClose,
  onConfirm,
}: {
  state: ConfirmState;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!state.open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
        <h3 className="text-lg font-semibold">
          {state.title ?? "Vui lòng xác nhận"}
        </h3>
        <p className="text-sm text-gray-600">
          {state.message ??
            "Bạn có chắc chắn muốn tiếp tục thao tác này không?"}
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            className="btn bg-gray-100 hover:bg-gray-200 text-gray-800"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
  className="btn btn-primary"
  onClick={onConfirm}  // KHÔNG ĐƯỢC onClose() ở đây
>
  Đồng ý
</button>

        </div>
      </div>
    </div>
  );
}

function ProductSelectorModal({
                                  open,
                                  onClose,
                                  onSelect,
                              }: {
    open: boolean;
    onClose: () => void;
    onSelect: (p: MockProduct) => void;
}) {
    const [search, setSearch] = useState("");
    const [filterFormat, setFilterFormat] = useState<string>("");

    if (!open) return null;

    const filtered = MOCK_PRODUCTS.filter((p) => {
        const matchSearch =
            !search ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase());
        const matchFormat =
            !filterFormat || p.size.toLowerCase().includes(filterFormat);
        return matchSearch && matchFormat;
    });

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold">Danh sách sản phẩm</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 text-xl"
                    >
                        ×
                    </button>
                </div>

                <div className="px-6 py-4 space-y-3 border-b">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="form-label text-sm">Tìm kiếm sản phẩm...</label>
                            <input
                                className="input"
                                placeholder="Nhập tên sách hoặc ISBN"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="w-48">
                            <label className="form-label text-sm">Kích thước</label>
                            <select
                                className="select"
                                value={filterFormat}
                                onChange={(e) => setFilterFormat(e.target.value)}
                            >
                                <option value="">Tất cả</option>
                                <option value="13x20">13x20 cm</option>
                                <option value="16x24">16x24 cm</option>
                                <option value="10x18">10x18 cm</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto px-6 py-3">
                    <table className="table min-w-[700px]">
                        <thead>
                        <tr>
                            <th>Sản phẩm</th>
                            <th>ISBN</th>
                            <th>Màu / Kích cỡ</th>
                            <th>Giá</th>
                            <th>Tồn kho</th>
                            <th>Hành động</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map((p) => (
                            <tr key={p.bookDetailId}>
                                <td>{p.name}</td>
                                <td>{p.sku}</td>
                                <td>
                                    <div className="flex items-center gap-2">
                      <span
                          className="inline-block w-3 h-3 rounded-full border"
                          style={{ background: p.color.toLowerCase() }}
                      />
                                        <span>{p.size}</span>
                                    </div>
                                </td>
                                <td>{p.price.toLocaleString("vi-VN")} đ</td>
                                <td>{p.stock}</td>
                                <td>
                                    <button
                                        className="btn btn-primary text-sm"
                                        onClick={() => onSelect(p)}
                                    >
                                        Chọn
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="text-center text-gray-500 py-4 text-sm"
                                >
                                    Không tìm thấy sản phẩm phù hợp.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-3 border-t flex justify-end">
                    <button
                        className="btn bg-gray-100 hover:bg-gray-200 text-gray-800"
                        onClick={onClose}
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function BillDetailPage() {
    const params = useParams<{ id: string }>();
  const router = useRouter();

  const receiptId = Number(params.id);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [status, setStatus] = useState<OrderStatus>("PENDING");
  const [orderType, setOrderType] = useState<OrderType>("UNKNOWN");
  const [paymentType, setPaymentType] = useState<PaymentType>("CASH");
  const [hasShipping, setHasShipping] = useState<boolean>(false);
  const [showTimeline, setShowTimeline] = useState(false);

  const [items, setItems] = useState<BillItem[]>([]);
  const [customer, setCustomer] = useState<CustomerInfo>({
    code: null,
    name: "",
    email: null,
    phone: "",
    address: "",
    note: "",
  });

  // Ưu đãi (đợt giảm giá) & voucher (phiếu giảm giá)
  const [discount, setDiscount] = useState<number>(0);
  const [voucher, setVoucher] = useState<number>(0);

  // Phí ship & thành tiền
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // Ghi chú đơn hàng
  const [orderNote, setOrderNote] = useState<string>("");

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    action: null,
  });

  const [showProductModal, setShowProductModal] = useState(false);

  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [receiptHistory, setReceiptHistory] = useState<Array<{oldStatus: string | null, newStatus: string, createdAt: string, updatedAt?: string}>>([]);
  
  // ✅ State cho thông tin hoàn tiền
  const [refundInfo, setRefundInfo] = useState<RefundInfo | null>(null);

    
    const { id } = useParams();

    // ---------- MOCK DATA TỪ HÓA ĐƠN 23 ----------
    // Tự bật timeline khi trạng thái đơn thay đổi
    useEffect(() => {
    if (!receiptId || Number.isNaN(receiptId)) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const res = await BillService.getById(receiptId);
        const payments = await BillService.getPaymentHistory(receiptId);
        
        // ✅ Fetch history riêng, nếu lỗi thì bỏ qua (không làm hỏng toàn bộ)
        let history = [];
        try {
          history = await BillService.getHistory(receiptId);
        } catch (historyError) {
          console.warn("Không lấy được lịch sử đơn hàng:", historyError);
          history = [];
        }

        setStatus(res.status as OrderStatus);
        // Service đã chuyển "DIRECT" → "POS" rồi, nên chỉ cần kiểm tra "POS" hoặc "ONLINE"
        const detectedOrderType =
          res.orderType === "POS"
            ? "POS"
            : res.orderType === "ONLINE"
            ? "ONLINE"
            : "UNKNOWN";
        setOrderType(detectedOrderType);

        // Xác định phương thức thanh toán: ưu tiên lấy từ paymentHistory, nếu không có thì mới dựa vào orderType
        if (payments && payments.length > 0) {
          // Lấy paymentType từ paymentDetail đầu tiên
          const firstPayment = payments[0];
          const paymentTypeFromHistory = firstPayment.paymentType as PaymentType;
          if (paymentTypeFromHistory && ["CASH", "TRANSFER", "COD"].includes(paymentTypeFromHistory)) {
            setPaymentType(paymentTypeFromHistory);
          } else {
            // Fallback: dựa trên loại đơn hàng
            if (detectedOrderType === "ONLINE") {
              setPaymentType("COD");
            } else if (detectedOrderType === "POS") {
              setPaymentType("CASH");
            }
          }
        } else {
          // Không có payment history → dựa trên loại đơn hàng
          if (detectedOrderType === "ONLINE") {
            setPaymentType("COD");
          } else if (detectedOrderType === "POS") {
            setPaymentType("CASH");
          }
        }

        // ✅ MUA POS: Không có ship (chỉ bán tại quầy)
        // ✅ MUA ONLINE: Luôn có ship
        let detectedHasShipping = false;
        if (detectedOrderType === "POS") {
          // POS không có ship
          detectedHasShipping = false;
        } else if (detectedOrderType === "ONLINE") {
          // ONLINE luôn có ship
          detectedHasShipping = true;
        } else {
          // Fallback: dùng giá trị từ backend
          detectedHasShipping = res.hasShipping || false;
        }

        setHasShipping(detectedHasShipping);


        setItems(res.items);
        setCustomer(res.customer);

        setDiscount(res.discount);
        setVoucher(res.voucher ?? 0);
        setShippingFee(res.shippingFee);

        // Thành tiền cuối cùng từ BE (grandTotal)
        setAmountPaid(res.amountPaid);

        setOrderNote(res.orderNote ?? "");

        setPaymentHistory(payments);
        
        // ✅ Parse refund info từ note nếu status = WAITING_REFUND_INFO
        if (res.status === "WAITING_REFUND_INFO" && res.orderNote) {
          try {
            const note = res.orderNote;
            const jsonStart = note.indexOf('{"refundBankAccount"');
            if (jsonStart !== -1) {
              const jsonEnd = note.indexOf("}", jsonStart);
              if (jsonEnd !== -1) {
                const jsonStr = note.substring(jsonStart, jsonEnd + 1);
                const refundData = JSON.parse(jsonStr);
                setRefundInfo({
                  refundBankAccount: refundData.refundBankAccount || null,
                  refundBankName: refundData.refundBankName || null,
                  refundAccountHolder: refundData.refundAccountHolder || null,
                });
              }
            }
          } catch (e) {
            console.error("Lỗi parse refund info:", e);
            setRefundInfo(null);
          }
        } else {
          setRefundInfo(null);
        }
        
        // ✅ Parse receipt history từ API response
        // BillService.getHistory đã parse sẵn, chỉ cần map lại format
        try {
          if (Array.isArray(history) && history.length > 0) {
            const parsedHistory = history.map((h: any) => ({
              oldStatus: h.oldStatus || null,
              newStatus: h.newStatus || "",
              createdAt: h.createdAt || "",
              updatedAt: h.updatedAt || h.createdAt || "",
            }));
            console.log("Receipt history from API:", history);
            console.log("Parsed receipt history:", parsedHistory);
            setReceiptHistory(parsedHistory);
          } else {
            console.log("No history data received:", history);
            setReceiptHistory([]);
          }
        } catch (e) {
          console.error("Lỗi parse receipt history:", e);
          setReceiptHistory([]);
        }

        setShowTimeline(true);
      } catch (e) {
        console.error(e);
        setLoadError("Không lấy được dữ liệu hóa đơn");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [receiptId]);

    // ---------- TÍNH TIỀN ----------
    // Tổng tiền hàng: tính từ giá đã giảm (pricePerUnit)
    // ✅ SỬA: Dùng pricePerUnit (giá đã giảm) để tính tổng
    const subTotal = items.reduce(
        (sum, it) => sum + it.pricePerUnit * it.quantity,
        0
    );

    // ✅ THÊM: Tính tổng tiền gốc để so sánh
    const originalSubTotal = items.reduce(
        (sum, it) => sum + (it.originalPrice || it.pricePerUnit) * it.quantity,
        0
    );

    // Thành tiền: số tiền cuối cùng khách phải trả
    // ✅ SỬA: Bây giờ subTotal đã là giá đã giảm, chỉ cần cộng phí ship
    // ✅ discount có thể là giảm giá thêm (voucher) ngoài giảm giá combo
    const finalTotal = subTotal + shippingFee - discount;

    // ---------- HANDLERS ----------
    const handleChangeQuantity = (id: number, delta: 1 | -1) => {
        setItems((prev) =>
            prev
                .map((it) => {
                    if (it.id !== id) return it;
                    let nextQty = it.quantity + delta;
                    if (nextQty < 1) nextQty = 1;
                    if (nextQty > it.stock) nextQty = it.stock;
                    return { ...it, quantity: nextQty };
                })
                .filter((it) => it.quantity > 0)
        );
    };

    const handleRemoveItem = (id: number) => {
        setItems((prev) => prev.filter((it) => it.id !== id));
    };

    const handleSelectProduct = (p: MockProduct) => {
        setItems((prev) => {
            const idx = prev.findIndex(
                (it) => it.bookDetailId === p.bookDetailId
            );
            if (idx !== -1) {
                const clone = [...prev];
                const current = clone[idx];
                const nextQty =
                    current.quantity + 1 > p.stock ? p.stock : current.quantity + 1;
                clone[idx] = { ...current, quantity: nextQty };
                return clone;
            }
            const newItem: BillItem = {
                id: Date.now(), // mock id
                bookDetailId: p.bookDetailId,
                name: p.name,
                pricePerUnit: p.price,
                quantity: 1,
                stock: p.stock,
                image: "/default-book.png",
            };
            return [...prev, newItem];
        });

        setShowProductModal(false);
    };

    const handleOpenConfirm = (action: ConfirmState["action"]) => {
    if (!action) return;
    const base: ConfirmState = { open: true, action };

    if (action === "NEXT") {
      setConfirmState({
        ...base,
        title: "Chuyển trạng thái đơn hàng",
        message: "Bạn có chắc chắn xác nhận?",
      });
    } else if (action === "CANCEL") {
      const cancelMsg = paymentType === "TRANSFER"
        ? "Hủy đơn hàng này?\n\nĐơn chuyển khoản đã thanh toán trước, sẽ chuyển sang trạng thái 'Chờ thông tin hoàn tiền' để khách nhập STK hoàn tiền."
        : "Đơn sẽ bị hủy và không thể tiếp tục xử lý. Tiếp tục?";
      setConfirmState({
        ...base,
        title: "Hủy đơn hàng",
        message: cancelMsg,
      });
    } else if (action === "FAILED") {
      const failedMsg = paymentType === "TRANSFER"
        ? "Xác nhận giao hàng thất bại?\n\nĐơn chuyển khoản đã thanh toán trước, sẽ chuyển sang trạng thái 'Chờ thông tin hoàn tiền' để khách nhập STK hoàn tiền."
        : "Đơn sẽ được đánh dấu là giao thất bại. Tiếp tục?";
      setConfirmState({
        ...base,
        title: "Xác nhận giao hàng thất bại",
        message: failedMsg,
      });
    } else if (action === "REFUND_CONFIRM") {
      const refundMsg = refundInfo?.refundBankAccount
        ? `Xác nhận đã hoàn tiền cho khách hàng?\n\nThông tin hoàn tiền:\n- STK: ${refundInfo.refundBankAccount}\n- Ngân hàng: ${refundInfo.refundBankName || "—"}\n- Chủ TK: ${refundInfo.refundAccountHolder || "—"}\n\nĐơn sẽ chuyển sang trạng thái "Đã hoàn tiền" (REFUNDED).`
        : "Chưa có thông tin hoàn tiền từ khách hàng. Không thể xác nhận hoàn tiền.";
      setConfirmState({
        ...base,
        title: "Xác nhận đã hoàn tiền",
        message: refundMsg,
      });
    } else {
      setConfirmState({
        ...base,
        title: "Hoàn tiền đơn hàng",
        message:
          "Xác nhận hoàn tiền đơn hàng?",
      });
    }
  };

  // ✅ Function để fetch lại receipt history
  const refreshReceiptHistory = async () => {
    if (!receiptId || Number.isNaN(receiptId)) return;
    try {
      const history = await BillService.getHistory(receiptId);
      if (Array.isArray(history) && history.length > 0) {
        const parsedHistory = history.map((h: any) => ({
          oldStatus: h.oldStatus || null,
          newStatus: h.newStatus || "",
          createdAt: h.createdAt || "",
          updatedAt: h.updatedAt || h.createdAt || "",
        }));
        setReceiptHistory(parsedHistory);
      }
    } catch (e) {
      console.error("Lỗi refresh receipt history:", e);
    }
  };

  const handleConfirmAction = async () => {
  if (!confirmState.action) return;
  if (!receiptId || Number.isNaN(receiptId)) return;
  
  // ✅ Prevent double click: nếu đang update thì return ngay
  if (isUpdatingStatus) {
    console.warn("Đang xử lý, vui lòng đợi...");
    return;
  }

  try {
    setIsUpdatingStatus(true);

    if (confirmState.action === "NEXT") {
      const next = getNextStatus(status, {
        orderType,
        paymentType,
        hasShipping,
      });

      await BillService.updateStatus(receiptId, next);
      setStatus(next);
      // ✅ Fetch lại history để timeline tự động cập nhật
      await refreshReceiptHistory();
    }

    // =========================
    // CANCEL — chỉ khi còn PENDING / AUTHORIZED
    // ✅ BE tự động xử lý: Nếu là TRANSFER → chuyển WAITING_REFUND_INFO, nếu là COD → CANCELLED
    // =========================
    else if (confirmState.action === "CANCEL") {
      // ✅ Prevent double click: disable button ngay lập tức
      if (isUpdatingStatus) return;
      
      // ✅ BE tự động xử lý: Gọi CANCELLED, BE sẽ tự động chuyển WAITING_REFUND_INFO nếu là TRANSFER
      await BillService.updateStatus(receiptId, "CANCELLED");
      // ✅ Reload để lấy status mới (có thể là CANCELLED hoặc WAITING_REFUND_INFO)
      window.location.reload();
    }

    // =========================
    // FAILED — chỉ khi đang giao
    // ✅ Nếu shop đánh dấu FAILED cho đơn TRANSFER → chuyển WAITING_REFUND_INFO (để khách nhập STK)
    // ✅ Nếu shop đánh dấu FAILED cho đơn COD → chỉ FAILED (không cần hoàn tiền)
    // =========================
    else if (confirmState.action === "FAILED") {
      if (status !== "IN_TRANSIT") {
        alert("Chỉ có thể đánh dấu thất bại khi đơn đang giao.");
        return;
      }

      // ✅ BE tự động xử lý: Nếu là TRANSFER → chuyển WAITING_REFUND_INFO, nếu là COD → FAILED
      await BillService.updateStatus(receiptId, "FAILED");
      // ✅ Reload để lấy status mới (có thể là FAILED hoặc WAITING_REFUND_INFO)
      window.location.reload();
    }

    // =========================
    // REFUND_CONFIRM — Xác nhận hoàn tiền: WAITING_REFUND_INFO → REFUNDED
    // =========================
    else if (confirmState.action === "REFUND_CONFIRM") {
      if (status !== "WAITING_REFUND_INFO") {
        alert("Chỉ có thể xác nhận hoàn tiền khi đơn ở trạng thái 'Chờ thông tin hoàn tiền'.");
        return;
      }

      if (!refundInfo?.refundBankAccount) {
        alert("Chưa có thông tin hoàn tiền từ khách hàng. Không thể xác nhận hoàn tiền.");
        return;
      }

      await BillService.updateStatus(receiptId, "REFUNDED");
      setStatus("REFUNDED");
      // ✅ Fetch lại history để timeline tự động cập nhật
      await refreshReceiptHistory();
      // ✅ Reload để cập nhật UI
      alert("Đã xác nhận hoàn tiền thành công! Đơn đã chuyển sang trạng thái 'Đã hoàn tiền'.");
      window.location.reload();
    }

  } catch (e) {
    console.error(e);
    alert("Có lỗi khi cập nhật trạng thái đơn hàng.");
  } finally {
    setIsUpdatingStatus(false);
    setConfirmState({ open: false, action: null }); // <--- ĐÓNG POPUP TẠI ĐÂY
  }
};

    const disableNext =
        status === "PAID" ||
        status === "CANCELLED" ||
        status === "FAILED" ||
        status === "REFUNDED" ||
        status === "WAITING_REFUND_INFO";

    return (
        <div className="space-y-6 p-4">
            <h2 className="section-title">Chi tiết hóa đơn — HD{id}</h2>

            {/* Điều hướng */}
            <div>
                <button
                    onClick={() => router.back()}
                    className="btn bg-gray-200 hover:bg-gray-300 text-sm"
                >
                    ← Quay lại
                </button>
            </div>

           {/* TRẠNG THÁI ĐƠN HÀNG */}
      <div className="card space-y-6">
        <h3 className="card-title">Trạng thái đơn hàng</h3>

        {showTimeline && (
          <div className="flex justify-center pt-2">
            <StatusTimeline status={status} receiptHistory={receiptHistory} orderType={orderType} />
          </div>
        )}

        {/* Nút hành động */}
        <div className="flex gap-3 pt-4 flex-wrap">

  {/* NEXT - POS không có nút này vì đã hoàn thành luôn */}
  {orderType !== "POS" && ["PENDING", "AUTHORIZED", "IN_TRANSIT"].includes(status) && (
  <button
    className="btn btn-primary"
    disabled={isUpdatingStatus}
    onClick={() => handleOpenConfirm("NEXT")}
  >
    {getNextActionLabel(status, { orderType, paymentType, hasShipping }) ??
      "Tiếp tục"}
  </button>
)}


  {/* CANCEL chỉ cho PENDING + AUTHORIZED, không cho POS (đã hoàn thành) */}
  {orderType !== "POS" && (status === "PENDING" || status === "AUTHORIZED") && (
    <button
      className="btn bg-pink-600 text-white hover:bg-pink-700"
      disabled={isUpdatingStatus}
      onClick={() => handleOpenConfirm("CANCEL")}
    >
      Huỷ đơn
    </button>
  )}

  {/* FAILED xuất hiện khi đang giao (IN_TRANSIT) */}
  {status === "IN_TRANSIT" && (
    <button
      className="btn bg-red-500 text-white hover:bg-red-600"
      disabled={isUpdatingStatus}
      onClick={() => handleOpenConfirm("FAILED")}
    >
      Xác nhận giao hàng thất bại
    </button>
  )}

  {/* ✅ Nút "Xác nhận đã hoàn tiền" cho đơn WAITING_REFUND_INFO */}
  {status === "WAITING_REFUND_INFO" && refundInfo?.refundBankAccount && (
    <button
      className="btn bg-green-600 text-white hover:bg-green-700"
      disabled={isUpdatingStatus}
      onClick={() => handleOpenConfirm("REFUND_CONFIRM")}
    >
      ✅ Xác nhận đã hoàn tiền
    </button>
  )}

</div>

        {/* ✅ Hiển thị thông tin hoàn tiền khi status = WAITING_REFUND_INFO */}
        {status === "WAITING_REFUND_INFO" && (
          <div className="mt-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
            <h4 className="font-bold text-yellow-800 mb-4 text-lg">📝 Thông tin hoàn tiền khách nhập</h4>
            {refundInfo?.refundBankAccount ? (
              <div className="bg-white rounded-lg p-4 border border-yellow-200 space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Số tài khoản:</label>
                  <p className="text-gray-800 font-medium">{refundInfo.refundBankAccount}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Tên ngân hàng:</label>
                  <p className="text-gray-800 font-medium">{refundInfo.refundBankName || "—"}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Tên chủ tài khoản:</label>
                  <p className="text-gray-800 font-medium">{refundInfo.refundAccountHolder || "—"}</p>
                </div>
              </div>
            ) : (
              <p className="text-yellow-700 italic text-center py-4">
                ⏳ Đang chờ khách hàng nhập thông tin tài khoản hoàn tiền...
              </p>
            )}
          </div>
        )}

      </div>
            {/* SẢN PHẨM TRONG ĐƠN */}
            <div className="border rounded-lg bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Sản phẩm trong đơn</h3>

                    {/* Theo yêu cầu: bỏ nút thêm sản phẩm, bảng chỉ hiển thị, không chỉnh sửa */}
                </div>

                <div className="overflow-x-auto">
                    <table className="table w-full text-sm table-fixed">
                        <thead className="bg-gray-100">
                        <tr>
                            <th className="px-3 py-2 text-center w-16">STT</th>
                            <th className="px-3 py-2 text-center">Ảnh</th>
                            <th className="px-3 py-2 text-left">Tên sản phẩm</th>
                            <th className="px-3 py-2 text-center">Giá</th>
                            <th className="px-3 py-2 text-center">Số lượng</th>
                            <th className="px-3 py-2 text-center">Thành tiền</th>
                        </tr>
                        </thead>

                        <tbody>
                        {items.map((item, index) => (
                            <tr key={item.id} className="border-b">
                                <td className="px-3 py-2 text-center align-middle">
                                  {index + 1}
                                </td>

                                <td className="px-3 py-2 text-center">
                                  <img
                                    src={item.image}
                                    className="w-12 h-12 rounded border mx-auto object-cover"
                                  />
                                </td>

                                <td className="px-3 py-2 align-middle">
                                  <div className="flex items-center h-full">
                                    <span>{item.name}</span>
                                  </div>
                                </td>

                                <td className="px-3 py-2 text-center">
                                    <div className="flex flex-col items-center">
                                        {/* ✅ Giá đã giảm (ưu tiên pricePerUnit) */}
                                        <div className="text-red-600 font-semibold">
                                            {item.pricePerUnit.toLocaleString("vi-VN")} đ
                                        </div>
                                        {/* ✅ Giá gốc bị gạch (nếu có giảm giá) */}
                                        {item.originalPrice && item.pricePerUnit < item.originalPrice && (
                                            <div className="text-gray-500 text-xs line-through">
                                                {item.originalPrice.toLocaleString("vi-VN")} đ
                                            </div>
                                        )}
                                    </div>
                                </td>

                                <td className="px-3 py-2 text-center">
                                  {/* Số lượng fix cứng, chỉ hiển thị, không thay đổi */}
                                  <span className="w-8 text-center inline-block">
                                    {item.quantity}
                                  </span>
                                </td>

                                <td className="px-3 py-2 text-center font-medium">
                                    <div className="flex flex-col items-center">
                                        {/* ✅ Thành tiền đã giảm */}
                                        <div className="text-red-600 font-bold">
                                            {(item.pricePerUnit * item.quantity).toLocaleString("vi-VN")} đ
                                        </div>
                                        {/* ✅ Thành tiền gốc bị gạch (nếu có giảm giá) */}
                                        {item.originalPrice && item.pricePerUnit < item.originalPrice && (
                                            <div className="text-gray-500 text-xs line-through">
                                                {(item.originalPrice * item.quantity).toLocaleString("vi-VN")} đ
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {items.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-4 text-gray-500">
                                    Chưa có sản phẩm nào trong đơn.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>


            {/* LAYOUT CHÍNH */}
            {/* LAYOUT CHÍNH */}
            <div className="space-y-6">

                {/* HÀNG: THÔNG TIN ĐƠN HÀNG + THÔNG TIN KHÁCH HÀNG */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* CARD TRÁI — THÔNG TIN ĐƠN HÀNG */}
                    <div className="border rounded-lg bg-white p-5 shadow-sm">
                      <h3 className="text-lg font-semibold mb-4">
                        Thông tin đơn hàng
                      </h3>

                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-gray-600">Mã đơn hàng:</span>
                          <span className="font-medium">HD{id}</span>
                        </div>

                        <div className="flex justify-between border-b pb-2">
                          <span className="text-gray-600">Loại đơn hàng:</span>
                          <span className="font-medium">
                            {orderType === "POS" ? "Tại quầy" : orderType === "ONLINE" ? "Trực tuyến" : "Không xác định"}
                          </span>
                        </div>

                        <div className="flex justify-between border-b pb-2">
                          <span className="text-gray-600">
                            Phương thức thanh toán:
                          </span>
                          <span className="font-medium">
                            {paymentType === "CASH"
                              ? "Tiền mặt"
                              : paymentType === "TRANSFER"
                              ? "Chuyển khoản"
                              : paymentType === "COD"
                              ? "COD"
                              : "Tiền mặt"}
                          </span>
                        </div>

                        {/* Tổng tiền hàng: tổng giá đã giảm */}
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-gray-600">Tổng tiền hàng:</span>
                          <div className="text-right">
                            <div className="font-semibold text-red-600">
                              {subTotal.toLocaleString("vi-VN")} đ
                            </div>
                            {originalSubTotal > subTotal && (
                              <div className="text-gray-500 text-xs line-through">
                                {originalSubTotal.toLocaleString("vi-VN")} đ
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Giảm giá - luôn hiển thị */}
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-gray-600">Giảm giá:</span>
                          <span className="font-semibold text-red-600">
                            {discount > 0 
                              ? `-${discount.toLocaleString("vi-VN")} đ`
                              : "0 đ"}
                          </span>
                        </div>

                        <div className="flex justify-between border-b pb-2">
                          <span className="text-gray-600">Phí ship:</span>
                          <span className="font-semibold">
                            {shippingFee.toLocaleString("vi-VN")} đ
                          </span>
                        </div>

                        <div className="flex justify-between border-b pb-2">
                          <span className="text-gray-600">Thành tiền:</span>
                          <span className="font-semibold text-red-600">
                            {finalTotal.toLocaleString("vi-VN")} đ
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-600">Ghi chú đơn hàng:</span>
                          <span className="text-right max-w-[55%]">
                            {orderNote && orderNote.trim() !== ""
                              ? orderNote
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* CARD PHẢI — THÔNG TIN KHÁCH HÀNG */}
                    <div className="border rounded-lg bg-white p-5 shadow-sm">
                      <h3 className="text-lg font-semibold mb-4">
                        Thông tin khách hàng
                      </h3>

                      {/* Card chỉ hiển thị thông tin, không cho chỉnh sửa */}
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-gray-600">Mã KH:</span>
                          <span className="font-medium">
                            {customer.code ?? "-"}
                          </span>
                        </div>

                        <div className="flex justify-between border-b pb-2">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium">
                            {customer.email && customer.email.trim() !== ""
                              ? customer.email
                              : "-"}
                          </span>
                        </div>

                        <div className="flex justify-between border-b pb-2">
                          <span className="text-gray-600">Tên khách hàng:</span>
                          <span className="font-medium">
                            {customer.name || "-"}
                          </span>
                        </div>

                        <div className="flex justify-between border-b pb-2">
                          <span className="text-gray-600">Số điện thoại:</span>
                          <span className="font-medium">
                            {customer.phone || "-"}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-600">Địa chỉ:</span>
                          <span className="font-medium text-right max-w-[60%]">
                            {customer.address || "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                </div>

            {/*    /!* HÓA ĐƠN *!/*/}
            {/*    <div className="border rounded-lg bg-white p-5 shadow-sm text-sm space-y-3">*/}
            {/*        <h3 className="text-lg font-semibold mb-2">Hóa đơn</h3>*/}

            {/*        <div className="flex justify-between">*/}
            {/*            <span>Tạm tính:</span>*/}
            {/*            <b>{subTotal.toLocaleString("vi-VN")} đ</b>*/}
            {/*        </div>*/}

            {/*        <div className="flex justify-between items-center">*/}
            {/*            <span>Giảm giá:</span>*/}
            {/*            <input*/}
            {/*                type="number"*/}
            {/*                className="input h-8 w-28 text-right"*/}
            {/*                value={discount}*/}
            {/*                onChange={(e) => setDiscount(Number(e.target.value) || 0)}*/}
            {/*            />*/}
            {/*        </div>*/}

            {/*        <div className="flex justify-between items-center">*/}
            {/*            <span>Phí vận chuyển:</span>*/}
            {/*            <input*/}
            {/*                type="number"*/}
            {/*                className="input h-8 w-28 text-right"*/}
            {/*                value={shippingFee}*/}
            {/*                onChange={(e) => setShippingFee(Number(e.target.value) || 0)}*/}
            {/*            />*/}
            {/*        </div>*/}

            {/*        <div className="flex justify-between">*/}
            {/*            <span>Thuế VAT ({taxPercent}%):</span>*/}
            {/*            <b>{taxAmount.toLocaleString("vi-VN")} đ</b>*/}
            {/*        </div>*/}

            {/*        <div className="border-t my-2"></div>*/}

            {/*        <div className="flex justify-between text-base font-semibold">*/}
            {/*            <span>Tổng cộng:</span>*/}
            {/*            <span className="text-red-600">*/}
            {/*    {finalTotal.toLocaleString("vi-VN")} đ*/}
            {/*</span>*/}
            {/*        </div>*/}

            {/*        <div className="flex justify-between">*/}
            {/*            <span>Đã thanh toán:</span>*/}
            {/*            <span className="text-green-600 font-semibold">*/}
            {/*    {amountPaid.toLocaleString("vi-VN")} đ*/}
            {/*</span>*/}
            {/*        </div>*/}

            {/*        <div className="flex justify-between">*/}
            {/*            <span>Cần trả thêm:</span>*/}
            {/*            <span className="font-semibold">*/}
            {/*    {needToPay.toLocaleString("vi-VN")} đ*/}
            {/*</span>*/}
            {/*        </div>*/}

            {/*        <button className="btn btn-primary w-full mt-2 text-sm">*/}
            {/*            LƯU THAY ĐỔI*/}
            {/*        </button>*/}
            {/*    </div>*/}
            </div>

            {/* MODALS */}
            <ConfirmDialog
                state={confirmState}
                onClose={() =>
                    setConfirmState((s) => ({ ...s, open: false }))
                }
                onConfirm={handleConfirmAction}
            />

            <ProductSelectorModal
                open={showProductModal}
                onClose={() => setShowProductModal(false)}
                onSelect={handleSelectProduct}
            />
        </div>
    );
}
