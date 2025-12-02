import {useMutation, useQueryClient} from "@tanstack/react-query";
import {api, jsonApi} from "@/lib/api";
import {API_ROUTES_TREE} from "@/lib/routes";
import {serializeBook, serializeReceipt} from "@/lib/serializers";
import {toast} from "sonner";

export function useReceipt(
    page = 0,
    limit = 10,
    enabled = true,
    keyword: string = ""
) {
    const routeMap = API_ROUTES_TREE.receipt;
    const queryClient = useQueryClient();


    // const receiptQuery = useQuery({
    //     queryKey: ["receipts", {page, limit, enabled, keyword: keyword ?? ""}],
    //     queryFn: async () => {
    //         const res = await api.get(routeMap.getMultiple, {params: {q: keyword, e: enabled, page, limit}});
    //         try {
    //             return jsonApi.deserialise(res.data);
    //         } catch {
    //             // If server returns plain array/object, return as-is
    //             return (res.data as unknown);
    //         }
    //     },
    // });


    const receiptDelete = useMutation({
        mutationFn: async (id: string | number) => {
            await api.delete(routeMap.delete({id: id}));
            return id;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: ["receipts"], exact: false});
            await queryClient.invalidateQueries({queryKey: ["users"], exact: false});
            await queryClient.invalidateQueries({queryKey: ["user"], exact: false});
            toast.success("Success");
        },
    });

    const receiptCreate
        = useMutation({
        mutationFn: async (newProp: any) => {
            const res = await api.post(routeMap.create, serializeReceipt(newProp));

            if (res.status !== 201) {
                throw jsonApi.deserialise(res.data);
            }

            return jsonApi.deserialise(res.data);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: ["receipts"], exact: false});
            await queryClient.invalidateQueries({queryKey: ["users"], exact: false})
            await queryClient.invalidateQueries({queryKey: ["user"], exact: false})
            toast.success("Success");
        },

    });

    const receiptUpdate
        = useMutation({
        mutationFn: async (newProp: any) => {
            const res = await api.put(routeMap.create, serializeBook("books", newProp));

            if (res.status !== 201) {
                throw jsonApi.deserialise(res.data);
            }

            return jsonApi.deserialise(res.data);

        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: ["receipts"], exact: false});
            await queryClient.invalidateQueries({queryKey: ["users"], exact: false})
            await queryClient.invalidateQueries({queryKey: ["user"], exact: false})
            toast.success("Success");
        },
    });

    return {
        // receiptQuery,
        receiptDelete,
        receiptCreate,
        receiptUpdate,
    };
}
