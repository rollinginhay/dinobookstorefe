"use client";

import { useState } from "react";
import "../../../style/login.css";
export default function Login() {
  const [activeTab, setActiveTab] = useState("login");
  const [phoneEmail, setPhoneEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isLoginDisabled = phoneEmail.trim() === "" || password.trim() === "";

  return (
    <>
      <div className="login">
        <div className="tabs">
          <div
            className={`tab ${activeTab === "login" ? "active" : ""}`}
            onClick={() => setActiveTab("login")}
          >
            Đăng nhập
          </div>
          <div
            className={`tab ${activeTab === "register" ? "active" : ""}`}
            onClick={() => setActiveTab("register")}
          >
            Đăng ký
          </div>
        </div>

        {activeTab === "login" && (
          <>
            <label htmlFor="phoneEmail">Số điện thoại/Email</label>
            <input
              type="text"
              id="phoneEmail"
              placeholder="Nhập số điện thoại hoặc email"
              value={phoneEmail}
              onChange={(e) => setPhoneEmail(e.target.value)}
            />

            <label htmlFor="password" style={{ marginTop: "20px" }}>
              Mật khẩu
            </label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </span>
            </div>

            <a href="#" className="forgot-link">
              Quên mật khẩu?
            </a>

            <button
              className={isLoginDisabled ? "" : "enabled"}
              disabled={isLoginDisabled}
            >
              Đăng nhập
            </button>
          </>
        )}

        {activeTab === "register" && (
          <div style={{ textAlign: "center", color: "#666" }}>
            <p>Form đăng ký đang phát triển...</p>
          </div>
        )}
      </div>
    </>
  );
}
