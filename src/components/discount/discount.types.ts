export type DiscountStatus = "UPCOMING" | "ACTIVE" | "EXPIRED";

export type Discount = {
  id: string;
  code: string;
  name: string;

  type: "PERCENT" | "FIXED";
  discountLabel: string;

  minTotal: number;
  endDate: string;

  quantity: number; // fix cứng
  used: number;     // fix cứng

  status: DiscountStatus;
};
