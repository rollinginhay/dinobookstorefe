"use client";

import {useAuth} from '@/context/auth-context';
import {useRouter} from 'next/navigation';
import {useEffect} from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string;
    fallback?: React.ReactNode;
}

export function ProtectedRoute({
                                   children,
                                   requiredRole,
                                   fallback
                               }: ProtectedRouteProps) {
    const {isAuthenticated, isLoading, hasRole, logout} = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }
        const hasRequiredRole = hasRole('ROLE_ADMIN') || hasRole('ROLE_EMPLOYEE');

        if (!hasRequiredRole) {
            logout();
            router.push('/login');
            return;
        }
    }, [isAuthenticated, isLoading, router]);

    // Loading state
    if (isLoading) {
        return (
            fallback || (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div
                            className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading...</p>
                    </div>
                </div>
            )
        );
    }

    // Not authenticated
    if (!isAuthenticated) {
        return null;
    }

    // Check role if required
    if (requiredRole && !hasRole(requiredRole)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <svg
                            className="h-6 w-6 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600">
                        You don&#39;t have permission to access this page.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}