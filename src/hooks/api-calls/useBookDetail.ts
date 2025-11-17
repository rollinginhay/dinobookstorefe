import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {api, jsonApi} from "@/lib/api";
import {API_ROUTES_TREE} from "@/lib/routes";

export function useBookDetail(bookId: number, enabled: boolean = true) {
    const routeMap = API_ROUTES_TREE.bookDetail;
    const queryClient = useQueryClient();


    const bookDetailQuery = useQuery({
        queryKey: ["bookDetail", {bookId, enabled}],
        queryFn: async () => {
            const res = await api.get(routeMap.getMultiple({id: bookId}), {params: {e: enabled}});
            try {
                return jsonApi.deserialise(res.data);
            } catch {
                // If server returns plain array/object, return as-is
                return (res.data as unknown);
            }
        },
    });


    return {
        bookDetailQuery
    };
}
