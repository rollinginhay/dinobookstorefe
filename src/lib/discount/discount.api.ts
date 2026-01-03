import {api, jsonApi} from "@/lib/api";
import {API_ROUTES} from "@/lib/routes";

/**
 * Lọc discount campaigns từ danh sách campaigns
 * Đợt giảm giá (SALE ĐỢT / SALE COMBO): PERCENTAGE_PRODUCT, PERCENTAGE_DISCOUNT, FLAT_DISCOUNT (giảm theo sách)
 * Phiếu giảm giá (SALE PHIẾU / VOUCHER): PERCENTAGE_RECEIPT (giảm theo đơn) - KHÔNG lấy
 */
function filterDiscountCampaigns(campaigns: any[]): any[] {
  return campaigns.filter((campaign) => {
    const attributes = campaign.attributes || campaign;
    const campaignType = attributes.campaignType;
    
    // Chỉ giữ lại đợt giảm giá: PERCENTAGE_PRODUCT, PERCENTAGE_DISCOUNT, FLAT_DISCOUNT (giảm theo sách)
    return (
      campaignType === "PERCENTAGE_PRODUCT" ||
      campaignType === "PERCENTAGE_DISCOUNT" ||
      campaignType === "FLAT_DISCOUNT"
    );
  });
}

export async function fetchDiscounts() {
  // Lấy tất cả campaigns từ BE
  const res = await api.get(API_ROUTES.GET_CAMPAIGNS);
  
  let campaigns: any[] = [];
  
  // BE trả về JSON:API format: { data: [...], links: {...} }
  // Có thể lấy trực tiếp từ res.data.data hoặc deserialize
  if (res.data && res.data.data && Array.isArray(res.data.data)) {
    campaigns = res.data.data;
  } else {
  // Nếu không có data.data, thử deserialize
  try {
    const deserialized = jsonApi.deserialise(res.data);
    if (Array.isArray(deserialized)) {
        campaigns = deserialized;
      } else if (deserialized && Array.isArray(deserialized.data)) {
        campaigns = deserialized.data;
    }
  } catch (e) {
    console.warn("Failed to deserialize, using raw data:", e);
    }
  }
  
  // Lọc chỉ lấy đợt giảm giá (không phải phiếu giảm giá)
  return filterDiscountCampaigns(campaigns);
}

export async function fetchDiscountById(id: string | number) {
  // Lấy campaign từ BE (campaign có thể là voucher hoặc discount)
  const res = await api.get(API_ROUTES.GET_CAMPAIGN_BY_ID({ id }));
  
  let campaign: any = null;
  
  // BE trả về JSON:API format: { data: {...}, links: {...} }
  // Có thể lấy trực tiếp từ res.data.data
  if (res.data && res.data.data) {
    campaign = res.data.data;
  } else {
  // Nếu không có data.data, thử deserialize
  try {
    const deserialized = jsonApi.deserialise(res.data);
      campaign = deserialized?.data || deserialized;
  } catch (e) {
    console.warn("Failed to deserialize, using raw data:", e);
      campaign = res.data;
    }
  }
  
  // Kiểm tra xem campaign này có phải là discount campaign không
  const attributes = campaign?.attributes || campaign || {};
  const campaignType = attributes.campaignType;
  
  // Chỉ chấp nhận đợt giảm giá: PERCENTAGE_PRODUCT, PERCENTAGE_DISCOUNT, FLAT_DISCOUNT (giảm theo sách)
  if (
    campaignType !== "PERCENTAGE_PRODUCT" &&
    campaignType !== "PERCENTAGE_DISCOUNT" &&
    campaignType !== "FLAT_DISCOUNT"
  ) {
    throw new Error("Campaign này không phải là đợt giảm giá");
  }
  
  return campaign;
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

