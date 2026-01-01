import VoucherForm from "@/components/voucher/VoucherForm";
import DeleteVoucherButton from "@/components/voucher/DeleteVoucherButton";
import { fetchVoucherById } from "@/lib/voucher/voucher.api";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditVoucherPage({ params }: Props) {
  const { id } = await params;

  let voucher;
  try {
    voucher = await fetchVoucherById(id);
  } catch (error) {
    console.error("Error fetching voucher:", error);
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl border p-6 text-center">
          <p className="text-red-600 mb-4">Có lỗi xảy ra khi tải dữ liệu phiếu giảm giá</p>
          <a href="/vouchers" className="text-blue-600 hover:text-blue-700 underline">
            Quay lại danh sách
          </a>
        </div>
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl border p-6 text-center">
          <p className="text-gray-600 mb-4">Không tìm thấy phiếu giảm giá</p>
          <a href="/vouchers" className="text-blue-600 hover:text-blue-700 underline">
            Quay lại danh sách
          </a>
        </div>
      </div>
    );
  }

  // Hỗ trợ cả format JSON:API (có attributes) và format thường
  const voucherName = voucher?.attributes?.name || voucher?.name || "";
  const voucherId = voucher?.id || id;

  return (
    <div className="space-y-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-4">
          <DeleteVoucherButton id={voucherId} voucherName={voucherName} />
        </div>
        <VoucherForm mode="edit" initialData={voucher} />
      </div>
    </div>
  );
}








