import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {api, jsonApi} from "@/lib/api";
import {API_ROUTES_TREE} from "@/lib/routes";
import {serializeBook} from "@/lib/serializers";
import {toast} from "sonner";

export function useBook(
    page = 0,
    limit = 10,
    enabled = true,
    keyword: string = ""
) {
    const routeMap = API_ROUTES_TREE.book;
    const queryClient = useQueryClient();


    const bookQuery = useQuery({
        queryKey: ["books", {page, limit, enabled, keyword: keyword ?? ""}],
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
        onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: ["books"], exact: false});
        },
    });

    const bookCreate
        = useMutation({
        mutationFn: async (newProp: any) => {
            const res = await api.post(routeMap.create, serializeBook("books", newProp));

            if (res.status !== 201) {
                throw jsonApi.deserialise(res.data);
            }

            return jsonApi.deserialise(res.data);

        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: ["books"], exact: false});
            toast.success("Success");
        },

    });

    const bookUpdate
        = useMutation({
        mutationFn: async (newProp: any) => {
            const res = await api.put(routeMap.create, serializeBook("books", newProp));

            if (res.status !== 201) {
                throw jsonApi.deserialise(res.data);
            }

            return jsonApi.deserialise(res.data);

        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: ["books"], exact: false});
            toast.success("Success");
        },
    });

    return {
        bookQuery,
        bookDelete,
        bookCreate,
        bookUpdate,
    };
}
