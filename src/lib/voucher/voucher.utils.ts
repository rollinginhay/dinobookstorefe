/**
 * Xác định trạng thái của voucher dựa trên startDate và endDate
 */
export type VoucherStatus = "UPCOMING" | "ACTIVE" | "EXPIRED";

export function getVoucherStatus(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): VoucherStatus {
  if (!startDate || !endDate) return "UPCOMING";

  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) {
    return "UPCOMING"; // Chưa diễn ra
  } else if (now >= start && now <= end) {
    return "ACTIVE"; // Đang diễn ra
  } else {
    return "EXPIRED"; // Đã kết thúc
  }
}

/**
 * Kiểm tra xem field có được phép chỉnh sửa không dựa trên trạng thái
 */
export function canEditField(
  field: string,
  status: VoucherStatus
): boolean {
  // Nếu đã kết thúc, không được sửa gì cả
  if (status === "EXPIRED") {
    return false;
  }

  // Nếu đang diễn ra, một số field không được sửa
  if (status === "ACTIVE") {
    const restrictedFields = [
      "voucherType", // Loại giảm giá không được đổi khi đang chạy
      "startDate", // Ngày bắt đầu không được đổi khi đã bắt đầu
    ];
    return !restrictedFields.includes(field);
  }

  // Nếu chưa diễn ra, có thể sửa tất cả
  return true;
}

/**
 * Format date từ API về format cho input date
 */
export function formatDateForInput(dateString: string | null | undefined): string {
  if (!dateString) return "";
  
  try {
    // Nếu date có format ISO với time, chỉ lấy phần date
    if (dateString.includes("T")) {
      return dateString.split("T")[0];
    }
    // Nếu là format date đơn giản (YYYY-MM-DD)
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    // Nếu là format khác, parse và format lại
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  } catch (e) {
    console.warn("Error parsing date:", dateString, e);
  }
  
  return "";
}







