import { User, Role } from "@/components/user/user.types";

export function mapUserList(raw: any[]): User[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  
  return raw.map((item) => {
    // Hỗ trợ cả format JSON:API (có attributes) và format thường
    const a = item.attributes || item;
    const id = item.id || a.id;
    
    // Lấy included từ item hoặc từ parent (nếu được truyền vào)
    const included = item.included || [];

    // Map roles - có thể ở trong attributes.roles hoặc relationships.roles.data
    let roles: Role[] = [];
    
    // Kiểm tra trong relationships (JSON:API format)
    if (item.relationships?.roles?.data) {
      const rolesData = Array.isArray(item.relationships.roles.data) 
        ? item.relationships.roles.data 
        : [item.relationships.roles.data];
      
      roles = rolesData.map((role: any) => {
        // Tìm role trong included nếu có
        const roleIncluded = included.find((inc: any) => inc.type === "role" && String(inc.id) === String(role.id));
        const roleAttrs = roleIncluded?.attributes || role.attributes || role;
        
        return {
          id: String(role.id || roleAttrs?.id || ""),
          name: roleAttrs?.name || "",
          enabled: roleAttrs?.enabled !== undefined ? roleAttrs.enabled : true,
        };
      });
    }
    // Fallback: kiểm tra trong attributes
    else if (a.roles) {
      if (Array.isArray(a.roles)) {
        roles = a.roles.map((role: any) => {
          const roleAttrs = role.attributes || role;
          return {
            id: String(role.id || roleAttrs.id || ""),
            name: roleAttrs.name || "",
            enabled: roleAttrs.enabled !== undefined ? roleAttrs.enabled : true,
          };
        });
      }
    }

    return {
      id: String(id),
      email: a.email || "",
      username: a.username || "",
      personName: a.personName || "",
      phoneNumber: a.phoneNumber || "",
      address: a.address || "",
      enabled: a.enabled !== undefined ? a.enabled : true,
      isOauth2User: a.isOauth2User || false,
      oauth2Id: a.oauth2Id || null,
      note: a.note || null,
      roles: roles,
      createdAt: a.createdAt || null,
      updatedAt: a.updatedAt || null,
    };
  });
}

export function mapUser(raw: any): User {
  const a = raw.attributes || raw;
  const id = raw.id || a.id;

  // Map roles - có thể ở trong attributes.roles hoặc relationships.roles.data
  let roles: Role[] = [];
  
  // Kiểm tra trong relationships (JSON:API format)
  if (raw.relationships?.roles?.data) {
    const rolesData = Array.isArray(raw.relationships.roles.data) 
      ? raw.relationships.roles.data 
      : [raw.relationships.roles.data];
    
    roles = rolesData.map((role: any) => {
      // Tìm role trong included nếu có
      const roleIncluded = raw.included?.find((inc: any) => inc.type === "role" && inc.id === role.id);
      const roleAttrs = roleIncluded?.attributes || role.attributes || role;
      
      return {
        id: String(role.id || roleAttrs?.id || ""),
        name: roleAttrs?.name || "",
        enabled: roleAttrs?.enabled !== undefined ? roleAttrs.enabled : true,
      };
    });
  }
  // Fallback: kiểm tra trong attributes
  else if (a.roles) {
    if (Array.isArray(a.roles)) {
      roles = a.roles.map((role: any) => {
        const roleAttrs = role.attributes || role;
        return {
          id: String(role.id || roleAttrs.id || ""),
          name: roleAttrs.name || "",
          enabled: roleAttrs.enabled !== undefined ? roleAttrs.enabled : true,
        };
      });
    }
  }

  return {
    id: String(id),
    email: a.email || "",
    username: a.username || "",
    personName: a.personName || "",
    phoneNumber: a.phoneNumber || "",
    address: a.address || "",
    enabled: a.enabled !== undefined ? a.enabled : true,
    isOauth2User: a.isOauth2User || false,
    oauth2Id: a.oauth2Id || null,
    note: a.note || null,
    roles: roles,
    createdAt: a.createdAt || null,
    updatedAt: a.updatedAt || null,
  };
}

