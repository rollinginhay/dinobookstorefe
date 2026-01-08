"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/contexts/CartContext";
// ✅ Bỏ voucher - không dùng nữa
// import { useVoucher } from "@/contexts/VoucherContext";

import Breadcrumb from "@/components/Breadcrumb";
import { useRouter } from "next/navigation";

type Province = { code: number; name: string };
type District = { code: number; name: string };
type Ward = { code: number; name: string };

export default function ThanhToan() {
  const router = useRouter();
  const { selectedCartItems, clearAllCartFromBackend, selectedTotalPrice, clearCart } =
    useCart();
  // ✅ Bỏ voucher - không dùng nữa
  // const { savedVouchers, getVoucherById, calculateDiscount } = useVoucher();
  // const [selectedVoucherId, setSelectedVoucherId] = useState<string>("");
  // const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    district: "",
    ward: "",
    paymentMethod: "CASH||TRANSFER",
    note: "",
  });

  // Load Provinces
  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/p/")
      .then((res) => res.json())
      .then((data) => setProvinces(data))
      .catch(() => setProvinces([]));
  }, []);

  // --- Calculate totals ---
  const shipping = selectedTotalPrice >= 299000 ? 0 : 30000;
  
  // ✅ Tạm tính = tổng giá gốc (originalPrice)
  const totalOriginal = selectedCartItems.reduce((sum, item) => {
    if (item.isCombo && item.comboOriginalPrice) {
      return sum + (item.comboOriginalPrice * item.quantity);
    }
    const originalPrice = item.originalPrice || item.price;
    return sum + (originalPrice * item.quantity);
  }, 0);
  
  // ✅ Số tiền giảm = tổng giá gốc - tổng giá đã giảm
  const discountAmount = totalOriginal - selectedTotalPrice;
  
  // ✅ Tổng cộng = giá đã giảm + phí ship
  const finalTotal = selectedTotalPrice + shipping;

  // ----------------- Handle Submit -----------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    // Confirm
    if (!window.confirm("Bạn có chắc chắn muốn đặt hàng không?")) {
      setLoading(false);
      return;
    }

    // Build full address as string
    const fullAddress = `${formData.address}, ${formData.ward}, ${formData.district}, ${formData.city}`;
    
    // Build Receipt Payload
    const userId = localStorage.getItem("userId");
    
    // Tạo included trước để có thể dùng cho relationships
    const receiptDetailsIncluded: any[] = selectedCartItems.flatMap((item) => {
      // Với combo: tạo nhiều receiptDetail (mỗi sách một cái)
      // Với item thường: tạo 1 receiptDetail
      if (item.isCombo && item.comboBooks && item.comboBooks.length > 0) {
        // Lấy combo metadata để lấy thông tin đầy đủ
        const cartCombos = JSON.parse(localStorage.getItem("cartCombos") || "[]");
        const comboMeta = cartCombos.find((cm: any) => 
          cm.cartDetailIds.includes(item.cartDetailId)
        );
        
        if (comboMeta && comboMeta.books) {
          // Tạo một receiptDetail cho mỗi sách trong combo
          return comboMeta.books.map((book: any, index: number) => {
            const bookDetailIdRaw = (book as any).bookDetailId || book.id;
            const bookDetailId = typeof bookDetailIdRaw === 'string' ? bookDetailIdRaw : String(bookDetailIdRaw);
            
            if (!bookDetailId || bookDetailId.startsWith('combo-')) {
              console.error('Invalid bookDetailId for combo book:', book);
              return null;
            }
            
            // Giá mỗi sách = comboPrice / số lượng sách
            const pricePerBook = comboMeta.comboPrice / comboMeta.books.length;
            
            return {
              type: "receiptDetail",
              id: String(comboMeta.cartDetailIds[index] || `combo-${comboMeta.comboId}-${index}`),
              attributes: {
                quantity: item.quantity,
                pricePerUnit: Math.round(pricePerBook),
                bookDetailId: Number(bookDetailId), // Gửi bookDetailId trong attributes để BE map đúng
              },
              relationships: {
                bookCopy: {
                  data: {
                    type: "bookCopy",
                    id: String(bookDetailId),
                  },
                },
              },
            };
          }).filter((rd: any) => rd !== null);
        } else {
          // Fallback: dùng comboBooks nếu không có comboMeta
          return item.comboBooks.map((book: any, index: number) => {
            const bookDetailId = (book as any).bookDetailId || book.id;
            const pricePerBook = item.price / (item.comboBooks?.length || 1);
            
            return {
              type: "receiptDetail",
              id: String(`combo-${item.cartDetailId}-${index}`),
              attributes: {
                quantity: item.quantity,
                pricePerUnit: Math.round(pricePerBook),
                bookDetailId: Number(bookDetailId), // Gửi bookDetailId trong attributes để BE map đúng
              },
              relationships: {
                bookCopy: {
                  data: {
                    type: "bookCopy",
                    id: String(bookDetailId),
                  },
                },
              },
            };
          });
        }
      } else {
        // Item thường: tạo 1 receiptDetail
        const bookDetailIdRaw = item.bookDetailId || item.id;
        let bookDetailId: string | number;
        
        // Kiểm tra và đảm bảo bookDetailId là số hợp lệ
        if (typeof bookDetailIdRaw === 'string') {
          if ((bookDetailIdRaw as string).startsWith('combo-')) {
            console.error('Invalid bookDetailId for item:', item);
            return [];
          } else {
            const parsed = Number(bookDetailIdRaw);
            if (!isNaN(parsed)) {
              bookDetailId = parsed;
            } else {
              console.error('Cannot parse bookDetailId:', bookDetailIdRaw);
              return [];
            }
          }
        } else if (typeof bookDetailIdRaw === 'number') {
          bookDetailId = bookDetailIdRaw;
        } else {
          console.error('Invalid bookDetailId type:', bookDetailIdRaw);
          return [];
        }
        
            return [{
              type: "receiptDetail",
              id: String(item.cartDetailId || item.id),
              attributes: {
                quantity: item.quantity,
                pricePerUnit: item.price,
                bookDetailId: Number(bookDetailId), // Gửi bookDetailId trong attributes để BE map đúng
              },
              relationships: {
                bookCopy: {
                  data: {
                    type: "bookCopy",
                    id: String(bookDetailId),
                  },
                },
              },
            }];
      }
    });
    
    const receiptPayload = {
      data: {
        type: "receipt",
        id: 0,
        attributes: {
          customerName: formData.fullName,
          customerPhone: formData.phone,
          customerAddress: fullAddress,
          orderStatus: "PENDING",
          orderType: "ONLINE",
          note: formData.note,
          discount: discountAmount, // ✅ Số tiền giảm từ campaign
          subTotal: totalOriginal, // ✅ Tạm tính = tổng giá gốc
          serviceCost: shipping,
          grandTotal: finalTotal, // ✅ Tổng cộng = giá đã giảm + phí ship
          hasShipping: shipping > 0,
        },
        relationships: {
          receiptDetails: {
            data: receiptDetailsIncluded.map((rd) => ({
              type: "receiptDetail",
              id: rd.id,
            })),
          },
          // paymentDetail: {
          //   data: {
          //     type: "paymentDetail",
          //     id: 1,
          //   },
          // },
          customer: {
            data: {
              type: "user",
              id: userId,
            },
          },
          employee: { data: null },
        },
      },
      included: receiptDetailsIncluded,
      // {
      //   type: "paymentDetail",
      //   id: 1,
      //   attributes: {
      //     paymentType: formData.paymentMethod,
      //     amount: finalTotal, // tổng tiền
      //   },
      // },
    };

    // Thu thập combo metadata từ cartCombos và chuyển đổi thành bookDetailIds
    // Lấy bookDetailIds từ các receiptDetail trong included (sau khi đã tạo payload)
    const cartCombos = JSON.parse(localStorage.getItem("cartCombos") || "[]");
    const receiptComboMetadata: any[] = [];
    
    selectedCartItems.forEach((item) => {
      if (item.isCombo) {
        // Tìm combo metadata từ cartCombos
        const comboMeta = cartCombos.find((cm: any) => 
          cm.cartDetailIds.includes(item.cartDetailId)
        );
        
        if (comboMeta) {
          // Lấy bookDetailIds từ các receiptDetail trong payload đã tạo
          // Tìm các receiptDetail có cartDetailId tương ứng với cartDetailIds trong combo
          const comboReceiptDetails = receiptPayload.included
            .filter((rd: any) => rd.type === "receiptDetail")
            .filter((rd: any) => {
              // Tìm receiptDetail có id (cartDetailId) trong comboMeta.cartDetailIds
              const rdId = String(rd.id);
              return comboMeta.cartDetailIds.some((cdId: number) => String(cdId) === rdId);
            });
          
          // Lấy bookDetailIds từ các receiptDetail
          const bookDetailIds = comboReceiptDetails.map((rd: any) => {
            const bookDetailId = rd.relationships?.bookCopy?.data?.id || 
                                 rd.attributes?.bookCopy;
            return String(bookDetailId);
          }).filter((id: string) => id && id !== 'null' && id !== 'undefined');
          
          console.log("📦 Combo metadata:", {
            comboId: comboMeta.comboId,
            comboName: comboMeta.comboName,
            cartDetailIds: comboMeta.cartDetailIds,
            comboReceiptDetails: comboReceiptDetails,
            bookDetailIds: bookDetailIds
          });
          
          receiptComboMetadata.push({
            comboId: comboMeta.comboId,
            bookDetailIds: bookDetailIds, // Lưu bookDetailIds từ receiptDetails trong payload
            comboName: comboMeta.comboName,
            comboPrice: comboMeta.comboPrice,
            comboOriginalPrice: comboMeta.comboOriginalPrice,
            comboDiscount: comboMeta.comboDiscount,
            quantity: item.quantity,
            receiptDetailIds: [], // Sẽ được cập nhật sau khi tạo đơn
          });
        }
      }
    });

    try {
      // --------------- COD ----------------
      if (formData.paymentMethod === "CASH") {
        const res = await fetch(
          "http://localhost:8080/v1/receipt/createOnline",
          {
            method: "POST",
            headers: { "Content-Type": "application/vnd.api+json" },
            body: JSON.stringify(receiptPayload),
          }
        );

        if (!res.ok) throw new Error("Lỗi tạo đơn hàng COD");
        const receipt = await res.json();
        const receiptId = receipt?.data?.id;
        
        if (!receiptId) {
          throw new Error("Không lấy được ID đơn hàng!");
        }
        
        // Lưu combo metadata với receiptId để trang hóa đơn có thể sử dụng
        if (receiptComboMetadata.length > 0) {
          // Fetch receiptDetails từ relationships endpoint để lấy đầy đủ thông tin
          try {
            const receiptDetailsRes = await fetch(
              `http://localhost:8080/v1/receipt/${receiptId}/relationships/receiptDetail?e=true`
            );
            
            if (receiptDetailsRes.ok) {
              const receiptDetailsJson = await receiptDetailsRes.json();
              const receiptDetails = receiptDetailsJson.data || [];
              
              // Map bookDetailIds với receiptDetailIds dựa vào book_copy_id
              receiptComboMetadata.forEach((comboMeta) => {
                const matchedReceiptDetails = receiptDetails.filter((rd: any) => {
                  // Lấy bookDetailId từ relationships hoặc attributes
                  const bookDetailId = String(
                    rd.relationships?.bookCopy?.data?.id || 
                    rd.relationships?.bookDetail?.data?.id ||
                    rd.attributes?.bookCopy ||
                    rd.attributes?.bookDetailId
                  );
                  return comboMeta.bookDetailIds.includes(bookDetailId);
                });
                
                comboMeta.receiptDetailIds = matchedReceiptDetails.map((rd: any) => String(rd.id));
              });
              
              console.log("✅ Combo metadata với receiptDetailIds:", receiptComboMetadata);
            } else {
              console.warn("⚠️ Không thể fetch receiptDetails, sẽ map sau khi xem hóa đơn");
            }
          } catch (err) {
            console.error("❌ Lỗi fetch receiptDetails:", err);
          }
          
          localStorage.setItem(`receiptCombo_${receiptId}`, JSON.stringify(receiptComboMetadata));
        }
        
        // Xóa TẤT CẢ giỏ hàng từ backend (không chỉ items đã chọn)
        // Đợi xóa xong mới chuyển trang
        await clearAllCartFromBackend();
        localStorage.setItem("latestOrder", JSON.stringify(receipt));

        alert("Đặt hàng thành công! Vui lòng kiểm tra email của bạn");
        router.push(`/hoa-don/${receiptId}`);
        return;
      }

      // --------------- BANKING / VNPay ----------------
      if (formData.paymentMethod === "TRANSFER") {
        try {
          // 1. Tạo receipt trước
          const receiptRes = await fetch(
            "http://localhost:8080/v1/receipt/createOnline",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(receiptPayload),
            }
          );

          if (!receiptRes.ok) {
            throw new Error("Không tạo được đơn hàng!");
          }

          const receipt = await receiptRes.json();
          const receiptId = receipt?.data?.id;
          if (!receiptId) {
            throw new Error("Không lấy được receiptId!");
          }

          // Lưu combo metadata với receiptId để trang hóa đơn có thể sử dụng
          if (receiptComboMetadata.length > 0) {
            // Fetch receiptDetails từ relationships endpoint để lấy đầy đủ thông tin
            try {
              const receiptDetailsRes = await fetch(
                `http://localhost:8080/v1/receipt/${receiptId}/relationships/receiptDetail?e=true`
              );
              
              if (receiptDetailsRes.ok) {
                const receiptDetailsJson = await receiptDetailsRes.json();
                const receiptDetails = receiptDetailsJson.data || [];
                
                // Map bookDetailIds với receiptDetailIds dựa vào book_copy_id
                receiptComboMetadata.forEach((comboMeta) => {
                  const matchedReceiptDetails = receiptDetails.filter((rd: any) => {
                    // Lấy bookDetailId từ relationships hoặc attributes
                    const bookDetailId = String(
                      rd.relationships?.bookCopy?.data?.id || 
                      rd.relationships?.bookDetail?.data?.id ||
                      rd.attributes?.bookCopy ||
                      rd.attributes?.bookDetailId
                    );
                    return comboMeta.bookDetailIds.includes(bookDetailId);
                  });
                  
                  comboMeta.receiptDetailIds = matchedReceiptDetails.map((rd: any) => String(rd.id));
                });
                
                console.log("✅ Combo metadata với receiptDetailIds:", receiptComboMetadata);
              } else {
                console.warn("⚠️ Không thể fetch receiptDetails, sẽ map sau khi xem hóa đơn");
              }
            } catch (err) {
              console.error("❌ Lỗi fetch receiptDetails:", err);
            }
            
            localStorage.setItem(`receiptCombo_${receiptId}`, JSON.stringify(receiptComboMetadata));
          }

          // 2. Gọi API tạo URL VNPay
          const vnpayRes = await fetch(
            `http://localhost:8080/api/vnpay/pay-receipt/${receiptId}?returnUrl=http://localhost:3000/vnpay-return`,
            {
              method: "POST",
            }
          );
          if (!vnpayRes.ok) {
            throw new Error("Không tạo được URL thanh toán VNPay!");
          }

          const vnpayData = await vnpayRes.json();

          if (vnpayData?.paymentUrl) {
            // 3. Redirect sang VNPay
            window.location.href = vnpayData.paymentUrl;
          } else {
            throw new Error("paymentUrl không tồn tại!");
          }

          return;
        } catch (error) {
          console.error("VNPay error:", error);
          alert("Lỗi khi thanh toán VNPay!");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tạo đơn hàng!");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const selected = provinces.find((p: any) => p.code == code);
    setFormData((prev) => ({
      ...prev,
      city: selected?.name || "",
      district: "",
      ward: "",
    }));

    if (!code) {
      setDistricts([]);
      setWards([]);
      return;
    }

    fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`)
      .then((res) => res.json())
      .then((data) => {
        setDistricts(data.districts || []);
        setWards([]);
      })
      .catch(() => {
        setDistricts([]);
        setWards([]);
      });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const selected = districts.find((d: any) => d.code == code);
    setFormData((prev) => ({
      ...prev,
      district: selected?.name || "",
      ward: "",
    }));

    if (!code) {
      setWards([]);
      return;
    }

    fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`)
      .then((res) => res.json())
      .then((data) => setWards(data.wards || []))
      .catch(() => setWards([]));
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = wards.find((w: any) => w.code == e.target.value);
    setFormData((prev) => ({
      ...prev,
      ward: selected?.name || "",
    }));
  };

  // ===================================================
  // 🔥 RETURN JSX NẰM NGOÀI handleSubmit – FIX MẤT UI
  // ===================================================
  if (selectedCartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Chưa có sản phẩm được chọn
          </h2>
          <button
            onClick={() => router.push("/gio-hang")}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
          >
            Quay lại giỏ hàng
          </button>
        </div>
      </div>
    );
  }

  // ------------------ MAIN UI ------------------
  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Giỏ hàng", href: "/gio-hang" },
          { label: "Thanh toán" },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Thanh toán</h1>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Thông tin giao hàng
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0912345678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Tỉnh / Thành phố */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tỉnh/Thành phố <span className="text-red-600">*</span>
                    </label>
                    <select
                      required
                      value={
                        provinces.find((p) => p.name === formData.city)?.code ||
                        ""
                      }
                      onChange={handleProvinceChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Chọn tỉnh/thành</option>
                      {provinces.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div> 

                  {/* Quận / Huyện */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quận/Huyện <span className="text-red-600">*</span>
                    </label>
                    <select
                      required
                      disabled={!districts.length}
                      value={
                        districts.find((d) => d.name === formData.district)
                          ?.code || ""
                      }
                      onChange={handleDistrictChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
                    >
                      <option value="">Chọn quận/huyện</option>
                      {districts.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Phường / Xã */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phường/Xã <span className="text-red-600">*</span>
                    </label>
                    <select
                      required
                      disabled={!wards.length}
                      value={
                        wards.find((w) => w.name === formData.ward)?.code || ""
                      }
                      onChange={handleWardChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100"
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
                {/* Địa chỉ chi tiết */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ chi tiết <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Số nhà, tên đường..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú đơn hàng
                  </label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ghi chú thêm (không bắt buộc)"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Phương thức thanh toán
              </h2>

              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH"
                    checked={formData.paymentMethod === "CASH"}
                    onChange={handleChange}
                    className="mr-3 text-blue-600"
                  />
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-900">
                        Thanh toán khi nhận hàng (COD)
                      </div>
                      <div className="text-sm text-gray-600">
                        Thanh toán bằng tiền mặt khi nhận hàng
                      </div>
                    </div>
                  </div>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="TRANSFER"
                    checked={formData.paymentMethod === "TRANSFER"}
                    onChange={handleChange}
                    className="mr-3 text-blue-600"
                  />
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-8 h-8 text-pink-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-900">
                        Ví Điện tử VNPay
                      </div>
                      <div className="text-sm text-gray-600">
                        Thanh toán qua ví điện tử VNPay
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Đơn hàng</h2>

              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {selectedCartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-12 h-16 object-cover rounded flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 line-clamp-1">
                        {item.title}
                      </div>
                      <div className="text-gray-600">
                        Số lượng: {item.quantity}
                      </div>
                      {/* Price - Hiển thị giá sale (đỏ, to) và giá gốc (gạch ngang) */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-red-600 font-bold text-base">
                          {(item.price * item.quantity).toLocaleString("vi-VN")} ₫
                        </span>
                        {(() => {
                          // Tính giá gốc: nếu là combo dùng comboOriginalPrice, không thì dùng originalPrice
                          const originalPrice = item.isCombo && item.comboOriginalPrice
                            ? item.comboOriginalPrice
                            : (item.originalPrice || item.price);
                          const originalAmount = originalPrice * item.quantity;
                          const discountedAmount = item.price * item.quantity;
                          
                          if (originalAmount > discountedAmount) {
                            return (
                              <span className="text-gray-400 text-xs line-through">
                                {originalAmount.toLocaleString("vi-VN")} ₫
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-3">
                {/* Tạm tính = tổng giá gốc */}
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính ({selectedCartItems.length} sản phẩm)</span>
                  <span>
                    {selectedCartItems.reduce((sum, item) => {
                      if (item.isCombo && item.comboOriginalPrice) {
                        return sum + (item.comboOriginalPrice * item.quantity);
                      }
                      const originalPrice = item.originalPrice || item.price;
                      return sum + (originalPrice * item.quantity);
                    }, 0).toLocaleString("vi-VN")} ₫
                  </span>
                </div>
                {/* Giảm giá */}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá</span>
                    <span className="font-medium">
                      -{discountAmount.toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-green-600 font-medium">
                        Miễn phí
                      </span>
                    ) : (
                      <span>{shipping.toLocaleString("vi-VN")} ₫</span>
                    )}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Tổng cộng</span>
                    <span className="text-red-600">
                      {finalTotal.toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-white py-4 px-6 rounded-lg hover:bg-orange-600 transition-colors font-semibold text-lg mt-6 disabled:opacity-50"
              >
                {loading ? "Đang xử lý..." : "Đặt hàng ngay"}
              </button>
              <div className="mt-4 text-sm text-gray-600">
                Bằng việc đặt hàng, bạn đồng ý với{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Điều khoản dịch vụ
                </a>{" "}
                của chúng tôi
              </div>
            </div>
          </div>
        </form>
      </div>

    </div>
  );
}
