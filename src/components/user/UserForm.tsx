"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {usePathname, useRouter} from "next/navigation";
import {createUser, fetchUsers, resetUserPassword, updateUser} from "@/lib/user/user.api";
import {fetchRoles} from "@/lib/user/role.api";
import {getRoleDisplayName} from "@/lib/user/role.utils";
import {mapUserList} from "@/lib/user/user.mapper";
import {toast} from "sonner";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {Role, User} from "./user.types";
import {useAuth} from "@/context/auth-context";

type Props = {
  mode: "create" | "edit";
  initialData?: any;
};

export default function UserForm({ mode, initialData }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState(false);
  const [showEnabledConfirm, setShowEnabledConfirm] = useState(false);
  const [pendingEnabledValue, setPendingEnabledValue] = useState<boolean | null>(null);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const hasSyncedInitialRole = useRef(false);
  const initialRoleFromAPI = useRef<Role | null>(null);

  // Kiểm tra xem có phải form khách hàng không (ẩn vai trò, ghi chú, reset password)
  // Form khách hàng: /users hoặc /users/[id] hoặc /users/new
  // Form nhân viên: /users/staff hoặc /users/staff/[id] hoặc /users/staff/new
  const isCustomerForm = pathname ? 
    (pathname.startsWith("/users/") && !pathname.startsWith("/users/staff")) : 
    true; // Mặc định là form khách hàng nếu chưa có pathname

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

    // Chỉ lấy từ localStorage khi edit
    if (mode === "edit") {
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
    }
    // Khi create, không lấy từ localStorage (để role được set đúng trong useEffect)

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

  // Kiểm tra xem có thay đổi không (bao gồm cả role)
  useEffect(() => {
    // So sánh từng field để phát hiện thay đổi chính xác
    let changed = false;
    
    // So sánh các field cơ bản
    if (formData.email.trim() !== (initialFormData.email || "").trim()) changed = true;
    if (formData.username.trim() !== (initialFormData.username || "").trim()) changed = true;
    if (formData.personName.trim() !== (initialFormData.personName || "").trim()) changed = true;
    if (formData.phoneNumber?.trim() !== (initialFormData.phoneNumber || "").trim()) changed = true;
    if (formData.address?.trim() !== (initialFormData.address || "").trim()) changed = true;
    if (formData.enabled !== initialFormData.enabled) changed = true;
    if (formData.note?.trim() !== (initialFormData.note || "").trim()) changed = true;
    
    // So sánh role - so sánh id của role
    if (!isCustomerForm) {
      const currentRoleId = formData.roles?.[0]?.id ? String(formData.roles[0].id) : "";
      
      // Ưu tiên dùng initialRoleFromAPI nếu có (đã được sync từ API)
      let initialRoleId = "";
      if (initialRoleFromAPI.current?.id) {
        initialRoleId = String(initialRoleFromAPI.current.id);
      } else if (initialFormData.roles?.[0]?.id) {
        initialRoleId = String(initialFormData.roles[0].id);
      } else if (initialFormData.roles?.[0]) {
        initialRoleId = String(initialFormData.roles[0]);
      } else {
        // Thử lấy từ attributes hoặc initialData trực tiếp
        const attrsRoles = attributes.roles || initialData?.roles || [];
        if (attrsRoles.length > 0) {
          const firstRole = attrsRoles[0];
          initialRoleId = String(firstRole.id || firstRole.attributes?.id || firstRole);
        }
      }
      
      if (currentRoleId !== initialRoleId && (currentRoleId || initialRoleId)) {
        changed = true;
        console.log("Role change detected:", { currentRoleId, initialRoleId, formDataRoles: formData.roles, initialRoleFromAPI: initialRoleFromAPI.current });
      }
    }
    
    console.log("hasChanges will be set to:", changed, "| formData.roles:", formData.roles);
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

  // Load danh sách users để check duplicate (chỉ khi tạo mới)
  useEffect(() => {
    if (mode === "create") {
      const loadUsers = async () => {
        try {
          const res = await fetchUsers();
          const mapped = mapUserList(res);
          setAllUsers(mapped);
        } catch (err: any) {
          console.error("Error fetching users for duplicate check:", err);
        }
      };
      loadUsers();
    }
  }, [mode]);

  // Load danh sách roles (chỉ khi không phải form khách hàng)
  useEffect(() => {
    if (isCustomerForm) return; // Không load roles cho form khách hàng
    
    const loadRoles = async () => {
      try {
        setLoadingRoles(true);
        const roles = await fetchRoles();
        setAvailableRoles(roles);
        
        // Nếu là tạo mới, tự động set role là Quản lý (ROLE_MANAGER)
        if (mode === "create") {
          const managerRole = roles.find(r => r.name === "ROLE_MANAGER");
          if (managerRole) {
            // Xóa localStorage draft nếu có để đảm bảo role mới được set
            if (typeof window !== "undefined" && storageKey) {
              try {
                localStorage.removeItem(storageKey);
              } catch (e) {
                console.warn("Failed to remove localStorage:", e);
              }
            }
            setFormData(prev => {
              // Luôn set role là Quản lý khi tạo mới
              console.log("Auto-setting role to ROLE_MANAGER:", managerRole);
              return {
                ...prev,
                roles: [managerRole]
              };
            });
          }
        }
      } catch (err: any) {
        console.error("Error fetching roles:", err);
        toast.error("Không thể tải danh sách vai trò");
      } finally {
        setLoadingRoles(false);
      }
    };

    loadRoles();
  }, [isCustomerForm, mode, storageKey]);

  // Sync roles từ availableRoles khi load xong (chỉ sync lần đầu, không ghi đè khi user đã thay đổi)
  useEffect(() => {
    if (isCustomerForm || availableRoles.length === 0 || hasSyncedInitialRole.current) {
      console.log("Skipping role sync:", { isCustomerForm, availableRolesLength: availableRoles.length, hasSynced: hasSyncedInitialRole.current });
      return;
    }
    console.log("Running initial role sync...");
    
    // Nếu đang edit, cần sync role từ initialData với availableRoles
    if (mode === "edit" && initialData) {
      // Lấy role từ initialData (từ API) - ưu tiên mapped data trước
      const initialRoles = initialData.roles || attributes.roles || [];
      if (initialRoles.length > 0) {
        const initialRole = initialRoles[0];
        const roleId = initialRole.id || initialRole.attributes?.id || initialRole;
        const roleName = initialRole.name || initialRole.attributes?.name;
        
        // Tìm role tương ứng trong availableRoles
        const matchedRole = availableRoles.find(r => 
          String(r.id) === String(roleId) || 
          r.name === roleName
        );
        
        if (matchedRole) {
          // Lưu role ban đầu từ API vào ref để so sánh sau này
          initialRoleFromAPI.current = matchedRole;
          
          // Đảm bảo formData có role đúng từ availableRoles (chỉ sync lần đầu)
          // Chỉ sync nếu formData chưa có role hoặc role hiện tại không phải là role object đầy đủ từ availableRoles
          setFormData(prev => {
            const currentRole = prev.roles?.[0];
            const currentRoleId = currentRole?.id ? String(currentRole.id) : "";
            const matchedRoleId = String(matchedRole.id);
            
            // Chỉ sync nếu:
            // 1. Chưa có role trong formData, HOẶC
            // 2. Role hiện tại không khớp với role từ API, HOẶC
            // 3. Role hiện tại không có đầy đủ thông tin (không phải object từ availableRoles)
            const needsSync = !currentRoleId || 
                             currentRoleId !== matchedRoleId || 
                             !currentRole?.name || 
                             typeof currentRole === 'string' ||
                             typeof currentRole === 'number';
            
            if (needsSync) {
              console.log("Initial sync: Setting role from", currentRole, "to", matchedRole);
              return {
                ...prev,
                roles: [matchedRole]
              };
            }
            return prev;
          });
          hasSyncedInitialRole.current = true;
        }
      }
    } else if (mode === "create") {
      // Với create mode, đánh dấu đã sync sau khi auto-set role
      hasSyncedInitialRole.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableRoles.length, mode, isCustomerForm]);

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


  // Handler quay lại - không cần confirm, quay lại luôn
  const handleBack = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
    // Quay lại đúng trang dựa trên loại form
    const backPath = isCustomerForm ? "/users" : "/users/staff";
    router.push(backPath);
  };

  const validateForm = (): boolean => {
    if (!formData.email.trim()) {
      toast.error("Vui lòng nhập email");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.error("Email không hợp lệ");
      return false;
    }

    if (formData.email.trim().length > 255) {
      toast.error("Email không được vượt quá 255 ký tự");
      return false;
    }

    if (mode === "create") {
      const duplicateEmail = allUsers.find(
        u => u.email?.toLowerCase() === formData.email.trim().toLowerCase()
      );
      if (duplicateEmail) {
        toast.error("Email này đã được sử dụng");
        return false;
      }
    }

    if (!formData.username.trim()) {
      toast.error("Vui lòng nhập tên đăng nhập");
      return false;
    }

    if (formData.username.trim().length < 3) {
      toast.error("Tên đăng nhập phải có ít nhất 3 ký tự");
      return false;
    }

    if (formData.username.trim().length > 50) {
      toast.error("Tên đăng nhập không được vượt quá 50 ký tự");
      return false;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(formData.username.trim())) {
      toast.error("Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới");
      return false;
    }

    if (mode === "create") {
      const duplicateUsername = allUsers.find(
        u => u.username?.toLowerCase() === formData.username.trim().toLowerCase()
      );
      if (duplicateUsername) {
        toast.error("Tên đăng nhập này đã được sử dụng");
        return false;
      }
    }

    if (!formData.personName.trim()) {
      toast.error("Vui lòng nhập họ tên");
      return false;
    }

    if (formData.personName.trim().length < 2) {
      toast.error("Họ tên phải có ít nhất 2 ký tự");
      return false;
    }

    if (formData.personName.trim().length > 100) {
      toast.error("Họ tên không được vượt quá 100 ký tự");
      return false;
    }

    if (formData.phoneNumber && formData.phoneNumber.trim()) {
      const phoneRegex = /^[0-9]{10,11}$/;
      const cleanPhone = formData.phoneNumber.replace(/\s/g, "");
      if (!phoneRegex.test(cleanPhone)) {
        toast.error("Số điện thoại không hợp lệ (10-11 chữ số)");
        return false;
      }

      if (mode === "create") {
        const duplicatePhone = allUsers.find(
          u => u.phoneNumber && u.phoneNumber.replace(/\s/g, "") === cleanPhone
        );
        if (duplicatePhone) {
          toast.error("Số điện thoại này đã được sử dụng");
          return false;
        }
      }
    }

    if (formData.address && formData.address.trim().length > 500) {
      toast.error("Địa chỉ không được vượt quá 500 ký tự");
      return false;
    }

    if (!isCustomerForm && (!formData.roles || formData.roles.length === 0)) {
      toast.error("Vui lòng chọn vai trò");
      return false;
    }

    if (!isCustomerForm && formData.note && formData.note.trim().length > 1000) {
      toast.error("Ghi chú không được vượt quá 1000 ký tự");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("=== handleSubmit called ===");
    console.log("hasChanges:", hasChanges);
    console.log("formData.roles:", formData.roles);
    console.log("mode:", mode);

    if (!validateForm()) {
      console.log("Validation failed");
      return;
    }

    // Kiểm tra nếu là edit mode và chưa có thay đổi gì
    if (mode === "edit" && !hasChanges) {
      console.log("No changes detected, showing info toast");
      toast.info("Bạn chưa chỉnh sửa gì");
      return;
    }

    console.log("Showing confirm dialog");
    // Hiển thị confirm dialog
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    console.log("=== handleConfirmSubmit CALLED ===");
    console.log("formData at start:", formData);
    console.log("formData.roles at start:", formData.roles);
    
    setLoading(true);
    setShowConfirm(false);

    try {
      console.log("=== SUBMITTING FORM ===");
      console.log("formData:", formData);
      console.log("formData.roles:", formData.roles);
      console.log("initialRoleFromAPI:", initialRoleFromAPI.current);
      console.log("hasChanges:", hasChanges);
      
      const payloadData: any = {
        email: formData.email.trim(),
        username: formData.username.trim(),
        personName: formData.personName.trim(),
        phoneNumber: formData.phoneNumber.trim() || null,
        address: formData.address.trim() || null,
        enabled: formData.enabled,
      };

      // Không cho phép thay đổi password trong form này
      // Password chỉ được thay đổi trong form đăng nhập/đổi mật khẩu

      // Xử lý note và roles
      if (!isCustomerForm) {
        // Form quản lý nhân viên: có note và roles
        payloadData.note = formData.note && formData.note.trim() ? formData.note.trim() : null;
        
        // Xử lý roles - Format đúng JSON:API với relationships
        let rolesToSend: any[] = [];
        
        if (formData.roles && Array.isArray(formData.roles) && formData.roles.length > 0) {
          // Lấy role từ formData (đã được chọn trong combobox)
          const selectedRole = formData.roles[0];
          console.log("Selected role from formData:", selectedRole);
          
          // Đảm bảo role có id hợp lệ
          const roleId = selectedRole.id || selectedRole.attributes?.id;
          console.log("Extracted roleId:", roleId);
          
          if (roleId) {
            rolesToSend = [{
              id: String(roleId),
              type: "role",
            }];
            console.log("Roles to send:", rolesToSend);
          } else {
            console.error("Role không có ID hợp lệ:", selectedRole);
            toast.error("Vai trò không hợp lệ");
            setLoading(false);
            return;
          }
        } else if (mode === "create") {
          // Nếu tạo mới mà không có role, set mặc định là ROLE_MANAGER
          const managerRole = availableRoles.find(r => r.name === "ROLE_MANAGER");
          if (managerRole) {
            rolesToSend = [{
              id: String(managerRole.id),
              type: "role",
            }];
          } else {
            toast.error("Không tìm thấy vai trò mặc định");
            setLoading(false);
            return;
          }
        } else if (mode === "edit") {
          // Khi edit, BẮT BUỘC phải có role
          console.error("ERROR: No role in formData when editing!");
          console.error("formData.roles:", formData.roles);
          toast.error("Vui lòng chọn vai trò");
          setLoading(false);
          return;
        }
        
        // Format roles theo JSON:API - có thể gửi trực tiếp hoặc trong relationships
        // Kitsu-core sẽ tự động serialize nếu gửi trực tiếp
        payloadData.roles = rolesToSend;
        console.log("Payload roles set to:", payloadData.roles);
      } else {
        // Form khách hàng: giữ nguyên roles hiện tại khi edit (không cho phép thay đổi)
        if (mode === "edit") {
          const existingRoles = attributes.roles || initialData?.roles || [];
          if (Array.isArray(existingRoles) && existingRoles.length > 0) {
            const firstRole = existingRoles[0];
            const roleId = firstRole.id || firstRole.attributes?.id || firstRole;
            payloadData.roles = [{
              id: String(roleId),
              type: "role",
            }];
          }
        }
      }

      // Nếu là edit, thêm id vào payload
      const payload: any = payloadData;
      if (mode === "edit" && initialData) {
        payload.id = String(initialData.id || attributes.id);
      }
      
      console.log("Final payload before serialization:", payload);

      if (mode === "create") {
        await createUser(payload);
        toast.success(isCustomerForm ? "Tạo khách hàng thành công!" : "Tạo nhân viên thành công!");
        if (typeof window !== "undefined") {
          localStorage.removeItem(storageKey);
          sessionStorage.setItem("shouldReloadStaff", "true");
        }
        const redirectPath = isCustomerForm ? "/users" : "/users/staff";
        // Sử dụng router.push với timestamp để force reload và trigger pathname change
        router.push(`${redirectPath}?reload=${Date.now()}`);
      } else {
        await updateUser(payload);
        toast.success(isCustomerForm ? "Cập nhật khách hàng thành công!" : "Cập nhật nhân viên thành công!");
        if (typeof window !== "undefined") {
          localStorage.removeItem(storageKey);
          sessionStorage.setItem("shouldReloadStaff", "true");
        }
        const redirectPath = isCustomerForm ? "/users" : "/users/staff";
        // Sử dụng router.push với timestamp để force reload và trigger pathname change
        router.push(`${redirectPath}?reload=${Date.now()}`);
      }
    } catch (error: any) {
      console.error("=== ERROR in handleConfirmSubmit ===");
      console.error("Error object:", error);
      console.error("Error response:", error?.response);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);
      
      // Kiểm tra nếu là lỗi 401 (Unauthorized) - session hết hạn
      if (error?.response?.status === 401) {
        console.error("401 Unauthorized - Session expired");
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        // Redirect về login sẽ được xử lý bởi axios interceptor
        return;
      }
      
      // Kiểm tra nếu là lỗi 404
      if (error?.response?.status === 404) {
        console.error("404 Not Found - API endpoint not found");
        toast.error("Không tìm thấy API endpoint. Vui lòng kiểm tra lại.");
        return;
      }
      
      const errorMessage =
        error?.response?.data?.errors?.[0]?.title ||
        error?.response?.data?.errors?.[0]?.detail ||
        error?.response?.data?.message ||
        error?.message ||
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


  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold">
            {isCustomerForm
              ? (mode === "create" ? "Tạo khách hàng mới" : "Chỉnh sửa khách hàng")
              : (mode === "create" ? "Tạo nhân viên mới" : "Chỉnh sửa nhân viên")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isCustomerForm
              ? (mode === "create"
                  ? "Điền thông tin để tạo khách hàng mới"
                  : "Cập nhật thông tin khách hàng")
              : (mode === "create"
                  ? "Điền thông tin để tạo nhân viên mới"
                  : "Cập nhật thông tin nhân viên")}
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
              className={`input w-full ${mode === "edit" ? "bg-gray-100 cursor-not-allowed" : ""}`}
              placeholder="example@email.com"
              required
              disabled={mode === "edit"}
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên đăng nhập <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`input w-full ${mode === "edit" ? "bg-gray-100 cursor-not-allowed" : ""}`}
              placeholder="username"
              required
              disabled={mode === "edit"}
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


          {/* Roles Selection - chỉ hiển thị khi không phải form khách hàng */}
          {!isCustomerForm && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vai trò <span className="text-red-500">*</span>
              </label>
              {loadingRoles ? (
                <p className="text-sm text-gray-500">Đang tải danh sách vai trò...</p>
              ) : availableRoles.length === 0 ? (
                <p className="text-sm text-gray-500">Không có vai trò nào</p>
              ) : (
                <select
                  name="selectedRole"
                  value={
                    formData.roles && formData.roles.length > 0
                      ? String(
                          formData.roles[0]?.id ||
                          formData.roles[0]?.attributes?.id ||
                          formData.roles[0] ||
                          ""
                        )
                      : ""
                  }
                  onFocus={() => {
                    console.log("=== Role select focused ===");
                    console.log("Current value:", formData.roles?.[0]);
                    console.log("Available roles:", availableRoles);
                  }}
                  onChange={(e) => {
                    const selectedRoleId = String(e.target.value);
                    console.log("=== Role dropdown changed ===");
                    console.log("selectedRoleId:", selectedRoleId);
                    console.log("availableRoles:", availableRoles);
                    console.log("Current formData.roles:", formData.roles);
                    
                    // Tìm role trong availableRoles
                    const selectedRole = availableRoles.find(r => {
                      const roleIdStr = String(r.id);
                      console.log(`Comparing: ${roleIdStr} === ${selectedRoleId}?`, roleIdStr === selectedRoleId);
                      return roleIdStr === selectedRoleId;
                    });
                    
                    console.log("Found selectedRole:", selectedRole);
                    
                    if (selectedRole) {
                      console.log("Setting new role:", selectedRole);
                      // Đánh dấu đã sync để ngăn useEffect ghi đè
                      hasSyncedInitialRole.current = true;
                      
                      // Cập nhật formData với role mới
                      setFormData(prev => {
                        const newFormData = {
                          ...prev,
                          roles: [selectedRole]
                        };
                        console.log("New formData will be:", newFormData);
                        return newFormData;
                      });
                      
                      // Đánh dấu đã có thay đổi
                      setHasChanges(true);
                      console.log("Role updated successfully");
                    } else {
                      console.error("ERROR: Could not find role with ID:", selectedRoleId);
                      console.error("Available role IDs:", availableRoles.map(r => ({ id: r.id, name: r.name, idType: typeof r.id })));
                    }
                  }}
                  className="input w-full"
                  required
                >
                  <option value="">-- Chọn vai trò --</option>
                  {availableRoles
                    .filter(role => {
                      // Chỉ hiển thị ROLE_MANAGER và ROLE_EMPLOYEE
                      const roleName = role.name || "";
                      return roleName === "ROLE_MANAGER" || roleName === "ROLE_EMPLOYEE";
                    })
                    .map((role) => (
                      <option key={role.id} value={String(role.id)}>
                        {getRoleDisplayName(role.name)} {!role.enabled ? "(Vô hiệu hóa)" : ""}
                      </option>
                    ))}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Chọn vai trò cho người dùng này
              </p>
            </div>
          )}

          {/* Trạng thái kích hoạt - chỉ hiển thị khi edit */}
          {mode === "edit" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái tài khoản
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const newValue = !formData.enabled;
                    setPendingEnabledValue(newValue);
                    setShowEnabledConfirm(true);
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
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
            </div>
          )}
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
            {/* Reset Password Button - chỉ hiển thị cho admin, khi edit, và không phải form khách hàng */}
            {mode === "edit" && isAdmin() && !isCustomerForm && (
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


      {/* Reset Password Confirm Dialog - chỉ hiển thị khi không phải form khách hàng */}
      {!isCustomerForm && (
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
      )}

      {/* Enabled Status Change Confirm Dialog - chỉ hiển thị khi edit */}
      {mode === "edit" && (
        <ConfirmDialog
          isOpen={showEnabledConfirm}
          onClose={() => {
            setShowEnabledConfirm(false);
            setPendingEnabledValue(null);
          }}
          onConfirm={handleConfirmEnabledChange}
          title="Xác nhận thay đổi trạng thái tài khoản"
          message={
            <div className="space-y-2">
              <p className="font-medium">
                Bạn có chắc muốn {pendingEnabledValue ? "kích hoạt" : "vô hiệu hóa"} tài khoản này?
              </p>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1 text-sm">
                <p className="font-medium text-blue-800">Lưu ý:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  {pendingEnabledValue ? (
                    <>
                      <li>Tài khoản sẽ được kích hoạt và có thể đăng nhập</li>
                      <li>Người dùng sẽ có thể sử dụng tất cả các chức năng</li>
                    </>
                  ) : (
                    <>
                      <li>Tài khoản sẽ bị vô hiệu hóa và không thể đăng nhập</li>
                      <li>Người dùng sẽ không thể truy cập hệ thống</li>
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
    </div>
  );
}

