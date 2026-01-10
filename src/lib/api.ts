// src/lib/api.ts
import axios, {AxiosInstance} from "axios";
import {deserialise, serialise} from "kitsu-core";
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
    serialise: (type: string, data: any) => serialise(type, data),
    deserialise: (raw: unknown) => deserialise(raw),
};

//REQUEST INTERCEPTORS
api.interceptors.request.use((config) => {
    // Get token from localStorage, attach to req header on every req
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }

    console.log("[Axios Request]", {
        method: config.method,
        url: config.baseURL! + config.url,
        params: config.params,
        data: config.data,
        headers: config.headers.Authorization ? 'Has Auth Token' : 'No Auth Token',
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
        // Handle 401 Unauthorized - token expired or invalid
        if (error.response?.status === 401) {
            console.error("[Axios Error] 401 Unauthorized - Clearing auth and redirecting to login");

            // Clear authentication state
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');

                // Redirect to login page
                window.location.href = '/login';
            }

            toast.error('Session expired. Please log in again.');
            return Promise.reject(error);
        }

        // Handle validation errors (400 Bad Request)
        if (error.response?.status === 400) {
            console.error("[Axios Error] 400 Bad Request", {
                message: error.message,
                url: error.config?.url,
                response: error.response,
            });

            // Let the calling code handle validation errors
            throw error;
        }

        if (error.status !== 400 && error.response?.data) {
            try {
                const err = deserialise(error.response.data).errors[0];
                toast.error(err.title);
                return Promise.reject(error);
            } catch (e) {
                // If deserialization fails, show generic error
                toast.error(error.response?.data?.message || error.message || 'An error occurred');
                return Promise.reject(error);
            }
        }

        console.error("[Axios Error]", {
            message: error.message,
            url: error.config?.url,
            response: error.response,
        });
        throw error;
    }
);


