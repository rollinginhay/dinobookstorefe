export type Voucher = {
  id: string;
  code: string;
  name: string;

  type: "PERCENT" | "FIXED";
  discountLabel: string;

  minTotal: number;
  endDate: string;
  startDate: string;

  used: boolean;
  enabled: boolean;

  voucherType: string;
  percentage: number | null;
  maxDiscount: number | null;
  note: string | null;
};








