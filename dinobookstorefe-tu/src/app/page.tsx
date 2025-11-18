"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BookCard, { Book } from "@/components/BookCard";
import VoucherSection from "@/components/VoucherSection";

export default function Home() {
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🟢 Fetch SÁCH NỔI BẬT (theo rating trung bình >= 4.5)
  async function fetchFeaturedBooks() {
    try {
      const res = await fetch(
        "http://localhost:8080/v1/books?e=true&page=0&limit=10&sort=rating_desc"
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();

      const includedMap = new Map();
      json.included?.forEach((item: any) => {
        includedMap.set(`${item.type}-${item.id}`, item);
      });

      const books: Book[] =
        json.data
          ?.map((item: any) => {
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
                  (id: string) =>
                    includedMap.get(`genre-${id}`)?.attributes?.name
                )
                .filter(Boolean)
                .join(", ") || "Chưa phân loại";

            // 🔹 Giá
            const copyIds =
              item.relationships?.bookCopies?.data?.map((b: any) => b.id) || [];
            const firstCopy = includedMap.get(`bookDetail-${copyIds[0]}`) || {};
            const price = firstCopy?.attributes?.price || 0;

            return {
              id: item.id,
              title: item.attributes?.title || "Không có tên",
              author: authors,
              genreName,
              price,
              rating,
            };
          })
          // 🔹 Chỉ lấy sách có rating trung bình >= 4.5
          .filter((b: Book) => (b.rating ?? 0) >= 4.5
) || [];

      setFeaturedBooks(books.slice(0, 6)); // chỉ lấy top 6
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
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-3">
                🏆 Sách Nổi Bật
              </h2>
              <div className="w-32 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded"></div>
            </div>
            <Link
              href="/sach-trong-nuoc"
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 group"
            >
              Xem tất cả
              <svg
                className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
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

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {featuredBooks.length > 0 ? (
              featuredBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))
            ) : (
              <p className="text-gray-500 text-center w-full">
                Không có sách nổi bật.
              </p>
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
