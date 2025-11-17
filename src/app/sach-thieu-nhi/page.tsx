"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo } from "react";
import BookCard, { Book } from "@/components/BookCard";
import Breadcrumb from "@/components/Breadcrumb";

type SortOption =
  | "default"
  | "bestseller"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "rating";

type ViewMode = "grid" | "list";

function SachThieuNhi() {
  // =========================
  // STATE
  // =========================
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allGenres, setAllGenres] = useState<string[]>([]);
  const [page] = useState(0);
  const limit = 50;

  // =========================
  // FETCH DATA FROM BACKEND
  // =========================
  useEffect(() => {
    async function fetchBooks() {
      try {
        setLoading(true);
        setError(null);

        const parentGenre = "Thiếu nhi";

        const res = await fetch(
          `http://localhost:8080/v1/books?e=true&page=${page}&limit=${limit}&genre=${encodeURIComponent(
            parentGenre
          )}`
        );

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(`Lỗi ${res.status}: ${msg}`);
        }

        const json = await res.json();

        // Map included để truy cập nhanh
        const includedMap = new Map();
        json.included?.forEach((i: any) =>
          includedMap.set(`${i.type}-${i.id}`, i)
        );

        // =========== GENRE CON ===========
        const genres =
          json.included
            ?.filter((i: any) => i.type === "genre")
            .map((g: any) => g.attributes?.name)
            .filter(
              (name: string) =>
                name &&
                name !== parentGenre &&
                !["Sách trong nước", "Sách nước ngoài"].includes(name)
            ) || [];

        setAllGenres(Array.from(new Set(genres)));

        // =========== PARSE BOOK ===========
        const parsed =
          json.data?.map((item: any) => {
            // Tác giả
            const creatorIds =
              item.relationships?.creators?.data?.map((c: any) => c.id) || [];

            const authors =
              creatorIds
                .map((id: string) => {
                  const c = includedMap.get(`creator-${id}`);
                  return c?.attributes?.name;
                })
                .filter(Boolean)
                .join(", ") || "Không rõ tác giả";

            // Genre con
            const genreIds =
              item.relationships?.genres?.data?.map((g: any) => g.id) || [];

            const genreName =
              genreIds
                .map((id: string) => {
                  const g = includedMap.get(`genre-${id}`);
                  return g?.attributes?.name;
                })
                .filter((n: string) => n && n !== parentGenre)
                .join(", ") || parentGenre;

            // Giá từ bookDetail
            const copyIds =
              item.relationships?.bookCopies?.data?.map((b: any) => b.id) || [];

            const detail =
              includedMap.get(`bookDetail-${copyIds[0]}`)?.attributes || {};

            return {
              id: item.id,
              title: item.attributes?.title,
              author: authors,
              genreName,
              price: detail.price || 0,
              originalPrice: detail.originalPrice || detail.price || 0,
              discount: detail.discount || 0,
              rating: item.attributes?.rating || 0,
              sold: item.attributes?.sold || 0,
              description: item.attributes?.description || "",
              image: detail?.image || "/images/default-book.jpg",
            };
          }) || [];

        setBooks(parsed);
      } catch (err: any) {
        setError(err.message);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();
  }, []);

  // =========================
  // CATEGORY LIST
  // =========================
  const allCategories = ["Tất cả", ...allGenres];

  // =========================
  // FILTER UI STATE
  // =========================
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [sortOption, setSortOption] = useState<SortOption>("default");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // =========================
  // FILTERING
  // =========================
  const filteredBooks = useMemo(() => {
    let filtered = books;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          (b.description || "").toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== "Tất cả") {
      filtered = filtered.filter(
        (b) =>
          b.genreName &&
          b.genreName.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    return filtered;
  }, [books, searchQuery, selectedCategory]);

  // =========================
  // SORTING
  // =========================
  const sortedBooks = useMemo(() => {
    const sorted = [...filteredBooks];

    switch (sortOption) {
      case "bestseller":
        return sorted.sort((a, b) => (b.sold || 0) - (a.sold || 0));
      case "newest":
        return sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
      case "price-asc":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-desc":
        return sorted.sort((a, b) => b.price - a.price);
      case "rating":
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      default:
        return sorted;
    }
  }, [filteredBooks, sortOption]);

  // =========================
  // PAGINATION
  // =========================
  const totalPages = Math.ceil(sortedBooks.length / itemsPerPage);
  const paginatedBooks = sortedBooks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFilterChange = () => setCurrentPage(1);

  // =========================
  // LOADING / ERROR
  // =========================
  if (loading)
    return (
      <div className="h-96 flex items-center justify-center text-gray-500 text-lg">
        ⏳ Đang tải dữ liệu...
      </div>
    );

  if (error)
    return (
      <div className="h-96 flex items-center justify-center text-red-500 text-lg">
        ⚠️ {error}
      </div>
    );

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb
        items={[{ label: "Trang chủ", href: "/" }, { label: "Sách thiếu nhi" }]}
      />

      {/* HEADER */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-3">👶 Sách Thiếu Nhi</h1>
          <p className="text-lg text-cyan-100">
            Khám phá thế giới đầy màu sắc dành cho các bé
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* FILTER BAR */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* SEARCH */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="🔍 Tìm kiếm sách, tác giả..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleFilterChange();
                }}
                className="w-full pl-12 pr-4 py-3 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-500"
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
            </div>

            {/* CATEGORY */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                handleFilterChange();
              }}
              className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 text-sm font-semibold"
            >
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  📚 {cat}
                </option>
              ))}
            </select>

            {/* SORT */}
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value as SortOption);
                handleFilterChange();
              }}
              className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 text-sm font-semibold"
            >
              <option value="default">📊 Mặc định</option>
              <option value="bestseller">🔥 Bán chạy</option>
              <option value="newest">🆕 Mới nhất</option>
              <option value="price-asc">💰 Giá thấp → cao</option>
              <option value="price-desc">💰 Giá cao → thấp</option>
              <option value="rating">⭐ Đánh giá cao</option>
            </select>
          </div>
        </div>

        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <p className="text-gray-600 font-medium">
            Tìm thấy{" "}
            <span className="text-cyan-600 font-bold">
              {sortedBooks.length}
            </span>{" "}
            sản phẩm
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === "grid"
                  ? "bg-cyan-600 text-white border-2 border-cyan-600"
                  : "bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50"
              }`}
            >
              🔲 Grid
            </button>

            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === "list"
                  ? "bg-cyan-600 text-white border-2 border-cyan-600"
                  : "bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50"
              }`}
            >
              ☰ List
            </button>
          </div>
        </div>

        {/* EMPTY STATE */}
        {paginatedBooks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Không tìm thấy sách
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? `Không có kết quả cho "${searchQuery}"`
                : "Không có sách trong danh mục này"}
            </p>
          </div>
        ) : (
          <>
            {/* GRID */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {paginatedBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}

            {/* LIST */}
            {viewMode === "list" && (
              <div className="space-y-4">
                {paginatedBooks.map((book) => (
                  <div
                    key={book.id}
                    className="bg-white rounded-xl shadow-sm p-6 flex gap-6 hover:shadow-lg transition-all"
                  >
                    <div className="aspect-[3/4] w-32 bg-gradient-to-br from-cyan-50 to-blue-100 rounded-lg overflow-hidden relative flex-shrink-0">
                      <img
                        src={book.image}
                        className="absolute inset-0 w-full h-full object-cover"
                        alt={book.title}
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {book.title}
                      </h3>

                      <p className="text-gray-600 mb-2">
                        Tác giả:{" "}
                        <span className="font-medium">{book.author}</span>
                      </p>

                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                        {book.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-red-600">
                          {book.price.toLocaleString("vi-VN")} ₫
                        </span>

                        <a
                          href={`/san-pham/${book.id}`}
                          className="bg-cyan-600 text-white px-6 py-3 rounded-lg hover:bg-cyan-700 transition-colors font-semibold"
                        >
                          Xem chi tiết
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="mt-16 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    ← Trước
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg ${
                        currentPage === i + 1
                          ? "bg-cyan-600 text-white border-cyan-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      } border-2`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Sau →
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Disable SSR
export default dynamic(() => Promise.resolve(SachThieuNhi), { ssr: false });
