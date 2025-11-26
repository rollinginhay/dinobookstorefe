import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {api, jsonApi} from "@/lib/api";
import {API_ROUTES_TREE} from "@/lib/routes";

export function useBookProperty(
    propertyType: string,
    page = 0,
    limit = 10,
    enabled = true,
    keyword: string = ""
) {
    const routeMap = API_ROUTES_TREE.property;
    const queryClient = useQueryClient();

    const queryRoute = routeMap[propertyType].getMultiple;

    const propertyQuery = useQuery({
        queryKey: ["property", propertyType, {page, limit, enabled, keyword: keyword ?? ""}],
        queryFn: async () => {
            if (!queryRoute) throw new Error(`Unknown property type: ${propertyType}`);
            const res = await api.get(queryRoute, {params: {q: keyword, e: enabled, page, limit}});
            try {
                return jsonApi.deserialise(res.data);
            } catch {
                // If server returns plain array/object, return as-is
                return (res.data as unknown);
            }
        },
    });

    const propertyDelete = useMutation({
        mutationFn: async (id: string | number) => {
            if (routeMap[propertyType] === undefined) throw new Error(`Unknown property type: ${propertyType}`);
            const res = await api.delete(routeMap[propertyType].delete({id: id}));
            if (res.status !== 200) {
                throw jsonApi.deserialise(res.data);
            }
            return jsonApi.deserialise(res.data);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: ["property", propertyType], exact: false});
        },
    });

    const propertyCreate
        = useMutation({
        mutationFn: async (newProp: any) => {
            if (routeMap[propertyType] === undefined) throw new Error(`Unknown property type: ${propertyType}`);
            const res = await api.post(routeMap[propertyType].create, jsonApi.serialise(propertyType, newProp));

            if (res.status !== 201) {
                throw jsonApi.deserialise(res.data);
            }

            return jsonApi.deserialise(res.data);

        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: ["property", propertyType], exact: false});
        },

    });

    const propertyUpdate = useMutation({
        mutationFn: async (newProp: any) => {
            if (routeMap[propertyType] === undefined) throw new Error(`Unknown property type: ${propertyType}`);
            const res = await api.put(routeMap[propertyType].update, jsonApi.serialise(propertyType, newProp));

            if (res.status !== 200) {
                throw jsonApi.deserialise(res.data);
            }

            return jsonApi.deserialise(res.data);

        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({queryKey: ["property", propertyType], exact: false});
        },
    })

    return {
        propertyQuery,
        propertyDelete,
        propertyCreate,
        propertyUpdate,
    };
}
