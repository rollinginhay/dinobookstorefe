import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {api, jsonApi} from "@/lib/api";
import {API_ROUTES_TREE} from "@/lib/routes";

export function useBook(
    page = 0,
    limit = 10,
    enabled = true,
    keyword: string = ""
) {
    const routeMap = API_ROUTES_TREE.book;
    const queryClient = useQueryClient();


    const bookQuery = useQuery({
        queryKey: ["book", {page, limit, enabled, keyword: keyword ?? ""}],
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

    const bookDelete = useMutation({
        mutationFn: async (id: string | number) => {
            await api.delete(routeMap.delete({id: id}));
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["book"]});
        },
    });

    const bookCreate
        = useMutation({
        mutationFn: async (newProp: any) => {
            const res = await api.post(routeMap.create, jsonApi.serialise("book", newProp));

            if (res.status !== 201) {
                throw jsonApi.deserialise(res.data);
            }

            return jsonApi.deserialise(res.data);

        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["book"]});
        },

    });

    const bookUpdate = useMutation({
        mutationFn: async (newProp: any) => {
            const res = await api.put(routeMap.update, jsonApi.serialise("book", newProp));

            if (res.status !== 200) {
                throw jsonApi.deserialise(res.data);
            }

            return jsonApi.deserialise(res.data);

        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["book"]});
        },
    })

    return {
        bookQuery,
        bookDelete,
        bookCreate,
        bookUpdate,
    };
}
