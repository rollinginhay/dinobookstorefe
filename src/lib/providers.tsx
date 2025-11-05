// src/lib/providers.tsx
"use client";

import React, {ReactNode, useState} from "react";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ApiContextProvider} from "~/context/ApiContext";

export function AppProviders({children}: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <ApiContextProvider>{children}</ApiContextProvider>
        </QueryClientProvider>
    );
}
