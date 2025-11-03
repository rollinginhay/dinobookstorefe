"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import logo from "../../../public/logo.webp";

export default function RootHeader() {
  return (
    <>
      <header className="header">
        <div className="top-bar">
          <div className="logo">
            <Link href="/">
              <Image src={logo} alt="Logo" width={120} height={40} />
            </Link>
          </div>

          <div className="search-box">
            <input type="text" placeholder="Bạn đang tìm gì..." />
            <button>
              <i className="fas fa-search"></i>
            </button>
          </div>

          <div className="icons">
            <div>
              <i className="fas fa-map-marker-alt"></i> <span>Cửa hàng</span>
            </div>
            <div>
              <Link href="/login">
                <i className="fas fa-user"></i> <span>Đăng nhập</span>
              </Link>
            </div>
            <div>
              <Link href={"/cart"}>
                {" "}
                <i className="fas fa-shopping-cart"></i> <span>Giỏ hàng</span>
              </Link>
            </div>
          </div>
        </div>

        <nav className="menu-bar">
          <Link href="#">
            🔍 HÀNG MỚI <span className="new">New</span>
          </Link>

          <div className="dropdown">
            <span>SẢN PHẨM ▼</span>
            <div className="dropdown-content">
              <Link href="#">🔥 TẤT CẢ SẢN PHẨM</Link>

              <span className="has-submenu">
                🔥 HÀNG BÁN CHẠY
                <div className="submenu">
                  <Link href="/product/domestic">Sách trong nước</Link>
                  <Link href="#">Sách nước ngoài</Link>
                  <Link href="#">Combo sách</Link>
                </div>
              </span>
              <Link href="#">Tiểu thuyết</Link>
              <Link href="#">Truyện tranh</Link>
              <Link href="#">Kinh tế</Link>
              <Link href="#">Lịch sử</Link>
            </div>
          </div>

          <Link href="#">SÁCH NƯỚC NGOÀI</Link>
          <Link href="#">SÁCH TRONG NƯỚC</Link>
          <Link href="#">PHỤ KIỆN</Link>

          <Link href="#">
            <span className="outlet">-50% OUTLET</span>
          </Link>

          <Link href="#">TIN VỀ SÁCH</Link>
        </nav>
      </header>
    </>
  );
}
