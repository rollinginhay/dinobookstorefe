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

// Helper để serialize campaign với relationships (theo format JSON:API)
function serializeCampaign(data: any) {
  const { campaignDetails, ...attributes } = data;
  
  // ✅ Serialize base resource - kitsu trả về string JSON
  const serializedStr = jsonApi.serialise("campaign", attributes);
  
  // Parse thành object để thêm relationships
  let parsed: any;
  try {
    parsed = typeof serializedStr === "string" ? JSON.parse(serializedStr) : serializedStr;
  } catch (e) {
    console.error("❌ Error parsing serialized:", e, "serializedStr:", serializedStr);
    // Fallback: tạo structure mới
    parsed = {
      data: {
        type: "campaign",
        attributes: attributes
      }
    };
  }
  
  // ✅ Đảm bảo có structure đúng
  if (!parsed.data) {
    parsed.data = { type: "campaign", attributes: attributes };
  }
  if (!parsed.data.attributes) {
    parsed.data.attributes = attributes;
  }
  
  // ✅ Thêm relationships.campaignDetails theo format JSON:API
  if (campaignDetails && Array.isArray(campaignDetails) && campaignDetails.length > 0) {
    if (!parsed.data.relationships) {
      parsed.data.relationships = {};
    }
    
    parsed.data.relationships.campaignDetails = {
      data: campaignDetails.map((cd: any) => ({
        type: "campaignDetail",
        attributes: {
          bookDetailId: cd.bookDetailId,
          value: cd.value || null,
        }
      }))
    };
  }
  
  const finalPayload = JSON.stringify(parsed);
  console.log("🔍 Serialized campaign payload:", finalPayload);
  return finalPayload;
}

export async function createDiscount(data: any) {
  const serialized = serializeCampaign(data);
  const res = await api.post(
    API_ROUTES.POST_CAMPAIGN_CREATE,
    serialized
  );
  return res.data;
}

export async function updateDiscount(data: any) {
  const serialized = serializeCampaign(data);
  const res = await api.put(
    API_ROUTES.PUT_CAMPAIGN_UPDATE,
    serialized
  );
  return res.data;
}

export async function deleteDiscount(id: string | number) {
  const res = await api.delete(API_ROUTES.DELETE_CAMPAIGN_DELETE({ id }));
  return res.data;
}

