export function mapDiscountList(raw: any[]) {
  return raw.map((item) => {
    const a = item.attributes;
    const campaignType = a.campaignType;

    // ✅ SỬA: Logic hiển thị giảm giá đúng theo loại campaign
    let discountLabel = "";
    if (campaignType === "PERCENTAGE_DISCOUNT") {
      // Giảm theo phần trăm đơn hàng
      if (a.percentage) {
        discountLabel = `${a.percentage}%`;
        if (a.maxDiscount) {
          discountLabel += ` (tối đa ${a.maxDiscount.toLocaleString()}đ)`;
        }
      } else {
        discountLabel = `${a.maxDiscount?.toLocaleString() || 0}đ`;
      }
    } else if (campaignType === "PERCENTAGE_PRODUCT") {
      // Combo: giảm theo phần trăm cho mỗi sản phẩm
      discountLabel = a.percentage ? `${a.percentage}%` : "0%";
    } else if (campaignType === "FLAT_DISCOUNT") {
      // Giảm cố định đơn hàng
      discountLabel = `${a.maxDiscount?.toLocaleString() || 0}đ`;
    } else {
      // Fallback cho các loại cũ
      discountLabel = a.percentage
        ? `${a.percentage}%`
        : `${a.maxDiscount?.toLocaleString() || 0}đ`;
    }

    return {
      id: item.id,
      name: a.name,
      type: a.campaignType?.includes("PERCENT") ? "PERCENT" : "FIXED",
      minTotal: a.minTotal ?? 0,
      discountLabel: discountLabel,
      quantity: item.relationships?.campaignDetails?.data?.length ?? 0,
      used: 0, // BE chưa trả
      endDate: a.endDate,
      startDate: a.startDate,
      enabled: a.enabled,
      campaignType: a.campaignType,
      percentage: a.percentage,
      maxDiscount: a.maxDiscount,
      note: a.note,
    };
  });
}
