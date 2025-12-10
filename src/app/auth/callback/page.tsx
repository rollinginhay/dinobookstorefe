"use client";

import {useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = () => {
            // Check for error in URL
            const errorParam = searchParams.get('error');
            const errorMessage = searchParams.get('message');

            if (errorParam) {
                setError(errorMessage || 'Authentication failed');
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
                return;
            }

            // Extract auth data from URL
            const authParam = searchParams.get('auth');

            if (!authParam) {
                setError('Missing authentication data');
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
                return;
            }

            try {
                // Decode and parse the auth object
                const authData = JSON.parse(decodeURIComponent(authParam));

                // Validate required fields
                if (!authData.jwtToken || !authData.email || !authData.username) {
                    setError('Invalid authentication data');
                    setTimeout(() => {
                        router.push('/login');
                    }, 3000);
                    return;
                }

                // Store auth data in localStorage
                localStorage.setItem('auth_token', authData.jwtToken);
                localStorage.setItem('auth_user', JSON.stringify({
                    email: authData.email,
                    username: authData.username,
                    oauthId: authData.oauthId,
                    roles: authData.roles || [],
                    createdAt: authData.createdAt,
                    updatedAt: authData.updatedAt,
                }));

                console.log('✅ Authentication successful, redirecting to home...');

                // Redirect to home page
                router.push('/');
            } catch (parseError) {
                console.error('Failed to parse auth data:', parseError);
                setError('Failed to process authentication data');
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
                return;
            }
        };

        handleCallback();
    }, [searchParams, router]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
                    <div className="text-center">
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
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Authentication Failed
                        </h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <p className="text-sm text-gray-500">
                            Redirecting to login page...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                        <svg
                            className="animate-spin h-6 w-6 text-blue-600"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Completing Sign In
                    </h2>
                    <p className="text-gray-600">
                        Please wait while we set up your account...
                    </p>
                </div>
            </div>
        </div>
    );
}