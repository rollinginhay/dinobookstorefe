import { api, jsonApi } from "@/lib/api";
import { API_ROUTES } from "@/lib/routes";
import { Role } from "@/components/user/user.types";
import { filterUniqueRoles } from "./role.utils";

export async function fetchRoles(): Promise<Role[]> {
  const res = await api.get(API_ROUTES.GET_ROLES);
  
  let roles: any[] = [];
  
  // BE trả về JSON:API format: { data: [...], links: {...} }
  if (res.data && res.data.data && Array.isArray(res.data.data)) {
    roles = res.data.data;
  } else {
    // Nếu không có data.data, thử deserialize
    try {
      const deserialized = jsonApi.deserialise(res.data);
      if (Array.isArray(deserialized)) {
        roles = deserialized;
      } else if (deserialized && Array.isArray(deserialized.data)) {
        roles = deserialized.data;
      }
    } catch (e) {
      console.warn("Failed to deserialize, using raw data:", e);
    }
  }
  
  // Map roles từ API response
  const mappedRoles: Role[] = roles.map((role: any) => {
    const attrs = role.attributes || role;
    return {
      id: String(role.id || attrs.id || ""),
      name: attrs.name || "",
      enabled: attrs.enabled !== undefined ? attrs.enabled : true,
    };
  });
  
  // Lọc trùng lặp và chỉ lấy roles enabled
  return filterUniqueRoles(mappedRoles);
}

