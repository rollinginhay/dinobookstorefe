// src/lib/api.ts
import axios, { AxiosInstance } from "axios";
import { serialise, deserialise } from "kitsu-core";

/**
 * Central axios instance used across the app.
 */
export const api: AxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
    headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
    },
});

/**
 * Small helpers to perform JSON:API (de)serialization using kitsu-core.
 */
export const jsonApi = {
    serialise: (type: string, data: Record<string, never>) => serialise(type, data),
    deserialise: (raw: unknown) => deserialise(raw),
};
