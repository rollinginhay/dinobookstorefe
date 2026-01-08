export type DiscountStatus = "UPCOMING" | "ACTIVE" | "EXPIRED";

export type Discount = {
  id: string;
  code: string;
  name: string;

  type: "PERCENT" | "FIXED";
  discountLabel: string;

  minTotal: number;
  startDate: string | null | undefined;
  endDate: string | null | undefined;

  quantity: number; // fix cứng
  used: number;     // fix cứng

  status: DiscountStatus;
  
  // Các field từ mapper
  campaignType?: string;
  enabled?: boolean;
  percentage?: number | null;
  maxDiscount?: number | null;
  note?: string | null;
};
