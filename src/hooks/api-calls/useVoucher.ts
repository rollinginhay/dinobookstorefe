import {useQuery, useQueryClient} from "@tanstack/react-query";
import {api, jsonApi} from "@/lib/api";
import {API_ROUTES} from "@/lib/routes";

export function useVoucher(
    enabled = true
) {
    const queryClient = useQueryClient();

    const voucherQuery = useQuery({
        queryKey: ["vouchers", {enabled}],
        queryFn: async () => {
            const res = await api.get(API_ROUTES.GET_VOUCHERS);
            try {
                return jsonApi.deserialise(res.data);
            } catch {
                // If server returns plain array/object, return as-is
                return (res.data as unknown);
            }
        },
        enabled: enabled,
    });

    return {
        voucherQuery,
    };
}

