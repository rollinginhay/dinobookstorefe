"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BookCard, { Book } from "@/components/BookCard";
import VoucherSection from "@/components/VoucherSection";
import { domesticBooks } from "@/data/books";

const FALLBACK_IMAGE = "/images/dacnhantam.jpg";

const mapToBookCard = (book: Partial<Book>): Book => ({
  id: Number(book.id),
  title: book.title || "Không có tên",
  author: book.author || "Không rõ tác giả",
  genreName: book.genreName || "Chưa phân loại",
  price: typeof book.price === "number" ? book.price : 0,
  rating: typeof book.rating === "number" ? book.rating : 0,
  image: book.image || FALLBACK_IMAGE,
  description: book.description || "",
  originalPrice:
    typeof book.originalPrice === "number" && book.originalPrice > 0
      ? book.originalPrice
      : typeof book.price === "number"
      ? book.price
      : 0,
  discount:
    typeof book.discount === "number"
      ? book.discount
      : book.originalPrice && book.price && book.originalPrice > book.price
      ? Math.round(
          ((book.originalPrice - book.price) / book.originalPrice) * 100
        )
      : 0,
  sold: typeof book.sold === "number" ? book.sold : 0,
  isTrending: Boolean(book.isTrending) || (book.rating ?? 0) >= 4.8,
  badge: book.badge,

  // ⭐ Fix bắt buộc cho TS strict
  year: book.year ?? 0,
  language: book.language ?? "Không rõ",
});

const fallbackFeaturedBooks = domesticBooks
  .filter((book) => (book.rating ?? 0) >= 4.5)
  .slice(0, 15)
  .map(mapToBookCard);

export default function Home() {
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFeatured = featuredBooks.length > 0;
  const displayFeatured = hasFeatured ? featuredBooks : fallbackFeaturedBooks;

  // 🟢 Fetch SÁCH NỔI BẬT (theo rating trung bình >= 4.5)
  // 🟢 Fetch SÁCH NỔI BẬT (theo rating trung bình >= 4.5)
  async function fetchFeaturedBooks() {
    try {
      console.log("🔄 Fetching featured books...");
      const res = await fetch(
        "http://localhost:8080/v1/books?e=true&page=0&limit=15"
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      console.log("📦 API response:", json);

      const includedMap = new Map();
      json.included?.forEach((item: any) => {
        includedMap.set(`${item.type}-${item.id}`, item);
      });

      const books: Book[] =
        json.data?.map((item: any) => {
          // 🔹 Lấy danh sách ID review
          const reviewIds =
            item.relationships?.reviews?.data?.map((r: any) => r.id) || [];

          // 🔹 Tính trung bình rating từ các review
          const ratings = reviewIds
            .map(
              (id: string) =>
                includedMap.get(`review-${id}`)?.attributes?.rating
            )
            .filter((r: any) => typeof r === "number");

          const rating =
            ratings.length > 0
              ? ratings.reduce((a: number, b: number) => a + b, 0) /
                ratings.length
              : 0;

          // 🔹 Tác giả
          const creatorIds =
            item.relationships?.creators?.data?.map((c: any) => c.id) || [];
          const authors =
            creatorIds
              .map(
                (id: string) =>
                  includedMap.get(`creator-${id}`)?.attributes?.name
              )
              .filter(Boolean)
              .join(", ") || "Không rõ tác giả";

          // 🔹 Thể loại
          const genreIds =
            item.relationships?.genres?.data?.map((g: any) => g.id) || [];
          const genreName =
            genreIds
              .map(
                (id: string) => includedMap.get(`genre-${id}`)?.attributes?.name
              )
              .filter(Boolean)
              .join(", ") || "Chưa phân loại";

          // 🔹 Giá
          const copyIds =
            item.relationships?.bookCopies?.data?.map((b: any) => b.id) || [];
          const firstCopy = includedMap.get(`bookDetail-${copyIds[0]}`) || {};
          const firstCopyAttributes = firstCopy?.attributes || {};
          const price = firstCopyAttributes?.price || 0;
          const originalPrice =
            firstCopyAttributes?.originalPrice || price || 0;
          const calculatedDiscount =
            firstCopyAttributes?.discount ??
            (originalPrice > price && originalPrice !== 0
              ? Math.round(((originalPrice - price) / originalPrice) * 100)
              : 0);
          const sold = firstCopyAttributes?.sold || item.attributes?.sold || 0;
          const coverImage = item.attributes?.imageUrl || FALLBACK_IMAGE;
          const badge =
            rating >= 4.8
              ? "Độc giả yêu thích"
              : rating >= 4.6
              ? "Biên tập chọn"
              : undefined;

          return {
            id:
              typeof item.id === "number"
                ? item.id
                : parseInt(String(item.id), 10) || 0,
            title: item.attributes?.title || "Không có tên",
            author: authors,
            genreName,
            price,
            rating,
            image: coverImage,
            description: item.attributes?.description || "",
            originalPrice,
            discount: calculatedDiscount,
            sold,
            isTrending: item.attributes?.isTrending || rating >= 4.8,
            badge,
          };
        }) || [];

      const topFeatured = books.slice(0, 15);
      console.log("✅ Featured books:", topFeatured);
      setFeaturedBooks(topFeatured);
    } catch (err: any) {
      console.error("❌ Lỗi fetch featured:", err);
      setFeaturedBooks([]);
    }
  }

  // 🟢 Fetch TOÀN BỘ SÁCH
  async function fetchAllBooks() {
    try {
      const res = await fetch(
        "http://localhost:8080/v1/books?e=true&page=0&limit=30"
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();

      const includedMap = new Map();
      json.included?.forEach((item: any) => {
        includedMap.set(`${item.type}-${item.id}`, item);
      });

      const books: Book[] =
        json.data?.map((item: any) => {
          const creatorIds =
            item.relationships?.creators?.data?.map((c: any) => c.id) || [];
          const authors =
            creatorIds
              .map(
                (id: string) =>
                  includedMap.get(`creator-${id}`)?.attributes?.name
              )
              .filter(Boolean)
              .join(", ") || "Không rõ tác giả";

          const genreIds =
            item.relationships?.genres?.data?.map((g: any) => g.id) || [];
          const genreName =
            genreIds
              .map(
                (id: string) => includedMap.get(`genre-${id}`)?.attributes?.name
              )
              .filter(Boolean)
              .join(", ") || "Chưa phân loại";

          const copyIds =
            item.relationships?.bookCopies?.data?.map((b: any) => b.id) || [];
          const firstCopy = includedMap.get(`bookDetail-${copyIds[0]}`) || {};
          const price = firstCopy?.attributes?.price || 0;

          const rating = item.attributes?.rating || 0;

          return {
            id: item.id,
            title: item.attributes?.title || "Không có tên",
            author: authors,
            genreName,
            price,
            rating,
            image: item.attributes?.imageUrl,
          };
        }) || [];

      setAllBooks(books);
    } catch (err: any) {
      console.error("❌ Lỗi fetch all:", err);
      setAllBooks([]);
    }
  }

  // 🧠 Gọi cả 2 API cùng lúc
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        await Promise.all([fetchFeaturedBooks(), fetchAllBooks()]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 🟡 Hiển thị loading / error
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-lg text-gray-500">
        ⏳ Đang tải dữ liệu sách...
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-lg text-red-500">
        ⚠️ Lỗi tải dữ liệu: {error}
      </div>
    );

  // 🟢 UI CHÍNH
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🎆 Banner 11.11 */}
      <section className="relative bg-gradient-to-br from-red-700 via-red-800 to-red-900 overflow-hidden">
        {/* Hiệu ứng ngôi sao */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <span className="text-white text-2xl opacity-40">✦</span>
            </div>
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
          <h1 className="text-7xl md:text-9xl font-black text-white mb-6">
            11.11
          </h1>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            NGÀY ĐÔI SALE VÔ LỖI
          </h2>
          <p className="text-xl md:text-2xl text-red-100 mb-8">
            Săn deal ngay - Ưu đãi hấp dẫn đến 50%
          </p>

          <Link
            href="#featured"
            className="inline-block bg-yellow-400 hover:bg-yellow-500 text-red-900 font-bold text-xl px-12 py-4 rounded-full transition-all transform hover:scale-105 shadow-2xl"
          >
            🛒 KHÁM PHÁ NGAY
          </Link>
        </div>
      </section>

      {/* 🎁 Voucher Section */}
      <VoucherSection />

      {/* 🏆 Sách nổi bật */}
      <section id="featured" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-rose-50 border border-rose-100 rounded-3xl shadow-sm p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl">🛍️</div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-rose-500">
                    Tủ sách
                  </p>
                  <h2 className="text-3xl font-bold text-slate-900">
                    Tủ Sách Nổi Bật
                  </h2>
                </div>
              </div>
              <Link
                href="/sach-trong-nuoc"
                className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2"
              >
                Xem tất cả
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
              {displayFeatured.map((book, index) => {
                // 🔍 Debug: Log book info
                if (index === 0) {
                  console.log(
                    "📚 Featured books:",
                    displayFeatured.map((b) => ({ id: b.id, title: b.title }))
                  );
                }
                return (
                  <Link
                    key={`featured-${book.id}-${index}`}
                    href={`/san-pham/${book.id}`}
                    className="flex-shrink-0 w-40 sm:w-44"
                    onClick={() =>
                      console.log("🖱️ Clicked book:", {
                        id: book.id,
                        title: book.title,
                        href: `/san-pham/${book.id}`,
                      })
                    }
                  >
                    <div className="w-full h-52 sm:h-56 rounded-2xl overflow-hidden bg-white shadow-md border border-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <img
                        src={book.image || FALLBACK_IMAGE}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== FALLBACK_IMAGE) {
                            target.src = FALLBACK_IMAGE;
                          }
                        }}
                      />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-slate-900 line-clamp-2 hover:text-blue-600 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {book.genreName || book.author}
                    </p>
                    {book.rating > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < Math.round(book.rating)
                                  ? "fill-current"
                                  : "text-gray-300"
                              }`}
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          ({book.rating.toFixed(1)})
                        </span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
            {displayFeatured.length > 0 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-slate-600">
                  Hiển thị{" "}
                  <span className="font-bold text-rose-600">
                    {displayFeatured.length}
                  </span>{" "}
                  cuốn sách nổi bật
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 📚 Tất cả sách */}
      <section className="py-16 bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-green-800">
              📚 Gợi Ý Cho Bạn
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {allBooks.length > 0 ? (
              allBooks.map((book) => <BookCard key={book.id} book={book} />)
            ) : (
              <p className="text-gray-500 text-center w-full">
                Không có dữ liệu sách.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
