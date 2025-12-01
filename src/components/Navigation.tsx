'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from "next-auth/react";
import { useCart } from '@/contexts/CartContext';

export default function Navigation() {
  const { totalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: session, status } = useSession();

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Navigation */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 py-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <div className="text-2xl font-black text-red-600 leading-tight">DinoBook</div>
              <div className="text-xs text-gray-500 -mt-1">Store</div>
            </div>
          </Link>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-2xl w-full">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm sách, tác giả, NXB..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-5 py-3 pl-12 pr-24 border-2 border-red-200 rounded-full focus:outline-none focus:border-red-600 transition-colors placeholder:text-gray-400"
              />
              <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <button className="absolute right-2 top-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-2 rounded-full font-semibold transition-all shadow-md hover:shadow-lg transform hover:scale-105">
                Tìm
              </button>
            </div>
          </div>

          {/* Right Icons + Auth */}
          <div className="flex items-center gap-4">
            {/* Auth Button */}
            <div className="flex items-center gap-2">
              {status === "loading" && (
                <span className="text-sm text-gray-500">
                  Đang kiểm tra đăng nhập...
                </span>
              )}
              {status !== "loading" && !session && (
                <Link
                  href="/dang-nhap"
                  className="px-4 py-2 rounded-full text-sm font-semibold border border-red-500 text-red-600 hover:bg-red-50 transition-colors"
                >
                  Đăng nhập / Đăng ký
                </Link>
              )}
              {status !== "loading" && session && (
                <div className="flex items-center gap-3">
                  <Link
                    href="/tai-khoan"
                    className="flex items-center gap-2 max-w-[200px] group"
                  >
                    {session.user?.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.user.image}
                        alt={session.user.name ?? "User"}
                        className="w-8 h-8 rounded-full border border-gray-200 group-hover:border-red-300 transition-colors"
                      />
                    )}
                    <div className="flex flex-col text-left">
                      <span className="text-xs text-gray-400">
                        Xin chào,
                      </span>
                      <span className="text-sm font-semibold text-gray-700 truncate group-hover:text-red-600">
                        {session.user?.name ?? "Người dùng"}
                      </span>
                      <span className="text-[10px] text-red-500 uppercase tracking-wide">
                        Trang cá nhân
                      </span>
                    </div>
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-xs font-semibold text-gray-500 hover:text-red-600 underline underline-offset-2"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
            <Link 
              href="/yeu-thich" 
              className="relative p-3 text-gray-700 hover:text-red-600 rounded-xl transition-all hover:bg-red-50 group"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>
            <Link 
              href="/gio-hang" 
              className="relative p-3 text-gray-700 hover:text-red-600 rounded-xl transition-all hover:bg-red-50 group"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-bounce">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Category Menu */}
        <div className="hidden lg:flex border-t border-gray-100 pt-3 pb-2">
          <div className="flex gap-8">
            <Link 
              href="/sach-trong-nuoc" 
              className="text-sm font-semibold text-gray-700 hover:text-red-600 transition-colors py-2 border-b-2 border-transparent hover:border-red-600"
            >
              📖 Sách trong nước
            </Link>
            <Link 
              href="/sach-nuoc-ngoai" 
              className="text-sm font-semibold text-gray-700 hover:text-red-600 transition-colors py-2 border-b-2 border-transparent hover:border-red-600"
            >
              🌍 Sách nước ngoài
            </Link>
            <Link 
              href="/ky-nang-song" 
              className="text-sm font-semibold text-gray-700 hover:text-red-600 transition-colors py-2 border-b-2 border-transparent hover:border-red-600"
            >
              💼 Kỹ năng sống
            </Link>
            <Link 
              href="/kinh-doanh" 
              className="text-sm font-semibold text-gray-700 hover:text-red-600 transition-colors py-2 border-b-2 border-transparent hover:border-red-600"
            >
              🎭 Kinh doanh
            </Link>
            <Link 
              href="/manga-comic" 
              className="text-sm font-semibold text-gray-700 hover:text-red-600 transition-colors py-2 border-b-2 border-transparent hover:border-red-600"
            >
              🎨 Manga/Comic
            </Link>
            <Link 
              href="/sach-thieu-nhi" 
              className="text-sm font-semibold text-gray-700 hover:text-red-600 transition-colors py-2 border-b-2 border-transparent hover:border-red-600"
            >
              👶 Sách thiếu nhi
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
