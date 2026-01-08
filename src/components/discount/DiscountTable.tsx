import Link from "next/link";
import {Discount} from "./discount.types";

function generateCode(id: string | number) {
  return `CAM${String(id).padStart(5, "0")}`;
}

export default function DiscountTable({ data }: { data: Discount[] }) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <table className="w-full border-collapse">
        <thead className="bg-gray-50 text-sm">
          <tr>
            <th className="px-4 py-3 text-left">Mã</th>
            <th className="px-4 py-3 text-left">Tên</th>
            <th className="px-4 py-3 text-left">Loại</th>
            <th className="px-4 py-3 text-left">Giá trị tối thiểu</th>
            <th className="px-4 py-3 text-left">Giảm</th>
            <th className="px-4 py-3 text-center">Ngày bắt đầu</th>
            <th className="px-4 py-3 text-center">Ngày kết thúc</th>
            <th className="px-4 py-3 text-center">Trạng thái</th>
            <th className="px-4 py-3 text-center">Hành động</th>
          </tr>
        </thead>

        <tbody>
          {data.map((d) => (
            <tr key={d.id} className="border-t text-sm">
              {/* ✅ MÃ – FE TỰ SINH */}
              <td className="px-4 py-3 font-medium">
                {generateCode(d.id)}
              </td>

              <td className="px-4 py-3">{d.name}</td>

              <td className="px-4 py-3">
                {(() => {
                  const campaignType = d.campaignType;
                  if (campaignType === "PERCENTAGE_PRODUCT") {
                    return "Combo";
                  } else if (campaignType === "PERCENTAGE_DISCOUNT") {
                    return "Đợt";
                  } else if (campaignType === "FLAT_DISCOUNT") {
                    return "Số tiền";
                  }
                  // Fallback cho các loại cũ
                  return d.type === "PERCENT" ? "Phần trăm" : "Tiền mặt";
                })()}
              </td>

              <td className="px-4 py-3">
                {d.minTotal.toLocaleString()}đ
              </td>

              <td className="px-4 py-3">{d.discountLabel}</td>

              <td className="px-4 py-3 text-center text-gray-700">
                {d.startDate 
                  ? new Date(d.startDate).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit"
                    })
                  : "-"}
              </td>

              <td className="px-4 py-3 text-center text-gray-700">
                {d.endDate 
                  ? new Date(d.endDate).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit"
                    })
                  : "-"}
              </td>

              <td className="px-4 py-3 text-center">
                {(() => {
                  const isCombo = d.campaignType === "PERCENTAGE_PRODUCT";
                  const now = new Date();
                  const start = d.startDate ? new Date(d.startDate) : null;
                  const end = d.endDate ? new Date(d.endDate) : null;
                  
                  // Combo không có ngày → luôn "Đang diễn ra"
                  if (isCombo && (!start || !end)) {
                    return (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                        Đang diễn ra
                      </span>
                    );
                  }
                  
                  // Các loại khác: check ngày như cũ
                  if (!start || !end) {
                    return (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                        Chưa bắt đầu
                      </span>
                    );
                  }
                  
                  if (now < start) {
                    return (
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                        Chưa bắt đầu
                      </span>
                    );
                  } else if (now >= start && now <= end) {
                    return (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                        Đang diễn ra
                      </span>
                    );
                  } else {
                    return (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                        Đã kết thúc
                      </span>
                    );
                  }
                })()}
              </td>

              {/* ✅ ICON KHÔNG LỆCH */}
              <td className="px-4 py-3 text-center">
                <Link
                  href={`/voucher/${d.id}`}
                  className="inline-flex items-center justify-center text-orange-500 hover:text-orange-600"
                  title="Chỉnh sửa"
                >
                  ✏️
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
