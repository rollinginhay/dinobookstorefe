import {useQuery} from "@tanstack/react-query";
import {api, jsonApi} from "@/lib/api";
import {API_ROUTES_TREE} from "@/lib/routes";

export function useBookSingle(id?: string | number) {
    const routeMap = API_ROUTES_TREE.book;

    return useQuery({
        queryKey: ["book", id],
        queryFn: async ({queryKey}) => {
            const [, bookId] = queryKey as [string, string | number];

            const res = await api.get(routeMap.getOne({id: bookId}));
            try {
                return jsonApi.deserialise(res.data);
            } catch {
                return res.data as unknown;
            }
        },
        staleTime: 0
    });
}
