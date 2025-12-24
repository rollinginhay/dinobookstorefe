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
            `http://localhost:8080/v1/receipts/list?e=true&page=${page}&limit=${limit}`,
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

            return {
                id: item.id,

                // tránh crash: fallback "UNKNOWN"
                status: a.orderStatus || "UNKNOWN",

                // FE muốn ONLINE / POS
                orderType: a.orderType === "DIRECT"
                    ? "POS"
                    : a.orderType || "UNKNOWN",

                // FE muốn tổng tiền — fallback 0 để không toLocaleString(undefined)
                totalAmount: a.grandTotal ?? 0,

                // FE muốn ngày tạo
                orderDate: a.createdAt ?? "",

                // FE muốn khách hàng & sđt
                customerName: a.customerName ?? "Khách lẻ",
                customerPhone: a.customerPhone ?? "-",
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

        const items = receiptDetails.map((rd: any) => {
            const bookDetailId = rd.relationships?.bookDetail?.data?.id;
            const bd = bookDetails.find((x) => x.id === bookDetailId);
            const bookId = bd?.relationships?.book?.data?.id;
            const book = books.find((x) => x.id === bookId);

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

        return {
            id: Number(receipt.id),
            status: attrs.orderStatus || "PENDING",
            orderType:
                attrs.orderType === "DIRECT"
                    ? "POS"
                    : attrs.orderType || "ONLINE",
            hasShipping: Boolean(attrs.hasShipping),

            customer: {
                name: attrs.customerName ?? "",
                phone: attrs.customerPhone ?? "",
                address: attrs.customerAddress ?? "",
                note: "",
            },

            items,
            discount: attrs.discount ?? 0,
            shippingFee: attrs.serviceCost ?? 0,
            taxPercent: attrs.tax ?? 0,
            amountPaid: attrs.grandTotal ?? 0, // BE chưa tách tiền đã trả, tạm dùng grandTotal
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
    }

};
