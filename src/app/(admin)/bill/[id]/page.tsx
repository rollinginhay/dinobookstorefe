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
  | "UNKNOWN";

type OrderType = "POS" | "ONLINE" | "UNKNOWN";

type PaymentType = "CASH" | "TRANSFER" | "COD";

interface BillItem {
    id: number; // id của receiptDetail
    bookDetailId: number;
    name: string;
    pricePerUnit: number;
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
  action: "NEXT" | "CANCEL" | "REFUND" | "FAILED" | null;
  title?: string;
  message?: string;
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
        <span className="badge bg-orange-100 text-orange-600">
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
        <span className="badge bg-red-100 text-red-600">Giao thất bại</span>
      );
    case "REFUNDED":
      return (
        <span className="badge bg-gray-100 text-gray-600">Hoàn tiền</span>
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

  // POS có ship → đi full flow
  if (orderType === "POS" && hasShipping === true) {
    if (current === "PENDING") return "AUTHORIZED";
    if (current === "AUTHORIZED") return "IN_TRANSIT";
    if (current === "IN_TRANSIT") return "PAID";
    return current;
  }

  // POS không ship → PENDING → PAID
  if (orderType === "POS" && hasShipping === false) {
    if (current === "PENDING") return "PAID";
    return current;
  }

  // ONLINE (luôn ship)
  if (current === "PENDING") return "AUTHORIZED";
  if (current === "AUTHORIZED") return "IN_TRANSIT";
  if (current === "IN_TRANSIT") return "PAID";

  return current;
}
function getNextActionLabel(
  current: OrderStatus,
  opts: { orderType: OrderType; paymentType: PaymentType; hasShipping: boolean }
): string | null {
  const { paymentType, hasShipping } = opts;

  if (!hasShipping) {
    if (current === "PENDING") {
      return paymentType === "CASH"
        ? "Xác nhận & Thanh toán"
        : "Xác nhận đơn & Hoàn tất thanh toán";
    }
    return null;
  }

  if (current === "PENDING") {
    if (paymentType === "COD") return "Xác nhận đơn COD";
    return "Xác nhận đơn đã thanh toán";
  }

  if (current === "AUTHORIZED") {
    return "Giao cho vận chuyển";
  }

  if (current === "IN_TRANSIT") {
    return "Xác nhận giao thành công";
  }

  return null;
}


function StatusTimeline({
  status,
  hasShipping,
}: {
  status: OrderStatus;
  hasShipping: boolean;
}) {
  const LABEL: Record<OrderStatus, string> = {
    PENDING: "Chờ xác nhận",
    AUTHORIZED: "Đã xác nhận",
    IN_TRANSIT: "Đang vận chuyển",
    PAID: "Hoàn thành",
    FAILED: "Giao thất bại",
    CANCELLED: "Đã hủy",
    REFUNDED: "Hoàn tiền",
    UNKNOWN: "Không xác định",
  };

  // ================== SUY LUẬN FLOW THEO LUỒNG M ĐÃ NÓI ==================
  function buildTimeline(st: OrderStatus, hasShipping: boolean): OrderStatus[] {
  // Đơn không ship: PENDING -> PAID
  if (!hasShipping) {
    switch (st) {
      case "PENDING":
        return ["PENDING"];
      case "PAID":
        return ["PENDING", "PAID"];
      case "CANCELLED":
        // chỉ có thể hủy khi còn pending -> ["PENDING", "CANCELLED"]
        return ["PENDING", "CANCELLED"];
      case "REFUNDED":
        // chắc chắn đã từng PAID rồi mới refund
        return ["PENDING", "PAID", "REFUNDED"];
      default:
        return ["PENDING", st];
    }
  }

  // Có ship: PENDING -> AUTHORIZED -> IN_TRANSIT -> PAID
  switch (st) {
    case "PENDING":
      return ["PENDING"];

    case "AUTHORIZED":
      return ["PENDING", "AUTHORIZED"];

    case "IN_TRANSIT":
      return ["PENDING", "AUTHORIZED", "IN_TRANSIT"];

    case "PAID":
      return ["PENDING", "AUTHORIZED", "IN_TRANSIT", "PAID"];

    case "FAILED":
      // chỉ nhảy từ IN_TRANSIT, không bao giờ qua PAID
      return ["PENDING", "AUTHORIZED", "IN_TRANSIT", "FAILED"];

    case "CANCELLED":
      // FE chỉ cho hủy khi PENDING hoặc AUTHORIZED
      return ["PENDING", "AUTHORIZED", "CANCELLED"];

    case "REFUNDED":
      // 👉 luôn show: Đang VC -> Thất bại -> Hoàn tiền
      return [
        "PENDING",
        "AUTHORIZED",
        "IN_TRANSIT",
        "FAILED",
        "REFUNDED",
      ];

    default:
      return ["PENDING"];
  }
}


  const steps = buildTimeline(status, hasShipping);


  const getColor = (st: OrderStatus) => {
    if (st === "FAILED") return "bg-red-600";
    if (st === "CANCELLED") return "bg-red-500";
    if (st === "REFUNDED") return "bg-gray-800";
    return "bg-blue-600";
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      {steps.map((st, i) => (
        <div key={st} className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full text-white flex items-center justify-center ${getColor(
              st
            )}`}
          >
            ✓
          </div>

          <span className="font-medium">{LABEL[st]}</span>

          {i < steps.length - 1 && (
            <div className="w-10 h-px bg-gray-300"></div>
          )}
        </div>
      ))}
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
  
  // Return request state - parse từ receipt.note theo quy ước log
  const [returnRequest, setReturnRequest] = useState<{
    reason: string;
    createdAt: string;
    status: "REQUESTED" | "APPROVED" | "REJECTED";
    rejectedReason?: string;
    rejectedDate?: string;
  } | null>(null);
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  
  // Parse return request từ note (format: RETURN_REQUEST:{reason} hoặc RETURN_APPROVED, RETURN_REJECTED:{reason}|{date})
  const parseReturnRequestFromNote = (note: string, receiptCreatedAt?: string, receiptUpdatedAt?: string): typeof returnRequest => {
    if (!note) return null;
    // Tìm RETURN_REQUEST:{reason} - lấy ngày từ dòng RETURN_REQUEST (nếu có timestamp) hoặc dùng receiptUpdatedAt
    const requestMatch = note.match(/RETURN_REQUEST:(.+?)(?:\n|$)/);
    if (requestMatch) {
      const reason = requestMatch[1].trim();
      // Tìm ngày yêu cầu - có thể parse từ note hoặc dùng receiptUpdatedAt khi có RETURN_REQUEST
      // Nếu có RETURN_REQUEST, ngày yêu cầu là lúc note được update (receiptUpdatedAt)
      // Hoặc có thể parse từ format RETURN_REQUEST:{reason}|{date} nếu có
      let requestDate = receiptUpdatedAt || receiptCreatedAt || "";
      const requestWithDateMatch = note.match(/RETURN_REQUEST:(.+?)\|(.+?)(?:\n|$)/);
      if (requestWithDateMatch) {
        requestDate = requestWithDateMatch[2].trim();
      }
      
      // Kiểm tra đã được duyệt/từ chối chưa
      if (note.includes("RETURN_APPROVED")) {
        return { reason, createdAt: requestDate, status: "APPROVED" };
      }
      // Parse RETURN_REJECTED:{reason}|{date}
      const rejectedMatch = note.match(/RETURN_REJECTED:([^|]+)\|(.+)/);
      if (rejectedMatch) {
        return { 
          reason, 
          createdAt: requestDate, // Ngày yêu cầu trả hàng (không phải ngày từ chối)
          status: "REJECTED",
          rejectedReason: rejectedMatch[1].trim(),
          rejectedDate: rejectedMatch[2].trim(),
        };
      }
      // Fallback: chỉ có RETURN_REJECTED không có format đầy đủ
      if (note.includes("RETURN_REJECTED")) {
        return { reason, createdAt: requestDate, status: "REJECTED" };
      }
      return { reason, createdAt: requestDate, status: "REQUESTED" };
    }
    return null;
  };

    
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

        let detectedHasShipping = res.hasShipping;

if (res.orderType === "DIRECT") {
  if (["AUTHORIZED", "IN_TRANSIT", "PAID", "FAILED", "REFUNDED"].includes(res.status)) {
    detectedHasShipping = true;
  }
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
        
        // Parse return request từ note (theo quy ước: RETURN_REQUEST, RETURN_APPROVED, RETURN_REJECTED)
        // Lấy createdAt và updatedAt từ receipt để hiển thị ngày yêu cầu
        const receiptCreatedAt = res.createdAt || res.orderDate || "";
        const receiptUpdatedAt = res.updatedAt || res.orderDate || "";
        const parsedReturnRequest = parseReturnRequestFromNote(res.orderNote ?? "", receiptCreatedAt, receiptUpdatedAt);
        setReturnRequest(parsedReturnRequest);

        setPaymentHistory(payments);

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
    // Tổng tiền hàng: chỉ tính tiền sách, chưa trừ giảm giá / voucher / cộng phí ship
    const subTotal = items.reduce(
        (sum, it) => sum + it.pricePerUnit * it.quantity,
        0
    );

    // Thành tiền: số tiền cuối cùng khách phải trả
    const finalTotal = subTotal + shippingFee - discount - voucher;

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
      setConfirmState({
        ...base,
        title: "Hủy đơn hàng",
        message: "Đơn sẽ bị hủy và không thể tiếp tục xử lý. Tiếp tục?",
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

    const handleConfirmAction = async () => {
  if (!confirmState.action) return;
  if (!receiptId || Number.isNaN(receiptId)) return;

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
    }

    // =========================
    // CANCEL — chỉ khi còn PENDING / AUTHORIZED
    // =========================
    else if (confirmState.action === "CANCEL") {
      await BillService.updateStatus(receiptId, "CANCELLED");
      setStatus("CANCELLED");
    }

    // =========================
    // FAILED — chỉ khi đang giao
    // =========================
    else if (confirmState.action === "FAILED") {
      if (status !== "IN_TRANSIT") {
        alert("Chỉ có thể đánh dấu thất bại khi đơn đang giao.");
        return;
      }

      await BillService.updateStatus(receiptId, "FAILED");
      setStatus("FAILED");
    }

    // =========================
    // REFUND — chỉ cho prepaid (không COD) + PAID hoặc FAILED + return request đã APPROVED
    // =========================
    else if (confirmState.action === "REFUND") {
      if (paymentType === "COD") {
        alert("Đơn COD không thể hoàn tiền.");
        return;
      }

      if (status !== "PAID" && status !== "FAILED") {
        alert("Chỉ hoàn tiền cho đơn đã thanh toán hoặc giao thất bại.");
        return;
      }
      
      // Kiểm tra return request đã được duyệt chưa
      if (!returnRequest || returnRequest.status !== "APPROVED") {
        alert("Chỉ có thể hoàn tiền sau khi đã duyệt yêu cầu trả hàng.");
        return;
      }

      // Ghi log REFUND_AFTER_RETURN vào receipt.note (theo quy ước)
      const currentNote = orderNote || "";
      const newNote = currentNote + (currentNote ? "\n" : "") + "REFUND_AFTER_RETURN";
      await BillService.updateReceipt(receiptId, {
        attributes: { note: newNote },
      });
      setOrderNote(newNote);
      
      // Đổi order_status thành REFUNDED (theo spec: chỉ đổi khi hoàn tiền)
      await BillService.updateStatus(receiptId, "REFUNDED");
      setStatus("REFUNDED");
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
        status === "REFUNDED";

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

        <div className="flex justify-center">{renderStatusBadge(status)}</div>

        {showTimeline && (
          <div className="flex justify-center pt-2">
            <StatusTimeline status={status} hasShipping={hasShipping} />
          </div>
        )}

        {/* Nút hành động */}
        <div className="flex gap-3 pt-4 flex-wrap">

  {/* NEXT */}
  {["PENDING", "AUTHORIZED", "IN_TRANSIT"].includes(status) && (
  <button
    className="btn btn-primary"
    disabled={isUpdatingStatus}
    onClick={() => handleOpenConfirm("NEXT")}
  >
    {getNextActionLabel(status, { orderType, paymentType, hasShipping }) ??
      "Tiếp tục"}
  </button>
)}


  {/* CANCEL chỉ cho PENDING + AUTHORIZED */}
  {(status === "PENDING" || status === "AUTHORIZED") && (
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

  {/* REFUND: chỉ prepaid - chỉ hiện khi return request đã được APPROVED */}
  {(status === "PAID" || status === "FAILED") &&
    paymentType !== "COD" &&
    returnRequest?.status === "APPROVED" && (
      <button
        className="btn bg-gray-800 text-white hover:bg-black"
        disabled={isUpdatingStatus}
        onClick={() => handleOpenConfirm("REFUND")}
      >
        Hoàn tiền
      </button>
    )}

</div>

        {/* YÊU CẦU TRẢ HÀNG (theo spec: admin phải duyệt trước khi hoàn tiền) */}
        {returnRequest && returnRequest.status === "REQUESTED" && (
          <div className="card border-orange-200 bg-orange-50 mt-4">
            <h3 className="card-title text-orange-800">Yêu cầu trả hàng</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Lý do trả hàng:</span>
                <p className="mt-1 text-gray-800 bg-white p-3 rounded border border-orange-200">
                  {returnRequest.reason}
                </p>
              </div>
              <div className="text-gray-600">
                Ngày yêu cầu: {returnRequest.createdAt ? new Date(returnRequest.createdAt).toLocaleString("vi-VN") : "Không xác định"}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  className="btn bg-green-600 text-white hover:bg-green-700"
                  disabled={isProcessingReturn}
                  onClick={async () => {
                    if (!receiptId || Number.isNaN(receiptId) || !returnRequest) return;
                    try {
                      setIsProcessingReturn(true);
                      // Ghi log RETURN_APPROVED vào receipt.note (theo quy ước)
                      const currentNote = orderNote || "";
                      const newNote = currentNote + (currentNote ? "\n" : "") + "RETURN_APPROVED";
                      await BillService.updateReceipt(receiptId, {
                        attributes: { note: newNote },
                      });
                      setOrderNote(newNote);
                      setReturnRequest({ ...returnRequest, status: "APPROVED" });
                      // Sau khi duyệt, nút "Hoàn tiền" sẽ xuất hiện (không đổi status ngay)
                    } catch (e) {
                      console.error(e);
                      alert("Có lỗi khi duyệt yêu cầu trả hàng.");
                    } finally {
                      setIsProcessingReturn(false);
                    }
                  }}
                >
                  Chấp nhận
                </button>
                <button
                  className="btn bg-red-600 text-white hover:bg-red-700"
                  disabled={isProcessingReturn}
                  onClick={() => {
                    setShowRejectModal(true);
                    setRejectReason("");
                  }}
                >
                  Từ chối trả hàng
                </button>
              </div>
            </div>
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
                                    {item.pricePerUnit.toLocaleString("vi-VN")} đ
                                </td>

                                <td className="px-3 py-2 text-center">
                                  {/* Số lượng fix cứng, chỉ hiển thị, không thay đổi */}
                                  <span className="w-8 text-center inline-block">
                                    {item.quantity}
                                  </span>
                                </td>

                                <td className="px-3 py-2 text-center font-medium">
                                    {(item.pricePerUnit * item.quantity).toLocaleString("vi-VN")} đ
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

                        {/* Tổng tiền hàng: tổng giá sách, chưa tính giảm giá / ship */}
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-gray-600">Tổng tiền hàng:</span>
                          <span className="font-semibold">
                            {subTotal.toLocaleString("vi-VN")} đ
                          </span>
                        </div>

                        {/* Giảm giá (tổng discount + voucher) - luôn hiển thị */}
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-gray-600">Giảm giá:</span>
                          <span className="font-semibold text-red-600">
                            {(discount + voucher) > 0 
                              ? `-${(discount + voucher).toLocaleString("vi-VN")} đ`
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

            {/* Modal từ chối trả hàng */}
            {showRejectModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Từ chối yêu cầu trả hàng</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lý do từ chối <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Nhập lý do từ chối yêu cầu trả hàng..."
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => {
                        setShowRejectModal(false);
                        setRejectReason("");
                      }}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={async () => {
                        if (!rejectReason.trim()) {
                          alert("Vui lòng nhập lý do từ chối");
                          return;
                        }
                        if (!receiptId || Number.isNaN(receiptId) || !returnRequest) return;
                        try {
                          setIsProcessingReturn(true);
                          // Ghi log RETURN_REJECTED:{reason}|{date} vào receipt.note (theo quy ước)
                          const currentNote = orderNote || "";
                          const rejectDate = new Date().toISOString();
                          const newNote = currentNote + (currentNote ? "\n" : "") + `RETURN_REJECTED:${rejectReason.trim()}|${rejectDate}`;
                          await BillService.updateReceipt(receiptId, {
                            attributes: { note: newNote },
                          });
                          setOrderNote(newNote);
                          setReturnRequest({ 
                            ...returnRequest, 
                            status: "REJECTED",
                            rejectedReason: rejectReason.trim(),
                            rejectedDate: rejectDate,
                          });
                          setShowRejectModal(false);
                          setRejectReason("");
                          // Order vẫn là PAID, không đổi status
                        } catch (e) {
                          console.error(e);
                          alert("Có lỗi khi từ chối yêu cầu trả hàng.");
                        } finally {
                          setIsProcessingReturn(false);
                        }
                      }}
                      disabled={isProcessingReturn || !rejectReason.trim()}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {isProcessingReturn ? "Đang xử lý..." : "Xác nhận từ chối"}
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>
    );
}
