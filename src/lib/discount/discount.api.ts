import { api, jsonApi } from "@/lib/api";
import { API_ROUTES } from "@/lib/routes";

export async function fetchDiscounts() {
  const res = await api.get(API_ROUTES.GET_CAMPAIGNS);
  
  // BE trả về JSON:API format: { data: [...], links: {...} }
  // Có thể lấy trực tiếp từ res.data.data hoặc deserialize
  if (res.data && res.data.data && Array.isArray(res.data.data)) {
    return res.data.data;
  }
  
  // Nếu không có data.data, thử deserialize
  try {
    const deserialized = jsonApi.deserialise(res.data);
    if (Array.isArray(deserialized)) {
      return deserialized;
    }
    if (deserialized && Array.isArray(deserialized.data)) {
      return deserialized.data;
    }
  } catch (e) {
    console.warn("Failed to deserialize, using raw data:", e);
  }
  
  // Fallback: trả về empty array
  return [];
}

export async function fetchDiscountById(id: string | number) {
  const res = await api.get(API_ROUTES.GET_CAMPAIGN_BY_ID({ id }));
  
  // BE trả về JSON:API format: { data: {...}, links: {...} }
  // Có thể lấy trực tiếp từ res.data.data
  if (res.data && res.data.data) {
    return res.data.data;
  }
  
  // Nếu không có data.data, thử deserialize
  try {
    const deserialized = jsonApi.deserialise(res.data);
    return deserialized?.data || deserialized;
  } catch (e) {
    console.warn("Failed to deserialize, using raw data:", e);
    return res.data;
  }
}

export async function createDiscount(data: any) {
  const res = await api.post(
    API_ROUTES.POST_CAMPAIGN_CREATE,
    jsonApi.serialise("campaign", data)
  );
  return res.data;
}

export async function updateDiscount(data: any) {
  const res = await api.put(
    API_ROUTES.PUT_CAMPAIGN_UPDATE,
    jsonApi.serialise("campaign", data)
  );
  return res.data;
}

export async function deleteDiscount(id: string | number) {
  const res = await api.delete(API_ROUTES.DELETE_CAMPAIGN_DELETE({ id }));
  return res.data;
}

