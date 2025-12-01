import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {api, jsonApi} from "@/lib/api";
import {API_ROUTES_TREE} from "@/lib/routes";
import {serializeBook} from "@/lib/serializers";
import {toast} from "sonner";

export function useCampaign(
    page = 0,
    limit = 10,
    enabled = true,
    keyword: string = ""
) {
    const routeMap = API_ROUTES_TREE.campaign;
    const queryClient = useQueryClient();

    const campaignQuery = useQuery({
        queryKey: ["campaigns", {page, limit, enabled, keyword: keyword ?? ""}],
        queryFn: async () => {
            const res = await api.get(routeMap.getMultiple, {params: {q: keyword, e: enabled, page, limit}});
            try {
                return jsonApi.deserialise(res.data);
            } catch {
                // If server returns plain array/object, return as-is
                return (res.data as unknown);
            }
        },
    });

    return {
        campaignQuery,
    };
}
