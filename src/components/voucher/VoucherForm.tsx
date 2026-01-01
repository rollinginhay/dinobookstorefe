"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createVoucher, updateVoucher } from "@/lib/voucher/voucher.api";
import { toast } from "sonner";
import {
  getVoucherStatus,
  canEditField,
  formatDateForInput,
  VoucherStatus,
} from "@/lib/voucher/voucher.utils";
import ConfirmDialog from "@/components/common/ConfirmDialog";

type Props = {
  mode: "create" | "edit";
  initialData?: any;
};

export default function VoucherForm({ mode, initialData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<VoucherStatus>("UPCOMING");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Parse initialData từ API
  const attributes = initialData?.attributes || initialData || {};

  // Key để lưu vào localStorage
  const storageKey = mode === "create" 
    ? "voucher_form_draft" 
    : `voucher_form_draft_${initialData?.id || attributes?.id}`;

  // Khôi phục dữ liệu từ localStorage hoặc dùng initialData
  const getInitialFormData = () => {
    // Lấy voucherType từ campaignType (vì campaign API dùng campaignType)
    const voucherTypeFromData = attributes.voucherType || attributes.campaignType;
    
    if (typeof window === "undefined") {
      return {
        name: attributes.name || "",
        voucherType:
          voucherTypeFromData || "PERCENTAGE_RECEIPT",
        startDate: formatDateForInput(attributes.startDate),
        endDate: formatDateForInput(attributes.endDate),
        enabled: attributes.enabled !== undefined ? attributes.enabled : true,
        minTotal: attributes.minTotal || 0,
        percentage: attributes.percentage || null,
        maxDiscount: attributes.maxDiscount || null,
        code: attributes.code || "",
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
          voucherType:
            voucherTypeFromData || "PERCENTAGE_RECEIPT",
          enabled: attributes.enabled !== undefined ? attributes.enabled : true,
        };
        return {
          name: parsed.name || "",
          voucherType: parsed.voucherType || (mode === "create" ? "PERCENTAGE_RECEIPT" : baseData.voucherType),
          startDate: parsed.startDate || "",
          endDate: parsed.endDate || "",
          enabled: parsed.enabled !== undefined ? parsed.enabled : (mode === "create" ? true : baseData.enabled),
          minTotal: parsed.minTotal || 0,
          percentage: parsed.percentage || null,
          maxDiscount: parsed.maxDiscount || null,
          code: parsed.code || "",
          note: parsed.note || "",
        };
      } catch (e) {
        console.warn("Failed to parse saved form data:", e);
      }
    }

    return {
      name: attributes.name || "",
      voucherType:
        voucherTypeFromData || "PERCENTAGE_RECEIPT",
      startDate: formatDateForInput(attributes.startDate),
      endDate: formatDateForInput(attributes.endDate),
      enabled: attributes.enabled !== undefined ? attributes.enabled : true,
      minTotal: attributes.minTotal || 0,
      percentage: attributes.percentage || null,
      maxDiscount: attributes.maxDiscount || null,
      code: attributes.code || "",
      note: attributes.note || "",
    };
  };

  // Lưu initialFormData vào useMemo để không bị tính lại mỗi lần render
  const initialFormData = useMemo(() => getInitialFormData(), []);
  const [formData, setFormData] = useState(initialFormData);

  // Xác định trạng thái khi có initialData
  useEffect(() => {
    if (mode === "edit" && initialData) {
      const voucherStatus = getVoucherStatus(
        attributes.startDate,
        attributes.endDate
      );
      setStatus(voucherStatus);
    }
  }, [mode, initialData, attributes.startDate, attributes.endDate]);

  // Kiểm tra xem có thay đổi không
  useEffect(() => {
    const changed = JSON.stringify(initialFormData) !== JSON.stringify(formData);
    setHasChanges(changed);
  }, [formData, initialFormData]);

  // Lưu formData vào localStorage mỗi khi thay đổi (debounce)
  useEffect(() => {
    if (typeof window !== "undefined" && hasChanges) {
      const timer = setTimeout(() => {
        localStorage.setItem(storageKey, JSON.stringify(formData));
      }, 300); // Debounce 300ms
      return () => clearTimeout(timer);
    }
  }, [formData, storageKey, hasChanges]);

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
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
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
    router.push("/vouchers");
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên phiếu giảm giá");
      return false;
    }

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

    // Phiếu giảm giá chỉ có PERCENTAGE_RECEIPT (giảm theo đơn)
    if (formData.voucherType === "PERCENTAGE_RECEIPT") {
      if (!formData.percentage || formData.percentage <= 0 || formData.percentage > 100) {
        toast.error("Phần trăm giảm giá phải từ 1% đến 100%");
        return false;
      }
      if (formData.maxDiscount && formData.maxDiscount <= 0) {
        toast.error("Giảm giá tối đa phải lớn hơn 0");
        return false;
      }
    }

    if (formData.minTotal < 0) {
      toast.error("Giá trị đơn hàng tối thiểu không được âm");
      return false;
    }

    if (mode === "create" && !formData.code.trim()) {
      toast.error("Vui lòng nhập mã phiếu giảm giá");
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

  const handleConfirmSubmit = async () => {
    setLoading(true);
    setShowConfirm(false);

    try {
      // Tạo payload đơn giản cho kitsu serialization
      // Convert date to LocalDateTime format (start of day for startDate, end of day for endDate)
      const startDateTime = formData.startDate ? `${formData.startDate}T00:00:00` : null;
      const endDateTime = formData.endDate ? `${formData.endDate}T23:59:59` : null;
      
      const payloadData: any = {
        name: formData.name.trim(),
        voucherType: formData.voucherType,
        startDate: startDateTime,
        endDate: endDateTime,
        enabled: formData.enabled,
        minTotal: formData.minTotal || 0,
        code: formData.code.trim(),
      };

      // Phiếu giảm giá chỉ có PERCENTAGE_RECEIPT (giảm theo đơn)
      if (formData.voucherType === "PERCENTAGE_RECEIPT") {
        payloadData.percentage = formData.percentage;
        if (formData.maxDiscount) {
          payloadData.maxDiscount = formData.maxDiscount;
        }
      }

      // Luôn gửi note, kể cả khi null hoặc rỗng
      payloadData.note = formData.note && formData.note.trim() 
        ? formData.note.trim() 
        : null;

      // Nếu là edit, thêm id vào payload
      const payload: any = payloadData;
      if (mode === "edit" && initialData) {
        payload.id = String(initialData.id || attributes.id);
      }

      if (mode === "create") {
        await createVoucher(payload);
        toast.success("Tạo phiếu giảm giá thành công!");
        // Xóa draft data khi submit thành công
        if (typeof window !== "undefined") {
          localStorage.removeItem(storageKey);
        }
        // Sử dụng window.location để đảm bảo refresh data
        window.location.href = "/vouchers";
      } else {
        await updateVoucher(payload);
        toast.success("Cập nhật phiếu giảm giá thành công!");
        // Xóa draft data khi submit thành công
        if (typeof window !== "undefined") {
          localStorage.removeItem(storageKey);
        }
        // Sử dụng window.location để đảm bảo refresh data
        window.location.href = "/vouchers";
      }
    } catch (error: any) {
      console.error("Error:", error);
      const errorMessage =
        error?.response?.data?.errors?.[0]?.title ||
        error?.response?.data?.errors?.[0]?.detail ||
        (mode === "create"
          ? "Có lỗi xảy ra khi tạo phiếu giảm giá"
          : "Có lỗi xảy ra khi cập nhật phiếu giảm giá");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Tính toán các field có thể edit
  const canEdit = (field: string) => {
    if (mode === "create") return true;
    return canEditField(field, status);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold">
            {mode === "create" ? "Tạo phiếu giảm giá mới" : "Chỉnh sửa phiếu giảm giá"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === "create"
              ? "Điền thông tin để tạo phiếu giảm giá mới"
              : `Trạng thái: ${status === "UPCOMING" ? "Chưa bắt đầu" : status === "ACTIVE" ? "Đang diễn ra" : "Đã kết thúc"}`}
          </p>
        </div>

        {/* Form fields */}
        <div className="bg-white rounded-xl border p-6 space-y-6">
          {/* Tên phiếu giảm giá */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên phiếu giảm giá <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!canEdit("name")}
              className="input w-full"
              placeholder="Ví dụ: Giảm 20% cho đơn hàng trên 500.000đ"
              required
            />
          </div>

          {/* Mã phiếu giảm giá */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã phiếu giảm giá <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              disabled={!canEdit("code") || mode === "edit"}
              className="input w-full"
              placeholder="Ví dụ: VCH00001"
              required
            />
            {mode === "edit" && (
              <p className="text-xs text-gray-500 mt-1">Mã phiếu giảm giá không thể thay đổi</p>
            )}
          </div>

          {/* Loại phiếu giảm giá */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại phiếu giảm giá <span className="text-red-500">*</span>
            </label>
            <select
              name="voucherType"
              value={formData.voucherType}
              onChange={handleChange}
              disabled={!canEdit("voucherType")}
              className="input w-full"
              required
            >
              <option value="PERCENTAGE_RECEIPT">Giảm phần trăm theo hóa đơn (Phiếu giảm giá)</option>
            </select>
          </div>

          {/* Phần trăm giảm giá */}
          {formData.voucherType === "PERCENTAGE_RECEIPT" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phần trăm giảm giá (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="percentage"
                value={formData.percentage || ""}
                onChange={handleChange}
                disabled={!canEdit("percentage")}
                className="input w-full"
                placeholder="Ví dụ: 20"
                min="1"
                max="100"
                step="0.1"
                required
              />
            </div>
          )}

          {/* Giảm giá tối đa */}
          {formData.voucherType === "PERCENTAGE_RECEIPT" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giảm giá tối đa (đồng)
              </label>
              <input
                type="number"
                name="maxDiscount"
                value={formData.maxDiscount || ""}
                onChange={handleChange}
                disabled={!canEdit("maxDiscount")}
                className="input w-full"
                placeholder="Ví dụ: 100000"
                min="0"
                step="1000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Giới hạn số tiền giảm tối đa (tùy chọn)
              </p>
            </div>
          )}


          {/* Giá trị đơn hàng tối thiểu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giá trị đơn hàng tối thiểu (đồng)
            </label>
            <input
              type="number"
              name="minTotal"
              value={formData.minTotal || ""}
              onChange={handleChange}
              disabled={!canEdit("minTotal")}
              className="input w-full"
              placeholder="Ví dụ: 500000"
              min="0"
              step="1000"
            />
          </div>

          {/* Ngày bắt đầu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày bắt đầu <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              disabled={!canEdit("startDate")}
              className="input w-full"
              min={mode === "create" || status === "UPCOMING" ? new Date().toISOString().split("T")[0] : undefined}
              required
            />
            {(mode === "create" || status === "UPCOMING") && (
              <p className="text-xs text-gray-500 mt-1">
                Ngày bắt đầu không được chọn ngày đã qua
              </p>
            )}
            {mode === "edit" && status === "ACTIVE" && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Ngày bắt đầu không thể thay đổi khi phiếu giảm giá đã bắt đầu
              </p>
            )}
          </div>

          {/* Ngày kết thúc */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngày kết thúc <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              disabled={!canEdit("endDate")}
              className="input w-full"
              min={
                formData.startDate 
                  ? (() => {
                      const startDate = new Date(formData.startDate);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      startDate.setHours(0, 0, 0, 0);
                      
                      // Nếu tạo mới hoặc chưa bắt đầu, min là max(today, startDate)
                      if (mode === "create" || status === "UPCOMING") {
                        return startDate > today ? formData.startDate : new Date().toISOString().split("T")[0];
                      }
                      // Nếu đã bắt đầu, chỉ cần sau startDate
                      return formData.startDate;
                    })()
                  : mode === "create" || status === "UPCOMING"
                  ? new Date().toISOString().split("T")[0]
                  : undefined
              }
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Ngày kết thúc phải sau ngày bắt đầu
              {(mode === "create" || status === "UPCOMING") && " và không được trong quá khứ"}
            </p>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú
            </label>
            <textarea
              name="note"
              value={formData.note || ""}
              onChange={handleChange}
              disabled={!canEdit("note")}
              className="input w-full"
              rows={3}
              placeholder="Ghi chú về phiếu giảm giá..."
            />
          </div>

          {/* Trạng thái kích hoạt */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="enabled"
              checked={formData.enabled}
              onChange={handleChange}
              disabled={!canEdit("enabled")}
              className="w-4 h-4"
              id="enabled"
            />
            <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
              Kích hoạt phiếu giảm giá
            </label>
          </div>
        </div>

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
            <button
              type="submit"
              disabled={loading || !canEdit("name")}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading
                ? "Đang xử lý..."
                : mode === "create"
                ? "Tạo phiếu giảm giá"
                : "Cập nhật"}
            </button>
          </div>
        </div>
      </form>

      {/* Confirm dialogs */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
        title={mode === "create" ? "Xác nhận tạo phiếu giảm giá" : "Xác nhận cập nhật phiếu giảm giá"}
        message={
          <div className="space-y-2">
            <p className="font-medium">
              {mode === "create"
                ? "Bạn có chắc chắn muốn tạo phiếu giảm giá này?"
                : "Bạn có chắc chắn muốn cập nhật phiếu giảm giá này?"}
            </p>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-1 text-sm">
              <p><span className="font-medium">Tên:</span> {formData.name}</p>
              <p><span className="font-medium">Mã:</span> {formData.code || "Chưa nhập"}</p>
              <p><span className="font-medium">Loại:</span> Giảm phần trăm theo hóa đơn (Phiếu giảm giá)</p>
              {formData.voucherType === "PERCENTAGE_RECEIPT" && (
                <>
                  <p><span className="font-medium">Giảm:</span> {formData.percentage}%</p>
                  {formData.maxDiscount && (
                    <p><span className="font-medium">Tối đa:</span> {formData.maxDiscount.toLocaleString("vi-VN")}đ</p>
                  )}
                </>
              )}
              {formData.minTotal > 0 && (
                <p><span className="font-medium">Đơn hàng tối thiểu:</span> {formData.minTotal.toLocaleString("vi-VN")}đ</p>
              )}
              {formData.startDate && (
                <p><span className="font-medium">Ngày bắt đầu:</span> {
                  formData.startDate.includes("T") 
                    ? new Date(formData.startDate).toLocaleDateString("vi-VN")
                    : new Date(formData.startDate + "T00:00:00").toLocaleDateString("vi-VN")
                }</p>
              )}
              {formData.endDate && (
                <p><span className="font-medium">Ngày kết thúc:</span> {
                  formData.endDate.includes("T")
                    ? new Date(formData.endDate).toLocaleDateString("vi-VN")
                    : new Date(formData.endDate + "T00:00:00").toLocaleDateString("vi-VN")
                }</p>
              )}
            </div>
          </div>
        }
        confirmText="Xác nhận"
        cancelText="Hủy"
        confirmButtonColor="blue"
        loading={loading}
        loadingText="Đang xử lý..."
      />

      <ConfirmDialog
        isOpen={showBackConfirm}
        onClose={() => setShowBackConfirm(false)}
        onConfirm={handleConfirmBack}
        title="Xác nhận quay lại"
        message="Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn quay lại? Dữ liệu chưa lưu sẽ bị mất."
        confirmText="Quay lại"
        cancelText="Ở lại"
        confirmButtonColor="red"
      />
    </div>
  );
}

