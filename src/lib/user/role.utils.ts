import {Role} from "@/components/user/user.types";

// ===================== ROLE CONSTANTS =====================
export const ROLE_NAMES = {
  ADMIN: "ROLE_ADMIN",
  MANAGER: "ROLE_MANAGER",
  EMPLOYEE: "ROLE_EMPLOYEE",
  USER: "ROLE_USER",
} as const;

export type RoleName = typeof ROLE_NAMES[keyof typeof ROLE_NAMES];

// ===================== ROLE DISPLAY NAMES =====================
// Map role name sang tiếng Việt theo use case diagram
export function getRoleDisplayName(roleName: string): string {
  const roleMap: Record<string, string> = {
    [ROLE_NAMES.ADMIN]: "Quản trị viên",
    [ROLE_NAMES.EMPLOYEE]: "Nhân viên",
    [ROLE_NAMES.USER]: "Khách hàng",
    "ROLE_MANAGER": "Quản lý",
    "ROLE_STAFF": "Nhân viên",
  };

  return roleMap[roleName] || roleName;
}

// ===================== ROLE COLORS =====================
// Trả về Tailwind CSS classes cho màu sắc của vai trò
export function getRoleColorClasses(roleName: string): string {
  const colorMap: Record<string, string> = {
    [ROLE_NAMES.ADMIN]: "bg-red-100 text-red-700", // Đỏ - quyền cao nhất
    [ROLE_NAMES.EMPLOYEE]: "bg-blue-100 text-blue-700", // Xanh dương - chuyên nghiệp
    [ROLE_NAMES.USER]: "bg-green-100 text-green-700", // Xanh lá - thân thiện
    "ROLE_MANAGER": "bg-purple-100 text-purple-700", // Tím - quản lý
    "ROLE_STAFF": "bg-blue-100 text-blue-700", // Xanh dương - nhân viên
  };

  return colorMap[roleName] || "bg-gray-100 text-gray-700"; // Mặc định: xám
}

// ===================== ROLE HIERARCHY =====================
// Phân cấp role theo use case diagram:
// Guest (không có role, chưa đăng nhập)
// User (ROLE_USER) - kế thừa từ Guest
// Staff (ROLE_EMPLOYEE) - kế thừa từ User
// Admin (ROLE_ADMIN) - kế thừa từ Staff

/**
 * Lấy tất cả roles mà user có (bao gồm cả roles kế thừa)
 */
export function getAllUserRoles(roles: Role[]): string[] {
  const roleNames = roles
    .filter((role) => role.enabled !== false)
    .map((role) => role.name);

  const allRoles = new Set<string>(roleNames);

  // Nếu có ROLE_ADMIN, tự động có ROLE_MANAGER, ROLE_EMPLOYEE và ROLE_USER
  if (roleNames.includes(ROLE_NAMES.ADMIN)) {
    allRoles.add(ROLE_NAMES.MANAGER);
    allRoles.add(ROLE_NAMES.EMPLOYEE);
    allRoles.add(ROLE_NAMES.USER);
  }

  // Nếu có ROLE_MANAGER, tự động có ROLE_EMPLOYEE và ROLE_USER
  if (roleNames.includes(ROLE_NAMES.MANAGER)) {
    allRoles.add(ROLE_NAMES.EMPLOYEE);
    allRoles.add(ROLE_NAMES.USER);
  }

  // Nếu có ROLE_EMPLOYEE, tự động có ROLE_USER
  if (roleNames.includes(ROLE_NAMES.EMPLOYEE)) {
    allRoles.add(ROLE_NAMES.USER);
  }

  return Array.from(allRoles);
}

/**
 * Kiểm tra user có role cụ thể (bao gồm cả roles kế thừa)
 */
export function hasRole(roles: Role[], roleName: string): boolean {
  const allRoles = getAllUserRoles(roles);
  return allRoles.includes(roleName);
}

/**
 * Kiểm tra user có phải là Admin không
 */
export function isAdmin(roles: Role[]): boolean {
  return hasRole(roles, ROLE_NAMES.ADMIN);
}

/**
 * Kiểm tra user có phải là Manager (Quản lý) không
 */
export function isManager(roles: Role[]): boolean {
  return hasRole(roles, ROLE_NAMES.MANAGER);
}

/**
 * Kiểm tra user có phải là Staff (Nhân viên) không
 */
export function isStaff(roles: Role[]): boolean {
  return hasRole(roles, ROLE_NAMES.EMPLOYEE);
}

/**
 * Kiểm tra user có phải là User (Khách hàng) không
 */
export function isUser(roles: Role[]): boolean {
  return hasRole(roles, ROLE_NAMES.USER);
}

/**
 * Kiểm tra user có phải là Guest (chưa đăng nhập) không
 */
export function isGuest(roles: Role[] | null | undefined): boolean {
  return !roles || roles.length === 0;
}

// ===================== PERMISSION CHECKS =====================
// Các quyền theo use case diagram

/**
 * Guest permissions: Xem danh sách sách, Xem chi tiết sách, Giỏ hàng, Đăng ký tài khoản
 */
export function canViewBooks(roles: Role[] | null | undefined): boolean {
  // Guest và tất cả users đều có thể xem sách
  return true;
}

export function canViewBookDetails(roles: Role[] | null | undefined): boolean {
  // Guest và tất cả users đều có thể xem chi tiết sách
  return true;
}

export function canUseShoppingCart(roles: Role[] | null | undefined): boolean {
  // Guest và tất cả users đều có thể dùng giỏ hàng
  return true;
}

export function canRegister(roles: Role[] | null | undefined): boolean {
  // Chỉ Guest mới có thể đăng ký
  return isGuest(roles);
}

/**
 * User permissions: Đăng nhập, Thông tin tài khoản, Quản lý giỏ hàng, 
 * Thanh toán, Tra cứu đơn hàng, Áp dụng voucher
 */
export function canLogin(roles: Role[] | null | undefined): boolean {
  // Chỉ Guest mới cần đăng nhập
  return isGuest(roles);
}

export function canViewAccountInfo(roles: Role[] | null | undefined): boolean {
  // User, Staff, Admin đều có thể xem thông tin tài khoản
  return !isGuest(roles);
}

export function canManageCart(roles: Role[] | null | undefined): boolean {
  // User, Staff, Admin đều có thể quản lý giỏ hàng
  return !isGuest(roles);
}

export function canMakePayment(roles: Role[] | null | undefined): boolean {
  // User, Staff, Admin đều có thể thanh toán
  return !isGuest(roles);
}

export function canTrackOrders(roles: Role[] | null | undefined): boolean {
  // User, Staff, Admin đều có thể tra cứu đơn hàng
  return !isGuest(roles);
}

export function canApplyVoucher(roles: Role[] | null | undefined): boolean {
  // User, Staff, Admin đều có thể áp dụng voucher
  return !isGuest(roles);
}

/**
 * Staff permissions: Bán hàng tại quầy POS, Tạo hóa đơn, 
 * Quản lý đơn hàng, Quản lý khách hàng, Hỗ trợ khách hàng
 */
export function canUsePOS(roles: Role[] | null | undefined): boolean {
  // Staff, Manager và Admin có thể dùng POS
  return roles ? (isStaff(roles) || isManager(roles) || isAdmin(roles)) : false;
}

export function canCreateInvoice(roles: Role[] | null | undefined): boolean {
  // Staff, Manager và Admin có thể tạo hóa đơn
  return roles ? (isStaff(roles) || isManager(roles) || isAdmin(roles)) : false;
}

export function canManageOrders(roles: Role[] | null | undefined): boolean {
  // Staff, Manager và Admin có thể quản lý đơn hàng
  return roles ? (isStaff(roles) || isManager(roles) || isAdmin(roles)) : false;
}

export function canManageCustomers(roles: Role[] | null | undefined): boolean {
  // Staff, Manager và Admin có thể quản lý khách hàng
  return roles ? (isStaff(roles) || isManager(roles) || isAdmin(roles)) : false;
}

export function canSupportCustomers(roles: Role[] | null | undefined): boolean {
  // Staff, Manager và Admin có thể hỗ trợ khách hàng
  return roles ? (isStaff(roles) || isManager(roles) || isAdmin(roles)) : false;
}

/**
 * Admin permissions: Quản lý sản phẩm, Quản lý thuộc tính sản phẩm,
 * Quản lý nhân viên, Quản lý người dùng, Phân quyền hệ thống,
 * Quản lý phiếu giảm giá, Quản lý đợt giảm giá, Thống kê & báo cáo
 */
export function canManageProducts(roles: Role[] | null | undefined): boolean {
  // Chỉ Admin có thể quản lý sản phẩm
  return roles ? isAdmin(roles) : false;
}

export function canManageProductAttributes(roles: Role[] | null | undefined): boolean {
  // Chỉ Admin có thể quản lý thuộc tính sản phẩm
  return roles ? isAdmin(roles) : false;
}

export function canManageStaff(roles: Role[] | null | undefined): boolean {
  // Manager và Admin có thể quản lý nhân viên
  return roles ? (isManager(roles) || isAdmin(roles)) : false;
}

export function canManageUsers(roles: Role[] | null | undefined): boolean {
  // Manager và Admin có thể quản lý người dùng
  return roles ? (isManager(roles) || isAdmin(roles)) : false;
}

export function canManagePermissions(roles: Role[] | null | undefined): boolean {
  // Chỉ Admin có thể phân quyền hệ thống
  return roles ? isAdmin(roles) : false;
}

export function canManageVouchers(roles: Role[] | null | undefined): boolean {
  // Chỉ Admin có thể quản lý phiếu giảm giá
  return roles ? isAdmin(roles) : false;
}

export function canManageDiscountCampaigns(roles: Role[] | null | undefined): boolean {
  // Chỉ Admin có thể quản lý đợt giảm giá
  return roles ? isAdmin(roles) : false;
}

export function canViewStatistics(roles: Role[] | null | undefined): boolean {
  // Chỉ Admin có thể xem thống kê & báo cáo
  return roles ? isAdmin(roles) : false;
}

// ===================== UTILITY FUNCTIONS =====================
// Lọc roles trùng lặp (theo name) và chỉ lấy role enabled
export function filterUniqueRoles(roles: Role[]): Role[] {
  const seen = new Set<string>();
  return roles
    .filter((role) => role.enabled !== false) // Chỉ lấy roles enabled
    .filter((role) => {
      if (seen.has(role.name)) {
        return false;
      }
      seen.add(role.name);
      return true;
    });
}




