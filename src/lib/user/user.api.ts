import { api, jsonApi } from "@/lib/api";
import { API_ROUTES } from "@/lib/routes";

export async function fetchUsers() {
  const res = await api.get(API_ROUTES.GET_USERS);
  
  // BE trả về JSON:API format: { data: [...], included: [...], links: {...} }
  let users: any[] = [];
  let included: any[] = [];
  
  if (res.data && res.data.data && Array.isArray(res.data.data)) {
    users = res.data.data;
    // Lấy included data nếu có (chứa roles)
    if (res.data.included && Array.isArray(res.data.included)) {
      included = res.data.included;
    }
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
    } catch (e) {
      console.warn("Failed to deserialize, using raw data:", e);
    }
  }
  
  // Gắn included data vào mỗi user để mapper có thể sử dụng
  return users.map((user: any) => ({
    ...user,
    included: included,
  }));
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

export async function updateUser(data: any) {
  // Đảm bảo có id khi update
  if (!data.id) {
    throw new Error("User ID is required for update");
  }
  const serialized = jsonApi.serialise("user", data);
  const res = await api.put(
    API_ROUTES.PUT_USER_UPDATE,
    serialized
  );
  return res.data;
}

export async function deleteUser(id: string | number) {
  const res = await api.delete(API_ROUTES.DELETE_USER_DELETE({ id }));
  return res.data;
}

