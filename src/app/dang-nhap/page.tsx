'use client';

import { FormEvent, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function DangNhapPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);
  const [registerMessage, setRegisterMessage] = useState<string | null>(null);

  const passwordHint =
    "Ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.";

  const validatePassword = (value: string) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    return regex.test(value);
  };

  const callAuthApi = async (
    path: "/v1/auth/login" | "/v1/auth/register",
    payload: Record<string, unknown>
  ) => {
    if (!API_BASE_URL) {
      throw new Error("Chưa cấu hình biến môi trường NEXT_PUBLIC_API_BASE_URL.");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response
      .json()
      .catch(() => ({ message: "Máy chủ không trả về JSON." }));

    if (!response.ok) {
      throw new Error(data?.message ?? "Yêu cầu thất bại.");
    }

    return data;
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginMessage(null);
    setLoginLoading(true);

    try {
      if (!validatePassword(loginForm.password)) {
        throw new Error(passwordHint);
      }

      const data = await callAuthApi("/v1/auth/login", {
        email: loginForm.email,
        password: loginForm.password,
      });

      if (data?.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
      }

      setLoginMessage("Đăng nhập thành công! Bạn có thể quay lại trang chủ.");
      setTimeout(() => router.push("/"), 1000);
    } catch (error) {
      setLoginMessage(
        error instanceof Error ? error.message : "Không thể đăng nhập."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterMessage(null);
    setRegisterLoading(true);

    try {
      if (!registerForm.phoneNumber.trim()) {
        throw new Error("Vui lòng nhập số điện thoại.");
      }
      if (!validatePassword(registerForm.password)) {
        throw new Error(passwordHint);
      }

      const data = await callAuthApi("/v1/auth/register", {
        fullName: registerForm.fullName,
        email: registerForm.email,
        phoneNumber: registerForm.phoneNumber,
        password: registerForm.password,
      });

      setRegisterMessage(
        data?.message ?? "Đăng ký thành công! Giờ bạn có thể đăng nhập."
      );
      setActiveTab("login");
    } catch (error) {
      setRegisterMessage(
        error instanceof Error ? error.message : "Không thể đăng ký."
      );
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" });
  };

  const renderForm = () => {
    if (activeTab === "login") {
      return (
        <form className="space-y-4" onSubmit={handleLoginSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={loginForm.email}
              onChange={(event) =>
                setLoginForm({ ...loginForm, email: event.target.value })
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="ban@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              value={loginForm.password}
              onChange={(event) =>
                setLoginForm({ ...loginForm, password: event.target.value })
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="••••••••"
            />
          <p className="text-xs text-gray-500 mt-1">{passwordHint}</p>
          </div>
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loginLoading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
          {loginMessage && (
            <p className="text-sm text-center text-gray-600">{loginMessage}</p>
          )}
        </form>
      );
    }

    return (
      <form className="space-y-4" onSubmit={handleRegisterSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Họ và tên
          </label>
          <input
            type="text"
            required
            value={registerForm.fullName}
            onChange={(event) =>
              setRegisterForm({ ...registerForm, fullName: event.target.value })
            }
            className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Nguyễn Văn A"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Email
          </label>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Số điện thoại
          </label>
          <input
            type="tel"
            required
            value={registerForm.phoneNumber}
            onChange={(event) =>
              setRegisterForm({
                ...registerForm,
                phoneNumber: event.target.value,
              })
            }
            className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="09xx xxx xxx"
          />
        </div>
          <input
            type="email"
            required
            value={registerForm.email}
            onChange={(event) =>
              setRegisterForm({ ...registerForm, email: event.target.value })
            }
            className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="ban@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Mật khẩu
          </label>
          <input
            type="password"
            required
            value={registerForm.password}
            onChange={(event) =>
              setRegisterForm({ ...registerForm, password: event.target.value })
            }
            className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Tối thiểu 8 ký tự"
          />
          <p className="text-xs text-gray-500 mt-1">{passwordHint}</p>
        </div>
        <button
          type="submit"
          disabled={registerLoading}
          className="w-full bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {registerLoading ? "Đang xử lý..." : "Đăng ký"}
        </button>
        {registerMessage && (
          <p className="text-sm text-center text-gray-600">
            {registerMessage}
          </p>
        )}
      </form>
    );
  };

  if (status === "loading") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Đang kiểm tra trạng thái đăng nhập...</p>
      </div>
    );
  }

  if (session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Bạn đã đăng nhập
        </h1>
        <p className="text-gray-600">
          Xin chào{" "}
          <span className="font-semibold">{session.user?.name ?? "bạn"}</span>.
          Bạn có thể quay lại trang chủ hoặc đăng xuất bên dưới.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Về trang chủ
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="px-6 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] bg-gradient-to-br from-red-50 to-white py-10 px-4">
      <div className="max-w-5xl mx-auto grid gap-10 lg:grid-cols-2">
        <section className="bg-white rounded-3xl shadow-xl p-8 border border-red-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-2xl">
              🔐
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Đăng nhập / Đăng ký
              </h1>
              <p className="text-gray-500 text-sm">
                Dành cho tài khoản nội bộ (form demo). Dùng Google để đăng nhập
                thật.
              </p>
            </div>
          </div>

          <div className="flex gap-2 mb-6 bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeTab === "login"
                  ? "bg-white text-red-600 shadow"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeTab === "register"
                  ? "bg-white text-red-600 shadow"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Đăng ký
            </button>
          </div>

          {!API_BASE_URL && (
            <div className="mb-4 rounded-xl bg-yellow-50 border border-yellow-200 text-sm text-yellow-800 px-4 py-3">
              Bạn chưa cấu hình <code>NEXT_PUBLIC_API_BASE_URL</code>. Các form
              email/mật khẩu sẽ không thể gọi API cho tới khi thêm biến môi trường này.
            </div>
          )}
          {renderForm()}
        </section>

        <section className="bg-red-600 rounded-3xl shadow-xl p-8 text-white space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top,_#fff,_transparent_50%)]" />
          <div className="relative space-y-4">
            <h2 className="text-3xl font-black">Đăng nhập bằng Google</h2>
            <p className="text-red-50">
              Đây là cách nhanh nhất để đăng ký/đăng nhập thật sự. Google sẽ xác
              thực tài khoản giúp bạn.
            </p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="relative flex items-center justify-center gap-3 w-full bg-white text-red-600 font-semibold py-3 rounded-2xl shadow-2xl hover:-translate-y-0.5 transition-transform"
          >
            <svg className="w-5 h-5" viewBox="0 0 533.5 544.3">
              <path
                fill="#4285f4"
                d="M533.5 278.4c0-17.4-1.6-34.1-4.7-50.4H272v95.4h147.3c-6.4 34.8-25.8 64.2-55 83.9v69.6h88.7c51.9-47.8 80.5-118.3 80.5-198.5z"
              />
              <path
                fill="#34a853"
                d="M272 544.3c74.7 0 137.4-24.7 183.2-67.4l-88.7-69.6c-24.6 16.5-56.1 26-94.5 26-72.7 0-134.3-49.1-156.4-115.1H24v72.3C69.8 486.1 163.4 544.3 272 544.3z"
              />
              <path
                fill="#fbbc04"
                d="M115.6 318.2c-5.6-16.5-8.8-34.1-8.8-52.2s3.2-35.7 8.8-52.2v-72.3H24C8.7 188.2 0 223.2 0 260s8.7 71.8 24 118.7l91.6-71.5z"
              />
              <path
                fill="#ea4335"
                d="M272 107.7c40.7 0 77.2 14 106 41.5l79.1-79.1C409.3 24.7 346.7 0 272 0 163.4 0 69.8 58.2 24 141.3l91.6 72.3C137.7 156.8 199.3 107.7 272 107.7z"
              />
            </svg>
            <span>Tiếp tục với Google</span>
          </button>

          <div className="relative bg-white/10 rounded-2xl p-6 space-y-4">
            <p className="font-semibold uppercase tracking-wide text-sm text-red-100">
              Hướng dẫn nhanh
            </p>
            <ul className="space-y-3 text-sm text-red-50">
              <li>1. Thêm GOOGLE_CLIENT_ID/SECRET vào file .env.local</li>
              <li>2. Khởi động lại `npm run dev`</li>
              <li>3. Bấm “Tiếp tục với Google” để đăng nhập</li>
            </ul>
            <p className="text-xs text-red-200">
              Sau khi Google xác thực thành công, NextAuth sẽ tự tạo session và
              chuyển bạn về trang chủ.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}


