// src/hooks/useGenres.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "~/context/ApiContext";
import { jsonApi } from "~/lib/api";
import { API_ROUTES } from "~/lib/routes";
import type { Genre } from "~/types/appContextTypes";

/**
 * CRUD + search hook for Genre resource.
 * - Uses jsonApi.serialise/deserialise for JSON:API endpoints
 * - Uses axios directly for custom routes when needed
 */
export function useGenres() {
    const api = useApi();
    const qc = useQueryClient();

    // 1) Fetch all genres (attempt JSON:API deserialise, fallback to raw)
    const genresQuery = useQuery<Genre[]>({
        queryKey: ["genres"],
        queryFn: async () => {
            const res = await api.get(API_ROUTES.GET_GENRES);
            try {
                return jsonApi.deserialise(res.data) as Genre[];
            } catch {
                // If server returns plain array/object, return as-is
                return (res.data as unknown) as Genre[];
            }
        },
    });

    // 2) Create genre (JSON:API)
    const createGenre = useMutation({
        mutationFn: async (payload: Partial<Genre>) => {
            const body = jsonApi.serialise("genres", payload as Record<string, never>);
            const res = await api.post(API_ROUTES.POST_GENRE_CREATE, body);
            try {
                return jsonApi.deserialise(res.data) as Genre;
            } catch {
                return (res.data as unknown) as Genre;
            }
        },
        onSuccess: () => qc.invalidateQueries(["genres"]),
    });

    // 3) Update genre (JSON:API, uses PATCH)
    const updateGenre = useMutation({
        mutationFn: async (payload: Partial<Genre>) => {
            const body = jsonApi.serialise("genres", payload as Record<string, never>);
            // some backends want PUT/PATCH to /genres/:id; we call route generator
            const id = payload.id;
            if (!id) throw new Error("updateGenre requires payload.id");
            const res = await api.patch(API_ROUTES.PUT_GENRE_UPDATE, body); // if your update route expects id in body or path, change accordingly
            try {
                return jsonApi.deserialise(res.data) as Genre;
            } catch {
                return (res.data as unknown) as Genre;
            }
        },
        onSuccess: () => qc.invalidateQueries(["genres"]),
    });

    // 4) Delete genre (simple axios delete)
    const deleteGenre = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(API_ROUTES.DELETE_GENRE_DELETE({ id }));
        },
        onSuccess: () => qc.invalidateQueries(["genres"]),
    });

    // 5) Example custom (non-JSON:API) search endpoint (uses axios directly)
    async function searchGenres(q: string): Promise<Genre[]> {
        const res = await api.get(API_ROUTES.GET_GENRES_SEARCH({ q }));
        return res.data as Genre[];
    }

    return {
        genresQuery,
        createGenre,
        updateGenre,
        deleteGenre,
        searchGenres,
    };
}
