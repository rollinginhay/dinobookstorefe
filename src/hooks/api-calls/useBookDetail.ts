import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {api, jsonApi} from "@/lib/api";
import {API_ROUTES_TREE} from "@/lib/routes";
import {serializeBook} from "@/lib/serializers";
import {toast} from "sonner";

export function useBookDetail(bookId: number | string) {
    const routeMap = API_ROUTES_TREE.bookDetail;
    const queryClient = useQueryClient();


    const bookDetailQuery = useQuery({
        queryKey: ["bookDetail", {bookId}],
        queryFn: async () => {
            const res = await api.get(routeMap.getMultiple({id: bookId}));
            try {
                return jsonApi.deserialise(res.data);
            } catch {
                // If server returns plain array/object, return as-is
                return (res.data as unknown);
            }
        },
    });

    const bookDetailCreate
        = useMutation({
        mutationFn: async (fullBook: any) => {
            const res = await api.post(routeMap.create, serializeBook("book", fullBook));

            if (res.status !== 201) {
                throw jsonApi.deserialise(res.data);
            }

            return jsonApi.deserialise(res.data);

        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: ["book"]});
            toast.success("Success");
        },
    });

    const bookDetailDelete = useMutation({
        mutationFn: async (id: string | number) => {
            await api.delete(routeMap.delete({id: id}));
            return id;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: ["book"], exact: false});
            toast.success("Success");
        },
    });

    return {
        bookDetailQuery,
        bookDetailCreate,
        bookDetailDelete
    };
}
