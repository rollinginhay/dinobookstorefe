"use client";

import {useEffect, useMemo, useState} from "react";
import ProductSelector from "./ProductSelector";
import CustomerSelector from "./CustomerSelector";
import QRCodeDisplay from "./QRCodeDisplay";
import {useRouter} from "next/navigation";
import {ReceiptDetail} from "@/types/appContextTypes";
import {useBook} from "@/hooks/api-calls/useBook";
import {deserializeUsers, serializeReceipt, serializeUser} from "@/lib/serializers";
import {useCampaign} from "@/hooks/api-calls/useCampaign";
import {useReceipt} from "@/hooks/api-calls/useReceipt";
import {useUser} from "@/hooks/api-calls/useUser";
import {useAuth} from "@/context/auth-context";
import {toast} from "sonner";

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
        // top-level fields
        const bookId = String(book.id ?? "");
        const title = book.title ?? "";
        const imageUrl = book.imageUrl ?? "";

        // bookCopies structure:
        const copies = Array.isArray(book.bookCopies?.data)
            ? book.bookCopies.data
            : [];

        return copies
            .filter((bc: any) => {
                // ✅ Filter: Chỉ lấy sách có stock > 0 VÀ enabled = true
                const stock = Number(bc.stock ?? 0);
                const enabled = bc.enabled !== false; // enabled mặc định là true nếu không có
                return stock > 0 && enabled;
            })
            .map((bc: any) => ({
            bookId,
            title: title,
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

type Campaign = {
    id: string;
    label: string;
    description: string;
    minTotal: number;
    type: string;
    value: number;
    maxDiscount: number;
    campaignDetails?: any;
    startDate?: any;
    endDate?: any;
};

function convertCampaigns(campaigns: any[]): Campaign[] {
    const now = new Date();
    console.log("convertCampaigns - Input campaigns:", campaigns);
    
    const mapped = campaigns.map((c) => {
        // Xử lý JSON API format (có attributes) hoặc plain object
        const attrs = c.attributes || c;
        const mappedCampaign = {
            id: String(c.id || attrs.id || ""),
            campaignType: String(attrs.campaignType || c.campaignType || attrs.type || c.type || ""),
            name: String(attrs.name || c.name || attrs.description || c.description || ""),
            percentage: Number(attrs.percentage || c.percentage || 0),
            discount: Number(attrs.discount || c.discount || attrs.flatDiscount || c.flatDiscount || 0),
            minTotal: Number(attrs.minTotal || c.minTotal || attrs.minOrder || c.minOrder || 0),
            maxDiscount: Number(attrs.maxDiscount || c.maxDiscount || 0),
            startDate: attrs.startDate || c.startDate || attrs.start || c.start,
            endDate: attrs.endDate || c.endDate || attrs.end || c.end,
            campaignDetails: attrs.campaignDetails || c.campaignDetails,
        };
        console.log("Mapped campaign:", mappedCampaign);
        return mappedCampaign;
    });
    
    console.log("After mapping:", mapped);
    
    const dateFiltered = mapped.filter((c) => {
        // Chỉ lấy campaigns đang hoạt động (trong khoảng startDate - endDate)
        if (c.startDate && c.endDate) {
            try {
                const startDate = new Date(c.startDate);
                const endDate = new Date(c.endDate);
                // Thêm 1 ngày vào endDate để bao gồm cả ngày cuối
                endDate.setHours(23, 59, 59, 999);
                const isActive = now >= startDate && now <= endDate;
                console.log(`Campaign ${c.id} date check:`, {
                    startDate: c.startDate,
                    endDate: c.endDate,
                    now: now.toISOString(),
                    isActive
                });
                return isActive;
            } catch (e) {
                console.error("Error parsing dates:", e, c.startDate, c.endDate);
                // Nếu parse lỗi thì giả sử đang hoạt động
                return true;
            }
        }
        // Nếu không có date thì giả sử đang hoạt động
        console.log(`Campaign ${c.id} has no dates, assuming active`);
        return true;
    });
    
    console.log("After date filter:", dateFiltered);
    
    // Bỏ filter type - hiển thị TẤT CẢ campaigns đang hoạt động
    // User muốn thấy tất cả campaigns, không filter theo type
    const typeFiltered = dateFiltered;
    
    console.log("After type filter:", typeFiltered);
    
    const final = typeFiltered.map((c) => {
        // Map campaignType sang type cho POS
        let type = c.campaignType;
        if (c.campaignType === "FLAT_DISCOUNT") {
            type = "FIXED";
        } else if (c.campaignType === "PERCENTAGE_DISCOUNT" || c.campaignType === "PERCENTAGE_PRODUCT") {
            // PERCENTAGE_DISCOUNT và PERCENTAGE_PRODUCT cũng là giảm theo phần trăm, map giống PERCENTAGE_RECEIPT
            type = "PERCENTAGE_RECEIPT";
        }
        
        // Map value: Tất cả loại PERCENTAGE dùng percentage, FLAT_DISCOUNT dùng discount amount
        let value = 0;
        if (c.campaignType === "PERCENTAGE_RECEIPT" 
            || c.campaignType === "PERCENTAGE_DISCOUNT" 
            || c.campaignType === "PERCENTAGE_PRODUCT") {
            value = c.percentage || 0;
        } else if (c.campaignType === "FLAT_DISCOUNT") {
            value = c.discount || 0;
        }
        
        // Tạo label hiển thị
        let label = "";
        if (c.campaignType === "PERCENTAGE_RECEIPT" 
            || c.campaignType === "PERCENTAGE_DISCOUNT" 
            || c.campaignType === "PERCENTAGE_PRODUCT") {
            label = `${c.percentage || 0}%`;
            if (c.maxDiscount) {
                label += ` (tối đa ${c.maxDiscount.toLocaleString()}đ)`;
            }
        } else if (c.campaignType === "FLAT_DISCOUNT") {
            label = `${(c.discount || 0).toLocaleString()}đ`;
        } else {
            // Fallback cho các loại khác
            label = c.percentage ? `${c.percentage}%` : `${(c.discount || 0).toLocaleString()}đ`;
        }
        
        return {
            id: c.id,
            label: label,
            description: c.name || "",
            minTotal: c.minTotal || 0,
            type: type,
            value: value,
            maxDiscount: c.maxDiscount || 0,
            campaignDetails: c.campaignDetails,
            startDate: c.startDate,
            endDate: c.endDate,
        };
    });
    
    console.log("Final converted campaigns:", final);
    return final;
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

    // Load Provinces
    useEffect(() => {
        fetch("https://provinces.open-api.vn/api/p/")
            .then((res) => res.json())
            .then((data) => setProvinces(data))
            .catch(() => setProvinces([]));
    }, []);

    // Handle Province Change (Edit Form)
    const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = e.target.value;
        const selected = provinces.find((p: any) => p.code == code);
        setEditShippingData(prev => ({
            ...prev,
            provinceCode: code,
            provinceName: selected?.name || "",
            districtCode: "",
            districtName: "",
            wardCode: "",
            wardName: "",
        }));
        setDistricts([]);
        setWards([]);

        if (!code) return;

        fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`)
            .then((res) => res.json())
            .then((data) => {
                setDistricts(data.districts || []);
            })
            .catch(() => {
                setDistricts([]);
            });
    };

    // Handle District Change (Edit Form)
    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = e.target.value;
        const selected = districts.find((d: any) => d.code == code);
        setEditShippingData(prev => ({
            ...prev,
            districtCode: code,
            districtName: selected?.name || "",
            wardCode: "",
            wardName: "",
        }));
        setWards([]);

        if (!code) return;

        fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`)
            .then((res) => res.json())
            .then((data) => setWards(data.wards || []))
            .catch(() => setWards([]));
    };

    // Handle Ward Change (Edit Form)
    const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = wards.find((w: any) => w.code == e.target.value);
        setEditShippingData(prev => ({
            ...prev,
            wardCode: e.target.value,
            wardName: selected?.name || "",
        }));
    };

    // Mở form chỉnh sửa
    const handleEditShipping = () => {
        const fullAddress = activeOrder.attributes.customerAddress || "";
        const parts = fullAddress.split(",").map(p => p.trim());

        // Parse địa chỉ (giả định format: "địa chỉ chi tiết, phường/xã, quận/huyện, tỉnh/thành phố")
        let detailAddr = ""; // Để trống địa chỉ chi tiết
        let wardName = "";
        let districtName = "";
        let provinceName = "";

        if (parts.length >= 4) {
            wardName = parts[1];
            districtName = parts[2];
            provinceName = parts[3];
        } else if (parts.length === 3) {
            wardName = parts[1];
            provinceName = parts[2];
        } else if (parts.length === 2) {
            provinceName = parts[1];
        }

        // Tìm province code
        const province = provinces.find(p =>
            p.name === provinceName ||
            p.name.toLowerCase().includes(provinceName.toLowerCase()) ||
            provinceName.toLowerCase().includes(p.name.toLowerCase())
        );

        setEditShippingData({
            name: activeOrder.attributes.customerName || "",
            phone: activeOrder.attributes.customerPhone || "",
            detailAddress: detailAddr,
            provinceCode: province ? String(province.code) : "",
            provinceName: province?.name || provinceName,
            districtCode: "",
            districtName: districtName,
            wardCode: "",
            wardName: wardName,
        });

        // Load districts nếu có province
        if (province) {
            fetch(`https://provinces.open-api.vn/api/p/${province.code}?depth=2`)
                .then((res) => res.json())
                .then((data) => {
                    const districtsList = data.districts || [];
                    setDistricts(districtsList);

                    // Tìm district
                    if (districtName) {
                        const district = districtsList.find((d: any) =>
                            d.name === districtName ||
                            d.name.toLowerCase().includes(districtName.toLowerCase()) ||
                            districtName.toLowerCase().includes(d.name.toLowerCase())
                        );

                        if (district) {
                            setEditShippingData(prev => ({
                                ...prev,
                                districtCode: String(district.code),
                                districtName: district.name,
                            }));

                            // Load wards
                            fetch(`https://provinces.open-api.vn/api/d/${district.code}?depth=2`)
                                .then((res) => res.json())
                                .then((data) => {
                                    const wardsList = data.wards || [];
                                    setWards(wardsList);

                                    // Tìm ward
                                    if (wardName) {
                                        const ward = wardsList.find((w: any) =>
                                            w.name === wardName ||
                                            w.name.toLowerCase().includes(wardName.toLowerCase()) ||
                                            wardName.toLowerCase().includes(w.name.toLowerCase())
                                        );

                                        if (ward) {
                                            setEditShippingData(prev => ({
                                                ...prev,
                                                wardCode: String(ward.code),
                                                wardName: ward.name,
                                            }));
                                        }
                                    }
                                })
                                .catch(() => setWards([]));
                        }
                    }
                })
                .catch(() => setDistricts([]));
        }

        setIsEditingShipping(true);
    };

    // Lưu thông tin giao hàng
    // LƯU Ý: Chỉ update thông tin giao hàng trong order attributes (customerName, customerPhone, customerAddress)
    // KHÔNG update thông tin khách hàng gốc trong relationships.customer
    // Điều này cho phép khách hàng A nhưng người nhận là B
    const handleSaveShipping = () => {
        if (!editShippingData.name.trim() || !editShippingData.phone.trim()) {
            alert("Vui lòng nhập đầy đủ tên và số điện thoại!");
            return;
        }

        if (!editShippingData.detailAddress.trim() || !editShippingData.provinceName) {
            alert("Vui lòng nhập đầy đủ thông tin địa chỉ!");
            return;
        }

        // Tạo địa chỉ đầy đủ
        const addressParts = [editShippingData.detailAddress];
        if (editShippingData.wardName) addressParts.push(editShippingData.wardName);
        if (editShippingData.districtName) addressParts.push(editShippingData.districtName);
        if (editShippingData.provinceName) addressParts.push(editShippingData.provinceName);
        const fullAddress = addressParts.join(", ");

        // CHỈ update attributes, KHÔNG động vào relationships.customer
        updateOrder({
            attributes: {
                customerName: editShippingData.name,
                customerPhone: editShippingData.phone,
                customerAddress: fullAddress,
            }
            // KHÔNG update relationships.customer - giữ nguyên khách hàng gốc
        });

        setIsEditingShipping(false);
        alert("Đã lưu thông tin giao hàng!");
    };

    // Hủy chỉnh sửa
    const handleCancelEdit = () => {
        setIsEditingShipping(false);
    };

    // Popup
    const [showProductPopup, setShowProductPopup] = useState(false);
    const [showCustomerPopup, setShowCustomerPopup] = useState(false);

    // Payment method
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER">("CASH");
    const [orderCode, setOrderCode] = useState<string>("");
    const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);

    // Nhận hàng
    const [shippingMethod, setShippingMethod] = useState<"STORE" | "DELIVERY">(
        "STORE"
    );
    // Đã bỏ các state liên quan đến giảm giá thủ công
    
    // Form chỉnh sửa thông tin giao hàng
    const [isEditingShipping, setIsEditingShipping] = useState(false);
    const [editShippingData, setEditShippingData] = useState({
        name: "",
        phone: "",
        detailAddress: "",
        provinceCode: "",
        provinceName: "",
        districtCode: "",
        districtName: "",
        wardCode: "",
        wardName: "",
    });
    const [provinces, setProvinces] = useState<Array<{ code: number; name: string }>>([]);
    const [districts, setDistricts] = useState<Array<{ code: number; name: string }>>([]);
    const [wards, setWards] = useState<Array<{ code: number; name: string }>>([]);

    // Search sản phẩm (gợi ý bên dưới ô tìm kiếm)
    const [searchText, setSearchText] = useState("");

    // Có thể trùng với demo trong ProductSelector cho dễ test
    const SEARCH_PRODUCTS = useMemo(() => {
        if (!bookQuery.isSuccess) return [];
        const bookDetails = extractBookDetails(bookQuery.data.data);
        return bookDetails;
    }, [bookQuery.dataUpdatedAt]);

    const VOUCHERS = useMemo((): Campaign[] => {
        if (!campaignQuery.isSuccess) {
            console.log("Campaign query not successful:", campaignQuery.error, campaignQuery.status);
            return [];
        }
        
        const rawCampaigns = campaignQuery.data?.data || campaignQuery.data || [];
        console.log("Raw campaigns data:", rawCampaigns);
        console.log("Campaign query data structure:", campaignQuery.data);
        
        if (!Array.isArray(rawCampaigns)) {
            console.error("Campaigns is not an array:", typeof rawCampaigns, rawCampaigns);
            return [];
        }
        
        const campaigns = convertCampaigns(rawCampaigns);
        console.log("Converted campaigns for POS:", campaigns);
        console.log("Number of active campaigns:", campaigns.length);
        
        return campaigns;
    }, [campaignQuery.dataUpdatedAt, campaignQuery.isSuccess, campaignQuery.error, campaignQuery.data]);

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

    // Reset payment state khi chuyển đơn hàng
    useEffect(() => {
        setIsPaymentConfirmed(false);
        if (paymentMethod === "TRANSFER") {
            const tempCode = `ORD${Date.now()}`;
            setOrderCode(tempCode);
        } else {
            setOrderCode("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeOrderId]);

    // Tạo mã đơn hàng khi chọn chuyển khoản
    useEffect(() => {
        if (paymentMethod === "TRANSFER") {
            const tempCode = `ORD${Date.now()}`;
            setOrderCode(tempCode);
        } else {
            setOrderCode("");
        }
        setIsPaymentConfirmed(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentMethod]);

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

    // ===============================
    // VOUCHER / DISCOUNT - TỰ ĐỘNG CHỌN CAMPAIGN TỐT NHẤT
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

    // Tính subtotal từ activeOrder
    const subTotal = useMemo(() => {
        const currentOrder = orders.find((o) => o.id === activeOrderId);
        if (!currentOrder || !currentOrder.relationships?.receiptDetails) return 0;
        return currentOrder.relationships.receiptDetails.reduce(
            (acc: number, item: ReceiptDetail) => acc + item.pricePerUnit * item.quantity,
            0
        );
    }, [activeOrderId, orders]);

    // Tự động tìm campaign tốt nhất dựa trên subtotal
    const findBestCampaign = useMemo((): Campaign | null => {
        if (subTotal <= 0 || VOUCHERS.length === 0) return null;

        // Chỉ lấy campaigns PERCENTAGE_RECEIPT và FIXED
        const applicableCampaigns = VOUCHERS.filter(
            (v) => (v.type === "PERCENTAGE_RECEIPT" || v.type === "FIXED") && subTotal >= v.minTotal
        );

        if (applicableCampaigns.length === 0) return null;

        // Tìm campaign có discount cao nhất
        let bestCampaign: Campaign | null = null;
        let bestDiscount = 0;

        for (const campaign of applicableCampaigns) {
            const discount = calcDiscountFromVoucher(campaign, subTotal);
            if (discount > bestDiscount) {
                bestDiscount = discount;
                bestCampaign = campaign;
            }
        }

        return bestCampaign;
    }, [subTotal, VOUCHERS]);

    // Tự động áp dụng campaign tốt nhất khi subtotal thay đổi
    useEffect(() => {
        if (!activeOrder) return;
        
        if (findBestCampaign && subTotal > 0) {
            const discount = calcDiscountFromVoucher(findBestCampaign, subTotal);
            if (discount > 0) {
                updateOrder({
                    voucherCode: findBestCampaign.id,
                    discountAmount: discount,
                    discount: discount
                });
            } else {
                // Nếu không đủ điều kiện, xóa discount
                updateOrder({
                    voucherCode: "",
                    discountAmount: 0,
                    discount: 0
                });
            }
        } else {
            // Không có campaign nào hoặc subtotal = 0, xóa discount
            updateOrder({
                voucherCode: "",
                discountAmount: 0,
                discount: 0
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [findBestCampaign, subTotal, activeOrderId]);

    // Nếu vì lý do gì đó không tìm thấy activeOrder
    if (!activeOrder) {
        return <div className="card">Không tìm thấy đơn hàng.</div>;
    }

    const addNewOrder = () => {
        // Giới hạn 5 đơn hàng - chỉ return, không hiển thị alert
        if (orders.length >= 5) {
            return;
        }

        const newOrder = createEmptyOrder();
        setOrders([...orders, newOrder]);
        setActiveOrderId(newOrder.id);
        // Reset payment state khi tạo đơn mới
        setIsPaymentConfirmed(false);
        setPaymentMethod("CASH");
        setOrderCode("");
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
        if (product.stock <= 0) {
            toast.warning("Sản phẩm đã hết hàng");
            return;
        }
        const current = activeOrder.relationships.receiptDetails;

        const exists = current.find((e: any) => e.bookCopy.id === product.id);
        let updatedItems;
        if (exists) {
            const newQuantity = exists.quantity + 1;
            if (newQuantity > product.stock) {
                toast.warning("Không đủ hàng trong kho");
                return;
            }
            updatedItems = current.map((e: any) =>
                e.bookCopy.id === product.id
                    ? {...e, quantity: newQuantity}
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

        // Giảm giá sẽ tự động được tính lại khi subtotal thay đổi (useEffect)
    };
    // ===============================
    // PAYMENT
    // ===============================
    //Client-side calculated fees, is not synced with backend
    // Bán hàng trực tiếp tại quầy - KHÔNG có VAT
    const orderDiscount = activeOrder?.discountAmount ?? 0;
    const shippingFee = shippingMethod === "DELIVERY" ? 30000 : 0;
    const grandTotal = Math.max(0, subTotal - orderDiscount + shippingFee);

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
            <div className="grid gap-6 xl:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)]">
                {/* =======================================
            LEFT COLUMN: PRODUCTS + CUSTOMER + VOUCHER + SHIPPING
        ======================================== */}
                <div className="space-y-4">
                    {/* SẢN PHẨM */}
                    <div className="card shadow-sm">
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
                            {orders.length < 5 && (
                                <button
                                    type="button"
                                    onClick={addNewOrder}
                                    className="btn btn-success bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-3 py-1.5"
                                >
                                    + Thêm
                                </button>
                            )}
                        </div>


                        {/* GIỎ HÀNG TABLE */}
                        <div className="rounded-lg border border-gray-200 overflow-x-auto bg-white">
                            <table className="table min-w-[700px]">
                                <thead>
                                <tr>
                                    <th className="w-[50px] text-center">#</th>
                                    <th className="w-[120px] text-center">Ảnh</th>
                                    <th className="w-[280px]">Sản phẩm</th>
                                    <th className="w-[140px] text-center">
                                        <div className="flex items-center justify-center">
                                            <span>Số lượng</span>
                                        </div>
                                    </th>
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
                                        <td className="text-center align-middle">{index + 1}</td>

                                        <td className="text-center align-middle">
                                            <div className="flex items-center justify-center">
                                                <img
                                                    src={receiptDetail.bookCopy.imageUrl}
                                                    className="w-16 h-16 object-cover rounded"
                                                    alt={receiptDetail.bookCopy.title}
                                                />
                                            </div>
                                        </td>

                                        <td className="align-middle">
                                            <div className="flex flex-col justify-center">
                                                <span className="font-semibold">{receiptDetail.bookCopy.title + " - " + receiptDetail.bookCopy.bookFormat}</span>
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
                                        <td className="text-center align-middle">
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-20 text-center font-medium border border-gray-300 rounded-md py-1.5 px-2"
                                                    value={receiptDetail.quantity}
                                                    onChange={(e) => {
                                                        let newQty = parseInt(e.target.value) || 1;
                                                        if (newQty >= 1) {
                                                            updateOrder({
                                                                relationships: {
                                                                    receiptDetails: activeOrder.relationships.receiptDetails.map((item: any) => {
                                                                            if (newQty > item.bookCopy.stock) {
                                                                                newQty = item.bookCopy.stock;
                                                                            }
                                                                            return item.bookCopy.id === receiptDetail.bookCopy.id
                                                                                ? {...item, quantity: newQty}
                                                                                : item

                                                                        }
                                                                    )
                                                                }
                                                            });
                                                        }
                                                    }}
                                                    onBlur={(e) => {
                                                        const value = parseInt(e.target.value);
                                                        if (!value || value < 1) {
                                                            updateOrder({
                                                                relationships: {
                                                                    receiptDetails: activeOrder.relationships.receiptDetails.map((item: any) =>
                                                                        item.bookCopy.id === receiptDetail.bookCopy.id
                                                                            ? {...item, quantity: 1}
                                                                            : item
                                                                    )
                                                                }
                                                            });
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </td>

                                        <td className="text-center align-middle font-semibold text-blue-600">
                                            <div className="flex items-center justify-center">
                                                {(receiptDetail.quantity * receiptDetail.pricePerUnit).toLocaleString()}đ
                                            </div>
                                        </td>

                                        <td className="text-center align-middle">
                                            <div className="flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    className="text-red-500 text-lg"
                                                    onClick={() => removeItem(receiptDetail.bookCopy.id)}
                                                    title="Xóa sản phẩm"
                                                >
                                                    🗑
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        <button
                            type="button"
                            className="btn btn-primary mt-4 w-full"
                            onClick={() => setShowProductPopup(true)}
                        >
                            + Chọn sản phẩm
                        </button>
                    </div>

                    {/* KHÁCH HÀNG */}
                    <div className="card shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="card-title mb-0">Khách hàng</h3>
                            <button
                                type="button"
                                className="btn btn-primary text-sm px-3 py-1.5"
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
                                    <div className="text-gray-500">SĐT</div>
                                    <div>{activeOrder.relationships.customer.phoneNumber}</div>
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

                    {/* GIẢM GIÁ - TỰ ĐỘNG ÁP DỤNG CAMPAIGN TỐT NHẤT */}
                    <div className="card shadow-sm">
                        <h3 className="card-title mb-4">Giảm giá</h3>
                        <div className="border-t border-gray-300 pt-4 mt-2">
                            {findBestCampaign && subTotal >= findBestCampaign.minTotal && orderDiscount > 0 ? (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-gray-700">
                                        Campaign áp dụng:
                                    </div>
                                    <div className="text-base font-semibold text-gray-900">
                                        #{findBestCampaign.id} – {findBestCampaign.description || findBestCampaign.id}
                                    </div>
                                    <div className="text-lg font-bold text-red-600">
                                        Giảm: -{orderDiscount.toLocaleString()}đ
                                    </div>
                                    <div className="text-xs text-gray-500 italic">
                                        (Áp dụng tự động theo hệ thống)
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">
                                    {subTotal > 0 
                                        ? "Không có campaign nào phù hợp với đơn hàng hiện tại"
                                        : "Thêm sản phẩm vào giỏ hàng để xem giảm giá"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* NHẬN HÀNG */}
                    <div className="card shadow-sm">
                        <h3 className="card-title mb-4">Nhận hàng</h3>
                        <div className="space-y-3">
                            <label
                                className="flex items-start gap-3 cursor-pointer p-3 border-2 rounded-lg transition-all hover:bg-gray-50 hover:border-blue-300 hover:shadow-sm">
                                <input
                                    type="radio"
                                    className="checkbox mt-0.5 w-5 h-5"
                                    checked={shippingMethod === "STORE"}
                                    onChange={() => setShippingMethod("STORE")}
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-800">Tại quầy</div>
                                </div>
                            </label>

                            <label
                                className="flex items-start gap-3 cursor-pointer p-3 border-2 rounded-lg transition-all hover:bg-gray-50 hover:border-blue-300 hover:shadow-sm">
                                <input
                                    type="radio"
                                    className="checkbox mt-0.5 w-5 h-5"
                                    checked={shippingMethod === "DELIVERY"}
                                    onChange={() => setShippingMethod("DELIVERY")}
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-800">Chuyển phát</div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        Giao hàng toàn quốc từ 1–2 ngày
                                    </div>
                                    {shippingMethod === "DELIVERY" && (
                                        <div className="mt-4 p-4 border rounded-lg bg-gray-50 space-y-3 ml-6">
                                            {!isEditingShipping ? (
                                                <>
                                                    {/* Hiển thị thông tin (read-only) */}
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="text-sm font-medium text-gray-500">Tên
                                                                người nhận</label>
                                                            <div className="mt-1 text-gray-800">
                                                                {activeOrder.attributes.customerName || "Chưa có thông tin"}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium text-gray-500">Số điện
                                                                thoại</label>
                                                            <div className="mt-1 text-gray-800">
                                                                {activeOrder.attributes.customerPhone || "Chưa có thông tin"}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-medium text-gray-500">Địa chỉ
                                                                nhận hàng</label>
                                                            <div className="mt-1 text-gray-800">
                                                                {activeOrder.attributes.customerAddress || "Chưa có thông tin"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary w-full mt-2"
                                                        onClick={handleEditShipping}
                                                    >
                                                        ✏️ Sửa thông tin
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    {/* Form chỉnh sửa */}
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="text-sm font-medium">
                                                                Tên người nhận <span className="text-red-600">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="input w-full mt-1"
                                                                value={editShippingData.name}
                                                                onChange={(e) => setEditShippingData(prev => ({
                                                                    ...prev,
                                                                    name: e.target.value
                                                                }))}
                                                                placeholder="Nhập tên người nhận"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="text-sm font-medium">
                                                                Số điện thoại <span className="text-red-600">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="input w-full mt-1"
                                                                value={editShippingData.phone}
                                                                onChange={(e) => setEditShippingData(prev => ({
                                                                    ...prev,
                                                                    phone: e.target.value
                                                                }))}
                                                                placeholder="Nhập số điện thoại"
                                                            />
                                                        </div>

                                                        {/* Địa chỉ - Tỉnh/Thành phố, Quận/Huyện, Phường/Xã (nằm ngang) */}
                                                        <div className="grid grid-cols-3 gap-3">
                                                            <div>
                                                                <label className="text-sm font-medium">
                                                                    Tỉnh/Thành phố <span
                                                                    className="text-red-600">*</span>
                                                                </label>
                                                                <select
                                                                    value={editShippingData.provinceCode}
                                                                    onChange={handleProvinceChange}
                                                                    className="input w-full mt-1"
                                                                    required
                                                                >
                                                                    <option value="">Chọn tỉnh/thành</option>
                                                                    {provinces.map((p) => (
                                                                        <option key={p.code} value={p.code}>
                                                                            {p.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div>
                                                                <label className="text-sm font-medium">
                                                                    Quận/Huyện <span className="text-red-600">*</span>
                                                                </label>
                                                                <select
                                                                    value={editShippingData.districtCode}
                                                                    onChange={handleDistrictChange}
                                                                    className="input w-full mt-1"
                                                                    disabled={!districts.length}
                                                                    required
                                                                >
                                                                    <option value="">Chọn quận/huyện</option>
                                                                    {districts.map((d) => (
                                                                        <option key={d.code} value={d.code}>
                                                                            {d.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div>
                                                                <label className="text-sm font-medium">
                                                                    Phường/Xã <span className="text-red-600">*</span>
                                                                </label>
                                                                <select
                                                                    value={editShippingData.wardCode}
                                                                    onChange={handleWardChange}
                                                                    className="input w-full mt-1"
                                                                    disabled={!wards.length}
                                                                    required
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
                                                            <label className="text-sm font-medium">
                                                                Địa chỉ chi tiết <span className="text-red-600">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className="input w-full mt-1"
                                                                value={editShippingData.detailAddress}
                                                                onChange={(e) => setEditShippingData(prev => ({
                                                                    ...prev,
                                                                    detailAddress: e.target.value
                                                                }))}
                                                                placeholder="Số nhà, tên đường..."
                                                            />
                                                        </div>

                                                        <div className="flex gap-2 mt-4">
                                                            <button
                                                                type="button"
                                                                className="btn bg-gray-200 hover:bg-gray-300 flex-1"
                                                                onClick={handleCancelEdit}
                                                            >
                                                                Hủy
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-primary flex-1"
                                                                onClick={handleSaveShipping}
                                                            >
                                                                💾 Lưu
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* =======================================
            RIGHT COLUMN: SUMMARY + PAYMENT + CONFIRM
        ======================================== */}
                <div className="space-y-4">
                    {/* TỔNG KẾT THANH TOÁN */}
                    <div className="card shadow-sm bg-gradient-to-br from-blue-50 to-white border-blue-100">
                        <h3 className="card-title mb-4 text-gray-800">Tổng thanh toán</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Tổng:</span>
                                <b>{subTotal.toLocaleString()}đ</b>
                            </div>

                            {shippingMethod === "DELIVERY" && (
                                <div className="flex justify-between">
                                    <span>Phí ship:</span>
                                    <b>
                                        {shippingFee === 0
                                            ? "Miễn phí"
                                            : shippingFee.toLocaleString() + "đ"}
                                    </b>
                                </div>
                            )}

                            {orderDiscount > 0 && (
                                <div className="flex justify-between text-red-500">
                                    <span>Giảm giá:</span>
                                    <b>
                                        -{orderDiscount.toLocaleString()}đ
                                    </b>
                                </div>
                            )}

                            <div className="divider my-3"/>

                            <div className="flex justify-between font-semibold text-lg mt-2">
                                <span>Thực thu:</span>
                                <b className="text-red-600">{grandTotal.toLocaleString()}đ</b>
                            </div>
                        </div>
                    </div>

                    {/* PHƯƠNG THỨC THANH TOÁN */}
                    <div className="card shadow-sm">
                        <h3 className="card-title mb-4">Phương thức thanh toán</h3>
                        <div className="space-y-3">

                            <label
                                className="flex items-center gap-3 cursor-pointer p-3 border-2 rounded-lg transition-all hover:bg-gray-50 hover:border-blue-300 hover:shadow-sm">
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    className="w-5 h-5 text-blue-600"
                                    checked={paymentMethod === "CASH"}
                                    onChange={() => setPaymentMethod("CASH")}
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-800">Tiền mặt</div>
                                </div>
                            </label>

                            <label
                                className="flex items-center gap-3 cursor-pointer p-3 border-2 rounded-lg transition-all hover:bg-gray-50 hover:border-blue-300 hover:shadow-sm">
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    className="w-5 h-5 text-blue-600"
                                    checked={paymentMethod === "TRANSFER"}
                                    onChange={() => setPaymentMethod("TRANSFER")}
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-800">Chuyển khoản</div>
                                </div>
                            </label>
                        </div>

                        {/* HIỂN THỊ QR CODE KHI CHỌN CHUYỂN KHOẢN */}
                        {paymentMethod === "TRANSFER" && orderCode && (
                            <div
                                className="mt-4 p-5 border-2 border-blue-300 rounded-xl bg-gradient-to-br from-blue-50 to-white shadow-md">
                                <div className="text-center mb-3">
                                    <div className="font-semibold text-sm mb-1">Mã đơn hàng:</div>
                                    <div className="text-xl font-bold text-blue-600 mb-2">{orderCode}</div>
                                    <div className="text-sm text-gray-600">
                                        Số tiền: <span
                                        className="font-bold text-red-600">{grandTotal.toLocaleString()}đ</span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-4">
                                    <div className="bg-white p-4 rounded-lg shadow-sm">
                                        <QRCodeDisplay value={orderCode} size={220}/>
                                    </div>

                                    {!isPaymentConfirmed && (
                                        <button
                                            type="button"
                                            className="btn bg-green-500 hover:bg-green-600 text-white w-full mt-2 py-3 text-base font-semibold"
                                            onClick={() => {
                                                setIsPaymentConfirmed(true);
                                                updateOrder({
                                                    relationships: {
                                                        paymentDetail: {
                                                            id: Date.now(),
                                                            paymentType: "TRANSFER",
                                                        },
                                                    },
                                                    attributes: {
                                                        orderStatus: "PAID"
                                                    }
                                                });
                                            }}
                                        >
                                            ✓ Đã nhận tiền
                                        </button>
                                    )}

                                    {isPaymentConfirmed && (
                                        <div
                                            className="w-full p-4 bg-green-100 border-2 border-green-400 rounded-lg text-center">
                                            <div className="text-green-700 font-semibold text-base">✓ Đã xác nhận nhận
                                                tiền
                                            </div>
                                            <div className="text-xs text-green-600 mt-1">Đơn hàng sẽ được tạo với trạng
                                                thái "Đã thanh toán"
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* NÚT XÁC NHẬN ĐƠN HÀNG */}
                    <button
                        type="button"
                        className="btn btn-primary w-full py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow"
                        onClick={async () => {
                            const order = structuredClone(activeOrder);
                            if (!order.relationships.receiptDetails || order.relationships.receiptDetails.length === 0) return;

                            // Kiểm tra nếu chọn chuyển khoản nhưng chưa xác nhận
                            if (paymentMethod === "TRANSFER" && !isPaymentConfirmed) {
                                alert("Vui lòng xác nhận đã nhận tiền trước khi tạo đơn hàng!");
                                return;
                            }

                            // Validate thông tin giao hàng nếu chọn chuyển phát
                            if (shippingMethod === "DELIVERY") {
                                if (!order.attributes.customerName || !order.attributes.customerName.trim()) {
                                    alert("Vui lòng nhập tên người nhận!");
                                    return;
                                }
                                if (!order.attributes.customerPhone || !order.attributes.customerPhone.trim()) {
                                    alert("Vui lòng nhập số điện thoại!");
                                    return;
                                }
                                if (!order.attributes.customerAddress || !order.attributes.customerAddress.trim()) {
                                    alert("Vui lòng nhập địa chỉ giao hàng!");
                                    return;
                                }
                            }
                                
                            order.attributes.hasShipping = shippingMethod === "DELIVERY";
                            order.id = 0;
                            order.attributes.discount = order.discount;
                            order.attributes.discountAmount = order.discountAmount;
                            // Bán hàng tại quầy - KHÔNG có VAT
                            order.attributes.tax = 0;
                            order.relationships.employee = {
                                id: user!.id
                            }

                            // Cập nhật payment detail - ưu tiên lấy từ activeOrder nếu đã có, nếu không thì dùng state
                            const existingPaymentDetail = activeOrder.relationships?.paymentDetail;
                            if (existingPaymentDetail && existingPaymentDetail.paymentType) {
                                // Dùng paymentDetail đã được update từ nút "Đã nhận tiền"
                                order.relationships.paymentDetail = existingPaymentDetail;
                            } else {
                                // Tạo mới từ state
                                order.relationships.paymentDetail = {
                                    id: Date.now(),
                                    paymentType: paymentMethod,
                                };
                            }

                            // Set order status dựa trên phương thức thanh toán
                            const finalPaymentType = existingPaymentDetail?.paymentType || paymentMethod;
                            if (finalPaymentType === "CASH") {
                                order.attributes.orderStatus = "PENDING";
                            } else if (finalPaymentType === "TRANSFER" && isPaymentConfirmed) {
                                order.attributes.orderStatus = "PAID";
                            }

                            console.log(order);
                            console.log(serializeReceipt(order));
                            const saved = await receiptCreate.mutateAsync(order);
                            console.log(saved.data.id);

                            // Cập nhật orderCode với ID thật từ backend nếu cần
                            if (saved.data.id) {
                                setOrderCode(`ORD${saved.data.id}`);
                            }

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

        </div>
    )
        ;
}