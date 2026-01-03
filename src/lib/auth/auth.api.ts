import axios from "axios";
import {API_ROUTES} from "@/lib/routes";

// Auth API không dùng JSON:API format, dùng axios instance riêng
const authApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  userId: string;
  oauthId?: string;
  email: string;
  username: string;
  roles: string[];
  createdAt?: string;
  updatedAt?: string;
  jwtToken: string;
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const res = await authApi.post(API_ROUTES.POST_AUTH_LOGIN, credentials);
  return res.data;
}

export async function register(data: {
  email: string;
  password: string;
  phoneNumber: string;
}): Promise<AuthResponse> {
  const res = await authApi.post(API_ROUTES.POST_AUTH_REGISTER, data);
  return res.data;
}

