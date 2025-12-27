export function mapDiscountList(raw: any[]) {
  return raw.map((item) => {
    const a = item.attributes;

    return {
      id: item.id,
      name: a.name,
      type: a.campaignType?.includes("PERCENT") ? "PERCENT" : "FIXED",
      minTotal: a.minTotal ?? 0,
      discountLabel: a.percentage
        ? `${a.percentage}%`
        : `${a.maxDiscount?.toLocaleString()}đ`,
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
