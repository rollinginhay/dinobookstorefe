// src/app/(admin)/bill/bill.service.ts
function getAuthHeader(): HeadersInit {
    const token = localStorage.getItem("auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export const BillService = {
    // ============================================
    // GET LIST HÓA ĐƠN
    // ============================================
    async getList(page = 0, limit = 50) {
        const res = await fetch(
            // Bỏ filter e=true để không bỏ sót hóa đơn mới; sort theo updatedAt desc
            `http://localhost:8080/v1/receipts/list?page=${page}&limit=${limit}&sort=updatedAt;desc`,
            {
                headers: {
                    "Content-Type": "application/vnd.api+json",
                    ...getAuthHeader(),
                },

                cache: "no-store",
            }
        );

        if (!res.ok) throw new Error("Failed to load receipts");

        const json = await res.json();

        return json.data.map((item: any) => {
            const a = item.attributes || {};
            const note = a.note || "";

            // Parse return request status từ note
            let returnStatus: "REQUESTED" | "REJECTED" | "APPROVED" | null = null;
            if (note && note.includes("RETURN_REQUEST:")) {
                if (note.includes("RETURN_APPROVED")) {
                    returnStatus = "APPROVED";
                } else if (note.includes("RETURN_REJECTED")) {
                    returnStatus = "REJECTED";
                } else {
                    returnStatus = "REQUESTED";
                }
                // Debug log
                console.log(`Receipt ${item.id}: note = "${note.substring(0, 100)}", returnStatus = ${returnStatus}`);
            }

            return {
                id: item.id,

                // tránh crash: fallback "UNKNOWN"
                status: a.orderStatus || "UNKNOWN",

                // FE muốn ONLINE / POS
                orderType: a.orderType === "DIRECT"
                    ? "POS"
                    : a.orderType === "ONLINE"
                    ? "ONLINE"
                    : a.orderType || "UNKNOWN",

                // FE muốn tổng tiền — fallback 0 để không toLocaleString(undefined)
                totalAmount: a.grandTotal ?? 0,

                // FE muốn ngày tạo
                orderDate: a.createdAt ?? "",

                // FE muốn khách hàng & sđt
                customerName: a.customerName ?? "Khách lẻ",
                customerPhone: a.customerPhone ?? "-",

                // Return request status
                returnStatus: returnStatus,
            };
        });
    },

    // ============================================
    // GET RECEIPT DETAIL — /v1/receipt/{id}
    // ============================================
    async getById(id: number) {
        const res = await fetch(`http://localhost:8080/v1/receipt/${id}`, {
            headers: {
                "Content-Type": "application/vnd.api+json",
                ...getAuthHeader(),
            },

            cache: "no-store",
        });

        if (!res.ok) throw new Error("Không lấy được chi tiết hóa đơn");
        const json = await res.json();

        const receipt = json.data;
        const attrs = receipt.attributes || {};
        const included: any[] = json.included || [];

        // --- tách included ---
        const receiptDetails = included.filter((x) => x.type === "receiptDetail");
        const bookDetails = included.filter((x) => x.type === "bookDetail");
        const books = included.filter((x) => x.type === "book");

        // CUSTOMER (user) để lấy mã KH + email
        const customerRelId =
            receipt.relationships?.customer?.data?.id ??
            receipt.relationships?.customer?.data?.ID; // fallback phòng BE viết hoa

        const customerUser = customerRelId
            ? included.find(
                  (x) => x.type === "user" && String(x.id) === String(customerRelId)
              )
            : null;

        // Fetch book for a bookDetail - try multiple approaches
        const fetchBookForBookDetail = async (bookDetailId: string | number) => {
            try {
                // First, try to get book ID from bookDetail relationship
                const bookDetailRes = await fetch(`http://localhost:8080/v1/bookDetail/${bookDetailId}`, {
                    headers: {
                        "Content-Type": "application/vnd.api+json",
                        ...getAuthHeader(),
                    },
                    cache: "no-store",
                });
                if (bookDetailRes.ok) {
                    const bookDetailJson = await bookDetailRes.json();
                    const bookDetailData = bookDetailJson.data;
                    const bookIdFromRel = bookDetailData?.relationships?.book?.data?.id;
                    
                    if (bookIdFromRel) {
                        const bookRes = await fetch(`http://localhost:8080/v1/book/${bookIdFromRel}`, {
                            headers: {
                                "Content-Type": "application/vnd.api+json",
                                ...getAuthHeader(),
                            },
                            cache: "no-store",
                        });
                        if (bookRes.ok) {
                            const bookJson = await bookRes.json();
                            return bookJson.data;
                        }
                    }
                }
                
                // Fallback: try fetching book directly using bookDetailId (in case they're the same)
                const bookRes = await fetch(`http://localhost:8080/v1/book/${bookDetailId}`, {
                    headers: {
                        "Content-Type": "application/vnd.api+json",
                        ...getAuthHeader(),
                    },
                    cache: "no-store",
                });
                if (bookRes.ok) {
                    const bookJson = await bookRes.json();
                    return bookJson.data;
                }
            } catch (e) {
                console.error(`Failed to fetch book for bookDetail ${bookDetailId}:`, e);
            }
            return null;
        };

        // Process items with async book fetching
        const itemsPromises = receiptDetails.map(async (rd: any) => {
            const bookDetailId = rd.relationships?.bookDetail?.data?.id;
            const bd = bookDetails.find((x) => x.id === bookDetailId);
            
            // Try to find book from included first
            let bookId = bd?.relationships?.book?.data?.id;
            let book = books.find((x) => x.id === bookId);
            
            // If not found in included, try reverse lookup through bookCopies
            if (!book && bd && books.length > 0) {
                book = books.find((b: any) => {
                    const bookCopies = b.relationships?.bookCopies?.data || [];
                    return bookCopies.some((bc: any) => bc.id === bookDetailId);
                });
                if (book) {
                    bookId = book.id;
                }
            }

            // If still not found, fetch book separately using bookDetailId
            if (!book && bookDetailId) {
                book = await fetchBookForBookDetail(bookDetailId);
            }

            const name =
                (book?.attributes?.title ?? "Sách") +
                (bd?.attributes?.bookFormat
                    ? ` - ${bd.attributes.bookFormat}`
                    : "");

            return {
                id: Number(rd.id), // id receiptDetail
                bookDetailId: Number(bookDetailId),
                name,
                pricePerUnit: rd.attributes?.pricePerUnit ?? 0,
                quantity: rd.attributes?.quantity ?? 1,
                stock: bd?.attributes?.stock ?? 0,
                image: book?.attributes?.imageUrl ?? "/default-book.png",
            };
        });

        const items = await Promise.all(itemsPromises);

        return {
            id: Number(receipt.id),
            status: attrs.orderStatus || "PENDING",
            orderType:
                attrs.orderType === "DIRECT"
                    ? "POS"
                    : attrs.orderType === "ONLINE"
                    ? "ONLINE"
                    : attrs.orderType || "UNKNOWN",
            hasShipping: Boolean(attrs.hasShipping),

            customer: {
                // Mã KH: dùng ID user → format KH + số (VD: KH49). Nếu không có user thì null để FE hiển thị "-"
                code: customerUser && customerUser.id != null
                    ? `KH${customerUser.id}`
                    : null,
                name: attrs.customerName ?? "",
                // Email: lấy từ user trong included; nếu không có thì null (POS / khách lẻ)
                email: customerUser?.attributes?.email ?? null,
                phone: attrs.customerPhone ?? "",
                address: attrs.customerAddress ?? "",
                note: attrs.note ?? "",
            },

            items,

            // Ưu đãi & voucher: chỉ là số tiền giảm, FE sẽ tự ẩn nếu = 0
            discount: attrs.discount ?? 0,
            voucher: attrs.voucher ?? 0,

            shippingFee: attrs.serviceCost ?? 0,

            // Thuế hiện tại không hiển thị ở UI chi tiết hóa đơn,
            // nhưng vẫn trả ra nếu sau này cần dùng.
            taxPercent: attrs.tax ?? 0,

            // Thành tiền cuối cùng khách phải trả (grandTotal của BE)
            amountPaid: attrs.grandTotal ?? 0,
            
            // Ngày tạo và ngày cập nhật
            createdAt: attrs.createdAt ?? "",
            updatedAt: attrs.updatedAt ?? attrs.createdAt ?? "",
            orderDate: attrs.createdAt ?? "",

            // Ghi chú đơn hàng (nếu BE có field)
            orderNote: attrs.orderNote ?? attrs.note ?? "",
        };
    },

    // ============================================
    // UPDATE RECEIPT (JSON:API) — PUT /v1/receipt/update
    // ============================================
    async updateReceipt(id: number, payload: any) {
        const body = {
            data: {
                type: "receipt",
                id: String(id),
                attributes: payload.attributes || {},
                relationships: payload.relationships || {},
            },
        };

        const res = await fetch(`http://localhost:8080/v1/receipt/update`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/vnd.api+json",
                ...getAuthHeader(),
            },

            body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error("Cập nhật hóa đơn thất bại");
        return res.json();
    },

    // ============================================
// UPDATE STATUS — API MỚI PATCH /v1/receipt/{id}/status
// ============================================
    async updateStatus(id: number, status: string) {
        const res = await fetch(`http://localhost:8080/v1/receipt/${id}/status`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/vnd.api+json",
                ...getAuthHeader(),
            },

            body: JSON.stringify({ orderStatus: status }),
        });

        if (!res.ok) throw new Error("Cập nhật trạng thái thất bại");
        return res.json();
    },

    // ============================================
    // GET ORDER HISTORY — GET /v1/receipt/{id}/history
    // ============================================
    async getHistory(id: number) {
        const res = await fetch(`http://localhost:8080/v1/receipt/${id}/history`, {
            headers: {
                "Content-Type": "application/vnd.api+json",
                ...getAuthHeader(),
            },
            cache: "no-store",
        });

        if (!res.ok) throw new Error("Không lấy được lịch sử đơn hàng");
        const json = await res.json();

        // Parse response based on API structure
        // Assuming the API returns data in JSON:API format
        const historyItems = json.data || json.history || [];

        return historyItems.map((item: any) => {
            const attrs = item.attributes || item;
            return {
                id: item.id || attrs.id,
                status: attrs.status || attrs.orderStatus || "",
                statusLabel: attrs.statusLabel || attrs.status || "",
                timestamp: attrs.timestamp || attrs.createdAt || attrs.time || "",
                confirmer: attrs.confirmer || attrs.confirmedBy || attrs.userName || "",
                note: attrs.note || attrs.description || "",
                icon: attrs.icon || "checkmark", // default icon
            };
        });
    },

    // ============================================
    // GET PAYMENT HISTORY (paymentDetail) — /v1/receipt/{id}/relationships/paymentDetail
    // ============================================
    async getPaymentHistory(id: number) {
        const res = await fetch(
            `http://localhost:8080/v1/receipt/${id}/relationships/paymentDetail`,
            {
                headers: {
                    "Content-Type": "application/vnd.api+json",
                    ...getAuthHeader(),
                },
                cache: "no-store",
            }
        );

        if (!res.ok) throw new Error("Không lấy được lịch sử thanh toán");

        const json = await res.json();
        const data: any[] = json.data || [];

        return data.map((item) => {
            const attrs = item.attributes || {};

            return {
                id: Number(item.id),
                amount: attrs.amount ?? 0,
                paymentType: attrs.paymentType || "CASH",
                createdAt: attrs.createdAt || "",
                note: attrs.note || "",
                provider: attrs.provider || "",
                providerId: attrs.providerId || "",
            };
        });
    },

};
