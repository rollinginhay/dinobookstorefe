"use client";

import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-red-50 text-red-700 p-6">
            <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
            <p className="mb-4">{error.message}</p>
            <button
                onClick={resetErrorBoundary}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
                Try again
            </button>
        </div>
    );
}

export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
    return (
        <ReactErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={(error) => {
                console.error("Unhandled app error:", error);
            }}
        >
            {children}
        </ReactErrorBoundary>
    );
}
