"use client";

import {useEffect, useMemo, useState} from "react";
import ProductSelector from "./ProductSelector";
import CustomerSelector from "./CustomerSelector";
import PaymentMethodPopup from "./PaymentMethodPopup";
import {useRouter} from "next/navigation";
import {ReceiptDetail} from "@/types/appContextTypes";
import {useBook} from "@/hooks/api-calls/useBook";
import {deserializeUsers, serializeReceipt, serializeUser} from "@/lib/serializers";
import {useCampaign} from "@/hooks/api-calls/useCampaign";
import {useReceipt} from "@/hooks/api-calls/useReceipt";
import {useUser} from "@/hooks/api-calls/useUser";
import {useAuth} from "@/context/auth-context";

// ===============================
// DEMO VOUCHER LIST (POS PANEL)
// ===============================

// chuẩn hoá tất cả voucher lấy từ localStorage để POS không crash
const normalizeVoucher = (v: any) => ({
    id: v.id,
    type: v.type,
    minTotal: v.minTotal || v.minOrder || 0,
    value: v.value || v.discount || 0,
    maxDiscount: v.maxDiscount || v.discount || v.value || 0,
    label: v.label,
    description: v.description,
    startDate: v.startDate,
    endDate: v.endDate,
    campaignDetails: v.campaignDetails
});

function extractBookDetails(books: any[]) {
    return books.flatMap((book) => {
        // top-level fields (your data shape)
        const bookId = String(book.id ?? "");
        const title = book.title ?? "";
        const imageUrl = book.imageUrl ?? "";

        // bookCopies structure: { data: [...] }
        const copies = Array.isArray(book.bookCopies?.data)
            ? book.bookCopies.data
            : [];

        return copies.map((bc: any) => ({
            bookId,
            title: title + (bc.bookFormat ? ` - ${bc.bookFormat}` : ""),
            imageUrl,
            id: String(bc.id ?? ""),

            createdAt: bc.createdAt ?? "",
            updatedAt: bc.updatedAt ?? "",
            enabled: bc.enabled ?? false,
            note: bc.note ?? "",

            isbn: bc.isbn ?? "",
            bookFormat: bc.bookFormat ?? "",
            dimensions: bc.dimensions ?? "",
            printLength: Number(bc.printLength ?? 0),
            stock: Number(bc.stock ?? 0),
            supplyPrice: Number(bc.supplyPrice ?? 0),
            salePrice: Number(bc.salePrice ?? 0),
            bookCondition: bc.bookCondition ?? "",
        }));
    });
}

function convertCampaigns(campaigns: any[]) {
    return campaigns.map((c) => {
        return {
            id: c.id,
            label: c.percentage,
            description: c.name,
            minTotal: c.minTotal,
            type: c.campaignType,
            value: c.percentage,
            maxDiscount: c.maxDiscount,
            campaignDetails: c.campaignDetails,
        };
    });
}

// {
//     id: "VC000004",
//         label: "20%",
//     description: "Giảm 20% tối đa 150.000đ",
//     minTotal: 1000000,
//     type: "PERCENT",
//     value: 20,
//     maxDiscount: 150000,
// }

// Lấy danh sách voucher từ localStorage
// ===============================
// ORDER MODEL
// ===============================
const createEmptyOrder = () => ({
    id: Date.now(),
    attributes: {
        customerName: "", ///if null on commit, is autofilled
        customerPhone: "",
        customerAddress: "",
        hasShipping: false,
        shippingService: null,
        shippingId: null,
        voucherCode: "",
        discountAmount: 0,
        discount: 0,
        orderStatus: "PENDING",
        orderType: "DIRECT"
    },
    relationships: {
        customer: null, // Khách hàng //use default pos user on null
        receiptDetails: [] as ReceiptDetail[], // Giỏ hàng
        paymentDetail: {
            id: 0,
            paymentType: "CASH",
        },
        employee: null
    },
});


export default function POS() {
    const router = useRouter();

    const [orders, setOrders] = useState<any[]>([]);
    const [activeOrderId, setActiveOrderId] = useState<number | null>(null);

    //authenticated employee
    const {user} = useAuth();

    const {bookQuery} = useBook(0, 500, true);
    const {campaignQuery} = useCampaign(0, 50, true);
    const {receiptCreate} = useReceipt();
    const {userQuery, userCreate} = useUser();

    // if (bookQuery.isLoading) return <p>Loading...</p>;
    // if (bookQuery.isError) return <p>Error loading books</p>;

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
    // Ô nhập mã voucher
    const [voucherInput, setVoucherInput] = useState("");
    // Search sản phẩm (gợi ý bên dưới ô tìm kiếm)
    const [searchText, setSearchText] = useState("");

    // Có thể trùng với demo trong ProductSelector cho dễ test
    const SEARCH_PRODUCTS = useMemo(() => {
        if (!bookQuery.isSuccess) return [];
        const bookDetails = extractBookDetails(bookQuery.data.data);
        return bookDetails;
    }, [bookQuery.dataUpdatedAt]);

    const VOUCHERS = useMemo(() => {
        if (!campaignQuery.isSuccess) return [];
        const campaigns = convertCampaigns(campaignQuery.data.data);
        return campaigns;
    }, [campaignQuery.dataUpdatedAt]);

    const USERS = useMemo(() => {
        if (!userQuery.isSuccess) return [];
        const users = deserializeUsers(userQuery.data.data);
        return users;
    }, [userQuery.dataUpdatedAt]);


    // const SEARCH_PRODUCTS = [
    //     {
    //         id: 1,
    //         code: "SP001",
    //         name: "Áo sơ mi trắng",
    //         price: 150000,
    //         image: "https://cdn-icons-png.flaticon.com/512/892/892458.png",
    //     },
    //     {
    //         id: 2,
    //         code: "SP002",
    //         name: "Quần jean xanh",
    //         price: 250000,
    //         image: "https://cdn-icons-png.flaticon.com/512/892/892403.png",
    //     },
    //     {
    //         id: 3,
    //         code: "SP003",
    //         name: "Giày sneaker",
    //         price: 500000,
    //         image: "https://cdn-icons-png.flaticon.com/512/892/892781.png",
    //     },
    // ];

    // const [vouchersFromLocalStorage, setVouchersFromLocalStorage] = useState<any[]>([]);

    // useEffect(() => {
    //     const saved = localStorage.getItem("vouchers");
    //     if (!saved) return;
    //
    //     const raw = JSON.parse(saved);
    //     setVouchersFromLocalStorage(raw.map((v: any) => normalizeVoucher(v)));
    // }, []);

    const updateOrder = (newData: any) => {
        setOrders((prev) =>
            prev.map((o) => {
                if (o.id !== activeOrderId) return o;

                // pull nested keys out to avoid clobbering them when we spread `rest`
                const {attributes: newAttributes, relationships: newRelationships, ...rest} = newData ?? {};

                return {
                    ...o,
                    // merge attributes one level deep
                    attributes: {
                        ...o.attributes,
                        ...(newAttributes ?? {}),
                    },
                    // merge relationships one level deep
                    relationships: {
                        ...o.relationships,
                        ...(newRelationships ?? {}),
                    },
                    // shallow merge remaining top-level props (but NOT attributes/relationships)
                    ...rest,
                };
            })
        );
    };


    // Lấy đơn hàng hiện tại
    const activeOrder = orders.find((o) => o.id === activeOrderId);
    // ➤ Khi đổi khách hàng → tự điền tên + sđt vào form giao hàng
    useEffect(() => {
        if (activeOrder?.customer) {
            updateOrder({
                attributes: {
                    customerName: activeOrder.relationships.customer.personName || "",
                    customerPhone: activeOrder.relationships.customer.phoneNumber || "",
                    customerAddress: activeOrder.relationships.customer.address || "",
                }
            })
        } else {
            updateOrder({
                attributes: {
                    customerName: "",
                    customerPhone: "",
                    customerAddress: "",
                }
            });
        }
    }, [activeOrder?.customer]);

    // Nếu vì lý do gì đó không tìm thấy activeOrder
    if (!activeOrder) {
        return <div className="card">Không tìm thấy đơn hàng.</div>;
    }

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
        const current = activeOrder.relationships.receiptDetails;

        const exists = current.find((e: any) => e.bookCopy.id === product.id);

        let updatedItems;

        if (exists) {
            updatedItems = current.map((e: any) =>
                e.bookCopy.id === product.id
                    ? {...e, quantity: e.quantity + 1}
                    : e
            );
        } else {
            const prodVouchers = VOUCHERS.filter(v => v.type === "PERCENTAGE_PRODUCT");
            const applicable = prodVouchers.filter((v) => v.campaignDetails.data.some((e: any) => e.bookDetailId === product.id));

            updatedItems = [
                ...current,
                {
                    id: Date.now(),
                    bookCopy: product,
                    quantity: 1,
                    pricePerUnit: applicable.length > 0 ? product.salePrice * (100 - applicable[0].value) / 100 : product.salePrice,
                    originalPrice: product.salePrice
                }
            ];
        }

        updateOrder({
            relationships: {
                receiptDetails: updatedItems
            }
        });
    };

    const changeQty = (bookCopyId: number, delta: number) => {
        const updatedItems = activeOrder.relationships.receiptDetails
            .map((item: any) =>
                item.bookCopy.id === bookCopyId
                    ? {...item, quantity: Math.max(1, item.quantity + delta)}
                    : item
            );

        updateOrder({
            relationships: {
                receiptDetails: updatedItems
            }
        });
    };

    const removeItem = (id: number | string) => {
        const updated = activeOrder.relationships.receiptDetails.filter((rd: any) => {
            return String(rd.bookCopy?.id) !== String(id);
        });

        updateOrder({
            relationships: {
                receiptDetails: updated,
            },
        });
    };
    // ===============================
    // PAYMENT
    // ===============================
    //Client-side calculated fees, is not synced with backend
    const tax = 8;
    const subTotal = activeOrder.relationships.receiptDetails.reduce(
        (acc: number, item: ReceiptDetail) => acc + item.pricePerUnit * item.quantity,
        0
    );
    const orderDiscount = activeOrder.discountAmount ?? 0;
    const shippingFee = shippingMethod === "DELIVERY" ? 30000 : 0;
    const grandTotal = Math.max(0, (subTotal - orderDiscount) * (100 + tax) / 100) + shippingFee;

    // ===============================
    // VOUCHER / DISCOUNT
    // ===============================
    const calcDiscountFromVoucher = (voucher: any, total: number) => {
        if (total < voucher.minTotal) return 0;

        if (voucher.type === "PERCENTAGE_RECEIPT") {
            const raw = (total * voucher.value) / 100;
            return Math.min(raw, voucher.maxDiscount ?? raw);
        }

        if (voucher.type === "FIXED") {
            return Math.min(voucher.value, total);
        }

        return 0;
    };


    const applyVoucherByCode = (id: string) => {
        if (VOUCHERS.length === 0) return;
        const allVouchers = [
            ...VOUCHERS.map((v) => normalizeVoucher(v)),
            // ...vouchersFromLocalStorage.map((v) => normalizeVoucher(v)),
        ];


        const voucher = allVouchers.find((v) => v.id === id);
        if (!voucher) {
            alert("Mã giảm giá không hợp lệ.");
            return;
        }

        const discount = calcDiscountFromVoucher(voucher, subTotal);
        if (discount <= 0) {
            alert(`Đơn hàng chưa đạt đơn tối thiểu ${voucher.minTotal.toLocaleString()}đ`);
            return;
        }

        updateOrder({voucherCode: voucher.id, discountAmount: discount, discount});
        setVoucherInput("");
    };

// Lọc sản phẩm theo nội dung tìm kiếm
    const filteredSearch =
        searchText.trim() === ""
            ? []
            : SEARCH_PRODUCTS.filter((p: any) => {
                const keyword = searchText.toLowerCase();
                return (
                    p.title.toLowerCase().includes(keyword)
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
                                {activeOrder.relationships.receiptDetails.length === 0 && (
                                    <tr>
                                        <td
                                            className="py-6 text-center text-gray-500"
                                            colSpan={6}
                                        >
                                            Giỏ hàng trống
                                        </td>
                                    </tr>
                                )}

                                {activeOrder.relationships.receiptDetails.map((receiptDetail: any, index: number) => (
                                    <tr key={receiptDetail.bookCopy.id}>
                                        <td className="text-center">{index + 1}</td>

                                        <td className="text-center">
                                            <img
                                                src={receiptDetail.bookCopy.imageUrl}
                                                className="w-16 h-16 object-cover mx-auto rounded"
                                                alt={receiptDetail.bookCopy.title}
                                            />
                                        </td>

                                        <td>
                                            <div className="flex flex-col justify-center">
                                                <span className="font-semibold">{receiptDetail.bookCopy.title}</span>
                                                <span className="text-gray-500 text-xs mt-1">
                                                    Đơn giá:{" "}
                                                    <b className="text-red-500">
                                                        {receiptDetail.pricePerUnit.toLocaleString()}đ
                                                    </b>
                                                    {receiptDetail.pricePerUnit < receiptDetail.originalPrice && (
                                                        <>
                                                            <span className="line-through">
                                                                {" "}
                                                                {receiptDetail.originalPrice.toLocaleString()}đ
                                                            </span>
                                                        </>
                                                    )}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <div className="inline-flex gap-2 items-center">
                                                <button
                                                    type="button"
                                                    className="w-8 h-8 border border-gray-300 rounded-md text-sm"
                                                    onClick={() => changeQty(receiptDetail.bookCopy.id, -1)}
                                                >
                                                    -
                                                </button>

                                                <span className="w-10 text-center font-medium">
                            {receiptDetail.quantity}
                          </span>

                                                <button
                                                    type="button"
                                                    className="w-8 h-8 border border-gray-300 rounded-md text-sm"
                                                    onClick={() => changeQty(receiptDetail.bookCopy.id, +1)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>

                                        <td className="text-center font-semibold text-blue-600">
                                            {(receiptDetail.quantity * receiptDetail.pricePerUnit).toLocaleString()}đ
                                        </td>

                                        <td className="text-center">
                                            <button
                                                type="button"
                                                className="text-red-500 text-lg"
                                                onClick={() => removeItem(receiptDetail.bookCopy.id)}
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
                                                    value={activeOrder.attributes.customerName}
                                                    onChange={(e) =>
                                                        updateOrder({
                                                            attributes: {customerName: e.target.value},
                                                        })
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
                                                    value={activeOrder.attributes.customerPhone}
                                                    onChange={(e) =>
                                                        updateOrder({
                                                            attributes: {customerPhone: e.target.value},
                                                        })
                                                    }
                                                    placeholder="Nhập số điện thoại"
                                                />
                                            </div>

                                            {/* Địa chỉ nhận hàng */}
                                            <div>
                                                <label className="text-sm font-medium">Địa chỉ nhận hàng</label>
                                                <textarea
                                                    className="input w-full mt-1 h-20"
                                                    value={activeOrder.attributes.customerAddress}
                                                    onChange={(e) =>
                                                        updateOrder({
                                                            attributes: {customerAddress: e.target.value},
                                                        })
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

                        {!activeOrder.relationships.customer && (
                            <div className="text-sm text-gray-700">Khách hàng lẻ</div>
                        )}

                        {activeOrder.relationships.customer && (
                            <div className="grid grid-cols-1 gap-3 text-sm">
                                <div>
                                    <div className="text-gray-500">Tên khách hàng</div>
                                    <div className="font-medium">
                                        {activeOrder.relationships.customer.personName}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Email</div>
                                    <div>{activeOrder.relationships.customer.email}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">SĐT</div>
                                    <div>{activeOrder.relationships.customer.phoneNumber}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Địa chỉ</div>
                                    <div>{activeOrder.relationships.customer.address}</div>
                                </div>


                                <button
                                    type="button"
                                    className="text-red-500 text-xs underline mt-1 justify-self-start"
                                    onClick={() => updateOrder({
                                        relationships: {
                                            customer: null,
                                        },
                                    })}
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
                                <b>Khuyến mãi</b>
                                {/*<input*/}
                                {/*    type="text"*/}
                                {/*    placeholder="Nhập mã"*/}
                                {/*    className="input flex-1"*/}
                                {/*    value={voucherInput}*/}
                                {/*    onChange={(e) => setVoucherInput(e.target.value)}*/}
                                {/*/>*/}
                                {/*<button*/}
                                {/*    type="button"*/}
                                {/*    className="btn btn-primary"*/}
                                {/*    onClick={() => applyVoucherByCode(voucherInput)}*/}
                                {/*>*/}
                                {/*    Áp dụng*/}
                                {/*</button>*/}
                            </div>

                            {/* DANH SÁCH VOUCHER DEMO */}
                            <div className="space-y-3 max-h-[260px] overflow-y-auto custom-scrollbar">
                                {VOUCHERS
                                    .filter(v => v.type === "PERCENTAGE_RECEIPT")
                                    .map((v) => {
                                        const isApplied = activeOrder.voucherCode === v.id;
                                        return (
                                            <button
                                                key={v.id}
                                                type="button"
                                                onClick={() => applyVoucherByCode(v.id)}
                                                className={`w-full flex border rounded-lg px-3 py-3 text-left items-center gap-3 ${
                                                    isApplied
                                                        ? "border-[var(--sidebar-primary)] bg-[var(--sidebar-primary-soft)]"
                                                        : "border-gray-200 bg-white hover:bg-gray-50"
                                                }`}
                                            >
                                                <div className="flex-1">
                                                    <div className="font-semibold text-sm">
                                                        {v.id}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {v.description}
                                                    </div>
                                                    <div className="text-[11px] text-gray-400 mt-1">
                                                        Đơn tối thiểu{" "}
                                                        {v.minTotal.toLocaleString("vi-VN")}đ
                                                    </div>
                                                </div>
                                                <div
                                                    className="flex flex-col items-center justify-between h-full text-center min-w-[48px]">
                        <span className="text-xs text-gray-500 uppercase">
                          Mã giảm giá
                        </span>
                                                    <span
                                                        className="text-base font-semibold text-[var(--sidebar-primary)]">
                          {v.label}
                        </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* TỔNG KẾT THANH TOÁN */}
                        <div className="divider"/>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Tổng:</span>
                                <b>{subTotal.toLocaleString()}đ</b>
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
                                <span>Thuế VAT:</span>
                                <b>8%</b>
                            </div>

                            <div className="flex justify-between font-semibold mt-2">
                                <span>Thực thu:</span>
                                <b>{grandTotal.toLocaleString()}đ</b>
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
                            onClick={async () => {
                                const order = structuredClone(activeOrder);
                                if (!order.relationships.receiptDetails || order.relationships.receiptDetails.length === 0) return;
                                order.attributes.hasShipping = shippingMethod === "DELIVERY";
                                order.id = 0;
                                order.attributes.discount = order.discount;
                                order.attributes.discountAmount = order.discountAmount;
                                order.relationships.employee = {
                                    id: user!.id
                                }
                                console.log(order);
                                console.log(serializeReceipt(order));
                                const saved = await receiptCreate.mutateAsync(order);
                                console.log(saved.data.id);

                                setOrders((prev) => {
                                    // remove the completed order from the current in-memory list
                                    const updated = prev.filter((o) => o.id !== activeOrderId);

                                    if (updated.length === 0) {
                                        // if nothing left, create a fresh order (prevents activeOrder === null)
                                        const fresh = createEmptyOrder();
                                        // persist the single fresh order
                                        localStorage.setItem("posOrders", JSON.stringify([fresh]));
                                        // update active tab to the new order
                                        setActiveOrderId(fresh.id);
                                        return [fresh];
                                    }

                                    // persist updated list
                                    localStorage.setItem("posOrders", JSON.stringify(updated));

                                    // if the deleted order was the active one, switch to the first remaining
                                    if (!updated.find((o) => o.id === activeOrderId)) {
                                        setActiveOrderId(updated[0].id);
                                    }

                                    return updated;
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
      ======================== */
            }
            {
                showProductPopup && (
                    <ProductSelector
                        onClose={() => setShowProductPopup(false)}
                        onSelect={(p) => {
                            addProduct(p);
                            setShowProductPopup(false);
                        }}
                        products={SEARCH_PRODUCTS}
                    />
                )
            }

            {
                showCustomerPopup && (
                    <CustomerSelector
                        onClose={() => setShowCustomerPopup(false)}
                        onSelect={(c) => {
                            updateOrder({
                                relationships: {
                                    customer: c
                                }
                            });
                            updateOrder({
                                attributes: {
                                    customerName: c.personName,
                                    customerPhone: c.phoneNumber,
                                    customerAddress: c.address
                                }
                            });
                            setShowCustomerPopup(false);
                        }}
                        customers={USERS.filter(u =>
                            u.roles.some(r => r.name === "ROLE_USER")
                        )}
                        onSave={(data) => {
                            console.log(data);
                            console.log(serializeUser(data));
                            userCreate.mutate(data);
                        }}
                    />
                )
            }

            {
                showPaymentPopup && (
                    <PaymentMethodPopup
                        amount={grandTotal}
                        onClose={() => setShowPaymentPopup(false)}
                        onConfirm={(data) => {
                            console.log("paymentDetail Updated")
                            updateOrder({
                                relationships: {
                                    paymentDetail: {
                                        id: Date.now(),
                                        paymentType: data.method,
                                        amount: data.amount,
                                    },
                                },
                            });
                            setShowPaymentPopup(false);
                        }}
                    />
                )
            }
        </div>
    )
        ;
}