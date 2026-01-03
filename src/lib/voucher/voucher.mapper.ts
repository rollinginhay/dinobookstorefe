export function mapVoucherList(raw: any[]) {
  if (!Array.isArray(raw)) {
    return [];
  }
  
  return raw.map((item) => {
    // Hỗ trợ cả format JSON:API (có attributes) và format thường
    const a = item.attributes || item;
    const id = item.id || a.id;

    // Campaign có campaignType, map sang voucherType để tương thích
    const campaignType = a.campaignType || a.voucherType || "";
    const voucherType = a.voucherType || campaignType || "";

    return {
      id: String(id),
      name: a.name || "",
      type: campaignType?.includes("PERCENT") || voucherType?.includes("PERCENT") ? "PERCENT" : "FIXED",
      minTotal: a.minTotal ?? 0,
      discountLabel: a.percentage
        ? `${a.percentage}%`
        : a.maxDiscount
        ? `${a.maxDiscount.toLocaleString("vi-VN")}đ`
        : "0đ",
      code: a.code || "",
      used: a.used || false,
      endDate: a.endDate || null,
      startDate: a.startDate || null,
      enabled: a.enabled !== undefined ? a.enabled : true,
      voucherType: voucherType,
      campaignType: campaignType, // Giữ cả campaignType cho tương thích
      percentage: a.percentage ?? null,
      maxDiscount: a.maxDiscount ?? null,
      note: a.note || null,
    };
  });
}
