// ✅ Utility để tính giá đã giảm cho sản phẩm (tương tự admin POS)

export interface Campaign {
  id: string;
  label: string;
  description: string;
  minTotal: number;
  type: string;
  value: number;
  maxDiscount: number;
  percentage?: number; // ✅ Thêm percentage cho PERCENTAGE_RECEIPT
  campaignDetails?: any;
  startDate?: any;
  endDate?: any;
}

// ✅ Fetch campaigns từ API (tương tự admin POS)
export async function fetchCampaigns(): Promise<Campaign[]> {
  try {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
    // ✅ Fetch với ?e=true để lấy included (giống admin POS)
    const res = await fetch(`${API_BASE_URL}/v1/activecampaigns`);
    if (!res.ok) {
      console.error("Không lấy được campaigns");
      return [];
    }

    const data = await res.json();
    const rawCampaigns = data.data || data || [];

    if (!Array.isArray(rawCampaigns)) {
      console.error("Campaigns is not an array:", typeof rawCampaigns);
      return [];
    }

    // Convert campaigns (giống admin POS)
    const now = new Date();
    const converted = await Promise.all(
      rawCampaigns.map(async (c: any) => {
        const attrs = c.attributes || c;
        
        // ✅ Lấy campaignDetails từ relationships (giống admin POS)
        let campaignDetails = 
          attrs.campaignDetails ||
          c.campaignDetails ||
          c.relationships?.campaignDetails ||
          null;

        // ✅ Nếu có relationships.campaignDetails.data, fetch chi tiết từ endpoint relationships
        if (c.relationships?.campaignDetails?.data && Array.isArray(c.relationships.campaignDetails.data)) {
          try {
            const detailsRes = await fetch(
              `${API_BASE_URL}/v1/campaign/${c.id}/relationships/campaignDetail`
            );
            if (detailsRes.ok) {
              const detailsJson = await detailsRes.json();
              campaignDetails = detailsJson.data || [];
              console.log(`✅ [fetchCampaigns] Fetched campaignDetails for campaign ${c.id}:`, campaignDetails.length);
            }
          } catch (err) {
            console.warn(`⚠️ [fetchCampaigns] Error fetching campaignDetails for ${c.id}:`, err);
          }
        }

        return {
          id: String(c.id || attrs.id || ""),
          campaignType: String(attrs.campaignType || c.campaignType || ""),
          name: String(attrs.name || c.name || ""),
          percentage: Number(attrs.percentage || c.percentage || 0),
          minTotal: Number(attrs.minTotal || c.minTotal || 0),
          maxDiscount: Number(attrs.maxDiscount || c.maxDiscount || 0),
          startDate: attrs.startDate || c.startDate,
          endDate: attrs.endDate || c.endDate,
          campaignDetails: campaignDetails,
        };
      })
    );
    
    const filtered = converted
      .filter((c: any) => {
        // ✅ LUÔN LUÔN check date range cho TẤT CẢ campaigns (kể cả PERCENTAGE_PRODUCT)
        // ✅ Backend không check date cho PERCENTAGE_PRODUCT, nên frontend PHẢI check
        const campaignType = c.campaignType;
        
        if (c.startDate && c.endDate) {
          try {
            const startDate = new Date(c.startDate);
            const endDate = new Date(c.endDate);
            endDate.setHours(23, 59, 59, 999);
            const isActive = now >= startDate && now <= endDate;
            if (!isActive) {
              console.log("⏰ [fetchCampaigns] Campaign đã hết hạn:", {
                id: c.id,
                name: c.name,
                type: campaignType,
                startDate,
                endDate,
                now
              });
            }
            return isActive;
          } catch (e) {
            console.error("❌ [fetchCampaigns] Lỗi parse date:", e);
            return false; // ✅ Nếu lỗi parse date, không giữ campaign
          }
        }
        
        // ✅ Nếu không có date range: Bỏ tất cả (không giữ campaigns không có date range)
        console.log("⚠️ [fetchCampaigns] Campaign không có date range (bỏ qua):", {
          id: c.id,
          type: campaignType
        });
        return false;
      })
      .map((c: any) => {
        // Map campaignType sang type (giống admin POS)
        let type = c.campaignType;
        if (c.campaignType === "PERCENTAGE_DISCOUNT") {
          type = "PERCENTAGE_RECEIPT"; // Giảm % theo đơn
        } else if (c.campaignType === "PERCENTAGE_PRODUCT") {
          type = "PERCENTAGE_PRODUCT"; // Giảm cố định theo sản phẩm
        }
        
        // Map value
        let value = 0;
        if (c.campaignType === "PERCENTAGE_RECEIPT" || c.campaignType === "PERCENTAGE_DISCOUNT") {
          value = c.percentage || 0;
        } else if (c.campaignType === "PERCENTAGE_PRODUCT") {
          value = c.percentage || 0; // ✅ SỬA: Giảm theo phần trăm (giống POS)
        }
        
        // Tạo label
        let label = "";
        if (c.campaignType === "PERCENTAGE_RECEIPT" || c.campaignType === "PERCENTAGE_DISCOUNT") {
          label = `${c.percentage || 0}%`;
          if (c.maxDiscount) {
            label += ` (tối đa ${c.maxDiscount.toLocaleString()}đ)`;
          }
        } else if (c.campaignType === "PERCENTAGE_PRODUCT") {
          label = `Giảm ${c.percentage || 0}%`; // ✅ SỬA: Hiển thị phần trăm (giống POS)
        }
        
        return {
          id: c.id,
          label: label,
          description: c.name || "",
          minTotal: c.minTotal || 0,
          type: type,
          value: value,
          maxDiscount: c.maxDiscount || 0,
          percentage: c.percentage || 0,
          campaignDetails: c.campaignDetails,
          startDate: c.startDate,
          endDate: c.endDate,
        };
      });

    return filtered;
  } catch (error) {
    console.error("Lỗi fetch campaigns:", error);
    return [];
  }
}

// ✅ Tính giá đã giảm cho sản phẩm (tương tự admin POS)
export function calculateDiscountedPrice(
  productId: number | string,
  originalPrice: number,
  campaigns: Campaign[]
): { discountedPrice: number; originalPrice: number; hasDiscount: boolean; discountAmount: number; campaignName?: string } {
  if (!campaigns || campaigns.length === 0) {
    return {
      discountedPrice: originalPrice,
      originalPrice: originalPrice,
      hasDiscount: false,
      discountAmount: 0,
    };
  }

  // Tìm campaign PERCENTAGE_PRODUCT áp dụng cho sản phẩm này
  const productCampaigns = campaigns.filter((v) => v.type === "PERCENTAGE_PRODUCT");
  const applicable = productCampaigns.filter((v) => {
    const campaignDetails = v.campaignDetails?.data || v.campaignDetails || [];
    return (
      Array.isArray(campaignDetails) &&
      campaignDetails.some((detail: any) => {
        const bookDetailId = detail.attributes?.bookDetailId || detail.bookDetailId;
        return String(bookDetailId) === String(productId);
      })
    );
  });

  if (applicable.length > 0) {
    // ✅ SỬA: Giảm giá theo phần trăm (giống POS)
    // value là phần trăm giảm giá (VD: 15 = 15%)
    const percentage = applicable[0].value || 0;
    const discountAmount = (originalPrice * percentage) / 100;
    const discountedPrice = Math.max(0, originalPrice - discountAmount);
    return {
      discountedPrice: discountedPrice,
      originalPrice: originalPrice,
      hasDiscount: discountedPrice < originalPrice,
      discountAmount: discountAmount,
      campaignName: applicable[0].description || applicable[0].label, // Tên chương trình giảm giá
    };
  }

  return {
    discountedPrice: originalPrice,
    originalPrice: originalPrice,
    hasDiscount: false,
    discountAmount: 0,
  };
}