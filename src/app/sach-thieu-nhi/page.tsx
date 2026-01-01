"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo } from "react";
import BookCard, { Book } from "@/components/BookCard";
import Breadcrumb from "@/components/Breadcrumb";
import FilterSidebar from "@/components/FilterSidebar";

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
  // FETCH DATA
  // =========================
  useEffect(() => {
    async function fetchBooks() {
      try {
        setLoading(true);
        setError(null);

        const parentGenre = "Sách thiếu nhi";

        const res = await fetch(
          `http://localhost:8080/v1/books?e=true&page=0&limit=10&genre=S%C3%A1ch%20thi%E1%BA%BFu%20nhi`
        );

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(`Lỗi ${res.status}: ${msg}`);
        }

        const json = await res.json();

        const includedMap = new Map();
        json.included?.forEach((i: any) =>
          includedMap.set(`${i.type}-${i.id}`, i)
        );

        // Lấy genre CON theo từng cuốn sách — CHUẨN NHẤT
        const genreSet = new Set<string>();

        json.data.forEach((item: any) => {
          const genreIds =
            item.relationships?.genres?.data?.map((g: any) => g.id) || [];

          genreIds.forEach((id: string) => {
            const g = includedMap.get(`genre-${id}`);
            const name = g?.attributes?.name;

            if (
              name &&
              name !== "Sách thiếu nhi" &&
              name !== "Sách trong nước" &&
              name !== "Sách nước ngoài"
            ) {
              genreSet.add(name);
            }
          });
        });

        setAllGenres(Array.from(genreSet));

        const parsed =
          json.data?.map((item: any) => {
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

            const genreIds =
              item.relationships?.genres?.data?.map((g: any) => g.id) || [];

            // Lấy danh sách tên genre của sách
            const genreList =
              genreIds
                .map((id: string) => {
                  const g = includedMap.get(`genre-${id}`);
                  return g?.attributes?.name;
                })
                .filter(Boolean) || [];

            // Genre con = tất cả genre trừ genre cha
            const genreChildren = genreList.filter(
              (g: string) =>
                g !== "Sách thiếu nhi" &&
                g !== "Sách trong nước" &&
                g !== "Sách nước ngoài"
            );

            // Nếu có genre con → lấy nó, không thì gán "Khác"
            const genres = genreChildren.length > 0 ? genreChildren : ["Khác"];
            const copyIds =
              item.relationships?.bookCopies?.data?.map((b: any) => b.id) || [];

            const detailObj = includedMap.get(`bookDetail-${copyIds[0]}`);
            const detail = detailObj?.attributes || {};

            // const detail =
            //   includedMap.get(`bookDetail-${copyIds[0]}`)?.attributes || {};
            const publisherId = item.relationships?.publisher?.data?.id;

            const publisherName =
              (publisherId &&
                includedMap.get(`publisher-${publisherId}`)?.attributes
                  ?.name) ||
              "Không rõ";

            return {
              id: Number(item.id),
              title: item.attributes?.title,
              author: authors,
              genres,
              price: detail.supplyPrice || 0,
              originalPrice: detail.originalPrice || detail.supplyPrice || 0,
              discount: detail.discount || 0,
              rating: item.attributes?.rating || 0,
              sold: item.attributes?.sold || 0,
              description: item.attributes?.description || "",
              image: item.attributes?.imageUrl,
              publisher: publisherName,
              copyId: Number(copyIds[0]),
              bookDetailId: Number(copyIds[0]),
              bookFormat: detail.bookFormat || "Khác",
            } as Book;
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
  // CATEGORY + FILTER STATE
  // =========================
  const allCategories = ["Tất cả", ...allGenres];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [sortOption, setSortOption] = useState<SortOption>("default");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [filterValues, setFilterValues] = useState<any>({
    priceRange: [],
    publisher: [],
    language: [],
  });

  const handleFilterChange = (filters: any) => {
    setFilterValues(filters);
    setCurrentPage(1);
  };
  // ⭐⭐⭐ TÍNH SỐ LƯỢNG NXB ⭐⭐⭐
  const publisherCounts = useMemo(() => {
    const map: Record<string, number> = {};

    books.forEach((b) => {
      const pub = b.publisher || "Không rõ";
      map[pub] = (map[pub] || 0) + 1;
    });

    return map;
  }, [books]);

  // =========================
  // FILTERING
  // =========================
  const filteredBooks = useMemo(() => {
    let filtered = books;

    // ⭐ LỌC THEO GIÁ
    if (filterValues.priceRange.length > 0) {
      filtered = filtered.filter((book) =>
        filterValues.priceRange.some((range: string) => {
          if (range === "500000+") return book.price >= 500000;
          const [min, max] = range.split("-").map(Number);
          return book.price >= min && book.price <= max;
        })
      );
    }

    // ⭐ LỌC THEO NHÀ XUẤT BẢN
    if (filterValues.publisher.length > 0) {
      filtered = filtered.filter((book) =>
        filterValues.publisher.includes(book.publisher)
      );
    }

    // ⭐ LỌC SEARCH
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          (b.description || "").toLowerCase().includes(q)
      );
    }
    // ⭐ LỌC THEO GENRE CON (SIDEBAR)
    if (filterValues.genres && filterValues.genres.length > 0) {
      filtered = filtered.filter((b) =>
        b.genres?.some((g) => filterValues.genres.includes(g))
      );
    }

    // ⭐ LỌC THEO CATEGORY
    if (selectedCategory !== "Tất cả") {
      filtered = filtered.filter((b) => b.genres?.includes(selectedCategory));
    }

    return filtered;
  }, [books, searchQuery, selectedCategory, filterValues]);

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

  // ======================================================
  // ⭐⭐⭐ THÊM PHẦN PRICE COUNTS (ĐÚNG CHỖ NÀY) ⭐⭐⭐
  // ======================================================
  const priceCounts = useMemo(() => {
    const count = {
      "0-50000": 0,
      "50000-100000": 0,
      "100000-200000": 0,
      "200000-500000": 0,
      "500000+": 0,
    };

    books.forEach((b) => {
      const p = b.price;

      if (p < 50000) count["0-50000"]++;
      else if (p < 100000) count["50000-100000"]++;
      else if (p < 200000) count["100000-200000"]++;
      else if (p < 500000) count["200000-500000"]++;
      else count["500000+"]++;
    });

    return count;
  }, [books]);

  // =========================
  // UI
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
                  setCurrentPage(1);
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

            {/* SORT */}
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value as SortOption);
                setCurrentPage(1);
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
                  ? "bg-blue-600 text-white border-2 border-cyan-600"
                  : "bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50"
              }`}
            >
              ☰ List
            </button>
          </div>
        </div>

        {/* ====================== */}
        {/*   SIDEBAR + GRID LIST   */}
        {/* ====================== */}
        <div className="flex gap-8">
          {/* SIDEBAR (luôn hiện) */}
          <div className="hidden lg:block w-64">
            <FilterSidebar
              onFilterChange={handleFilterChange}
              priceCounts={priceCounts}
              publisherCounts={publisherCounts} // ⭐ THÊM
              books={books} // ⭐ THÊM
            />
          </div>

          {/* MAIN LIST AREA */}
          <div className="flex-1">
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
                {viewMode === "grid" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
                    {paginatedBooks.map((book) => (
                      <BookCard key={book.id} book={book} />
                    ))}
                  </div>
                )}

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
              </>
            )}
          </div>
        </div>

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
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(SachThieuNhi), { ssr: false });
