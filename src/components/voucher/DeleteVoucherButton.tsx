"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteVoucher } from "@/lib/voucher/voucher.api";
import { toast } from "sonner";
import ConfirmDialog from "@/components/common/ConfirmDialog";

type Props = {
  id: string | number;
  voucherName?: string;
};

export default function DeleteVoucherButton({ id, voucherName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteVoucher(id);
      toast.success("Xóa phiếu giảm giá thành công!");
      window.location.href = "/vouchers";
    } catch (error: any) {
      console.error("Error:", error);
      const errorMessage =
        error?.response?.data?.errors?.[0]?.title ||
        error?.response?.data?.errors?.[0]?.detail ||
        "Có lỗi xảy ra khi xóa phiếu giảm giá";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
      >
        <span>🗑️</span>
        <span>Xóa phiếu giảm giá</span>
      </button>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Xác nhận xóa phiếu giảm giá"
        message={
          <>
            Bạn có chắc chắn muốn xóa phiếu giảm giá{" "}
            <span className="font-medium text-gray-900">
              {voucherName || `#${id}`}
            </span>
            ? Hành động này không thể hoàn tác.
          </>
        }
        confirmText="Xóa"
        cancelText="Hủy"
        confirmButtonColor="red"
        loading={loading}
        loadingText="Đang xóa..."
      />
    </>
  );
}













