// src/context/ApiContext.tsx
"use client";

import React, {createContext, ReactNode, useContext} from "react";
import type {AxiosInstance} from "axios";
import {api} from "@/lib/api";

/**
 * ApiContext provides the Axios instance throughout the app.
 * The default value is `undefined` to force consumers to be inside the provider.
 */
const ApiContext = createContext<AxiosInstance | undefined>(undefined);

export function ApiContextProvider({ children }: { children: ReactNode }) {
    return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

/**
 * Hook to access the shared Axios instance.
 * Throws if used outside the provider.
 */
export function useApi(): AxiosInstance {
    const ctx = useContext(ApiContext);
    if (!ctx) {
        throw new Error("useApi must be used within an ApiContextProvider");
    }
    return ctx;
}
