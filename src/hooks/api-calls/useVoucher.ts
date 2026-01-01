import {useQuery, useQueryClient} from "@tanstack/react-query";
import {fetchVouchers} from "@/lib/voucher/voucher.api";

export function useVoucher(
    enabled = true
) {
    const queryClient = useQueryClient();

    const voucherQuery = useQuery({
        queryKey: ["vouchers", {enabled}],
        queryFn: async () => {
            // Sử dụng fetchVouchers để lấy voucher campaigns từ campaigns API
            return await fetchVouchers();
        },
        enabled: enabled,
    });

    return {
        voucherQuery,
    };
}



