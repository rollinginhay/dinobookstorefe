import {api, jsonApi} from "@/lib/api";
import {API_ROUTES} from "@/lib/routes";

export async function fetchUsers() {
  // Force refresh with timestamp to bypass cache
  const res = await api.get(`${API_ROUTES.GET_USERS}?t=${Date.now()}`);
  console.log("---------------------------",res)
  // BE trả về JSON:API format: { data: [...], included: [...], links: {...} }
  let users: any[] = [];
  let included: any[] = [];
  
  if (res.data && res.data.data && Array.isArray(res.data.data)) {
    users = res.data.data;
    // Lấy included data nếu có (chứa roles)
    if (res.data.included && Array.isArray(res.data.included)) {
      included = res.data.included;
    }
    console.log(`fetchUsers: Loaded ${users.length} users with ${included.length} included resources`);
  } else {
    // Nếu không có data.data, thử deserialize
    try {
      const deserialized = jsonApi.deserialise(res.data);
      
      if (Array.isArray(deserialized)) {
        users = deserialized;
      } else if (deserialized && Array.isArray(deserialized.data)) {
        users = deserialized.data;
        if (deserialized.included) {
          included = Array.isArray(deserialized.included) ? deserialized.included : [];
        }
      }
      console.log("deserialized",deserialized)
      console.log(`fetchUsers: Deserialized ${users.length} users with ${included.length} included resources`);
    } catch (e) {
      console.warn("Failed to deserialize, using raw data:", e);
      console.warn("Raw response data:", res.data);
    }
  }
  
  // Gắn included data vào mỗi user để mapper có thể sử dụng
  const result = users.map((user: any) => ({
    ...user,
    included: included,
  }));
  
  console.log(`fetchUsers: Returning ${result.length} users`);
  return result;
}

export async function fetchUserById(id: string | number) {
  const res = await api.get(API_ROUTES.GET_USER_BY_ID({ id }));
  
  // BE trả về JSON:API format: { data: {...}, included: [...], links: {...} }
  let user: any = null;
  let included: any[] = [];
  
  if (res.data && res.data.data) {
    user = res.data.data;
    // Lấy included data nếu có (chứa roles)
    if (res.data.included && Array.isArray(res.data.included)) {
      included = res.data.included;
    }
  } else {
    // Nếu không có data.data, thử deserialize
    try {
      const deserialized = jsonApi.deserialise(res.data);
      user = deserialized?.data || deserialized;
      if (deserialized?.included) {
        included = Array.isArray(deserialized.included) ? deserialized.included : [];
      }
    } catch (e) {
      console.warn("Failed to deserialize, using raw data:", e);
      user = res.data;
    }
  }
  
  // Gắn included data vào user để mapper có thể sử dụng
  if (user) {
    return {
      ...user,
      included: included,
    };
  }
  
  return user;
}

export async function createUser(data: any) {
  // Loại bỏ id nếu có (không cần id khi tạo mới)
  const { id, ...createData } = data;
  const serialized = jsonApi.serialise("user", createData);
  const res = await api.post(
    API_ROUTES.POST_USER_CREATE,
    serialized
  );
  return res.data;
}

export async function createUserWithRole(data: any) {
  // API mới để tạo user với role (bypass JsonApiValidator bug)
  const { id, roles, ...createData } = data;
  
  // Serialize user attributes trước
  let serialized: any;
  try {
    const serializedStr = jsonApi.serialise("user", createData);
    // jsonApi.serialise có thể trả về string hoặc object
    serialized = typeof serializedStr === "string" ? JSON.parse(serializedStr) : serializedStr;
  } catch (e) {
    console.error("❌ Error serializing user:", e);
    // Fallback: tạo structure mới
    serialized = {
      data: {
        type: "user",
        attributes: createData
      }
    };
  }
  
  // ✅ Đảm bảo có structure đúng
  if (!serialized.data) {
    serialized.data = { type: "user", attributes: createData };
  }
  if (!serialized.data.attributes) {
    serialized.data.attributes = createData;
  }
  
  // ✅ Format roles thành JSON:API relationships format
  if (roles && Array.isArray(roles) && roles.length > 0) {
    if (!serialized.data.relationships) {
      serialized.data.relationships = {};
    }
    
    // Format roles: [{ id: "1", type: "role" }] -> relationships.roles.data
    serialized.data.relationships.roles = {
      data: roles.map((role: any) => ({
        type: "role",
        id: String(role.id || role)
      }))
    };
    console.log("✅ Roles formatted as relationships:", serialized.data.relationships.roles);
  } else {
    console.warn("⚠️ No roles provided in createUserWithRole");
  }
  
  console.log("🚀 [Frontend] Using createUserWithRole API");
  console.log("🚀 [Frontend] Final payload:", JSON.stringify(serialized, null, 2));
  
  const res = await api.post(
    API_ROUTES.POST_USER_CREATE_WITH_ROLE,
    serialized
  );
  return res.data;
}

export async function updateUser(data: any) {
  // Đảm bảo có id khi update
  if (!data.id) {
    throw new Error("User ID is required for update");
  }
  console.log("updateUser - Input data:", data);
  const serialized = jsonApi.serialise("user", data);
  console.log("updateUser - Serialized payload:", JSON.stringify(serialized, null, 2));
  const res = await api.put(
    API_ROUTES.PUT_USER_UPDATE,
    serialized
  );
  console.log("updateUser - Response:", res.data);
  return res.data;
}

export async function updateUserWithRole(data: any) {
  // API mới để update user với role (bypass JsonApiValidator bug)
  // Đảm bảo có id khi update
  if (!data.id) {
    throw new Error("User ID is required for update");
  }
  
  const { id, roles, ...updateData } = data;
  
  // Serialize user attributes trước
  let serialized: any;
  try {
    const serializedStr = jsonApi.serialise("user", updateData);
    // jsonApi.serialise có thể trả về string hoặc object
    serialized = typeof serializedStr === "string" ? JSON.parse(serializedStr) : serializedStr;
  } catch (e) {
    console.error("❌ Error serializing user:", e);
    // Fallback: tạo structure mới
    serialized = {
      data: {
        type: "user",
        id: String(id),
        attributes: updateData
      }
    };
  }
  
  // ✅ Đảm bảo có structure đúng
  if (!serialized.data) {
    serialized.data = { type: "user", id: String(id), attributes: updateData };
  }
  if (!serialized.data.attributes) {
    serialized.data.attributes = updateData;
  }
  if (!serialized.data.id) {
    serialized.data.id = String(id);
  }
  
  // ✅ Format roles thành JSON:API relationships format
  if (roles && Array.isArray(roles) && roles.length > 0) {
    if (!serialized.data.relationships) {
      serialized.data.relationships = {};
    }
    
    // Format roles: [{ id: "1", type: "role" }] -> relationships.roles.data
    serialized.data.relationships.roles = {
      data: roles.map((role: any) => ({
        type: "role",
        id: String(role.id || role)
      }))
    };
    console.log("✅ Roles formatted as relationships:", serialized.data.relationships.roles);
  } else {
    console.warn("⚠️ No roles provided in updateUserWithRole");
  }
  
  console.log("🚀 [Frontend] Using updateUserWithRole API");
  console.log("🚀 [Frontend] Final payload:", JSON.stringify(serialized, null, 2));
  
  const res = await api.put(
    API_ROUTES.PUT_USER_UPDATE_WITH_ROLE,
    serialized
  );
  return res.data;
}

export async function deleteUser(id: string | number) {
  const res = await api.delete(API_ROUTES.DELETE_USER_DELETE({ id }));
  return res.data;
}

export async function resetUserPassword(id: string | number) {
  const res = await api.post(API_ROUTES.POST_USER_RESET_PASSWORD({ id }));
  return res.data;
}