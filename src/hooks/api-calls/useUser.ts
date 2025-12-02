import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {api, jsonApi} from "@/lib/api";
import {API_ROUTES_TREE} from "@/lib/routes";
import {serializeUser} from "@/lib/serializers";
import {toast} from "sonner";

export function useUser() {
    const routeMap = API_ROUTES_TREE.user;
    const queryClient = useQueryClient();

    const userQuery = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await api.get(routeMap.getMultiple);
            try {
                return jsonApi.deserialise(res.data);
            } catch {
                // If server returns plain array/object, return as-is
                return (res.data as unknown);
            }
        },
    });

    const userCreate
        = useMutation({
        mutationFn: async (user: any) => {
            const res = await api.post(routeMap.create, serializeUser(user));

            if (res.status !== 201) {
                throw jsonApi.deserialise(res.data);
            }

            return jsonApi.deserialise(res.data);

        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: ["users"], exact: false})
            await queryClient.invalidateQueries({queryKey: ["user"], exact: false})
            toast.success("Success");
        },
    });

    return {
        userQuery,
        userCreate
    };
}
