"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function KinhDoanh() {
  // =========================
  // STATE
  // =========================
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [allGenres, setAllGenres] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [sortOption, setSortOption] = useState<SortOption>("default");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // ⭐ giá trị filter cho Sidebar
  const [filterValues, setFilterValues] = useState<any>({
    priceRange: [],
    publisher: [],
    language: [],
    genres: [],
  });

  const handleFilterChange = (filters: any) => {
    setFilterValues(filters);
    setCurrentPage(1);
  };

  // =========================
  // LOAD DATA FROM BACKEND
  // =========================
  useEffect(() => {
    async function fetchBooks() {
      try {
        setLoading(true);
        setError(null);

        const parent = "Kinh doanh";

        const res = await fetch(
          `http://localhost:8080/v1/books?e=true&page=0&limit=50&genre=${encodeURIComponent(
            parent
          )}`
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

        // ===== LẤY GENRE CON CHO TRANG KINH DOANH =====
        const genreSet = new Set<string>();

        json.data?.forEach((item: any) => {
          const genreIds =
            item.relationships?.genres?.data?.map((g: any) => g.id) || [];

          genreIds.forEach((id: string) => {
            const g = includedMap.get(`genre-${id}`);
            const name = g?.attributes?.name;

            if (
              name &&
              ![
                "Sách trong nước",
                "Sách nước ngoài",
                "Sách thiếu nhi",
                parent,
              ].includes(name)
            ) {
              genreSet.add(name);
            }
          });
        });

        setAllGenres(Array.from(genreSet));

        // ===== PARSE BOOK DATA =====
        const parsed: Book[] =
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

            // Genre con -> mảng genres
            const genreIds =
              item.relationships?.genres?.data?.map((g: any) => g.id) || [];

            const genreList =
              genreIds
                .map((id: string) => {
                  const g = includedMap.get(`genre-${id}`);
                  return g?.attributes?.name;
                })
                .filter(Boolean) || [];

            const genreChildren = genreList.filter(
              (g: string) =>
                g !== "Sách trong nước" &&
                g !== "Sách nước ngoài" &&
                g !== "Sách thiếu nhi" &&
                g !== parent
            );

            const genres = genreChildren.length > 0 ? genreChildren : ["Khác"];

            // Book detail / price
            const copyIds =
              item.relationships?.bookCopies?.data?.map((b: any) => b.id) || [];

            const detailObj = includedMap.get(`bookDetail-${copyIds[0]}`);
            const detail = detailObj?.attributes || {};

            // const detail =
            //   includedMap.get(`bookDetail-${copyIds[0]}`)?.attributes || {};

            // Publisher
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
              price: detail.price || 0,
              originalPrice: detail.originalPrice || detail.price || 0,
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
  // CATEGORY LIST
  // =========================
  const allCategories = ["Tất cả", ...allGenres];

  // =========================
  // COUNT PUBLISHER & PRICE
  // =========================
  const publisherCounts = useMemo(() => {
    const map: Record<string, number> = {};

    books.forEach((b) => {
      const pub = (b as any).publisher || "Không rõ";
      map[pub] = (map[pub] || 0) + 1;
    });

    return map;
  }, [books]);

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
  // FILTER
  // =========================
  const filteredBooks = useMemo(() => {
    let filtered = books;

    // Lọc theo giá
    if (filterValues.priceRange.length > 0) {
      filtered = filtered.filter((book) =>
        filterValues.priceRange.some((range: string) => {
          if (range === "500000+") return book.price >= 500000;
          const [min, max] = range.split("-").map(Number);
          return book.price >= min && book.price <= max;
        })
      );
    }

    // Lọc theo NXB
    if (filterValues.publisher.length > 0) {
      filtered = filtered.filter((book: any) =>
        filterValues.publisher.includes(book.publisher)
      );
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          (b.description || "").toLowerCase().includes(q)
      );
    }

    // Lọc theo genre con từ sidebar
    if (filterValues.genres && filterValues.genres.length > 0) {
      filtered = filtered.filter((b: any) =>
        b.genres?.some((g: string) => filterValues.genres.includes(g))
      );
    }

    // Lọc theo category ở dropdown
    if (selectedCategory !== "Tất cả") {
      filtered = filtered.filter(
        (b: any) => b.genres && b.genres.includes(selectedCategory)
      );
    }

    return filtered;
  }, [books, searchQuery, selectedCategory, filterValues]);

  // =========================
  // SORT
  // =========================
  const sortedBooks = useMemo(() => {
    const sorted = [...filteredBooks];

    switch (sortOption) {
      case "bestseller":
        return sorted.sort((a: any, b: any) => (b.sold || 0) - (a.sold || 0));
      case "newest":
        return sorted.sort((a: any, b: any) => (b.year || 0) - (a.year || 0));
      case "price-asc":
        return sorted.sort((a: any, b: any) => a.price - b.price);
      case "price-desc":
        return sorted.sort((a: any, b: any) => b.price - a.price);
      case "rating":
        return sorted.sort(
          (a: any, b: any) => (b.rating || 0) - (a.rating || 0)
        );
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
        items={[{ label: "Trang chủ", href: "/" }, { label: "Kinh doanh" }]}
      />

      {/* HEADER – GIỮ MÀU KINH DOANH CŨ */}
      <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-3">💼 Kinh Doanh</h1>
          <p className="text-lg text-yellow-100">
            Khám phá những cuốn sách hay nhất về kinh doanh và khởi nghiệp
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* FILTER BAR – màu vàng như cũ */}
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
                className="w-full pl-12 pr-4 py-3 border-2 border-yellow-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            {/* SORT */}
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value as SortOption);
                setCurrentPage(1);
              }}
              className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 text-sm font-semibold"
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
            <span className="text-yellow-600 font-bold">
              {sortedBooks.length}
            </span>{" "}
            sản phẩm
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === "grid"
                  ? "bg-yellow-600 text-white border-2 border-yellow-600"
                  : "bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50"
              }`}
            >
              🔲 Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === "list"
                  ? "bg-orange-600 text-white border-2 border-orange-600"
                  : "bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50"
              }`}
            >
              ☰ List
            </button>
          </div>
        </div>

        {/* SIDEBAR + LIST */}
        <div className="flex gap-8">
          {/* SIDEBAR */}
          <div className="hidden lg:block w-64">
            <FilterSidebar
              onFilterChange={handleFilterChange}
              priceCounts={priceCounts}
              publisherCounts={publisherCounts}
              books={books}
            />
          </div>

          {/* MAIN CONTENT */}
          <div className="flex-1">
            {paginatedBooks.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Không tìm thấy sách
                </h3>
                <p className="text-gray-600">
                  {searchQuery
                    ? `Không có kết quả cho "${searchQuery}"`
                    : "Không có sách trong danh mục này"}
                </p>
              </div>
            ) : (
              <>
                {/* GRID VIEW */}
                {viewMode === "grid" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
                    {paginatedBooks.map((book) => (
                      <BookCard key={book.id} book={book} />
                    ))}
                  </div>
                )}

                {/* LIST VIEW */}
                {viewMode === "list" && (
                  <div className="space-y-4">
                    {paginatedBooks.map((book) => (
                      <div
                        key={book.id}
                        className="bg-white rounded-xl shadow-sm p-6 flex gap-6 hover:shadow-lg transition-all"
                      >
                        <div className="aspect-[3/4] w-32 bg-gradient-to-br from-yellow-50 to-orange-100 rounded-lg overflow-hidden relative flex-shrink-0">
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

                          <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                            {book.description}
                          </p>

                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-red-600">
                              {book.price.toLocaleString("vi-VN")} ₫
                            </span>

                            <a
                              href={`/san-pham/${book.id}`}
                              className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 font-semibold transition-colors"
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
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm bg-white border-2 border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        ← Trước
                      </button>

                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`px-4 py-2 text-sm rounded-lg border-2 ${
                            currentPage === i + 1
                              ? "bg-yellow-600 text-white border-yellow-600"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}

                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm bg-white border-2 border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50"
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
      </div>
    </div>
  );
}
