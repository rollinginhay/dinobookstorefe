// src/lib/queryClient.ts
import {MutationCache, QueryCache, QueryClient} from "@tanstack/react-query";

export const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: (error, query) => {
            console.error("[Query Error]", error, "in", query.queryKey);
        },
    }),
    mutationCache: new MutationCache({
        onError: (error, variables, context, mutation) => {
            console.error("[Mutation Error]", error, "in", mutation.options.mutationKey);
        },
    }),
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
        mutations: {
            retry: 0,
        },
    },
});
