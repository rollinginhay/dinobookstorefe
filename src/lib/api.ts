// src/lib/api.ts
import axios, {AxiosInstance} from "axios";
import {serialise, deserialise} from "kitsu-core";
import {toast} from "sonner";

/**
 * Central axios instance used across the app.
 */
export const api: AxiosInstance = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
        headers: {
            Accept: "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
        },
    }
);

/**
 * Small helpers to perform JSON:API (de)serialization using kitsu-core.
 */
export const jsonApi = {
    serialise: (type: string, data: Record<string, never>) => serialise(type, data),
    deserialise: (raw: unknown) => deserialise(raw),
};

//REQUEST LOGGER
api.interceptors.request.use((config) => {
    console.log("[Axios Request]", {
        method: config.method,
        url: config.baseURL! + config.url,
        params: config.params,
        data: config.data,
    });
    return config;
});

//RESPONSE LOGGER
api.interceptors.response.use(
    (response) => {
        console.log("[Axios Response]", {
            status: response.status,
            url: response.config.url,
            data: response.data,
        });
        return response;
    },
    (error) => {
        if (error.status !== 400) {
            const err = deserialise(error.response.data).errors[0];
            toast.error(err.title);
            return Promise.reject(error);
        }
        console.error("[Axios Error]", {
            message: error.message,
            url: error.config?.url,
            response: error.response,
        });
        throw error;
    }
);


