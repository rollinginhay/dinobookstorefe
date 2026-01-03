import Link from "next/link";
import {Voucher} from "./voucher.types";
import {getVoucherStatus} from "@/lib/voucher/voucher.utils";

function generateCode(id: string | number) {
  return `VCH${String(id).padStart(5, "0")}`;
}

export default function VoucherTable({ data }: { data: Voucher[] }) {
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
          {data.map((v) => {
            const status = getVoucherStatus(v.startDate, v.endDate);
            return (
              <tr key={v.id} className="border-t text-sm">
                {/* ✅ MÃ – FE TỰ SINH */}
                <td className="px-4 py-3 font-medium">
                  {v.code || generateCode(v.id)}
                </td>

                <td className="px-4 py-3">{v.name}</td>

                <td className="px-4 py-3">
                  {v.type === "PERCENT" ? "Phần trăm" : "Tiền mặt"}
                </td>

                <td className="px-4 py-3">
                  {v.minTotal.toLocaleString()}đ
                </td>

                <td className="px-4 py-3">{v.discountLabel}</td>

                <td className="px-4 py-3 text-center text-gray-700">
                  {v.startDate 
                    ? new Date(v.startDate).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit"
                      })
                    : "-"}
                </td>

                <td className="px-4 py-3 text-center text-gray-700">
                  {v.endDate 
                    ? new Date(v.endDate).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit"
                      })
                    : "-"}
                </td>

                <td className="px-4 py-3 text-center">
                  {(() => {
                    if (v.used) {
                      return (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                          Đã sử dụng
                        </span>
                      );
                    }
                    
                    if (status === "UPCOMING") {
                      return (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                          Chưa bắt đầu
                        </span>
                      );
                    } else if (status === "ACTIVE") {
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
                    href={`/vouchers/${v.id}`}
                    className="inline-flex items-center justify-center text-orange-500 hover:text-orange-600"
                    title="Chỉnh sửa"
                  >
                    ✏️
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}













