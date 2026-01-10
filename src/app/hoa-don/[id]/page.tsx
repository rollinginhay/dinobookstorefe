"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function HoaDon() {
  const params = useParams();
  const receiptId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCombos, setExpandedCombos] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!receiptId) return;

    const fetchReceipt = async () => {
      try {
        // 1) LẤY HÓA ĐƠN VỚI ?e=true ĐỂ LẤY ĐẦY ĐỦ DỮ LIỆU
        const resReceipt = await fetch(
          `http://localhost:8080/v1/receipt/${receiptId}?e=true`
        );
        if (!resReceipt.ok) throw new Error("Không lấy được hóa đơn");
        const receiptJson = await resReceipt.json();

        const receipt = receiptJson.data;
        const attrs = receipt.attributes || {};
        const included: any[] = receiptJson.included || [];

        // Debug: Log dữ liệu nhận được
        console.log("📦 Receipt data:", receipt);
        console.log("📦 Receipt attributes:", attrs);
        console.log("📦 Included items:", included);
        console.log("📦 Receipt relationships:", receipt.relationships);

        // Tách included theo type
        let receiptDetails = included.filter((x) => x.type === "receiptDetail");
        let bookDetails = included.filter((x) => x.type === "bookDetail");
        const books = included.filter((x) => x.type === "book");

        // Nếu receiptDetails không có relationships, thử fetch từ relationships endpoint
        if (receiptDetails.length > 0 && !receiptDetails[0].relationships?.bookDetail && !receiptDetails[0].relationships?.bookCopy) {
          try {
            console.log("🔍 Fetching receiptDetails từ relationships endpoint");
            const receiptDetailsRes = await fetch(
              `http://localhost:8080/v1/receipt/${receiptId}/relationships/receiptDetail?e=true`
            );
            if (receiptDetailsRes.ok) {
              const receiptDetailsJson = await receiptDetailsRes.json();
              const receiptDetailsFromRel = receiptDetailsJson.data || [];
              const receiptDetailsIncluded = receiptDetailsJson.included || [];
              
              // Merge receiptDetails với relationships đầy đủ
              receiptDetails = receiptDetails.map((rd: any) => {
                const rdFromRel = receiptDetailsFromRel.find((r: any) => String(r.id) === String(rd.id));
                if (rdFromRel && rdFromRel.relationships) {
                  return { ...rd, relationships: { ...rd.relationships, ...rdFromRel.relationships } };
                }
                return rd;
              });
              
              // Thêm bookDetails từ included nếu có
              const bookDetailsFromRel = receiptDetailsIncluded.filter((x: any) => x.type === "bookDetail");
              if (bookDetailsFromRel.length > 0) {
                bookDetails.push(...bookDetailsFromRel);
              }
              
              console.log("🔍 ReceiptDetails sau khi fetch từ relationships:", receiptDetails);
            }
          } catch (err) {
            console.error("Lỗi fetch receiptDetails từ relationships:", err);
          }
        }

        console.log("📦 ReceiptDetails count:", receiptDetails.length);
        console.log("📦 ReceiptDetails:", receiptDetails);
        console.log("📦 BookDetails count:", bookDetails.length);
        console.log("📦 Books count:", books.length);

        // Lấy thông tin khách hàng
        const customerRelId =
          receipt.relationships?.customer?.data?.id ??
          receipt.relationships?.customer?.data?.ID;
        const customerUser = customerRelId
          ? included.find(
              (x) => x.type === "user" && String(x.id) === String(customerRelId)
            )
          : null;

        // Đọc combo metadata từ localStorage
        const receiptComboMetadataStr = localStorage.getItem(`receiptCombo_${receiptId}`);
        const receiptComboMetadata: any[] = receiptComboMetadataStr 
          ? JSON.parse(receiptComboMetadataStr) 
          : [];
        
        console.log("📦 Combo metadata từ localStorage:", receiptComboMetadata);
        console.log("📦 ReceiptDetails để map:", receiptDetails);
        
        // Map receiptDetailIds với combo
        // CHỈ map khi combo có receiptDetailIds rõ ràng từ khi tạo đơn
        // KHÔNG tự động map bằng bookDetailIds vì sẽ gộp nhầm sách lẻ vào combo
        // (ví dụ: mua combo + sách lẻ có cùng bookDetailId → sách lẻ sẽ bị gộp vào combo nếu map bằng bookDetailIds)
        const receiptDetailIdToComboMap: Record<string, any> = {};
        
        receiptComboMetadata.forEach((combo) => {
          const comboReceiptDetailIds = combo.receiptDetailIds || [];
          // CHỈ map khi có receiptDetailIds và length > 0
          // Nếu không có, không map gì cả để tránh gộp nhầm sách lẻ
          if (comboReceiptDetailIds.length > 0) {
            comboReceiptDetailIds.forEach((rdId: string) => {
              receiptDetailIdToComboMap[rdId] = combo;
            });
          }
          // BỎ phần else: không tự động map bằng bookDetailIds
          // Vì nếu làm vậy, sách lẻ có bookDetailId trùng với combo sẽ bị gộp nhầm vào combo
        });
        
        // Lưu lại combo metadata đã được map với receiptDetailIds
        if (receiptComboMetadata.length > 0) {
          localStorage.setItem(`receiptCombo_${receiptId}`, JSON.stringify(receiptComboMetadata));
        }

        // Lấy danh sách sản phẩm (bao gồm cả combo)
        const productList = await Promise.all(
          receiptDetails.map(async (rd: any) => {
            // Lấy bookDetailId từ relationships (bookDetail hoặc bookCopy) hoặc attributes của receiptDetail
            // Backend có thể dùng bookCopy thay vì bookDetail
            let bookDetailId = rd.relationships?.bookDetail?.data?.id 
              || rd.relationships?.bookCopy?.data?.id
              || rd.attributes?.bookDetailId
              || rd.attributes?.bookCopy;
            
            // Nếu không có trong relationships hoặc attributes, thử fetch receiptDetail riêng để lấy relationship
            if (!bookDetailId && rd.id) {
              try {
                console.log("🔍 Fetching receiptDetail để lấy bookDetail/bookCopy relationship:", rd.id);
                const receiptDetailRes = await fetch(
                  `http://localhost:8080/v1/receiptDetail/${rd.id}?e=true`
                );
                if (receiptDetailRes.ok) {
                  const receiptDetailJson = await receiptDetailRes.json();
                  bookDetailId = receiptDetailJson.data?.relationships?.bookDetail?.data?.id 
                    || receiptDetailJson.data?.relationships?.bookCopy?.data?.id
                    || receiptDetailJson.data?.attributes?.bookDetailId
                    || receiptDetailJson.data?.attributes?.bookCopy;
                  console.log("🔍 BookDetailId từ receiptDetail fetch:", bookDetailId);
                }
              } catch (err) {
                console.error("Lỗi fetch receiptDetail:", err);
              }
            }
            
            const bd = bookDetails.find((x) => String(x.id) === String(bookDetailId));
            
            console.log("🔍 ReceiptDetail:", rd);
            console.log("🔍 BookDetailId:", bookDetailId);
            console.log("🔍 BookDetail từ included:", bd);
            
            // Tìm book trong included trước
            let book = null;
            const bookIdFromDetail = bd?.relationships?.book?.data?.id;
            
            if (bookIdFromDetail) {
              book = books.find((x) => String(x.id) === String(bookIdFromDetail));
            }
            
            // Nếu không có book trong included, thử fetch book trực tiếp từ bookDetailId
            // (vì book và bookDetail có thể có cùng ID)
            if (!book && bookDetailId) {
              try {
                console.log("🔍 Thử fetch book trực tiếp với ID:", bookDetailId);
                const bookRes = await fetch(
                  `http://localhost:8080/v1/book/${bookDetailId}?e=true`
                );
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
                    book = bookData;
                    console.log("🔍 Book tìm thấy từ bookDetailId:", book);
                  } else {
                    // Thử tìm bookDetail trong included của book response
                    const included = bookJson.included || [];
                    const bookDetailInIncluded = included.find(
                      (x: any) => x.type === "bookDetail" && String(x.id) === String(bookDetailId)
                    );
                    if (bookDetailInIncluded) {
                      book = bookData;
                      console.log("🔍 Book tìm thấy từ included:", book);
                    }
                  }
                }
              } catch (err) {
                console.error("Lỗi fetch book từ bookDetailId:", err);
              }
            }
            
            // Nếu vẫn không có, thử fetch bookDetail và tìm book từ relationships
            if (!book && bookDetailId) {
              try {
                console.log("🔍 Fetching bookDetail để tìm book:", bookDetailId);
                const bookDetailRes = await fetch(
                  `http://localhost:8080/v1/bookDetail/${bookDetailId}?e=true`
                );
                if (bookDetailRes.ok) {
                  const bookDetailJson = await bookDetailRes.json();
                  const bookDetailIncluded = bookDetailJson.included || [];
                  
                  // Tìm book trong included của bookDetail response
                  const bookFromDetail = bookDetailIncluded.find(
                    (x: any) => x.type === "book"
                  );
                  
                  if (bookFromDetail) {
                    book = bookFromDetail;
                    console.log("🔍 Book từ bookDetail included:", book);
                  } else if (bookDetailJson.data?.relationships?.book?.data?.id) {
                    // Nếu có relationship đến book, fetch book
                    const bookIdFromRel = bookDetailJson.data.relationships.book.data.id;
                    const bookRes = await fetch(
                      `http://localhost:8080/v1/book/${bookIdFromRel}?e=true`
                    );
                    if (bookRes.ok) {
                      const bookJson = await bookRes.json();
                      book = bookJson.data;
                      console.log("🔍 Book từ relationships:", book);
                    }
                  } else {
                    // Nếu không có relationship, thử fetch book với cùng ID
                    const bookRes = await fetch(
                      `http://localhost:8080/v1/book/${bookDetailId}?e=true`
                    );
                    if (bookRes.ok) {
                      const bookJson = await bookRes.json();
                      book = bookJson.data;
                      console.log("🔍 Book từ cùng ID:", book);
                    }
                  }
                }
              } catch (err) {
                console.error("Lỗi fetch bookDetail:", err);
              }
            }

            console.log("✅ Final book:", book);
            console.log("✅ Title:", book?.attributes?.title);
            console.log("✅ Image:", book?.attributes?.imageUrl);

            const comboInfo = receiptDetailIdToComboMap[rd.id];

            // ✅ Lấy giá gốc từ bookDetail (salePrice)
            const bookDetailObj = bookDetails.find((bd: any) => String(bd.id) === String(bookDetailId));
            const bookDetailAttrs = bookDetailObj?.attributes || {};
            const originalPrice = bookDetailAttrs.salePrice || rd.attributes?.pricePerUnit || 0;
            const discountedPrice = rd.attributes?.pricePerUnit ?? 0;

            return {
              id: rd.id,
              title: book?.attributes?.title ?? "Sách",
              price: discountedPrice, // Giá đã giảm
              originalPrice: originalPrice, // ✅ Giá gốc (salePrice)
              quantity: rd.attributes?.quantity ?? 1,
              image: book?.attributes?.imageUrl ?? "/default-book.jpg",
              bookDetailId: bookDetailId,
              isCombo: !!comboInfo,
              comboId: comboInfo?.comboId,
              comboName: comboInfo?.comboName,
              comboPrice: comboInfo?.comboPrice,
              comboOriginalPrice: comboInfo?.comboOriginalPrice, // ✅ Giá gốc combo
            };
          })
        );

        // Nhóm các sản phẩm thành combo và items đơn lẻ
        const comboGroups: Record<string, any[]> = {};
        const standaloneItems: any[] = [];
        
        productList.forEach((item: any) => {
          if (item.isCombo && item.comboId) {
            if (!comboGroups[item.comboId]) {
              comboGroups[item.comboId] = [];
            }
            comboGroups[item.comboId].push(item);
          } else {
            standaloneItems.push(item);
          }
        });

        // Tạo danh sách sản phẩm cuối cùng (combo + items đơn lẻ)
        const finalProductList: any[] = [];
        
        // Thêm các combo
        Object.values(comboGroups).forEach((comboItems: any[]) => {
          if (comboItems.length > 0) {
            const firstItem = comboItems[0];
            const comboInfo = receiptDetailIdToComboMap[firstItem.id];
            const comboPrice = comboInfo?.comboPrice || comboItems.reduce((sum, item) => sum + item.price, 0);
            const comboOriginalPrice = comboInfo?.comboOriginalPrice || comboItems.reduce((sum, item) => sum + (item.originalPrice || item.price), 0);
            
            finalProductList.push({
              id: `combo-${comboInfo?.comboId}`,
              isCombo: true,
              comboName: comboInfo?.comboName || "Combo sách",
              comboPrice: comboPrice, // Giá đã giảm
              comboOriginalPrice: comboOriginalPrice, // ✅ Giá gốc combo
              quantity: firstItem.quantity,
              items: comboItems,
              totalPrice: comboPrice * firstItem.quantity,
              totalOriginalPrice: comboOriginalPrice * firstItem.quantity, // ✅ Tổng giá gốc
            });
          }
        });
        
        // Thêm các items đơn lẻ
        finalProductList.push(...standaloneItems);

        // Lấy thông tin thanh toán
        const paymentDetails = included.filter((x) => x.type === "paymentDetail");
        const paymentMethod = paymentDetails.length > 0 
          ? paymentDetails[0].attributes?.paymentType || "CASH"
          : "CASH";

        const orderData = {
          receiptId: receipt.id,
          orderCode: attrs.orderCode || `HD${receipt.id}`,
          status: attrs.orderStatus || "PENDING",
          orderType: attrs.orderType === "DIRECT" ? "POS" : attrs.orderType === "ONLINE" ? "ONLINE" : "UNKNOWN",
          info: {
            customerCode: customerUser && customerUser.id != null ? `KH${customerUser.id}` : null,
            fullName: attrs.customerName || customerUser?.attributes?.name || "Khách hàng",
            phone: attrs.customerPhone || customerUser?.attributes?.phone || "—",
            email: customerUser?.attributes?.email || "—",
            address: attrs.customerAddress || customerUser?.attributes?.address || "—",
            paymentMethod: paymentMethod,
          },
          items: finalProductList,
          shipping: attrs.serviceCost ?? 0,
          voucherDiscount: attrs.discount ?? 0,
          subTotal: attrs.subTotal ?? 0,
          finalTotal: attrs.grandTotal ?? 0,
          note: attrs.note || attrs.orderNote || "—",
          createdAt: attrs.createdAt || new Date().toISOString(),
        };

        setOrder(orderData);
      } catch (err) {
        console.error("Lỗi tải hóa đơn:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [receiptId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Đang tải hóa đơn...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        Không tìm thấy dữ liệu hóa đơn!
      </div>
    );
  }

  const { info, items, shipping, voucherDiscount, subTotal, finalTotal, note, createdAt, orderCode, orderType, status } =
    order;

  // ✅ Tổng giá hiện tại (đã giảm) của tất cả sách
  const totalDiscountedPrice = items.reduce((total: number, item: any) => {
    if (item.isCombo && item.totalPrice) {
      // Combo: dùng totalPrice đã tính sẵn
      return total + item.totalPrice;
    } else {
      // Item đơn lẻ: price * quantity
      return total + (item.price || 0) * (item.quantity || 1);
    }
  }, 0);

  const statusMeta: Record<string, { label: string; color: string; dot: string }> = {
    pending: { label: "Chờ xác nhận", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
    authorized: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
    in_transit: { label: "Đang vận chuyển", color: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500" },
    paid: { label: "Hoàn thành", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
    cancelled: { label: "Đã hủy", color: "bg-gray-200 text-gray-600", dot: "bg-gray-500" },
    failed: { label: "Giao thất bại", color: "bg-red-100 text-red-600", dot: "bg-red-500" },
    refunded: { label: "Hoàn tiền", color: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
  };

  const renderStatus = (status: string) => {
    const key = (status || "").toLowerCase();
    const meta = statusMeta[key] || { label: status || "—", color: "bg-gray-100 text-gray-700", dot: "bg-gray-400" };
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${meta.color}`}>
        <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
        {meta.label}
      </span>
    );
  };

  // ✅ Tính "Thành tiền" = Tổng giá đã giảm + Phí ship
  const calculatedFinalTotal = totalDiscountedPrice + shipping;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg border-2 border-red-100 overflow-hidden mb-6">
          {/* Header với gradient đỏ nhạt */}
          <div className="bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border-b-2 border-red-200 p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-rose-500 bg-clip-text text-transparent mb-2">
                  Hóa Đơn
                </h1>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 text-sm">Mã đơn hàng:</span>
                    <span className="font-bold text-red-600 text-lg">
                      {orderCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 text-sm">Ngày:</span>
                    <span className="font-semibold text-gray-700">
                      {new Date(createdAt).toLocaleString("vi-VN")}
                    </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600 text-sm">Trạng thái:</span>
                  {renderStatus(status)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Thông tin khách hàng */}
              <div className="bg-gradient-to-br from-red-50/30 to-rose-50/30 rounded-xl p-6 border border-red-100">
                <h2 className="text-xl font-bold mb-4 text-red-700 flex items-center gap-2">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Thông tin khách hàng
                </h2>
                <div className="space-y-3 text-gray-700">
                  {info.customerCode && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 min-w-[120px]">Mã KH:</span>
                      <span className="text-red-600 font-bold">{info.customerCode}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-gray-800 min-w-[120px]">Tên khách hàng:</span>
                    <span className="text-gray-700">{info.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800 min-w-[120px]">Số điện thoại:</span>
                    <span className="text-gray-700">{info.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800 min-w-[120px]">Email:</span>
                    <span className="text-gray-700">{info.email}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-gray-800 min-w-[120px]">Địa chỉ:</span>
                    <span className="text-gray-700">{info.address}</span>
                  </div>
                </div>
              </div>

              {/* Thông tin đơn hàng */}
              <div className="bg-gradient-to-br from-red-50/30 to-rose-50/30 rounded-xl p-6 border border-red-100">
                <h2 className="text-xl font-bold mb-4 text-red-700 flex items-center gap-2">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Thông tin đơn hàng
                </h2>
                <div className="space-y-3 text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800 min-w-[160px]">Mã đơn hàng:</span>
                    <span className="text-red-600 font-bold">{orderCode}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800 min-w-[160px]">Phương thức thanh toán:</span>
                    <span className="text-red-600 font-semibold">
                      {info.paymentMethod === "COD"
                        ? "COD"
                        : info.paymentMethod === "VNPAY"
                        ? "VNPay"
                        : info.paymentMethod === "CASH"
                        ? "Tiền mặt"
                        : info.paymentMethod === "MOMO"
                        ? "MoMo"
                        : info.paymentMethod}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800 min-w-[160px]">Tổng tiền hàng:</span>
                    <span className="text-gray-700 font-semibold">{totalDiscountedPrice.toLocaleString("vi-VN")} ₫</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800 min-w-[160px]">Phí ship:</span>
                    {shipping === 0 ? (
                      <span className="text-green-600 font-semibold">Miễn phí</span>
                    ) : (
                      <span className="text-gray-700">{shipping.toLocaleString("vi-VN")} ₫</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t-2 border-red-200">
                    <span className="font-bold text-gray-800 min-w-[160px] text-lg">Thành tiền:</span>
                    <span className="text-red-500 font-bold text-2xl">
                      {calculatedFinalTotal.toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                  <div className="flex items-start gap-2 pt-2">
                    <span className="font-semibold text-gray-800 min-w-[160px]">Ghi chú đơn hàng:</span>
                    <span className="text-gray-600 italic">{note}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sản phẩm trong đơn */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">
            Sản phẩm trong đơn
          </h2>
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Chưa có sản phẩm nào trong đơn.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border-2 border-red-100 shadow-lg">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="border-b-2 border-red-300 bg-gradient-to-r from-red-50 via-rose-50 to-red-50">
                    <th className="text-left py-4 px-6 font-bold text-red-700 text-sm uppercase tracking-wide">STT</th>
                    <th className="text-left py-4 px-6 font-bold text-red-700 text-sm uppercase tracking-wide">Ảnh</th>
                    <th className="text-left py-4 px-6 font-bold text-red-700 text-sm uppercase tracking-wide">Tên sản phẩm</th>
                    <th className="text-right py-4 px-6 font-bold text-red-700 text-sm uppercase tracking-wide">Giá</th>
                    <th className="text-right py-4 px-6 font-bold text-red-700 text-sm uppercase tracking-wide">Số lượng</th>
                    <th className="text-right py-4 px-6 font-bold text-red-700 text-sm uppercase tracking-wide">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, index: number) => {
                    if (item.isCombo && item.items && item.items.length > 0) {
                      // ✅ Hiển thị combo với nút expand/collapse
                      const comboId = item.id || `combo-${index}`;
                      const isExpanded = expandedCombos.has(comboId);
                      const bookTitles = item.items.map((comboItem: any) => comboItem.title).join(", ");
                      const displayTitles = bookTitles.length > 60 ? bookTitles.substring(0, 60) + "..." : bookTitles;
                      
                      const toggleExpand = () => {
                        setExpandedCombos((prev) => {
                          const newSet = new Set(prev);
                          if (newSet.has(comboId)) {
                            newSet.delete(comboId);
                          } else {
                            newSet.add(comboId);
                          }
                          return newSet;
                        });
                      };
                      
                      return (
                        <React.Fragment key={item.id}>
                          {/* Dòng combo header */}
                          <tr className="border-b-2 border-red-200 bg-gradient-to-r from-red-50 via-rose-50 to-red-50 hover:from-red-100 hover:via-rose-100 hover:to-red-100 transition-all duration-200">
                            <td className="py-5 px-6" rowSpan={isExpanded ? item.items.length + 1 : 1}>
                              <div className="flex flex-col items-center gap-2">
                                <span className="font-bold text-red-600 text-xl">
                                  {index + 1}
                                </span>
                                <span className="bg-gradient-to-r from-red-400 to-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                                  COMBO
                                </span>
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <div className="flex items-center">
                                <img
                                  src={item.items[0]?.image || item.image}
                                  alt={item.comboName || "Combo"}
                                  className="w-20 h-24 object-cover rounded-xl shadow-lg border-2 border-red-100 hover:border-red-300 transition-all"
                                />
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-gray-800 text-base">
                                    {item.comboName || "Combo sách"}
                                  </span>
                                  {/* ✅ Nút expand/collapse */}
                                  <button
                                    onClick={toggleExpand}
                                    className="ml-2 p-1 text-gray-500 hover:text-red-600 transition-colors"
                                    title={isExpanded ? "Thu gọn" : "Xem chi tiết"}
                                  >
                                    {isExpanded ? (
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                      </svg>
                                    ) : (
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                                {/* ✅ Tên sách (nhạt nhạt, truncate với 3 chấm) */}
                                <span className="text-gray-400 text-xs line-clamp-1">
                                  {displayTitles}
                                </span>
                              </div>
                            </td>
                            <td className="py-5 px-6 text-right">
                              <div className="flex flex-col items-end gap-1">
                                {/* Giá đã giảm (đỏ, to) */}
                                <span className="font-bold text-red-600 text-base">
                                  {item.comboPrice.toLocaleString("vi-VN")} ₫
                                </span>
                                {/* Giá gốc (xám, gạch ngang) - chỉ hiển thị khi có giảm giá */}
                                {item.comboOriginalPrice && item.comboOriginalPrice > item.comboPrice && (
                                  <span className="text-xs text-gray-400 line-through">
                                    {item.comboOriginalPrice.toLocaleString("vi-VN")} ₫
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-5 px-6 text-right">
                              <span className="font-bold text-red-600 text-lg">
                                {item.quantity}
                              </span>
                            </td>
                            <td className="py-5 px-6 text-right">
                              <div className="flex flex-col items-end gap-1">
                                {/* Thành tiền đã giảm (đỏ, to) */}
                                <span className="font-bold text-red-600 text-lg">
                                  {item.totalPrice.toLocaleString("vi-VN")} ₫
                                </span>
                                {/* Thành tiền gốc (xám, gạch ngang) - chỉ hiển thị khi có giảm giá */}
                                {item.totalOriginalPrice && item.totalOriginalPrice > item.totalPrice && (
                                  <span className="text-xs text-gray-400 line-through">
                                    {item.totalOriginalPrice.toLocaleString("vi-VN")} ₫
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                          {/* ✅ Chi tiết các sách trong combo (chỉ hiển thị khi expanded) */}
                          {isExpanded && item.items.map((comboItem: any, comboIdx: number) => (
                            <tr
                              key={`${item.id}-${comboItem.id || comboIdx}`}
                              className="border-b border-red-100 bg-gradient-to-r from-red-50/30 to-rose-50/30 hover:from-red-50 hover:to-rose-50 transition-all"
                            >
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3 pl-8">
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="w-0.5 h-8 bg-gradient-to-b from-red-300 to-transparent"></div>
                                    <div className="w-3 h-3 rounded-full bg-red-300 border-2 border-white shadow-sm"></div>
                                  </div>
                                  <img
                                    src={comboItem.image}
                                    alt={comboItem.title}
                                    className="w-16 h-20 object-cover rounded-lg shadow-md border-2 border-red-100 hover:border-red-300 transition-all"
                                  />
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="pl-4">
                                  <div className="font-medium text-gray-800 text-sm">
                                    {comboItem.title}
                                  </div>
                                  <div className="text-xs text-red-500 mt-1 font-semibold">
                                    ✓ Trong combo
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-right">
                                {/* ✅ Hiển thị giá gốc (originalPrice) cho sản phẩm lẻ trong combo */}
                                <span className="text-gray-600 text-sm font-medium">
                                  {(comboItem.originalPrice || comboItem.price || 0).toLocaleString("vi-VN")} ₫
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <span className="text-gray-600">{comboItem.quantity || 1}</span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                {/* ✅ Hiển thị thành tiền gốc cho sản phẩm lẻ trong combo */}
                                <span className="text-gray-700 font-medium">
                                  {((comboItem.originalPrice || comboItem.price || 0) * (comboItem.quantity || 1)).toLocaleString("vi-VN")} ₫
                                </span>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    } else {
                      // Hiển thị sản phẩm đơn lẻ với design đẹp và đồng nhất với combo
                      return (
                        <tr 
                          key={item.id} 
                          className="border-b-2 border-red-200 bg-gradient-to-r from-red-50 via-rose-50 to-red-50 hover:from-red-100 hover:via-rose-100 hover:to-red-100 transition-all duration-200"
                        >
                          <td className="py-5 px-6">
                            <div className="flex items-center justify-center">
                              <span className="font-bold text-red-600 text-xl">
                                {index + 1}
                              </span>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex items-center">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-20 h-24 object-cover rounded-xl shadow-lg border-2 border-red-100 hover:border-red-300 transition-all"
                              />
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <span className="font-semibold text-gray-800 text-base">
                              {item.title}
                            </span>
                          </td>
                          <td className="py-5 px-6 text-right">
                            <div className="flex flex-col items-end gap-1">
                              {/* Giá đã giảm (đỏ, to) */}
                              <span className="font-bold text-red-600 text-base">
                                {item.price.toLocaleString("vi-VN")} ₫
                              </span>
                              {/* Giá gốc (xám, gạch ngang) - chỉ hiển thị khi có giảm giá */}
                              {item.originalPrice && item.originalPrice > item.price && (
                                <span className="text-xs text-gray-400 line-through">
                                  {item.originalPrice.toLocaleString("vi-VN")} ₫
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-5 px-6 text-right">
                            <span className="font-bold text-red-600 text-lg">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="py-5 px-6 text-right">
                            <div className="flex flex-col items-end gap-1">
                              {/* Thành tiền đã giảm (đỏ, to) */}
                              <span className="font-bold text-red-600 text-lg">
                                {(item.price * item.quantity).toLocaleString("vi-VN")} ₫
                              </span>
                              {/* Thành tiền gốc (xám, gạch ngang) - chỉ hiển thị khi có giảm giá */}
                              {item.originalPrice && item.originalPrice > item.price && (
                                <span className="text-xs text-gray-400 line-through">
                                  {(item.originalPrice * item.quantity).toLocaleString("vi-VN")} ₫
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-10 text-center text-gray-500 text-sm">
          Cảm ơn bạn đã mua hàng tại Dino Bookstore! 📚✨
        </div>
      </div>
    </div>
  );
}
