// src/lib/providers.tsx
"use client";

import React, {ReactNode, useState} from "react";

import {ApiContextProvider} from "@/context/ApiContext";
import {queryClient} from "@/lib/queryClient";
import {QueryClientProvider} from "@tanstack/react-query";
import {AppErrorBoundary} from "@/components/AppErrorBoundary";


export function AppProviders({children}: { children: ReactNode }) {
    const [client] = useState(() => queryClient);

    return (
        <QueryClientProvider client={client}>
            <AppErrorBoundary>
                <ApiContextProvider>{children}</ApiContextProvider>
            </AppErrorBoundary>

        </QueryClientProvider>
    );
}
