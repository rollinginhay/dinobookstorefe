import { Role } from "@/components/user/user.types";

// Map role name sang tiếng Việt
export function getRoleDisplayName(roleName: string): string {
  const roleMap: Record<string, string> = {
    "ROLE_ADMIN": "Quản trị viên",
    "ROLE_EMPLOYEE": "Nhân viên",
    "ROLE_USER": "Người dùng",
    "ROLE_MANAGER": "Quản lý",
    "ROLE_STAFF": "Nhân viên",
  };

  return roleMap[roleName] || roleName;
}

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


