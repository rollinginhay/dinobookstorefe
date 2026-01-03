import DiscountForm from "@/components/discount/DiscountForm";
import DeleteDiscountButton from "@/components/discount/DeleteDiscountButton";
import { fetchDiscountById } from "@/lib/discount/discount.api";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditVoucherPage({ params }: Props) {
  const { id } = await params;

  const discount = await fetchDiscountById(id); // 👈 ĐÃ LÀ data

  if (!discount) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl border p-6 text-center">
          <p className="text-gray-600">Không tìm thấy đợt giảm giá</p>
        </div>
      </div>
    );
  }

  const campaignName = discount?.attributes?.name || discount?.name || "";

  return (
    <div className="space-y-4">
      <div className="max-w-4xl mx-auto">
        <DiscountForm mode="edit" initialData={discount} />
      </div>
    </div>
  );
}
