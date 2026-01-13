"use client";

import {useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {createDiscount, updateDiscount} from "@/lib/discount/discount.api";
import {toast} from "sonner";
import {CampaignStatus, canEditField, formatDateForInput, getCampaignStatus,} from "@/lib/discount/discount.utils";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {useBook} from "@/hooks/api-calls/useBook";
import ProductSelector from "@/app/(admin)/pos/ProductSelector";

type Props = {
  mode: "create" | "edit";
  initialData?: any;
};

export default function DiscountForm({ mode, initialData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<CampaignStatus>("UPCOMING");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [showEnabledConfirm, setShowEnabledConfirm] = useState(false);
  const [pendingEnabledValue, setPendingEnabledValue] = useState<boolean | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  // Parse initialData từ API
  const attributes = initialData?.attributes || initialData || {};
  const relationships = initialData?.relationships || {};
  const [campaignDetails, setCampaignDetails] = useState<any[]>([]);

  // Key để lưu vào localStorage
  const storageKey = mode === "create" 
    ? "voucher_form_draft" 
    : `voucher_form_draft_${initialData?.id || attributes?.id}`;

  // Khôi phục dữ liệu từ localStorage hoặc dùng initialData
  const getInitialFormData = () => {
    if (typeof window === "undefined") {
      return {
        name: attributes.name || "",
        campaignType:
          attributes.campaignType || "PERCENTAGE_PRODUCT",
        startDate: formatDateForInput(attributes.startDate),
        endDate: formatDateForInput(attributes.endDate),
        enabled: attributes.enabled !== undefined ? attributes.enabled : true,
        minTotal: attributes.minTotal || 0,
        percentage: attributes.percentage || null,
        maxDiscount: attributes.maxDiscount || null,
        note: attributes.note || "",
      };
    }

    // Thử lấy từ localStorage (cho cả create và edit mode)
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const baseData = {
          name: attributes.name || "",
          campaignType:
            attributes.campaignType || "PERCENTAGE_PRODUCT",
          enabled: attributes.enabled !== undefined ? attributes.enabled : true,
        };
        // Helper function để lấy ngày theo giờ địa phương
        const getTodayLocalString = () => {
          const today = new Date();
          return today.getFullYear() + '-' + 
                 String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                 String(today.getDate()).padStart(2, '0');
        };
        
        const getTomorrowLocalString = () => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          return tomorrow.getFullYear() + '-' + 
                 String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + 
                 String(tomorrow.getDate()).padStart(2, '0');
        };

        // Tạo ngày mặc định cho tạo mới
        const today = getTodayLocalString();
        const tomorrowStr = getTomorrowLocalString();

        return {
          name: parsed.name || "",
          campaignType: parsed.campaignType || (mode === "create" ? "PERCENTAGE_PRODUCT" : baseData.campaignType),
          startDate: parsed.startDate || (mode === "create" ? today : ""),
          endDate: parsed.endDate || (mode === "create" ? tomorrowStr : ""),
          enabled: parsed.enabled !== undefined ? parsed.enabled : (mode === "create" ? true : baseData.enabled),
          minTotal: parsed.minTotal || 0,
          percentage: parsed.percentage || null,
          maxDiscount: parsed.maxDiscount || null,
          note: parsed.note || "",
        };
      } catch (e) {
        console.warn("Failed to parse saved form data:", e);
      }
    }

    // Helper function để lấy ngày theo giờ địa phương
    const getTodayLocalString = () => {
      const today = new Date();
      return today.getFullYear() + '-' + 
             String(today.getMonth() + 1).padStart(2, '0') + '-' + 
             String(today.getDate()).padStart(2, '0');
    };
    
    const getTomorrowLocalString = () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.getFullYear() + '-' + 
             String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + 
             String(tomorrow.getDate()).padStart(2, '0');
    };

    // Tạo ngày mặc định cho tạo mới
    const today = getTodayLocalString();
    const tomorrowStr = getTomorrowLocalString();

    return {
      name: attributes.name || "",
      campaignType:
        attributes.campaignType || "PERCENTAGE_PRODUCT",
      startDate: mode === "create" ? today : formatDateForInput(attributes.startDate),
      endDate: mode === "create" ? tomorrowStr : formatDateForInput(attributes.endDate),
      enabled: attributes.enabled !== undefined ? attributes.enabled : true,
      minTotal: attributes.minTotal || 0,
      percentage: attributes.percentage || null,
      maxDiscount: attributes.maxDiscount || null,
      note: attributes.note || "",
    };
  };

  // Lưu initialFormData vào useMemo để không bị tính lại mỗi lần render
  const initialFormData = useMemo(() => getInitialFormData(), []);
  const [formData, setFormData] = useState(initialFormData);

  // ==== LOAD SÁCH ĐỂ CHỌN CHO COMBO / SALE ĐỢT ====
  const { bookQuery } = useBook(0, 500, true);

  const comboSelectableProducts = useMemo(() => {
    if (!bookQuery.isSuccess) return [];
    const raw = (bookQuery.data as any)?.data || (bookQuery.data as any) || [];

    // Tái sử dụng logic extractBookDetails từ POS
    const booksArray = Array.isArray(raw) ? raw : [];
    return booksArray.flatMap((book: any) => {
      const bookId = String(book.id ?? "");
      const title = book.title ?? "";
      const imageUrl = book.imageUrl ?? "";

      const copies = Array.isArray(book.bookCopies?.data)
        ? book.bookCopies.data
        : [];

      return copies
        .filter((bc: any) => {
          // ✅ Filter: Chỉ lấy sách có stock > 0 VÀ enabled = true
          // Xử lý cả JSON:API format (có attributes) và plain object
          const attrs = bc.attributes || bc;
          const stock = Number(attrs.stock ?? bc.stock ?? 0);
          const enabled = (attrs.enabled ?? bc.enabled) !== false; // enabled mặc định là true nếu không có
          return stock > 0 && enabled;
        })
        .map((bc: any) => {
          // Xử lý cả JSON:API format (có attributes) và plain object
          const attrs = bc.attributes || bc;
          const supplyPrice = Number(attrs.supplyPrice ?? bc.supplyPrice ?? 0);

          return {
            bookId,
            id: String(bc.id ?? attrs.id ?? ""),
            title:
              title +
              ((attrs.bookFormat ?? bc.bookFormat)
                ? ` - ${attrs.bookFormat ?? bc.bookFormat}`
                : ""),
            imageUrl,
            bookFormat: attrs.bookFormat ?? bc.bookFormat ?? "",
            // ✅ Luôn dùng supplyPrice làm giá gốc; giữ salePrice = supplyPrice để tránh lệ thuộc cột sale_price
            salePrice: supplyPrice,
            supplyPrice,
            stock: Number(attrs.stock ?? bc.stock ?? 0),
            author: book.authorName || "",
          };
        });
    });
  }, [bookQuery.data, bookQuery.isSuccess]);

  // Xác định trạng thái khi có initialData
  useEffect(() => {
    if (mode === "edit" && initialData) {
      const campaignStatus = getCampaignStatus(
        attributes.startDate,
        attributes.endDate
      );
      setStatus(campaignStatus);
    }
  }, [mode, initialData, attributes.startDate, attributes.endDate]);

  // ✅ Lưu selectedProducts ban đầu để so sánh
  const [initialSelectedProducts, setInitialSelectedProducts] = useState<any[]>([]);
  
  // Kiểm tra xem có thay đổi không (bao gồm cả selectedProducts)
  useEffect(() => {
    const formDataChanged = JSON.stringify(initialFormData) !== JSON.stringify(formData);
    // ✅ So sánh selectedProducts: so sánh theo ID để tránh reference issues
    const selectedProductsChanged = JSON.stringify(initialSelectedProducts.map(p => p.id).sort()) !== 
                                    JSON.stringify(selectedProducts.map(p => p.id).sort());
    const changed = formDataChanged || selectedProductsChanged;
    setHasChanges(changed);
  }, [formData, initialFormData, selectedProducts, initialSelectedProducts]);

  // Lưu formData vào localStorage mỗi khi thay đổi (debounce)
  useEffect(() => {
    if (typeof window !== "undefined" && hasChanges) {
      const timer = setTimeout(() => {
        localStorage.setItem(storageKey, JSON.stringify(formData));
      }, 300); // Debounce 300ms
      return () => clearTimeout(timer);
    }
  }, [formData, storageKey, hasChanges]);

  // ✅ Fetch campaignDetails riêng từ endpoint relationships để lấy đầy đủ thông tin (có attributes)
  useEffect(() => {
    if (mode === "edit" && initialData?.id && formData.campaignType === "PERCENTAGE_PRODUCT") {
      console.log("🔍 [DiscountForm] Fetching campaignDetails for campaign ID:", initialData.id);
      // Fetch từ endpoint relationships để lấy đầy đủ thông tin
      fetch(`http://localhost:8080/v1/campaign/${initialData.id}/relationships/campaignDetail`)
        .then((res) => res.json())
        .then((json) => {
          console.log("🔍 [DiscountForm] Fetched campaignDetails from relationships endpoint:", json);
          const details = json.data || [];
          // ✅ CHỈ LẤY campaignDetails với enabled = true
          const enabledDetails = details.filter((cd: any) => {
            const enabled = cd.attributes?.enabled !== undefined ? cd.attributes.enabled : cd.enabled;
            return enabled !== false; // Chỉ lấy enabled = true hoặc undefined (mặc định là true)
          });
          console.log("✅ [DiscountForm] Filtered enabled campaignDetails:", enabledDetails);
          setCampaignDetails(enabledDetails);
        })
        .catch((err) => {
          console.error("❌ [DiscountForm] Error fetching campaignDetails:", err);
          // Fallback: dùng relationships từ initialData
          const fallbackDetails = (relationships?.campaignDetails?.data || []).filter((cd: any) => {
            const enabled = cd.attributes?.enabled !== undefined ? cd.attributes.enabled : cd.enabled;
            return enabled !== false;
          });
          setCampaignDetails(fallbackDetails);
        });
    } else {
      // Nếu không phải edit mode hoặc không phải combo, dùng relationships từ initialData
      const fallbackDetails = (relationships?.campaignDetails?.data || []).filter((cd: any) => {
        const enabled = cd.attributes?.enabled !== undefined ? cd.attributes.enabled : cd.enabled;
        return enabled !== false;
      });
      setCampaignDetails(fallbackDetails);
    }
  }, [mode, initialData?.id, formData.campaignType, relationships?.campaignDetails?.data]);

  // Load lại selectedProducts từ campaignDetails hoặc note khi edit mode
  useEffect(() => {
    if (mode === "edit" && formData.campaignType === "PERCENTAGE_PRODUCT" && comboSelectableProducts.length > 0 && campaignDetails.length > 0) {
      console.log("🔍 [DiscountForm] Loading selectedProducts from campaignDetails:", campaignDetails);
      console.log("🔍 [DiscountForm] Available comboSelectableProducts count:", comboSelectableProducts.length);
      
      // ✅ Parse đúng: lấy bookDetailId từ attributes hoặc top level
      const detailIds = campaignDetails
        .map((cd: any, index: number) => {
          console.log(`🔍 [DiscountForm] campaignDetails[${index}]:`, JSON.stringify(cd, null, 2));
          
          // JSON:API format từ relationships endpoint: { id: "...", attributes: { bookDetailId: "...", enabled: true } }
          const bookDetailId = cd.attributes?.bookDetailId || cd.bookDetailId;
          const enabled = cd.attributes?.enabled !== undefined ? cd.attributes.enabled : cd.enabled;
          
          // ✅ CHỈ LẤY các entries với enabled = true (đã được filter ở trên, nhưng double-check để chắc chắn)
          if (enabled === false) {
            console.log("⚠️ [DiscountForm] Skipping disabled CampaignDetail:", cd);
            return null;
          }
          
          if (!bookDetailId) {
            console.warn("⚠️ [DiscountForm] CampaignDetail has no bookDetailId:", cd);
            return null;
          }
          
          console.log(`✅ [DiscountForm] Extracted bookDetailId: ${bookDetailId} from CampaignDetail:`, cd);
          return String(bookDetailId);
        })
        .filter((id): id is string => id !== null);
      
      console.log("🔍 [DiscountForm] Parsed bookDetailIds (enabled only):", detailIds);
      console.log("🔍 [DiscountForm] comboSelectableProducts IDs (first 10):", comboSelectableProducts.slice(0, 10).map(p => ({ id: p.id, title: p.title })));
      
      const matched = comboSelectableProducts.filter((p) => detailIds.includes(String(p.id)));
      console.log("✅ [DiscountForm] Matched products:", matched.map(p => ({ id: p.id, title: p.title })));
      
      if (matched.length > 0) {
        setSelectedProducts(matched);
        // ✅ Lưu selectedProducts ban đầu để so sánh (chỉ lần đầu load)
        setInitialSelectedProducts([...matched]);
      } else {
        console.warn("⚠️ [DiscountForm] No products matched! detailIds:", detailIds);
        // Fallback: parse từ note
        if (formData.note) {
          const match = formData.note.match(/COMBO_BOOK_DETAIL_IDS=([0-9,]+)/);
          if (match) {
            const ids = match[1].split(",").map((id) => id.trim());
            const matched = comboSelectableProducts.filter((p) => ids.includes(String(p.id)));
            if (matched.length > 0) {
              setSelectedProducts(matched);
              // ✅ Lưu selectedProducts ban đầu để so sánh
              setInitialSelectedProducts([...matched]);
            }
          }
        }
      }
    } else if (mode === "create") {
      // ✅ Khi create mode, initialSelectedProducts là mảng rỗng
      setInitialSelectedProducts([]);
    }
  }, [mode, formData.campaignType, formData.note, campaignDetails, comboSelectableProducts]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
      setHasChanges(true);
    } else if (type === "number") {
      // Cho phép empty string để có thể xóa được
      if (value === "" || value === null || value === undefined) {
        setFormData((prev) => ({
          ...prev,
          [name]: null,
        }));
      } else {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          setFormData((prev) => ({
            ...prev,
            [name]: numValue,
          }));
        }
      }
      setHasChanges(true);
    } else {
      // Xử lý đặc biệt cho ngày bắt đầu
      if (name === "startDate") {
        setFormData((prev) => {
          const newFormData = { ...prev, [name]: value };
          
          // Nếu ngày kết thúc không có hoặc <= ngày bắt đầu mới, tự động set ngày kết thúc là ngày bắt đầu + 1
          if (!prev.endDate || prev.endDate <= value) {
            const startDate = new Date(value + 'T00:00:00'); // Đảm bảo parse theo timezone địa phương
            const nextDay = new Date(startDate);
            nextDay.setDate(nextDay.getDate() + 1);
            newFormData.endDate = nextDay.getFullYear() + '-' + 
                                  String(nextDay.getMonth() + 1).padStart(2, '0') + '-' + 
                                  String(nextDay.getDate()).padStart(2, '0');
          }
          
          return newFormData;
        });
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
      setHasChanges(true);
    }
  };

  // Handler quay lại
  const handleBack = () => {
    if (hasChanges) {
      setShowBackConfirm(true);
    } else {
      goBack();
    }
  };

  // Xác nhận quay lại và xóa draft
  const handleConfirmBack = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
    goBack();
  };

  // Quay lại list
  const goBack = () => {
    router.push("/voucher");
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên đợt giảm giá");
      return false;
    }

    // Validate ngày cho tất cả loại voucher
    if (!formData.startDate) {
      toast.error("Vui lòng chọn ngày bắt đầu");
      return false;
    }

    if (!formData.endDate) {
      toast.error("Vui lòng chọn ngày kết thúc");
      return false;
    }

    // Validate ngày bắt đầu - không được trong quá khứ
    const startDate = new Date(formData.startDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    
    if (mode === "create" || status === "UPCOMING") {
      if (startDate < now) {
        toast.error("Ngày bắt đầu không được chọn ngày đã qua");
        return false;
      }
    }

    // Validate ngày kết thúc
    const endDate = new Date(formData.endDate);
    endDate.setHours(0, 0, 0, 0);
    
    // Ngày kết thúc phải sau ngày bắt đầu
    if (startDate >= endDate) {
      toast.error("Ngày kết thúc phải sau ngày bắt đầu");
      return false;
    }

    // Validate: Khi tạo mới hoặc chưa bắt đầu, endDate không được trong quá khứ
    if (mode === "create" || status === "UPCOMING") {
      if (endDate < now) {
        toast.error("Ngày kết thúc không được chọn ngày đã qua");
        return false;
        }
      }

    // Đợt giảm giá: PERCENTAGE_PRODUCT, PERCENTAGE_DISCOUNT, FLAT_DISCOUNT
    if (formData.campaignType === "PERCENTAGE_PRODUCT") {
      // Cho combo: chỉ cần số tiền giảm cho từng sản phẩm
      if (!formData.maxDiscount || formData.maxDiscount <= 0) {
        toast.error("Vui lòng nhập số tiền giảm cho từng sản phẩm");
        return false;
      }
    } else if (formData.campaignType === "PERCENTAGE_DISCOUNT") {
      if (!formData.percentage || formData.percentage <= 0 || formData.percentage > 100) {
        toast.error("Phần trăm giảm giá phải từ 1% đến 100%");
        return false;
      }
      // Bắt buộc có maxDiscount khi giảm %
      if (!formData.maxDiscount || formData.maxDiscount <= 0) {
        toast.error("Vui lòng nhập giảm tối đa (VNĐ)");
        return false;
      }
      
      // Validation 1: maxDiscount < minTotal (nếu minTotal > 0)
      if (formData.minTotal > 0 && formData.maxDiscount >= formData.minTotal) {
        toast.error(
          `Số tiền giảm tối đa (${formData.maxDiscount.toLocaleString()}đ) phải nhỏ hơn giá trị đơn hàng tối thiểu (${formData.minTotal.toLocaleString()}đ)`
        );
        return false;
      }
      
      // Validation 2: finalDiscount < subTotal (đảm bảo giá phải trả > 0)
      // Tính finalDiscount với minTotal làm giá trị tham chiếu (nếu minTotal > 0)
      // hoặc với một giá trị tối thiểu hợp lý (ví dụ: maxDiscount * 2) nếu minTotal = 0
      const testSubTotal = formData.minTotal > 0 
        ? formData.minTotal 
        : Math.max(formData.maxDiscount * 2, 100000); // Nếu minTotal = 0, dùng giá trị test
      
      const rawDiscount = (testSubTotal * formData.percentage) / 100;
      const finalDiscount = Math.min(rawDiscount, formData.maxDiscount);
      
      if (finalDiscount >= testSubTotal) {
        toast.error(
          `Số tiền giảm giá (${finalDiscount.toLocaleString()}đ) phải nhỏ hơn tổng tiền đơn hàng để đảm bảo giá phải trả luôn > 0`
        );
        return false;
      }
      
      // Kiểm tra với minTotal nếu có
      if (formData.minTotal > 0) {
        const minTotalRawDiscount = (formData.minTotal * formData.percentage) / 100;
        const minTotalFinalDiscount = Math.min(minTotalRawDiscount, formData.maxDiscount);
        
        if (minTotalFinalDiscount >= formData.minTotal) {
          toast.error(
            `Với đơn hàng tối thiểu (${formData.minTotal.toLocaleString()}đ), số tiền giảm (${minTotalFinalDiscount.toLocaleString()}đ) phải nhỏ hơn để đảm bảo giá phải trả > 0`
          );
          return false;
        }
      }
    } else if (formData.campaignType === "FLAT_DISCOUNT") {
      if (!formData.maxDiscount || formData.maxDiscount <= 0) {
        toast.error("Số tiền giảm giá phải lớn hơn 0");
        return false;
      }
    }

    // Validate: PERCENTAGE_PRODUCT bắt buộc phải chọn sản phẩm
    if (formData.campaignType === "PERCENTAGE_PRODUCT") {
      if (!selectedProducts || selectedProducts.length === 0) {
        toast.error("Vui lòng chọn ít nhất một sản phẩm để áp dụng giảm giá");
        return false;
      }
      
      // Validate: Số tiền giảm không được vượt quá giá của cuốn sách rẻ nhất
      if (selectedProducts.length > 0 && formData.maxDiscount) {
        const prices = selectedProducts
          .map((p) => p.salePrice || 0)
          .filter((price) => price > 0);
        
        if (prices.length > 0) {
          const minPrice = Math.min(...prices);
          if (formData.maxDiscount > minPrice) {
            toast.error(
              `Số tiền giảm giá (${formData.maxDiscount.toLocaleString()}đ) không được vượt quá giá của cuốn sách rẻ nhất trong nhóm (${minPrice.toLocaleString()}đ)`
            );
            return false;
          }
        }
      }
    }

    // Combo (PERCENTAGE_PRODUCT) không cần validate minTotal
    if (formData.campaignType !== "PERCENTAGE_PRODUCT" && formData.minTotal < 0) {
      toast.error("Giá trị đơn hàng tối thiểu không được âm");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Kiểm tra nếu là edit mode và chưa có thay đổi gì
    if (mode === "edit" && !hasChanges) {
      toast.info("Bạn chưa chỉnh sửa gì");
      return;
    }

    // Hiển thị confirm dialog
    setShowConfirm(true);
  };

  const handleConfirmEnabledChange = () => {
    if (pendingEnabledValue !== null) {
      setFormData(prev => ({
        ...prev,
        enabled: pendingEnabledValue
      }));
      setHasChanges(true);
      setPendingEnabledValue(null);
    }
    setShowEnabledConfirm(false);
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    setShowConfirm(false);

    try {
      // Tạo payload đơn giản cho kitsu serialization
      const payloadData: any = {
        name: formData.name.trim(),
        campaignType: formData.campaignType,
        enabled: formData.enabled,
      };

      // Thêm ngày và minTotal cho tất cả loại voucher
      payloadData.startDate = formData.startDate;
      payloadData.endDate = formData.endDate;
      
      // Chỉ PERCENTAGE_PRODUCT không cần minTotal
      if (formData.campaignType !== "PERCENTAGE_PRODUCT") {
        payloadData.minTotal = formData.minTotal || 0;
      } else {
        payloadData.minTotal = 0; // Vẫn set 0 cho PERCENTAGE_PRODUCT
      }

      // Thêm percentage hoặc maxDiscount tùy theo loại
      // Đợt giảm giá: PERCENTAGE_PRODUCT, PERCENTAGE_DISCOUNT, FLAT_DISCOUNT
      if (formData.campaignType === "PERCENTAGE_PRODUCT") {
        // Combo: chỉ cần maxDiscount (số tiền giảm cho từng sản phẩm)
        payloadData.maxDiscount = formData.maxDiscount;
        payloadData.percentage = null; // Không dùng percentage cho combo
      } else if (formData.campaignType === "PERCENTAGE_DISCOUNT") {
        payloadData.percentage = formData.percentage;
        payloadData.maxDiscount = formData.maxDiscount; // Giữ maxDiscount cho giảm %
      } else if (formData.campaignType === "FLAT_DISCOUNT") {
        payloadData.maxDiscount = formData.maxDiscount;
        payloadData.percentage = null;
      }

      // Thêm note nếu có
      if (formData.note.trim()) {
        payloadData.note = formData.note.trim();
      }

      // ✅ Gửi relationships.campaignDetails cho combo (thay vì lưu vào note)
      // ⚠️ QUAN TRỌNG: LUÔN LUÔN gửi campaignDetails khi update combo, kể cả khi không có sản phẩm nào
      // (để BE có thể soft-delete các CampaignDetail cũ)
      if (formData.campaignType === "PERCENTAGE_PRODUCT") {
        if (selectedProducts.length > 0) {
          // Tạo campaignDetails với bookDetailId - sẽ được serialize thành relationships.campaignDetails
          // ✅ SỬA: Dùng maxDiscount (số tiền giảm cố định) thay vì percentage
          payloadData.campaignDetails = selectedProducts.map((p) => ({
            id: null, // null cho create mới
            bookDetailId: String(p.id), // Đảm bảo là string
            value: formData.maxDiscount || null, // ✅ Số tiền giảm cố định cho từng sản phẩm (VD: 20000)
          }));
          console.log("🔍 [DiscountForm] Sending campaignDetails with fixed discount per product:", payloadData.campaignDetails);
        } else {
          // Nếu không có sản phẩm nào được chọn, gửi mảng rỗng để BE soft-delete các CampaignDetail cũ
          payloadData.campaignDetails = [];
          console.log("⚠️ [DiscountForm] No products selected, sending empty campaignDetails array");
        }
      }

      // Nếu là edit, thêm id vào payload
      const payload: any = payloadData;
      if (mode === "edit" && initialData) {
        payload.id = String(initialData.id || attributes.id);
      }

      if (mode === "create") {
        await createDiscount(payload);
        toast.success("Tạo đợt giảm giá thành công!");
        // Xóa draft data khi submit thành công
        if (typeof window !== "undefined") {
          localStorage.removeItem(storageKey);
        }
        // Sử dụng window.location để đảm bảo refresh data
        window.location.href = "/voucher";
      } else {
        await updateDiscount(payload);
        toast.success("Cập nhật đợt giảm giá thành công!");
        // Xóa draft data khi submit thành công
        if (typeof window !== "undefined") {
          localStorage.removeItem(storageKey);
        }
        // Sử dụng window.location để đảm bảo refresh data
        window.location.href = "/voucher";
      }
    } catch (error: any) {
      console.error("Error:", error);
      const errorMessage =
        error?.response?.data?.errors?.[0]?.title ||
        error?.response?.data?.errors?.[0]?.detail ||
        "Có lỗi xảy ra khi xử lý yêu cầu";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

    // Xác định các field có được disable không
  const isFieldDisabled = (fieldName: string): boolean => {
    if (mode === "create") return false;
    return !canEditField(fieldName, status);
  };

  const isFormReadOnly = status === "EXPIRED";

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl border shadow-sm">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === "create"
                  ? "Tạo đợt giảm giá mới"
                  : "Chỉnh sửa đợt giảm giá"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {mode === "create"
                  ? "Điền thông tin để tạo đợt giảm giá mới"
                  : status === "EXPIRED"
                  ? "Đợt giảm giá đã kết thúc - Chỉ xem"
                  : status === "ACTIVE"
                  ? "Đợt giảm giá đang diễn ra - Một số trường không thể chỉnh sửa"
                  : "Đợt giảm giá chưa diễn ra - Có thể chỉnh sửa tất cả"}
              </p>
            </div>
            {mode === "edit" && (
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {status === "EXPIRED"
                  ? "Đã kết thúc"
                  : status === "ACTIVE"
                  ? "Đang diễn ra"
                  : "Chưa diễn ra"}
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tên đợt giảm giá */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên đợt giảm giá <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              disabled={isFieldDisabled("name") || isFormReadOnly}
              className="input w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Ví dụ: Giảm giá mùa hè 2025"
            />
            <p className="text-xs text-gray-500 mt-1">
              Tên mô tả cho đợt giảm giá này
            </p>
          </div>

          {/* Loại giảm giá */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại giảm giá <span className="text-red-500">*</span>
            </label>
            <select
              name="campaignType"
              required
              value={formData.campaignType}
              onChange={handleChange}
              disabled={isFieldDisabled("campaignType") || isFormReadOnly}
              className="input w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="PERCENTAGE_PRODUCT">Giảm số tiền cố định theo sản phẩm</option>
              <option value="PERCENTAGE_DISCOUNT">Giảm % theo đơn</option>
            </select>
            {isFieldDisabled("campaignType") && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Loại giảm giá không thể thay đổi khi đợt giảm giá đang diễn ra
              </p>
            )}
          </div>

          {/* Giá trị giảm */}
          {formData.campaignType === "PERCENTAGE_PRODUCT" && (
            <>
              {/* Số tiền giảm cho từng sản phẩm - Chỉ cho PERCENTAGE_PRODUCT */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tiền giảm cho từng sản phẩm (VNĐ) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    name="maxDiscount"
                    type="text"
                    inputMode="numeric"
                    required
                    value={formData.maxDiscount !== null && formData.maxDiscount !== undefined ? formData.maxDiscount : ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || value === null || value === undefined) {
                        setFormData(prev => ({ ...prev, maxDiscount: null }));
                      } else {
                        const num = parseFloat(value);
                        if (!isNaN(num) && num >= 0) {
                          setFormData(prev => ({ ...prev, maxDiscount: num }));
                        }
                      }
                    }}
                    disabled={isFieldDisabled("maxDiscount") || isFormReadOnly}
                    className="input w-full disabled:bg-gray-100 disabled:cursor-not-allowed pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="Ví dụ: 20000"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    đ
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mỗi sản phẩm trong combo sẽ được giảm số tiền này (ví dụ: 20,000đ cho mỗi cuốn sách)
                </p>
                {(() => {
                  // Tính giá sách rẻ nhất trong nhóm sản phẩm đã chọn
                  if (selectedProducts.length > 0 && formData.maxDiscount) {
                    const prices = selectedProducts
                      .map((p) => p.salePrice || 0)
                      .filter((price) => price > 0);
                    
                    if (prices.length > 0) {
                      const minPrice = Math.min(...prices);
                      if (formData.maxDiscount > minPrice) {
                        return (
                          <p className="text-xs text-red-600 mt-1 font-medium">
                            ⚠️ Cảnh báo: Số tiền giảm ({formData.maxDiscount.toLocaleString()}đ) vượt quá giá của cuốn sách rẻ nhất trong nhóm ({minPrice.toLocaleString()}đ). Vui lòng điều chỉnh lại.
                          </p>
                        );
                      }
                    }
                  }
                  return null;
                })()}
                {isFieldDisabled("maxDiscount") && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Số tiền giảm không thể thay đổi khi đợt giảm giá đang diễn ra
                  </p>
                )}
              </div>
            </>
          )}

          {formData.campaignType === "PERCENTAGE_DISCOUNT" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phần trăm giảm giá (%) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    name="percentage"
                    type="text"
                    inputMode="decimal"
                    required
                    value={formData.percentage !== null && formData.percentage !== undefined ? formData.percentage : ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || value === null || value === undefined) {
                        setFormData(prev => ({ ...prev, percentage: null }));
                      } else {
                        const num = parseFloat(value);
                        if (!isNaN(num) && num >= 0 && num <= 100) {
                          setFormData(prev => ({ ...prev, percentage: num }));
                        }
                      }
                    }}
                    disabled={isFieldDisabled("percentage") || isFormReadOnly}
                    className="input w-full disabled:bg-gray-100 disabled:cursor-not-allowed pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="Ví dụ: 10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    %
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Nhập số phần trăm từ 1% đến 100%
                </p>
                {isFieldDisabled("percentage") && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Phần trăm giảm giá không thể thay đổi khi đợt giảm giá đang diễn ra
                  </p>
                )}
              </div>
            </>
          )}

          {formData.campaignType === "FLAT_DISCOUNT" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số tiền giảm (VNĐ) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  name="maxDiscount"
                  type="text"
                  inputMode="numeric"
                  required
                  value={formData.maxDiscount !== null && formData.maxDiscount !== undefined ? formData.maxDiscount : ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || value === null || value === undefined) {
                      setFormData(prev => ({ ...prev, maxDiscount: null }));
                    } else {
                      const num = parseFloat(value);
                      if (!isNaN(num) && num >= 0) {
                        setFormData(prev => ({ ...prev, maxDiscount: num }));
                      }
                    }
                  }}
                  disabled={isFormReadOnly}
                  className="input w-full disabled:bg-gray-100 disabled:cursor-not-allowed pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="Ví dụ: 50000"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  đ
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Nhập số tiền giảm giá (ví dụ: 50000 cho 50,000đ)
              </p>
            </div>
          )}

          {/* Giá trị đơn hàng tối thiểu - Ẩn khi là combo */}
          {formData.campaignType !== "PERCENTAGE_PRODUCT" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giá trị đơn hàng tối thiểu (VNĐ)
            </label>
            <div className="relative">
              <input
                name="minTotal"
                type="text"
                inputMode="numeric"
                value={formData.minTotal !== null && formData.minTotal !== undefined ? formData.minTotal : ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || value === null || value === undefined) {
                    setFormData(prev => ({ ...prev, minTotal: 0 }));
                  } else {
                    const num = parseFloat(value);
                    if (!isNaN(num) && num >= 0) {
                      setFormData(prev => ({ ...prev, minTotal: num }));
                    }
                  }
                }}
                disabled={isFormReadOnly}
                className="input w-full disabled:bg-gray-100 disabled:cursor-not-allowed pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                đ
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Đơn hàng phải đạt giá trị này mới được áp dụng giảm giá. <span className="font-medium">Nhập 0 nếu không yêu cầu giá trị tối thiểu</span>
            </p>
            {(() => {
              // Cảnh báo cho PERCENTAGE_DISCOUNT
              if (formData.campaignType === "PERCENTAGE_DISCOUNT" && formData.minTotal > 0 && formData.maxDiscount) {
                // Validation 1: maxDiscount < minTotal
                if (formData.maxDiscount >= formData.minTotal) {
                  return (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      ⚠️ Cảnh báo: Giá trị đơn hàng tối thiểu ({formData.minTotal.toLocaleString()}đ) phải lớn hơn số tiền giảm tối đa ({formData.maxDiscount.toLocaleString()}đ)
                    </p>
                  );
                }
                
                // Validation 2: finalDiscount < minTotal (đảm bảo giá phải trả > 0)
                if (formData.percentage) {
                  const minTotalRawDiscount = (formData.minTotal * formData.percentage) / 100;
                  const minTotalFinalDiscount = Math.min(minTotalRawDiscount, formData.maxDiscount);
                  
                  if (minTotalFinalDiscount >= formData.minTotal) {
                    return (
                      <p className="text-xs text-red-600 mt-1 font-medium">
                        ⚠️ Cảnh báo: Với đơn hàng tối thiểu ({formData.minTotal.toLocaleString()}đ), số tiền giảm ({minTotalFinalDiscount.toLocaleString()}đ) phải nhỏ hơn để đảm bảo giá phải trả &gt; 0
                      </p>
                    );
                  }
                }
              }
              return null;
            })()}
          </div>
          )}

          {/* Giảm tối đa (VNĐ) - BẮT BUỘC với giảm % – đặt dưới minTotal */}
          {formData.campaignType === "PERCENTAGE_DISCOUNT" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giảm tối đa (VNĐ) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  name="maxDiscount"
                  type="text"
                  inputMode="numeric"
                  required
                  value={formData.maxDiscount !== null && formData.maxDiscount !== undefined ? formData.maxDiscount : ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || value === null || value === undefined) {
                      setFormData(prev => ({ ...prev, maxDiscount: null }));
                    } else {
                      const num = parseFloat(value);
                      if (!isNaN(num) && num >= 0) {
                        setFormData(prev => ({ ...prev, maxDiscount: num }));
                      }
                    }
                  }}
                  disabled={isFieldDisabled("maxDiscount") || isFormReadOnly}
                  className="input w-full disabled:bg-gray-100 disabled:cursor-not-allowed pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="Ví dụ: 50000"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  đ
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Số tiền giảm tối đa khi áp dụng phần trăm (ví dụ: 50,000đ)
              </p>
              {(() => {
                // Validation 1: maxDiscount < minTotal (nếu minTotal > 0)
                if (formData.minTotal > 0 && formData.maxDiscount && formData.maxDiscount >= formData.minTotal) {
                  return (
                    <p className="text-xs text-red-600 mt-1 font-medium">
                      ⚠️ Cảnh báo: Số tiền giảm tối đa ({formData.maxDiscount.toLocaleString()}đ) phải nhỏ hơn giá trị đơn hàng tối thiểu ({formData.minTotal.toLocaleString()}đ)
                    </p>
                  );
                }
                
                // Validation 2: finalDiscount < subTotal (đảm bảo giá phải trả > 0)
                if (formData.percentage && formData.maxDiscount && formData.minTotal > 0) {
                  const minTotalRawDiscount = (formData.minTotal * formData.percentage) / 100;
                  const minTotalFinalDiscount = Math.min(minTotalRawDiscount, formData.maxDiscount);
                  
                  if (minTotalFinalDiscount >= formData.minTotal) {
                    return (
                      <p className="text-xs text-red-600 mt-1 font-medium">
                        ⚠️ Cảnh báo: Với đơn hàng tối thiểu ({formData.minTotal.toLocaleString()}đ), số tiền giảm ({minTotalFinalDiscount.toLocaleString()}đ) phải nhỏ hơn để đảm bảo giá phải trả &gt; 0
                      </p>
                    );
                  }
                }
                
                // Kiểm tra với giá trị test nếu minTotal = 0
                if (formData.percentage && formData.maxDiscount && formData.minTotal === 0) {
                  const testSubTotal = Math.max(formData.maxDiscount * 2, 100000);
                  const rawDiscount = (testSubTotal * formData.percentage) / 100;
                  const finalDiscount = Math.min(rawDiscount, formData.maxDiscount);
                  
                  if (finalDiscount >= testSubTotal) {
                    return (
                      <p className="text-xs text-red-600 mt-1 font-medium">
                        ⚠️ Cảnh báo: Số tiền giảm ({finalDiscount.toLocaleString()}đ) quá lớn so với phần trăm ({formData.percentage}%), có thể khiến giá phải trả ≤ 0. Vui lòng điều chỉnh lại.
                      </p>
                    );
                  }
                }
                
                return null;
              })()}
              {isFieldDisabled("maxDiscount") && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Giảm tối đa không thể thay đổi khi đợt giảm giá đang diễn ra
                </p>
              )}
            </div>
          )}

          {/* Ngày bắt đầu */}
          {(
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày bắt đầu <span className="text-red-500">*</span>
            </label>
            <input
              name="startDate"
              type="date"
              required
              value={formData.startDate}
              onChange={handleChange}
              disabled={isFieldDisabled("startDate") || isFormReadOnly}
              className="input w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
              min={mode === "create" || status === "UPCOMING" ? (() => {
                const today = new Date();
                return today.getFullYear() + '-' + 
                       String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(today.getDate()).padStart(2, '0');
              })() : undefined}
            />
            {isFieldDisabled("startDate") && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Ngày bắt đầu không thể thay đổi khi đợt giảm giá đã bắt đầu
              </p>
            )}
          </div>
          )}

          {/* Ngày kết thúc */}
          {(
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày kết thúc <span className="text-red-500">*</span>
            </label>
            <input
              name="endDate"
              type="date"
              required
              value={formData.endDate}
              onChange={handleChange}
              min={
                formData.startDate 
                  ? (() => {
                      const startDate = new Date(formData.startDate);
                      startDate.setDate(startDate.getDate() + 1);
                      return startDate.toISOString().split("T")[0];
                    })()
                  : undefined
              }
              disabled={isFormReadOnly}
              className="input w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ngày kết thúc phải sau ngày bắt đầu
              {(mode === "create" || status === "UPCOMING") && " và không được trong quá khứ"}
            </p>
          </div>
          )}

          {/* Chọn sản phẩm áp dụng - chỉ cho SALE ĐỢT / SALE COMBO */}
          {formData.campaignType === "PERCENTAGE_PRODUCT" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn sản phẩm áp dụng <span className="text-red-500">*</span>
              </label>
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 space-y-3">
                <p className="text-sm text-gray-600">
                  Chọn các sản phẩm sẽ được giảm số tiền cố định trong đợt này. Mỗi sản phẩm được chọn sẽ giảm {formData.maxDiscount ? `${formData.maxDiscount.toLocaleString()}đ` : 'X đồng'}.
                </p>

                <button
                  type="button"
                  disabled={isFieldDisabled("products") || isFormReadOnly || !bookQuery.isSuccess}
                  onClick={() => setShowProductSelector(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bookQuery.isLoading ? "Đang tải danh sách sách..." : "+ Chọn sản phẩm"}
                </button>

                {/* Danh sách sản phẩm đã chọn */}
                {selectedProducts.length > 0 ? (
                  <>
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">
                        Đã chọn {selectedProducts.length} sản phẩm
                      </p>
                    </div>
                    <div className="mt-2 border-t pt-3 space-y-2 max-h-60 overflow-y-auto">
                      {selectedProducts.slice(0, 3).map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between gap-3 text-sm bg-white border rounded-md px-3 py-2"
                        >
                          <div className="flex items-center gap-3">
                            {p.imageUrl && (
                              <img
                                src={p.imageUrl}
                                alt={p.title}
                                className="w-10 h-14 object-cover rounded"
                              />
                            )}
                            <div>
                              <div className="font-medium text-gray-900 line-clamp-1">
                                {p.title}
                </div>
                              <div className="text-xs text-gray-500">
                                {p.bookFormat && `${p.bookFormat} • `}
                                {p.salePrice
                                  ? `${p.salePrice.toLocaleString()}đ`
                                  : "Chưa có giá"}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="text-xs text-red-600 hover:text-red-700 font-semibold"
                            onClick={() => {
                              setSelectedProducts((prev) => {
                                const newProducts = prev.filter((sp) => sp.id !== p.id);
                                console.log("🗑️ [DiscountForm] Removed product:", p.title, "Remaining:", newProducts.length);
                                return newProducts;
                              });
                              // ✅ Đánh dấu có thay đổi khi xóa sản phẩm
                              setHasChanges(true);
                            }}
                          >
                            Xóa
                          </button>
                        </div>
                      ))}
                      {selectedProducts.length > 3 && (
                        <p className="text-xs text-gray-500 text-center">
                          ... và {selectedProducts.length - 3} sản phẩm khác
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-500">
                    Chưa có sản phẩm nào được chọn.
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Mỗi sản phẩm được chọn sẽ được giảm số tiền cố định đã thiết lập ở trên. Bạn có thể quản lý danh sách sản phẩm áp dụng ngay tại đây.
              </p>
            </div>
          )}

          {/* Trạng thái kích hoạt - chỉ hiển thị khi sửa */}
          {mode === "edit" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái đợt giảm giá
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const newValue = !formData.enabled;
                    setPendingEnabledValue(newValue);
                    setShowEnabledConfirm(true);
                  }}
                  disabled={isFormReadOnly}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    formData.enabled ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {formData.enabled ? "Đang hoạt động" : "Vô hiệu hóa"}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Tắt để vô hiệu hóa đợt giảm giá này
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Quay lại danh sách
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Hủy
              </button>
            {!isFormReadOnly && (
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Đang xử lý...
                  </span>
                ) : mode === "create" ? (
                  "Tạo đợt giảm giá"
                ) : (
                  "Cập nhật"
                )}
              </button>
            )}
            </div>
          </div>
        </form>

        {/* Confirm Dialog cho Submit */}
        <ConfirmDialog
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirmSubmit}
          title={mode === "create" ? "Xác nhận tạo đợt giảm giá" : "Xác nhận cập nhật đợt giảm giá"}
          message={
            mode === "create" ? (
              <>
                Bạn có chắc chắn muốn tạo đợt giảm giá{" "}
                <span className="font-medium text-gray-900">"{formData.name}"</span>?
                <br />
                Sau khi tạo, đợt giảm giá sẽ được lưu vào hệ thống.
              </>
            ) : (
              <>
                Bạn có chắc chắn muốn cập nhật thông tin đợt giảm giá{" "}
                <span className="font-medium text-gray-900">"{formData.name}"</span>?
                <br />
                Các thay đổi sẽ được áp dụng ngay sau khi xác nhận.
              </>
            )
          }
          confirmText={mode === "create" ? "Tạo mới" : "Cập nhật"}
          cancelText="Hủy"
          confirmButtonColor="blue"
          loading={loading}
          loadingText={mode === "create" ? "Đang tạo..." : "Đang cập nhật..."}
        />

        {/* Confirm Dialog cho Quay lại */}
        <ConfirmDialog
          isOpen={showBackConfirm}
          onClose={() => setShowBackConfirm(false)}
          onConfirm={handleConfirmBack}
          title="Quay lại danh sách"
          message={
            <>
              Bạn có thay đổi chưa lưu trong form này.
              <br />
              Dữ liệu đã nhập sẽ không được lưu khi bạn quay lại.
              <br />
              Bạn có muốn quay lại danh sách không?
            </>
          }
          confirmText="Quay lại"
          cancelText="Ở lại"
          confirmButtonColor="blue"
          loading={false}
        />

        {/* Enabled Status Change Confirm Dialog - chỉ hiển thị khi sửa */}
        {mode === "edit" && (
          <ConfirmDialog
            isOpen={showEnabledConfirm}
            onClose={() => {
              setShowEnabledConfirm(false);
              setPendingEnabledValue(null);
            }}
            onConfirm={handleConfirmEnabledChange}
            title="Xác nhận thay đổi trạng thái đợt giảm giá"
            message={
              <div className="space-y-2">
                <p className="font-medium">
                  Bạn có chắc muốn {pendingEnabledValue ? "kích hoạt" : "vô hiệu hóa"} đợt giảm giá này?
                </p>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1 text-sm">
                  <p className="font-medium text-blue-800">Lưu ý:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    {pendingEnabledValue ? (
                      <>
                        <li>Đợt giảm giá sẽ được kích hoạt và có thể áp dụng ngay</li>
                        <li>Khách hàng sẽ có thể sử dụng đợt giảm giá này</li>
                      </>
                    ) : (
                      <>
                        <li>Đợt giảm giá sẽ bị vô hiệu hóa và không thể áp dụng</li>
                        <li>Khách hàng sẽ không thể sử dụng đợt giảm giá này</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            }
            confirmText="Xác nhận"
            cancelText="Hủy"
            confirmButtonColor={pendingEnabledValue ? "green" : "red"}
          />
        )}

        {/* ProductSelector Modal - chỉ hiển thị khi showProductSelector === true */}
        {showProductSelector && (
          <ProductSelector
            multi
            products={comboSelectableProducts}
            initialSelectedIds={selectedProducts.map((p) => p.id)}
            onClose={() => setShowProductSelector(false)}
            onSelect={(products) => {
              setSelectedProducts(products as any[]);
              setShowProductSelector(false);
              setHasChanges(true);
            }}
          />
        )}

      </div>
    </div>
  );
}
