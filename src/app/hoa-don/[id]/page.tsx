"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function HoaDon() {
  const params = useParams();
  const receiptId = params?.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        const receiptDetails = included.filter((x) => x.type === "receiptDetail");
        const bookDetails = included.filter((x) => x.type === "bookDetail");
        const books = included.filter((x) => x.type === "book");

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
        
        // Map receiptDetailIds với combo (nếu chưa có thì map bằng bookDetailIds)
        const receiptDetailIdToComboMap: Record<string, any> = {};
        const processedReceiptDetailIds = new Set<string>();
        
        receiptComboMetadata.forEach((combo) => {
          const comboReceiptDetailIds = combo.receiptDetailIds || [];
          if (comboReceiptDetailIds.length > 0) {
            // Đã có receiptDetailIds từ khi tạo đơn
            comboReceiptDetailIds.forEach((rdId: string) => {
              receiptDetailIdToComboMap[rdId] = combo;
            });
          } else {
            // Chưa có receiptDetailIds, map bằng bookDetailIds
            receiptDetails.forEach((rd: any) => {
              const bookDetailId = String(rd.relationships?.bookDetail?.data?.id);
              if (combo.bookDetailIds.includes(bookDetailId) && !processedReceiptDetailIds.has(rd.id)) {
                receiptDetailIdToComboMap[rd.id] = combo;
                processedReceiptDetailIds.add(rd.id);
                // Thêm vào combo.receiptDetailIds để lưu lại
                if (!combo.receiptDetailIds) combo.receiptDetailIds = [];
                if (!combo.receiptDetailIds.includes(rd.id)) {
                  combo.receiptDetailIds.push(rd.id);
                }
              }
            });
          }
        });
        
        // Lưu lại combo metadata đã được map với receiptDetailIds
        if (receiptComboMetadata.length > 0) {
          localStorage.setItem(`receiptCombo_${receiptId}`, JSON.stringify(receiptComboMetadata));
        }

        // Lấy danh sách sản phẩm (bao gồm cả combo)
        const productList = await Promise.all(
          receiptDetails.map(async (rd: any) => {
            const bookDetailId = rd.relationships?.bookDetail?.data?.id;
            const bd = bookDetails.find((x) => x.id === bookDetailId);
            
            console.log("🔍 ReceiptDetail:", rd);
            console.log("🔍 BookDetailId:", bookDetailId);
            console.log("🔍 BookDetail từ included:", bd);
            
            // Nếu không có book trong included, fetch từ API
            let book = null;
            const bookId = bd?.relationships?.book?.data?.id;
            
            console.log("🔍 BookId từ bookDetail relationships:", bookId);
            
            if (bookId) {
              book = books.find((x) => x.id === bookId);
              console.log("🔍 Book từ included:", book);
            }
            
            // Nếu vẫn không có book, thử fetch book trực tiếp từ bookDetailId
            // (vì book và bookDetail có thể có cùng ID)
            if (!book && bookDetailId) {
              try {
                console.log("🔍 Thử fetch book trực tiếp với ID:", bookDetailId);
                const bookRes = await fetch(
                  `http://localhost:8080/v1/book/${bookDetailId}?e=true`
                );
                if (bookRes.ok) {
                  const bookJson = await bookRes.json();
                  // Kiểm tra xem book này có bookCopies chứa bookDetailId không
                  const bookCopies = bookJson.data?.relationships?.bookCopies?.data || [];
                  const hasThisBookDetail = bookCopies.some(
                    (bc: any) => bc.id === String(bookDetailId)
                  );
                  
                  if (hasThisBookDetail) {
                    book = bookJson.data;
                    console.log("🔍 Book tìm thấy từ bookDetailId:", book);
                  } else {
                    // Nếu không match, thử tìm trong included
                    const included = bookJson.included || [];
                    const bookDetailInIncluded = included.find(
                      (x: any) => x.type === "bookDetail" && x.id === String(bookDetailId)
                    );
                    if (bookDetailInIncluded) {
                      book = bookJson.data;
                      console.log("🔍 Book tìm thấy từ included:", book);
                    }
                  }
                }
              } catch (err) {
                console.error("Lỗi fetch book từ bookDetailId:", err);
              }
            }
            
            // Nếu vẫn không có, thử fetch bookDetail và tìm book từ relationships ngược lại
            if (!book && bookDetailId) {
              try {
                console.log("🔍 Fetching bookDetail để tìm book:", bookDetailId);
                const bookDetailRes = await fetch(
                  `http://localhost:8080/v1/bookDetail/${bookDetailId}?e=true`
                );
                if (bookDetailRes.ok) {
                  const bookDetailJson = await bookDetailRes.json();
                  const bookDetailIncluded = bookDetailJson.included || [];
                  
                  // Tìm book trong included
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
                      `http://localhost:8080/v1/book/${bookIdFromRel}`
                    );
                    if (bookRes.ok) {
                      const bookJson = await bookRes.json();
                      book = bookJson.data;
                      console.log("🔍 Book từ relationships:", book);
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

            return {
              id: rd.id,
              title: book?.attributes?.title ?? "Sách",
              price: rd.attributes?.pricePerUnit ?? 0,
              quantity: rd.attributes?.quantity ?? 1,
              image: book?.attributes?.imageUrl ?? "/default-book.jpg",
              bookDetailId: bookDetailId,
              isCombo: !!comboInfo,
              comboId: comboInfo?.comboId,
              comboName: comboInfo?.comboName,
              comboPrice: comboInfo?.comboPrice,
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
            finalProductList.push({
              id: `combo-${comboInfo?.comboId}`,
              isCombo: true,
              comboName: comboInfo?.comboName || "Combo sách",
              comboPrice: comboInfo?.comboPrice || comboItems.reduce((sum, item) => sum + item.price, 0),
              quantity: firstItem.quantity,
              items: comboItems,
              totalPrice: (comboInfo?.comboPrice || comboItems.reduce((sum, item) => sum + item.price, 0)) * firstItem.quantity,
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

  const { info, items, shipping, voucherDiscount, subTotal, finalTotal, note, createdAt, orderCode, orderType } =
    order;

  // Tính lại "Tổng tiền hàng" từ danh sách sản phẩm (chưa có phí ship và voucher)
  const calculatedSubTotal = items.reduce((total: number, item: any) => {
    if (item.isCombo && item.totalPrice) {
      // Combo: dùng totalPrice đã tính sẵn
      return total + item.totalPrice;
    } else {
      // Item đơn lẻ: price * quantity
      return total + (item.price || 0) * (item.quantity || 1);
    }
  }, 0);

  // Tính lại "Thành tiền" = Tổng tiền hàng + Phí ship - Giảm giá
  const calculatedFinalTotal = calculatedSubTotal + shipping - voucherDiscount;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hóa Đơn</h1>
              <p className="text-gray-500 mt-2">
                Mã đơn hàng: <span className="font-semibold">{orderCode}</span>
              </p>
              <p className="text-gray-500">
                Ngày: {new Date(createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Thông tin khách hàng */}
            <div>
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                Thông tin khách hàng
              </h2>
              <div className="space-y-2 text-gray-700">
                {info.customerCode && (
                  <p>
                    <b>Mã KH:</b> {info.customerCode}
                  </p>
                )}
                <p>
                  <b>Tên khách hàng:</b> {info.fullName}
                </p>
                <p>
                  <b>Số điện thoại:</b> {info.phone}
                </p>
                <p>
                  <b>Email:</b> {info.email}
                </p>
                <p>
                  <b>Địa chỉ:</b> {info.address}
                </p>
              </div>
            </div>

            {/* Thông tin đơn hàng */}
            <div>
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                Thông tin đơn hàng
              </h2>
              <div className="space-y-2 text-gray-700">
                <p>
                  <b>Mã đơn hàng:</b> {orderCode}
                </p>
                <p>
                  <b>Loại đơn hàng:</b> {orderType === "ONLINE" ? "Trực tuyến" : orderType === "POS" ? "Tại cửa hàng" : orderType}
                </p>
                <p>
                  <b>Phương thức thanh toán:</b>{" "}
                  {info.paymentMethod === "CASH" || info.paymentMethod === "COD"
                    ? "Tiền mặt"
                    : info.paymentMethod === "VNPAY"
                    ? "VNPay"
                    : info.paymentMethod === "MOMO"
                    ? "MoMo"
                    : info.paymentMethod}
                </p>
                <p>
                  <b>Tổng tiền hàng:</b> {calculatedSubTotal.toLocaleString("vi-VN")} đ
                </p>
                <p>
                  <b>Phí ship:</b>{" "}
                  {shipping === 0 ? (
                    <span className="text-green-600">Miễn phí</span>
                  ) : (
                    `${shipping.toLocaleString("vi-VN")} đ`
                  )}
                </p>
                {voucherDiscount > 0 && (
                  <p>
                    <b>Giảm giá:</b> -{voucherDiscount.toLocaleString("vi-VN")} đ
                  </p>
                )}
                <p>
                  <b>Thành tiền:</b>{" "}
                  <span className="text-red-600 font-bold">
                    {calculatedFinalTotal.toLocaleString("vi-VN")} đ
                  </span>
                </p>
                <p>
                  <b>Ghi chú đơn hàng:</b> {note}
                </p>
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">STT</th>
                    <th className="text-left py-3 px-4">Ảnh</th>
                    <th className="text-left py-3 px-4">Tên sản phẩm</th>
                    <th className="text-right py-3 px-4">Giá</th>
                    <th className="text-right py-3 px-4">Số lượng</th>
                    <th className="text-right py-3 px-4">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, index: number) => {
                    if (item.isCombo && item.items && item.items.length > 0) {
                      // Hiển thị combo đơn giản
                      return (
                        <React.Fragment key={item.id}>
                          {/* Dòng combo - không có ảnh */}
                          <tr className="border-b bg-blue-50">
                            <td className="py-3 px-4">{index + 1}</td>
                            <td className="py-3 px-4"></td>
                            <td className="py-3 px-4 font-medium">
                              <div className="font-bold text-blue-700">
                                {item.comboName || "Combo sách"}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {item.comboPrice.toLocaleString("vi-VN")} đ
                            </td>
                            <td className="py-3 px-4 text-right">{item.quantity}</td>
                            <td className="py-3 px-4 text-right font-semibold">
                              {item.totalPrice.toLocaleString("vi-VN")} đ
                            </td>
                          </tr>
                          {/* Các dòng sách trong combo */}
                          {item.items.map((comboItem: any, comboIdx: number) => (
                            <tr
                              key={`${item.id}-${comboItem.id || comboIdx}`}
                              className="border-b"
                            >
                              <td className="py-3 px-4"></td>
                              <td className="py-3 px-4">
                                <img
                                  src={comboItem.image}
                                  alt={comboItem.title}
                                  className="w-16 h-20 object-cover rounded"
                                />
                              </td>
                              <td className="py-3 px-4 font-medium">{comboItem.title}</td>
                              <td className="py-3 px-4 text-right">
                                {(comboItem.price || 0).toLocaleString("vi-VN")} đ
                              </td>
                              <td className="py-3 px-4 text-right">{comboItem.quantity || 1}</td>
                              <td className="py-3 px-4 text-right font-semibold">
                                {((comboItem.price || 0) * (comboItem.quantity || 1)).toLocaleString("vi-VN")} đ
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    } else {
                      // Hiển thị sản phẩm đơn lẻ
                      return (
                    <tr key={item.id} className="border-b">
                      <td className="py-3 px-4">{index + 1}</td>
                      <td className="py-3 px-4">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-16 h-20 object-cover rounded"
                        />
                      </td>
                      <td className="py-3 px-4 font-medium">{item.title}</td>
                      <td className="py-3 px-4 text-right">
                        {item.price.toLocaleString("vi-VN")} đ
                      </td>
                      <td className="py-3 px-4 text-right">{item.quantity}</td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {(item.price * item.quantity).toLocaleString("vi-VN")} đ
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
