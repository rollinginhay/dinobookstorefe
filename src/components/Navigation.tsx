"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useCart } from "@/contexts/CartContext";
import { useFavorite } from "@/contexts/FavoriteContext";

interface SearchBook {
  id: number;
  title: string;
  author: string;
  image?: string;
}

export default function Navigation() {
  const router = useRouter();
  const { totalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchBook[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  const { favorites } = useFavorite();
  const totalFavorites = favorites.length;

  // 👇 Lấy thông tin từ localStorage sau khi login và lắng nghe thay đổi
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("jwtToken");
      const name = localStorage.getItem("username");
      const avatar = localStorage.getItem("userAvatar");

      if (token) {
        setIsLoggedIn(true);
        setUserFullName(name);
        setUserAvatar(avatar);
      } else {
        setIsLoggedIn(false);
        setUserFullName(null);
        setUserAvatar(null);
      }
    };

    // Check ngay khi mount
    checkAuth();

    // Lắng nghe thay đổi storage (khi đăng nhập/đăng xuất từ tab khác)
    window.addEventListener('storage', checkAuth);

    // Kiểm tra token định kỳ để phát hiện thay đổi trong cùng tab
    const interval = setInterval(checkAuth, 1000);

    return () => {
      window.removeEventListener('storage', checkAuth);
      clearInterval(interval);
    };
  }, []);
  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("username");
    localStorage.removeItem("userAvatar");
    localStorage.removeItem("userId");
    // Xóa giỏ hàng và yêu thích khi đăng xuất
    localStorage.removeItem("guest_cart");
    localStorage.removeItem("favorites");
    setIsLoggedIn(false);
    // Bắt buộc quay về trang đăng nhập
    window.location.href = "/dang-nhap";
  };

  // Fetch books khi user nhập vào search bar (với debounce)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(
          `http://localhost:8080/v1/books?e=true&page=0&limit=50`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch books");
        }

        const json = await res.json();
        const includedMap = new Map();
        json.included?.forEach((i: any) =>
          includedMap.set(`${i.type}-${i.id}`, i)
        );

        const queryLower = searchQuery.toLowerCase().trim();
        const matched: SearchBook[] = [];

        json.data?.forEach((item: any) => {
          const title = item.attributes?.title || "";
          const creatorIds =
            item.relationships?.creators?.data?.map((c: any) => c.id) || [];
          const authors =
            creatorIds
              .map((id: string) => {
                const c = includedMap.get(`creator-${id}`);
                return c?.attributes?.name;
              })
              .filter(Boolean)
              .join(", ") || "";

          // Tìm theo title hoặc author
          if (
            title.toLowerCase().includes(queryLower) ||
            authors.toLowerCase().includes(queryLower)
          ) {
            matched.push({
              id: Number(item.id),
              title: title,
              author: authors || "Không rõ tác giả",
              image: item.attributes?.imageUrl,
            });
          }
        });

        // Giới hạn tối đa 5 kết quả
        setSearchResults(matched.slice(0, 5));
        setShowSuggestions(matched.length > 0);
      } catch (error) {
        console.error("Error searching books:", error);
        setSearchResults([]);
        setShowSuggestions(false);
      } finally {
        setIsSearching(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Đóng suggestions khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBookClick = (bookId: number) => {
    setSearchQuery("");
    setShowSuggestions(false);
    router.push(`/san-pham/${bookId}`);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/tim-kiem?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Navigation */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 py-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex-shrink-0 flex items-center gap-2 group"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <div className="text-2xl font-black text-red-600 leading-tight">
                DinoBook
              </div>
              <div className="text-xs text-gray-500 -mt-1">Store</div>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl w-full" ref={searchRef}>
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm sách, tác giả, NXB..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearchSubmit();
                  }
                }}
                className="w-full px-5 py-3 pl-12 pr-24 border-2 border-red-200 rounded-full focus:outline-none focus:border-red-600 transition-colors placeholder:text-gray-400"
              />
              <svg
                className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <button
                onClick={handleSearchSubmit}
                className="absolute right-2 top-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-2 rounded-full font-semibold transition-all shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Tìm
              </button>

              {/* Search Suggestions Dropdown */}
              {showSuggestions && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-500">
                      Đang tìm kiếm...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((book) => (
                        <button
                          key={book.id}
                          onClick={() => handleBookClick(book.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left"
                        >
                          {book.image ? (
                            <img
                              src={book.image}
                              alt={book.title}
                              className="w-12 h-16 object-cover rounded flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-16 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                              <span className="text-2xl">📚</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {book.title}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {book.author}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      Không tìm thấy sách nào
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Icons + Auth */}
          <div className="flex items-center gap-4">
            {/* Auth Button */}
            <div className="flex items-center gap-2">
              {!isLoggedIn && (
                <Link
                  href="/dang-nhap"
                  className="px-4 py-2 rounded-full text-sm font-semibold border border-red-500 text-red-600 hover:bg-red-50 transition-colors"
                >
                  Đăng nhập / Đăng ký
                </Link>
              )}

              {/* Nếu đã login → Hiện avatar + tên + logout */}
              {isLoggedIn && (
                <div className="flex items-center gap-3">
                  <Link
                    href="/tai-khoan"
                    className="flex items-center gap-2 max-w-[200px] group"
                  >
                    {/* Avatar với gradient đỏ-cam và glow effect */}
                    <div className="relative">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-lg font-bold text-white shadow-md">
                        {(userFullName?.[0] || "U").toUpperCase()}
                      </div>
                      {/* Glow effect - halo màu hồng nhạt xung quanh */}
                      <div className="absolute inset-0 rounded-2xl bg-red-200/30 blur-md -z-10 opacity-60"></div>
                    </div>

                    <div className="flex flex-col text-left">
                      <span className="text-xs font-semibold text-red-500 uppercase tracking-[0.2em]">
                        DINO MEMBER
                      </span>
                      <span className="text-sm font-bold text-gray-900 truncate group-hover:text-red-600">
                        {userFullName ?? "Người dùng"}
                      </span>
                    </div>
                  </Link>

                  <button
                    onClick={handleLogout}
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
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>

              {totalFavorites > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                  {totalFavorites > 9 ? "9+" : totalFavorites}
                </span>
              )}
            </Link>

            <Link
              href="/gio-hang"
              className="relative p-3 text-gray-700 hover:text-red-600 rounded-xl transition-all hover:bg-red-50 group"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-bounce">
                  {totalItems > 9 ? "9+" : totalItems}
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
