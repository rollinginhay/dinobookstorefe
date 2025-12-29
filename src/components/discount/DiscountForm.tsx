"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createDiscount, updateDiscount } from "@/lib/discount/discount.api";
import { toast } from "sonner";
import {
  getCampaignStatus,
  canEditField,
  formatDateForInput,
  CampaignStatus,
} from "@/lib/discount/discount.utils";
import ConfirmDialog from "@/components/common/ConfirmDialog";

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
  const [hasChanges, setHasChanges] = useState(false);

  // Parse initialData từ API
  const attributes = initialData?.attributes || initialData || {};
  const relationships = initialData?.relationships || {};
  const campaignDetails = relationships?.campaignDetails?.data || [];

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
          attributes.campaignType ||
          (attributes.type === "PERCENT" ? "PERCENTAGE_DISCOUNT" : "FLAT_DISCOUNT") ||
          "PERCENTAGE_DISCOUNT",
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
            attributes.campaignType ||
            (attributes.type === "PERCENT" ? "PERCENTAGE_DISCOUNT" : "FLAT_DISCOUNT") ||
            "PERCENTAGE_DISCOUNT",
          enabled: attributes.enabled !== undefined ? attributes.enabled : true,
        };
        return {
          name: parsed.name || "",
          campaignType: parsed.campaignType || (mode === "create" ? "PERCENTAGE_DISCOUNT" : baseData.campaignType),
          startDate: parsed.startDate || "",
          endDate: parsed.endDate || "",
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

    return {
      name: attributes.name || "",
      campaignType:
        attributes.campaignType ||
        (attributes.type === "PERCENT" ? "PERCENTAGE_DISCOUNT" : "FLAT_DISCOUNT") ||
        "PERCENTAGE_DISCOUNT",
      startDate: formatDateForInput(attributes.startDate),
      endDate: formatDateForInput(attributes.endDate),
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
    router.push("/voucher");
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên đợt giảm giá");
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

    if (formData.campaignType === "PERCENTAGE_DISCOUNT") {
      if (!formData.percentage || formData.percentage <= 0 || formData.percentage > 100) {
        toast.error("Phần trăm giảm giá phải từ 1% đến 100%");
        return false;
      }
    } else if (formData.campaignType === "FLAT_DISCOUNT") {
      if (!formData.maxDiscount || formData.maxDiscount <= 0) {
        toast.error("Số tiền giảm giá phải lớn hơn 0");
        return false;
      }
    }

    if (formData.minTotal < 0) {
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

    // Hiển thị confirm dialog
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    setShowConfirm(false);

    try {
      // Tạo payload đơn giản cho kitsu serialization
      const payloadData: any = {
        name: formData.name.trim(),
        campaignType: formData.campaignType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        enabled: formData.enabled,
        minTotal: formData.minTotal || 0,
      };

      // Thêm percentage hoặc maxDiscount tùy theo loại
      if (formData.campaignType === "PERCENTAGE_DISCOUNT") {
        payloadData.percentage = formData.percentage;
        payloadData.maxDiscount = null;
      } else if (formData.campaignType === "FLAT_DISCOUNT") {
        payloadData.maxDiscount = formData.maxDiscount;
        payloadData.percentage = null;
      }

      // Thêm note nếu có
      if (formData.note.trim()) {
        payloadData.note = formData.note.trim();
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
              <option value="PERCENTAGE_DISCOUNT">Giảm theo phần trăm (%)</option>
              <option value="FLAT_DISCOUNT">Giảm theo số tiền cố định (đ)</option>
            </select>
            {isFieldDisabled("campaignType") && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Loại giảm giá không thể thay đổi khi đợt giảm giá đang diễn ra
              </p>
            )}
          </div>

          {/* Giá trị giảm */}
          {formData.campaignType === "PERCENTAGE_DISCOUNT" && (
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
                  disabled={isFormReadOnly}
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
            </div>
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

          {/* Giá trị đơn hàng tối thiểu */}
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
              Đơn hàng phải đạt giá trị này mới được áp dụng giảm giá (để 0 nếu không yêu cầu)
            </p>
          </div>

          {/* Ngày bắt đầu */}
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
              min={mode === "create" || status === "UPCOMING" ? new Date().toISOString().split("T")[0] : undefined}
            />
            {isFieldDisabled("startDate") && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Ngày bắt đầu không thể thay đổi khi đợt giảm giá đã bắt đầu
              </p>
            )}
          </div>

          {/* Ngày kết thúc */}
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
              disabled={isFormReadOnly}
              className="input w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
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
              value={formData.note}
              onChange={handleChange}
              disabled={isFormReadOnly}
              rows={3}
              className="input w-full disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
              placeholder="Thêm ghi chú về đợt giảm giá này (tùy chọn)"
            />
          </div>

          {/* Thông tin số lượng và đã dùng (chỉ hiển thị khi edit) */}
          {mode === "edit" && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Số lượng voucher
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {campaignDetails.length}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tổng số mã giảm giá đã tạo
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Đã sử dụng
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  0
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Số mã đã được sử dụng
                </p>
              </div>
            </div>
          )}

          {/* Trạng thái kích hoạt */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              name="enabled"
              type="checkbox"
              checked={formData.enabled}
              onChange={handleChange}
              disabled={isFormReadOnly}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div>
              <label className="text-sm font-medium text-gray-700 cursor-pointer">
                Kích hoạt đợt giảm giá
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                Tắt để vô hiệu hóa đợt giảm giá này
              </p>
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
      </div>
    </div>
  );
}
