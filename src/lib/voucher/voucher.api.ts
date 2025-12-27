import { api, jsonApi } from "@/lib/api";
import { API_ROUTES } from "@/lib/routes";

export async function fetchVouchers() {
  const res = await api.get(API_ROUTES.GET_VOUCHERS);
  
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

export async function fetchVoucherById(id: string | number) {
  const res = await api.get(API_ROUTES.GET_VOUCHER_BY_ID({ id }));
  
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

export async function createVoucher(data: any) {
  // Loại bỏ id nếu có (không cần id khi tạo mới)
  const { id, ...createData } = data;
  const serialized = jsonApi.serialise("voucher", createData);
  const res = await api.post(
    API_ROUTES.POST_VOUCHER_CREATE,
    serialized
  );
  return res.data;
}

export async function updateVoucher(data: any) {
  // Đảm bảo có id khi update
  if (!data.id) {
    throw new Error("Voucher ID is required for update");
  }
  const serialized = jsonApi.serialise("voucher", data);
  const res = await api.put(
    API_ROUTES.PUT_VOUCHER_UPDATE,
    serialized
  );
  return res.data;
}

export async function deleteVoucher(id: string | number) {
  const res = await api.delete(API_ROUTES.DELETE_VOUCHER_DELETE({ id }));
  return res.data;
}
