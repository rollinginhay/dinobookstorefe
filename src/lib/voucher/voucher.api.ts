import {api, jsonApi} from "@/lib/api";
import {API_ROUTES} from "@/lib/routes";

/**
 * Lọc voucher campaigns từ danh sách campaigns
 * Phiếu giảm giá (SALE PHIẾU / VOUCHER): chỉ PERCENTAGE_RECEIPT (giảm theo đơn)
 * Đợt giảm giá (SALE ĐỢT / SALE COMBO): PERCENTAGE_PRODUCT, PERCENTAGE_DISCOUNT, FLAT_DISCOUNT (giảm theo sách)
 */
function filterVoucherCampaigns(campaigns: any[]): any[] {
  return campaigns.filter((campaign) => {
    const attributes = campaign.attributes || campaign;
    const campaignType = attributes.campaignType;
    
    // Chỉ giữ lại phiếu giảm giá: PERCENTAGE_RECEIPT (giảm theo đơn)
    return campaignType === "PERCENTAGE_RECEIPT";
  });
}

export async function fetchVouchers() {
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
  
  // Lọc chỉ lấy voucher campaigns (không phải discount campaigns)
  return filterVoucherCampaigns(campaigns);
}

export async function fetchVoucherById(id: string | number) {
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
  
  // Kiểm tra xem campaign này có phải là voucher campaign không
  const attributes = campaign?.attributes || campaign || {};
  const campaignType = attributes.campaignType;
  
  // Chỉ chấp nhận phiếu giảm giá: PERCENTAGE_RECEIPT (giảm theo đơn)
  if (campaignType !== "PERCENTAGE_RECEIPT") {
    throw new Error("Campaign này không phải là phiếu giảm giá (phải là PERCENTAGE_RECEIPT)");
  }
  
  return campaign;
}

export async function createVoucher(data: any) {
  // Loại bỏ id nếu có (không cần id khi tạo mới)
  const { id, ...createData } = data;
  
  // Map voucherType sang campaignType nếu có (để tương thích với form dùng voucherType)
  if (createData.voucherType && !createData.campaignType) {
    createData.campaignType = createData.voucherType;
    // Có thể giữ voucherType hoặc xóa tùy theo BE yêu cầu
  }
  
  // Đảm bảo serialized với resource type "campaign" (không phải "voucher")
  const serialized = jsonApi.serialise("campaign", createData);
  const res = await api.post(
    API_ROUTES.POST_CAMPAIGN_CREATE,
    serialized
  );
  return res.data;
}

export async function updateVoucher(data: any) {
  // Đảm bảo có id khi update
  if (!data.id) {
    throw new Error("Voucher ID is required for update");
  }
  
  // Map voucherType sang campaignType nếu có (để tương thích với form dùng voucherType)
  if (data.voucherType && !data.campaignType) {
    data.campaignType = data.voucherType;
    // Có thể giữ voucherType hoặc xóa tùy theo BE yêu cầu
  }
  
  // Serialized với resource type "campaign" (không phải "voucher")
  const serialized = jsonApi.serialise("campaign", data);
  const res = await api.put(
    API_ROUTES.PUT_CAMPAIGN_UPDATE,
    serialized
  );
  return res.data;
}

export async function deleteVoucher(id: string | number) {
  // Xóa campaign (voucher là một loại campaign)
  const res = await api.delete(API_ROUTES.DELETE_CAMPAIGN_DELETE({ id }));
  return res.data;
}
