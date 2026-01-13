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

        // ✅ Fetch detail cho từng item để lấy giá đúng (tính từ originalPrice)
        const billsWithCorrectPrice = await Promise.all(
            json.data.map(async (item: any) => {
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
                }

                // ✅ Fetch detail để tính lại grandTotal từ giá đã giảm
                let correctGrandTotal = a.grandTotal ?? 0;
                try {
                    const detailRes = await BillService.getById(Number(item.id));
                    // ✅ SỬA: Tính từ pricePerUnit (giá đã giảm) thay vì originalPrice
                    const correctSubTotal = detailRes.items.reduce(
                        (sum: number, it: any) => sum + it.pricePerUnit * it.quantity,
                        0
                    );
                    correctGrandTotal = correctSubTotal + detailRes.shippingFee - detailRes.discount;
                } catch (e) {
                    // Nếu fetch detail fail, dùng giá từ backend
                    console.warn(`Failed to fetch detail for receipt ${item.id}, using backend value:`, e);
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

                    // ✅ SỬA: Dùng giá đã tính lại từ pricePerUnit (giá đã giảm)
                    totalAmount: correctGrandTotal,

                    // FE muốn ngày tạo
                    orderDate: a.createdAt ?? "",

                    // FE muốn khách hàng & sđt
                    customerName: a.customerName ?? "Khách lẻ",
                    customerPhone: a.customerPhone ?? "-",

                    // Return request status
                    returnStatus: returnStatus,

                    // Note field để kiểm tra refund info
                    note: note,
                };
            })
        );

        return billsWithCorrectPrice;
    },

    // ============================================
    // GET RECEIPT DETAIL — /v1/receipt/{id}
    // ============================================
    async getById(id: number) {
        const res = await fetch(`http://localhost:8080/v1/receipt/${id}?e=true`, {
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
        const bookCopies = included.filter((x) => x.type === "bookCopy"); // ✅ Lấy bookCopy từ included

        // CUSTOMER (user) để lấy mã KH + email
        const customerRelId =
            receipt.relationships?.customer?.data?.id ??
            receipt.relationships?.customer?.data?.ID; // fallback phòng BE viết hoa

        const customerUser = customerRelId
            ? included.find(
                  (x) => x.type === "user" && String(x.id) === String(customerRelId)
              )
            : null;

        // Fetch book for a bookDetail - try multiple approaches với ?e=true
        const fetchBookForBookDetail = async (bookDetailId: string | number) => {
            try {
                // First, try to get book ID from bookDetail relationship với ?e=true
                const bookDetailRes = await fetch(`http://localhost:8080/v1/bookDetail/${bookDetailId}?e=true`, {
                    headers: {
                        "Content-Type": "application/vnd.api+json",
                        ...getAuthHeader(),
                    },
                    cache: "no-store",
                });
                if (bookDetailRes.ok) {
                    const bookDetailJson = await bookDetailRes.json();
                    const bookDetailData = bookDetailJson.data;
                    const bookDetailIncluded = bookDetailJson.included || [];
                    
                    // Tìm book trong included trước
                    let book = bookDetailIncluded.find((x: any) => x.type === "book");
                    
                    if (book) {
                        return book;
                    }
                    
                    // Nếu không có trong included, thử từ relationships
                    const bookIdFromRel = bookDetailData?.relationships?.book?.data?.id;
                    if (bookIdFromRel) {
                        const bookRes = await fetch(`http://localhost:8080/v1/book/${bookIdFromRel}?e=true`, {
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
                
                // Fallback: try fetching book directly using bookDetailId với ?e=true
                const bookRes = await fetch(`http://localhost:8080/v1/book/${bookDetailId}?e=true`, {
                    headers: {
                        "Content-Type": "application/vnd.api+json",
                        ...getAuthHeader(),
                    },
                    cache: "no-store",
                });
                if (bookRes.ok) {
                    const bookJson = await bookRes.json();
                    const bookData = bookJson.data;
                    
                    // Kiểm tra xem book này có bookCopies chứa bookDetailId không
                    const bookCopies = bookData?.relationships?.bookCopies?.data || [];
                    const hasThisBookDetail = bookCopies.some(
                        (bc: any) => String(bc.id) === String(bookDetailId)
                    );
                    
                    // Hoặc nếu book ID trùng với bookDetailId (cùng ID)
                    const isSameId = String(bookData?.id) === String(bookDetailId);
                    
                    if (hasThisBookDetail || isSameId) {
                        return bookData;
                    }
                    
                    // Thử tìm bookDetail trong included của book response
                    const included = bookJson.included || [];
                    const bookDetailInIncluded = included.find(
                        (x: any) => x.type === "bookDetail" && String(x.id) === String(bookDetailId)
                    );
                    if (bookDetailInIncluded) {
                        return bookData;
                    }
                }
            } catch (e) {
                console.error(`Failed to fetch book for bookDetail ${bookDetailId}:`, e);
            }
            return null;
        };

        // Process items with async book fetching
        const itemsPromises = receiptDetails.map(async (rd: any) => {
            // ✅ Lấy bookDetailId từ nhiều nguồn (bookDetail hoặc bookCopy)
            let bookDetailId = rd.relationships?.bookDetail?.data?.id 
                || rd.relationships?.bookCopy?.data?.id
                || rd.attributes?.bookDetailId
                || rd.attributes?.bookCopyId;
            
            // ✅ Ưu tiên tìm bookCopy từ included (giống POS page)
            let bookCopy: any = null;
            if (bookDetailId) {
                bookCopy = bookCopies.find((x) => String(x.id) === String(bookDetailId));
            }
            
            // Nếu không có bookCopy trong included, thử fetch receiptDetail trực tiếp
            if (!bookCopy && rd.id) {
                try {
                    const rdRes = await fetch(`http://localhost:8080/v1/receiptDetail/${rd.id}?e=true`, {
                        headers: {
                            "Content-Type": "application/vnd.api+json",
                            ...getAuthHeader(),
                        },
                        cache: "no-store",
                    });
                    if (rdRes.ok) {
                        const rdJson = await rdRes.json();
                        const rdData = rdJson.data;
                        const rdIncluded = rdJson.included || [];
                        bookDetailId = rdData?.relationships?.bookDetail?.data?.id
                            || rdData?.relationships?.bookCopy?.data?.id
                            || rdData?.attributes?.bookDetailId
                            || rdData?.attributes?.bookCopyId;
                        
                        // Tìm bookCopy trong included của receiptDetail
                        if (bookDetailId) {
                            bookCopy = rdIncluded.find((x: any) => x.type === "bookCopy" && String(x.id) === String(bookDetailId));
                        }
                    }
                } catch (e) {
                    console.error(`Failed to fetch receiptDetail ${rd.id}:`, e);
                }
            }
            
            const bd = bookDetails.find((x) => x.id === bookDetailId);
            
            // ✅ Nếu có bookCopy, ưu tiên dùng thông tin từ bookCopy (giống POS page)
            let bookTitle = "";
            let bookImageUrl = "";
            let bookFormat = "";
            
            if (bookCopy) {
                // Lấy từ bookCopy (có thể có attributes hoặc không)
                const bcAttrs = bookCopy.attributes || bookCopy;
                bookFormat = bcAttrs.bookFormat || "";
                
                // Tìm book từ bookCopy relationship
                const bookIdFromCopy = bookCopy.relationships?.book?.data?.id;
                if (bookIdFromCopy) {
                    const book = books.find((x) => String(x.id) === String(bookIdFromCopy));
                    if (book) {
                        bookTitle = book.attributes?.title || "";
                        bookImageUrl = book.attributes?.imageUrl || "";
                    }
                }
                
                // Nếu không tìm thấy book, thử fetch
                if (!bookTitle && bookIdFromCopy) {
                    try {
                        const bookRes = await fetch(`http://localhost:8080/v1/book/${bookIdFromCopy}?e=true`, {
                            headers: {
                                "Content-Type": "application/vnd.api+json",
                                ...getAuthHeader(),
                            },
                            cache: "no-store",
                        });
                        if (bookRes.ok) {
                            const bookJson = await bookRes.json();
                            const book = bookJson.data;
                            bookTitle = book?.attributes?.title || "";
                            bookImageUrl = book?.attributes?.imageUrl || "";
                        }
                    } catch (e) {
                        console.error(`Failed to fetch book for bookCopy:`, e);
                    }
                }
            }
            
            // ✅ Fallback: Nếu không có bookCopy, dùng logic cũ
            if (!bookTitle || !bookImageUrl) {
                // Try to find book from included first
                let bookId = bd?.relationships?.book?.data?.id;
                let book = books.find((x) => x.id === bookId);
                
                // If not found in included, try reverse lookup through bookCopies
                if (!book && bd && books.length > 0) {
                    book = books.find((b: any) => {
                        const bookCopies = b.relationships?.bookCopies?.data || [];
                        return bookCopies.some((bc: any) => String(bc.id) === String(bookDetailId));
                    });
                    if (book) {
                        bookId = book.id;
                    }
                }

                // If still not found, fetch book separately using bookDetailId
                if (!book && bookDetailId) {
                    book = await fetchBookForBookDetail(bookDetailId);
                }

                // ✅ Nếu vẫn chưa có book, thử fetch bookDetail trực tiếp để lấy book
                if (!book && bookDetailId) {
                    try {
                        const bdRes = await fetch(`http://localhost:8080/v1/bookDetail/${bookDetailId}?e=true`, {
                            headers: {
                                "Content-Type": "application/vnd.api+json",
                                ...getAuthHeader(),
                            },
                            cache: "no-store",
                        });
                        if (bdRes.ok) {
                            const bdJson = await bdRes.json();
                            const bdData = bdJson.data;
                            const bdIncluded = bdJson.included || [];
                            
                            // Tìm book trong included
                            book = bdIncluded.find((x: any) => x.type === "book");
                            
                            // Nếu không có trong included, thử từ relationships
                            if (!book) {
                                const bookIdFromBd = bdData?.relationships?.book?.data?.id;
                                if (bookIdFromBd) {
                                    const bookRes = await fetch(`http://localhost:8080/v1/book/${bookIdFromBd}?e=true`, {
                                        headers: {
                                            "Content-Type": "application/vnd.api+json",
                                            ...getAuthHeader(),
                                        },
                                        cache: "no-store",
                                    });
                                    if (bookRes.ok) {
                                        const bookJson = await bookRes.json();
                                        book = bookJson.data;
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.error(`Failed to fetch bookDetail ${bookDetailId}:`, e);
                    }
                }
                
                // Cập nhật thông tin từ book nếu chưa có
                if (book && !bookTitle) {
                    bookTitle = book?.attributes?.title || "";
                }
                if (book && !bookImageUrl) {
                    bookImageUrl = book?.attributes?.imageUrl || "";
                }
            }
            
            // ✅ Tạo tên sản phẩm: title + bookFormat (giống POS page)
            const name = bookTitle 
                ? (bookFormat ? `${bookTitle} - ${bookFormat}` : bookTitle)
                : (bookFormat ? `Sách - ${bookFormat}` : "Sách");

            // ✅ Lấy giá gốc từ bookDetail (salePrice) thay vì giá đã giảm từ receiptDetail
            // pricePerUnit trong receiptDetail là giá ĐÃ GIẢM (sau khi áp dụng campaign giảm giá sản phẩm)
            // Để tính tổng tiền hàng gốc, cần dùng salePrice từ bookDetail
            const originalPrice = bd?.attributes?.salePrice ?? rd.attributes?.pricePerUnit ?? 0;
            const discountedPrice = rd.attributes?.pricePerUnit ?? 0; // Giá đã giảm (nếu có)
            
            // ✅ Lấy ảnh: ưu tiên bookImageUrl từ bookCopy, sau đó bd.imageUrl, cuối cùng là default
            let imageUrl = bookImageUrl || bd?.attributes?.imageUrl || "/default-book.png";
            
            return {
                id: Number(rd.id), // id receiptDetail
                bookDetailId: Number(bookDetailId) || 0,
                name: name || "Sách - Bìa mềm", // Fallback nếu không có tên
                pricePerUnit: discountedPrice, // Giá đã giảm để hiển thị
                originalPrice: originalPrice, // ✅ Giá gốc để tính tổng tiền hàng
                quantity: rd.attributes?.quantity ?? 1,
                stock: bd?.attributes?.stock ?? 0,
                image: imageUrl,
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
                "Content-Type": "application/json",
                ...getAuthHeader(),
            },
            cache: "no-store",
        });

        if (!res.ok) {
            const text = await res.text();
            console.error("API error response:", text);
            throw new Error("Không lấy được lịch sử đơn hàng");
        }
        
        let json;
        try {
            const text = await res.text();
            console.log("Raw API response:", text);
            json = JSON.parse(text);
        } catch (e) {
            console.error("JSON parse error:", e);
            throw new Error("Không thể parse JSON từ API");
        }

        console.log("Parsed JSON:", json);

        // ✅ API trả về List<ReceiptHistory> trực tiếp (array of objects)
        // Mỗi object có thể có nested objects (receipt, user, etc.) nhưng ta chỉ cần fields cơ bản
        const historyItems = Array.isArray(json) ? json : (json.data || []);

        console.log("History items (raw):", historyItems);
        console.log("First item structure:", historyItems[0]);

        return historyItems.map((item: any) => {
            // Parse từ entity trực tiếp - chỉ lấy fields cần thiết
            // Ignore nested objects như receipt, user, etc.
            // Nếu item là nested object (có receipt bên trong), vẫn lấy fields ở top level
            const result = {
                oldStatus: item.oldStatus || item.old_status || null,
                newStatus: item.newStatus || item.new_status || null,
                createdAt: item.createdAt || item.created_at || "",
                updatedAt: item.updatedAt || item.updated_at || item.createdAt || item.created_at || "",
                actorName: item.actorName || item.actor_name || "System",
            };
            console.log("Parsed item:", result);
            return result;
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