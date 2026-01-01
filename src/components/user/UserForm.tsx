"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createUser, updateUser, resetUserPassword } from "@/lib/user/user.api";
import { fetchRoles } from "@/lib/user/role.api";
import { getRoleDisplayName, getRoleColorClasses } from "@/lib/user/role.utils";
import { toast } from "sonner";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { User, Role } from "./user.types";
import { useAuth } from "@/context/auth-context";

type Props = {
  mode: "create" | "edit";
  initialData?: any;
};

export default function UserForm({ mode, initialData }: Props) {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Parse initialData từ API
  const attributes = initialData?.attributes || initialData || {};

  // Key để lưu vào localStorage
  const storageKey = mode === "create" 
    ? "user_form_draft" 
    : `user_form_draft_${initialData?.id || attributes?.id}`;

  // Khôi phục dữ liệu từ localStorage hoặc dùng initialData
  const getInitialFormData = () => {
    if (typeof window === "undefined") {
      return {
        email: attributes.email || "",
        username: attributes.username || "",
        personName: attributes.personName || "",
        phoneNumber: attributes.phoneNumber || "",
        address: attributes.address || "",
        enabled: attributes.enabled !== undefined ? attributes.enabled : true,
        note: attributes.note || "",
        roles: attributes.roles || [],
      };
    }

    // Thử lấy từ localStorage
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          email: parsed.email || "",
          username: parsed.username || "",
          personName: parsed.personName || "",
          phoneNumber: parsed.phoneNumber || "",
          address: parsed.address || "",
          enabled: parsed.enabled !== undefined ? parsed.enabled : true,
          note: parsed.note || "",
          roles: parsed.roles || [],
        };
      } catch (e) {
        console.warn("Failed to parse saved form data:", e);
      }
    }

    return {
      email: attributes.email || "",
      username: attributes.username || "",
      personName: attributes.personName || "",
      phoneNumber: attributes.phoneNumber || "",
      address: attributes.address || "",
      enabled: attributes.enabled !== undefined ? attributes.enabled : true,
      note: attributes.note || "",
      roles: attributes.roles || [],
    };
  };

  const initialFormData = useMemo(() => getInitialFormData(), []);
  const [formData, setFormData] = useState(initialFormData);

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
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [formData, storageKey, hasChanges]);

  // Load danh sách roles
  useEffect(() => {
    const loadRoles = async () => {
      try {
        setLoadingRoles(true);
        const roles = await fetchRoles(); // fetchRoles đã lọc trùng lặp và map rồi
        setAvailableRoles(roles);
      } catch (err: any) {
        console.error("Error fetching roles:", err);
        toast.error("Không thể tải danh sách vai trò");
      } finally {
        setLoadingRoles(false);
      }
    };

    loadRoles();
  }, []);

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
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      setHasChanges(true);
    }
  };

  // Handler chọn/bỏ chọn role
  const handleRoleToggle = (roleId: string) => {
    setFormData((prev) => {
      const currentRoles = prev.roles || [];
      const roleIndex = currentRoles.findIndex((r: any) => String(r.id || r) === roleId);
      
      let newRoles;
      if (roleIndex >= 0) {
        // Bỏ chọn role
        newRoles = currentRoles.filter((r: any) => String(r.id || r) !== roleId);
      } else {
        // Chọn role
        const role = availableRoles.find((r) => r.id === roleId);
        if (role) {
          newRoles = [...currentRoles, role];
        } else {
          newRoles = currentRoles;
        }
      }
      
      return {
        ...prev,
        roles: newRoles,
      };
    });
    setHasChanges(true);
  };

  // Kiểm tra role có được chọn không
  const isRoleSelected = (roleId: string) => {
    const currentRoles = formData.roles || [];
    return currentRoles.some((r: any) => String(r.id || r) === roleId);
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
    router.push("/users");
  };

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      toast.error("Vui lòng nhập email");
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Email không hợp lệ");
      return false;
    }

    if (!formData.username.trim()) {
      toast.error("Vui lòng nhập tên người dùng");
      return false;
    }

    if (!formData.personName.trim()) {
      toast.error("Vui lòng nhập họ tên");
      return false;
    }

    // Validate phone number (optional but if provided, should be valid)
    if (formData.phoneNumber && formData.phoneNumber.trim()) {
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ""))) {
        toast.error("Số điện thoại không hợp lệ (10-11 chữ số)");
        return false;
      }
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
      const payloadData: any = {
        email: formData.email.trim(),
        username: formData.username.trim(),
        personName: formData.personName.trim(),
        phoneNumber: formData.phoneNumber.trim() || null,
        address: formData.address.trim() || null,
        enabled: formData.enabled,
        note: formData.note && formData.note.trim() ? formData.note.trim() : null,
      };

      // Không cho phép thay đổi password trong form này
      // Password chỉ được thay đổi trong form đăng nhập/đổi mật khẩu

      // Xử lý roles - giữ nguyên roles hiện tại khi edit nếu không có thay đổi
      if (formData.roles && Array.isArray(formData.roles) && formData.roles.length > 0) {
        payloadData.roles = formData.roles.map((role: any) => ({
          id: String(role.id || role),
          type: "role",
        }));
      } else if (mode === "edit") {
        // Giữ nguyên roles hiện tại nếu không có thay đổi
        // Check both attributes format and direct format
        const existingRoles = attributes.roles || initialData?.roles || [];
        if (Array.isArray(existingRoles) && existingRoles.length > 0) {
          payloadData.roles = existingRoles.map((role: any) => {
            const roleId = role.id || role.attributes?.id || role;
            return {
              id: String(roleId),
              type: "role",
            };
          });
        }
      }

      // Nếu là edit, thêm id vào payload
      const payload: any = payloadData;
      if (mode === "edit" && initialData) {
        payload.id = String(initialData.id || attributes.id);
      }

      if (mode === "create") {
        await createUser(payload);
        toast.success("Tạo người dùng thành công!");
        if (typeof window !== "undefined") {
          localStorage.removeItem(storageKey);
        }
        window.location.href = "/users";
      } else {
        await updateUser(payload);
        toast.success("Cập nhật người dùng thành công!");
        if (typeof window !== "undefined") {
          localStorage.removeItem(storageKey);
        }
        window.location.href = "/users";
      }
    } catch (error: any) {
      console.error("Error:", error);
      const errorMessage =
        error?.response?.data?.errors?.[0]?.title ||
        error?.response?.data?.errors?.[0]?.detail ||
        (mode === "create"
          ? "Có lỗi xảy ra khi tạo người dùng"
          : "Có lỗi xảy ra khi cập nhật người dùng");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setResettingPassword(true);
    setShowResetPasswordConfirm(false);

    try {
      const userId = initialData?.id || attributes.id;
      if (!userId) {
        toast.error("Không tìm thấy ID người dùng");
        return;
      }

      await resetUserPassword(userId);
      toast.success("Reset mật khẩu thành công! Người dùng sẽ nhận được email với mật khẩu tạm và cần đổi mật khẩu khi đăng nhập lại.");
    } catch (error: any) {
      console.error("Error resetting password:", error);
      const errorMessage =
        error?.response?.data?.errors?.[0]?.title ||
        error?.response?.data?.errors?.[0]?.detail ||
        "Có lỗi xảy ra khi reset mật khẩu";
      toast.error(errorMessage);
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold">
            {mode === "create" ? "Tạo người dùng mới" : "Chỉnh sửa người dùng"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === "create"
              ? "Điền thông tin để tạo người dùng mới"
              : "Cập nhật thông tin người dùng"}
          </p>
        </div>

        {/* Form fields */}
        <div className="bg-white rounded-xl border p-6 space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input w-full"
              placeholder="example@email.com"
              required
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên người dùng <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="input w-full"
              placeholder="username"
              required
            />
          </div>

          {/* Person Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Họ tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="personName"
              value={formData.personName}
              onChange={handleChange}
              className="input w-full"
              placeholder="Nguyễn Văn A"
              required
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số điện thoại
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="input w-full"
              placeholder="0123456789"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ
            </label>
            <textarea
              name="address"
              value={formData.address || ""}
              onChange={handleChange}
              className="input w-full"
              rows={3}
              placeholder="Địa chỉ chi tiết..."
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú
            </label>
            <textarea
              name="note"
              value={formData.note || ""}
              onChange={handleChange}
              className="input w-full"
              rows={3}
              placeholder="Ghi chú về người dùng..."
            />
          </div>

          {/* Roles Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vai trò
            </label>
            {loadingRoles ? (
              <p className="text-sm text-gray-500">Đang tải danh sách vai trò...</p>
            ) : availableRoles.length === 0 ? (
              <p className="text-sm text-gray-500">Không có vai trò nào</p>
            ) : (
              <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {availableRoles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={isRoleSelected(role.id)}
                        onChange={() => handleRoleToggle(role.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className={`text-sm font-medium ${getRoleColorClasses(role.name)} px-2 py-0.5 rounded`}>
                        {getRoleDisplayName(role.name)}
                      </span>
                      {!role.enabled && (
                        <span className="text-xs text-gray-400">(Vô hiệu hóa)</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Chọn các vai trò cho người dùng này
            </p>
          </div>

          {/* Trạng thái kích hoạt */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="enabled"
              checked={formData.enabled}
              onChange={handleChange}
              className="w-4 h-4"
              id="enabled"
            />
            <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
              Kích hoạt tài khoản
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <button
            type="button"
            onClick={handleBack}
            disabled={loading || resettingPassword}
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
            {/* Reset Password Button - chỉ hiển thị cho admin và khi edit */}
            {mode === "edit" && isAdmin() && (
              <button
                type="button"
                onClick={() => setShowResetPasswordConfirm(true)}
                disabled={loading || resettingPassword}
                className="px-5 py-2.5 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
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
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                Reset mật khẩu
              </button>
            )}
            <button
              type="button"
              onClick={handleBack}
              disabled={loading || resettingPassword}
              className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || resettingPassword}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading
                ? "Đang xử lý..."
                : mode === "create"
                ? "Tạo người dùng"
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
        title={mode === "create" ? "Xác nhận tạo người dùng" : "Xác nhận cập nhật người dùng"}
        message={
          <div className="space-y-2">
            <p className="font-medium">
              {mode === "create"
                ? "Bạn có chắc chắn muốn tạo người dùng này?"
                : "Bạn có chắc chắn muốn cập nhật người dùng này?"}
            </p>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-1 text-sm">
              <p><span className="font-medium">Email:</span> {formData.email}</p>
              <p><span className="font-medium">Tên người dùng:</span> {formData.username}</p>
              <p><span className="font-medium">Họ tên:</span> {formData.personName}</p>
              {formData.phoneNumber && (
                <p><span className="font-medium">Số điện thoại:</span> {formData.phoneNumber}</p>
              )}
              {formData.address && (
                <p><span className="font-medium">Địa chỉ:</span> {formData.address}</p>
              )}
              <p><span className="font-medium">Trạng thái:</span> {formData.enabled ? "Hoạt động" : "Vô hiệu hóa"}</p>
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

      {/* Reset Password Confirm Dialog */}
      <ConfirmDialog
        isOpen={showResetPasswordConfirm}
        onClose={() => setShowResetPasswordConfirm(false)}
        onConfirm={handleResetPassword}
        title="Xác nhận reset mật khẩu"
        message={
          <div className="space-y-2">
            <p className="font-medium">
              Bạn có chắc muốn reset mật khẩu cho người dùng này?
            </p>
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-1 text-sm">
              <p className="font-medium text-orange-800">Lưu ý:</p>
              <ul className="list-disc list-inside space-y-1 text-orange-700">
                <li>Hệ thống sẽ tạo mật khẩu tạm hoặc gửi link reset qua email</li>
                <li>Người dùng bắt buộc phải đổi mật khẩu khi đăng nhập lại</li>
                <li>Hành động này sẽ được ghi vào audit log</li>
              </ul>
            </div>
          </div>
        }
        confirmText="Xác nhận reset"
        cancelText="Hủy"
        confirmButtonColor="orange"
        loading={resettingPassword}
        loadingText="Đang reset mật khẩu..."
      />
    </div>
  );
}

