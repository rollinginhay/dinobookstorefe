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

function SachNuocNgoai() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page] = useState(0);
  const limit = 50;
  const [allGenres, setAllGenres] = useState<string[]>([]);

  useEffect(() => {
    async function fetchBooks() {
      try {
        setLoading(true);
        setError(null);

        const genre = "Sách nước ngoài";

        const res = await fetch(
          `http://localhost:8080/v1/books?e=true&page=${page}&limit=${limit}&genre=${encodeURIComponent(
            genre
          )}`
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }

        const json = await res.json();

        const includedMap = new Map();
        json.included?.forEach((item: any) =>
          includedMap.set(`${item.type}-${item.id}`, item)
        );
        // 🔹 Lấy toàn bộ genre con từ included (không lấy genre cha)
        const genres =
          json.included
            ?.filter((item: any) => item.type === "genre")
            .map((g: any) => g.attributes?.name)
            .filter(
              (name: string) =>
                name && !["Sách trong nước", "Sách nước ngoài"].includes(name)
            ) || [];

        // 🔹 Lưu lại vào state
        setAllGenres(Array.from(new Set(genres)));

        const books =
          json.data?.map((item: any) => {
            // AUTHORS
            const creatorIds =
              item.relationships?.creators?.data?.map((c: any) => c.id) || [];

            const authors =
              creatorIds
                .map((id: string) => {
                  const creator = includedMap.get(`creator-${id}`);
                  return creator?.attributes?.name;
                })
                .filter(Boolean)
                .join(", ") || "Không rõ tác giả";

            // GENRES
            const genreIds =
              item.relationships?.genres?.data?.map((g: any) => g.id) || [];

            const parentGenres = ["Sách nước ngoài", "Sách trong nước"];

            const genreName =
              genreIds
                .map((id: string) => {
                  const g = includedMap.get(`genre-${id}`);
                  return g?.attributes?.name;
                })
                .filter((name: string) => name && !parentGenres.includes(name))
                .join(", ") || "Chưa phân loại";

            // PRICE
            const copyIds =
              item.relationships?.bookCopies?.data?.map((c: any) => c.id) || [];

            const firstCopy =
              includedMap.get(`bookDetail-${copyIds[0]}`)?.attributes || {};

            return {
              id: item.id,
              title: item.attributes?.title || "",
              author: authors,
              genreName,
              price: firstCopy?.price || 0,
              rating: item.attributes?.rating || 0,
              sold: item.attributes?.sold || 0,
              year: item.attributes?.publishedYear || 0,
              image: item.attributes?.imageUrl,
            };
          }) || [];

        setBooks(books);
      } catch (err: any) {
        setError(err.message);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();
  }, []);

  /** CATEGORY LIST */
  const allCategories = ["Tất cả", ...allGenres];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [sortOption, setSortOption] = useState<SortOption>("default");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  /** FILTER + SEARCH */
  const filteredBooks = useMemo(() => {
    let filtered = books;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.author || "").toLowerCase().includes(q) ||
          (b.genreName || "").toLowerCase().includes(q)
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

  /** SORT */
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

  /** PAGINATION */
  const totalPages = Math.ceil(sortedBooks.length / itemsPerPage);
  const paginatedBooks = sortedBooks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /** LOADING + ERROR */
  if (loading)
    return (
      <div className="flex justify-center items-center h-96 text-gray-500 text-lg">
        ⏳ Đang tải dữ liệu...
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-96 text-red-500 text-lg">
        ⚠️ Lỗi tải dữ liệu: {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Sách nước ngoài" },
        ]}
      />

      {/* HEADER — GIỮ NGUYÊN STYLE */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-3">🌍 Sách Nước Ngoài</h1>
          <p className="text-lg text-purple-100">
            Tuyển tập sách hay từ khắp nơi trên thế giới
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* FILTER BAR */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Tìm kiếm sách, tác giả..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3 border-2 border-blue-200 rounded-xl 
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Category */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
            >
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  📚 {cat}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
            >
              <option value="default">📊 Mặc định</option>
              <option value="bestseller">🔥 Bán chạy</option>
              <option value="newest">🆕 Mới nhất</option>
              <option value="price-asc">🪙 Giá thấp → cao</option>
              <option value="price-desc">🪙 Giá cao → thấp</option>
              <option value="rating">⭐ Đánh giá cao</option>
            </select>
          </div>
        </div>

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
                  ? "bg-indigo-600 text-white border-2 border-indigo-600"
                  : "bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50"
              }`}
            >
              🔲 Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === "list"
                  ? "bg-cyan-600 text-white"
                  : "border-2 border-gray-300 hover:bg-gray-50"
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

            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("Tất cả");
                setCurrentPage(1);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <>
            {/* GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {paginatedBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="mt-16 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border-2 
                               border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    ← Trước
                  </button>

                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                          currentPage === page
                            ? "text-white bg-blue-600 border-2 border-blue-600"
                            : "text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border-2 
                               border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
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

export default dynamic(() => Promise.resolve(SachNuocNgoai), {
  ssr: false,
});
