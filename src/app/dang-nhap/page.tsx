"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DangNhapPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);
  const [registerMessage, setRegisterMessage] = useState<string | null>(null);

  const passwordHint =
    "Ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.";

  const validatePassword = (value: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    return regex.test(value);
  };

  const callAuthApi = async (
    path: "/v1/auth/loginOnline" | "/v1/auth/register",
    payload: Record<string, unknown>
  ) => {
    if (!API_BASE_URL) {
      throw new Error(
        "Chưa cấu hình biến môi trường NEXT_PUBLIC_API_BASE_URL."
      );
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

      const data = await callAuthApi("/v1/auth/loginOnline", {
        email: loginForm.email,
        password: loginForm.password,
      });
      if (data?.jwtToken) {
        // Lưu token và thông tin user
        localStorage.setItem("jwtToken", data.jwtToken);
        localStorage.setItem("username", data.username ?? "Người dùng");
        if (data.userId) {
          localStorage.setItem("userId", String(data.userId));
        }
        setIsLoggedIn(true);
        // Redirect về trang chủ ngay, không hiển thị trang "Bạn đã đăng nhập"
        window.location.href = "/";
        return;
      }

      setLoginMessage("Đăng nhập thành công! Bạn có thể quay lại trang chủ.");
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
      if (!validatePassword(registerForm.password)) {
        throw new Error(passwordHint);
      }
      if (registerForm.password !== registerForm.confirmPassword) {
        throw new Error("Mật khẩu xác nhận không khớp.");
      }

      // Gọi API đăng ký từ BE
      const data = await callAuthApi("/v1/auth/register", {
        email: registerForm.email,
        password: registerForm.password,
      });

      // Lưu thông tin user và token sau khi đăng ký thành công
      if (data?.jwtToken) {
        localStorage.setItem("jwtToken", data.jwtToken);
        localStorage.setItem("username", data.username ?? (registerForm.fullName || "Người dùng"));
        if (data.userId) {
          localStorage.setItem("userId", String(data.userId));
        }
        setIsLoggedIn(true);
        // Redirect về trang chủ ngay, không hiển thị trang "Bạn đã đăng nhập"
        window.location.href = "/";
        return;
      }

      setRegisterMessage("Đăng ký thành công! Bạn đã được đăng nhập và sẽ được chuyển về trang chủ.");
    } catch (error) {
      setRegisterMessage(
        error instanceof Error ? error.message : "Không thể đăng ký."
      );
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("userAvatar");
    // Xóa giỏ hàng và yêu thích khi đăng xuất
    localStorage.removeItem("guest_cart");
    localStorage.removeItem("favorites");
    setIsLoggedIn(false);
    // Bắt buộc quay về trang đăng nhập
    window.location.href = "/dang-nhap";
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
            <div className="relative">
              <input
                type={showLoginPassword ? "text" : "password"}
                required
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm({ ...loginForm, password: event.target.value })
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showLoginPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
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
          <div className="relative">
            <input
              type={showRegisterPassword ? "text" : "password"}
              required
              value={registerForm.password}
              onChange={(event) =>
                setRegisterForm({ ...registerForm, password: event.target.value })
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Tối thiểu 8 ký tự"
            />
            <button
              type="button"
              onClick={() => setShowRegisterPassword(!showRegisterPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {showRegisterPassword ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">{passwordHint}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Xác nhận mật khẩu
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              value={registerForm.confirmPassword}
              onChange={(event) =>
                setRegisterForm({
                  ...registerForm,
                  confirmPassword: event.target.value,
                })
              }
              className={`w-full rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                registerForm.confirmPassword &&
                registerForm.password === registerForm.confirmPassword
                  ? "pr-20"
                  : "pr-10"
              }`}
              placeholder="Nhập lại mật khẩu"
            />
            {registerForm.confirmPassword &&
              registerForm.password === registerForm.confirmPassword && (
                <svg
                  className="absolute right-10 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {showConfirmPassword ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={registerLoading}
          className="w-full bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {registerLoading ? "Đang xử lý..." : "Đăng ký"}
        </button>
        {registerMessage && (
          <p className="text-sm text-center text-gray-600">{registerMessage}</p>
        )}
      </form>
    );
  };


  return (
    <div className="min-h-[calc(100vh-200px)] bg-gradient-to-br from-red-50 to-white py-10 px-4">
      <div className="max-w-2xl mx-auto">
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
              email/mật khẩu sẽ không thể gọi API cho tới khi thêm biến môi
              trường này.
            </div>
          )}
          {renderForm()}
        </section>
      </div>
    </div>
  );
}
