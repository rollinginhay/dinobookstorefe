"use client";

import React, {createContext, useContext, useEffect, useState} from 'react';
import { login as loginApi } from '@/lib/auth/auth.api';
import { toast } from 'sonner';

interface User {
    email: string;
    username: string;
    oauthId?: string;
    roles?: string[];
    createdAt?: string;
    updatedAt?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: () => void;
    loginWithCredentials: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load auth state from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedToken && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setToken(storedToken);
                setUser(parsedUser);
            } catch (error) {
                console.error('Failed to parse stored user data:', error);
                // Clear invalid data
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
            }
        }
        setIsLoading(false);
    }, []);

    // Initiate OAuth2 login flow
    const login = () => {
        // Redirect to backend OAuth2 endpoint
        window.location.href = `${BACKEND_URL}/oauth2/authorize/google`;
    };

    // Login with email and password
    const loginWithCredentials = async (email: string, password: string) => {
        try {
            const response = await loginApi({ email, password });
            
            // Save token and user info
            localStorage.setItem(TOKEN_KEY, response.jwtToken);
            localStorage.setItem(USER_KEY, JSON.stringify({
                email: response.email,
                username: response.username,
                oauthId: response.oauthId,
                roles: response.roles || [],
                createdAt: response.createdAt,
                updatedAt: response.updatedAt,
            }));
            
            setToken(response.jwtToken);
            setUser({
                email: response.email,
                username: response.username,
                oauthId: response.oauthId,
                roles: response.roles || [],
                createdAt: response.createdAt,
                updatedAt: response.updatedAt,
            });
            
            toast.success('Đăng nhập thành công!');
        } catch (error: any) {
            console.error('Login error:', error);
            let errorMessage = 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
            
            if (error?.response?.status === 401) {
                errorMessage = 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.';
            } else if (error?.response?.data?.message) {
                // Map các thông báo lỗi sang tiếng Việt
                const message = error.response.data.message;
                if (message.includes('Invalid Email') || message.includes('Invalid Password')) {
                    errorMessage = 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.';
                } else {
                    errorMessage = message;
                }
            } else if (error?.response?.data?.errors?.[0]?.detail) {
                errorMessage = error.response.data.errors[0].detail;
            } else if (error?.message) {
                errorMessage = error.message;
            }
            
            toast.error(errorMessage);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
        toast.success('Đăng xuất thành công!');
    };

    // Helper function to check if user has a specific role
    const hasRole = (role: string): boolean => {
        if (!user || !user.roles) return false;
        return user.roles.includes(role);
    };

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        login,
        loginWithCredentials,
        logout,
        isAuthenticated: !!token && !!user,
        hasRole,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}