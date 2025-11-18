"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Book } from "@/components/BookCard";
import Breadcrumb from "@/components/Breadcrumb";
import PromotionBanner from "@/components/PromotionBanner";
import { useCart } from "@/contexts/CartContext";
import { useFavorite } from "@/contexts/FavoriteContext";
import Link from "next/link";

export default function ProductDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorite();
  const bookId = parseInt(params.id);

  // 🔹 State dữ liệu
  const [book, setBook] = useState<Book | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<
    "description" | "details" | "reviews"
  >("description");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchBookAndRelated() {
      try {
        setLoading(true);

        // --- Lấy thông tin sách ---
        const res = await fetch(
          `http://localhost:8080/v1/book/${bookId}?e=true`
        );
        if (!res.ok) throw new Error("Không thể tải dữ liệu sách");
        const json = await res.json();
        console.log("json", json);
        const includedMap = new Map();
        json.included?.forEach((item: any) => {
          includedMap.set(`${item.type}-${item.id}`, item);
        });

        const item = json.data;
        console.log("item", item);
        const creatorIds =
          item.relationships?.creators?.data?.map((c: any) => c.id) || [];
        const authors =
          creatorIds
            .map(
              (id: string) => includedMap.get(`creator-${id}`)?.attributes?.name
            )
            .filter(Boolean)
            .join(", ") || "Không rõ tác giả";

        const genreIds =
          item.relationships?.genres?.data?.map((g: any) => g.id) || [];
        console.log("genreIds", genreIds);
        const genreName =
          genreIds
            .map(
              (id: string) => includedMap.get(`genre-${id}`)?.attributes?.name
            )
            .filter(Boolean)
            .join(", ") || "Chưa phân loại";
        const publisherId = item.relationships?.publisher?.data?.id || null;
        console.log("publisherId", publisherId);
        const publisherName = publisherId
          ? includedMap.get(`publisher-${publisherId}`)?.attributes?.name
          : "Không rõ NXB";
        console.log("publisherName", publisherName);
        const publishedDate = item.attributes.published;
        const year = publishedDate
          ? new Date(publishedDate).getFullYear()
          : "Không rõ năm xuất bản";
        const language = item.attributes.language || "Không rõ ngôn ngữ";
        console.log("language", language);
        const copyIds =
          item.relationships?.bookCopies?.data?.map((b: any) => b.id) || [];
        const firstCopy = includedMap.get(`bookDetail-${copyIds[0]}`) || {};
        console.log(firstCopy, "firstCopy");
        const price = firstCopy?.attributes?.price || 0;
        const bookData: Book = {
          id: Number(item.id),
          title: item.attributes?.title,
          author: authors,
          price,
          genreName: genreName,
          rating: item.attributes?.rating || 4.5,
          description: item.attributes?.description || "",
          image: item.attributes?.imageUrl || "/default-book.jpg",
          sold: item.attributes?.sold || 0,
          publisher: publisherName,
          year: year,
          pages: item.attributes?.pages,
          language: language,
        };
        console.log(json.data.attributes, "json");
        setBook(bookData);

        // --- 🔹 Lấy danh sách sách liên quan theo thể loại ---
        if (genreIds.length > 0) {
          const relatedRes = await fetch(
            `http://localhost:8080/v1/books?filter.genre=${encodeURIComponent(
              genreIds[0]
            )}&limit=5&e=true`
          );
          const relatedJson = await relatedRes.json();
          const relatedIncludedMap = new Map();
          relatedJson.included?.forEach((item: any) => {
            relatedIncludedMap.set(`${item.type}-${item.id}`, item);
          });

          const relatedList: Book[] =
            relatedJson.data
              ?.filter((b: any) => b.id !== item.id)
              .map((b: any) => {
                // Lấy tác giả
                const relatedCreatorIds =
                  b.relationships?.creators?.data?.map((c: any) => c.id) || [];
                const relatedAuthors =
                  relatedCreatorIds
                    .map(
                      (id: string) =>
                        relatedIncludedMap.get(`creator-${id}`)?.attributes
                          ?.name
                    )
                    .filter(Boolean)
                    .join(", ") || "—";

                // Lấy giá từ bookCopies
                const copyIds =
                  b.relationships?.bookCopies?.data?.map((c: any) => c.id) ||
                  [];
                const firstCopy =
                  relatedIncludedMap.get(`bookDetail-${copyIds[0]}`) || {};

                return {
                  id: Number(b.id),
                  title: b.attributes?.title,
                  author: relatedAuthors,
                  price:
                    b.attributes?.price || firstCopy?.attributes?.price || 0,
                  image: b.attributes?.imageUrl || "/default-book.jpg",
                  rating: b.attributes?.rating || 0,
                };
              }) || [];

          setRelatedBooks(relatedList);
        } else {
          setRelatedBooks([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchBookAndRelated();
  }, [bookId]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Đang tải dữ liệu sách...
      </div>
    );

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Không tìm thấy sản phẩm
          </h2>
          <Link href="/" className="text-blue-600 hover:underline">
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }
  const discount = 15;
  const originalPrice = Math.round(book.price * (1 + discount / 100));
  const isFav = isFavorite(book.id);

  const handleQuantityChange = (value: number) => {
    if (value < 1 || value > 10) return;
    setQuantity(value);
  };

  const handleAddToCart = () => addToCart(book, quantity);
  const handleBuyNow = () => {
    addToCart(book, quantity);
    router.push("/thanh-toan");
  };
  const handleFavorite = () => {
    if (isFav) removeFromFavorites(book.id);
    else addToFavorites(book);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Promotion Banner */}
      <PromotionBanner />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Sách", href: "/sach" },
          { label: book.category, href: `/the-loai/${book.category}` },
          { label: book.title },
        ]}
      />

      {/* Product Detail Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Left: Images */}
            <div className="space-y-4">
              <div className="aspect-[3/4] bg-gray-50 rounded-lg overflow-hidden relative group">
                <img
                  src={book.image}
                  alt={book.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-red-500 text-white text-xl px-4 py-2 rounded-full font-bold">
                  -{discount}%
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-lg cursor-pointer hover:ring-2 ring-blue-500 overflow-hidden"
                  >
                    <img
                      src={book.image}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {book.title}
                </h1>
                <p className="text-xl text-gray-600">
                  Tác giả:{" "}
                  <span className="font-semibold text-blue-600">
                    {book.author}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-4 border-b pb-4">
                <div className="flex items-center">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${
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
                  <span className="text-gray-700 ml-2 font-medium">
                    {book.rating}
                  </span>
                </div>
                <span className="text-gray-500">|</span>
                <span className="text-blue-600 hover:underline cursor-pointer font-medium">
                  123 đánh giá
                </span>
                <span className="text-gray-500">|</span>
                <span className="text-gray-600">
                  Đã bán:{" "}
                  <span className="font-medium text-orange-500">
                    {book.sold?.toLocaleString("vi-VN")}
                  </span>
                </span>
              </div>

              {/* Giá */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-4xl font-bold text-red-600">
                      {book.price.toLocaleString("vi-VN")} ₫
                    </span>
                    <span className="text-gray-500 text-xl line-through ml-3">
                      {originalPrice.toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                  <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    Giảm {discount}%
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <span className="text-gray-600">
                    NXB: <span className="font-medium">{book.publisher}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-gray-600">
                    Năm XB: <span className="font-medium">{book.year}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  <span className="text-gray-600">
                    Số trang: <span className="font-medium">{book.pages}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                    />
                  </svg>
                  <span className="text-gray-600">
                    Ngôn ngữ:{" "}
                    <span className="font-medium">{book.language}</span>
                  </span>
                </div>
              </div>

              {/* Các nút hành động */}
              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-orange-500 text-white py-4 px-6 rounded-lg hover:bg-orange-600 transition-colors font-semibold text-lg flex items-center justify-center gap-2"
                >
                  Thêm vào giỏ hàng
                </button>
                <button
                  onClick={handleBuyNow}
                  className="px-6 py-4 border-2 border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 transition-colors font-semibold"
                >
                  Mua ngay
                </button>
                <button
                  onClick={handleFavorite}
                  className={`px-4 py-4 border rounded-lg transition-colors ${
                    isFav
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <svg
                    className={`w-5 h-5 ${
                      isFav ? "text-red-500" : "text-gray-600"
                    }`}
                    fill={isFav ? "currentColor" : "none"}
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
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Sản phẩm liên quan */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-l-4 border-orange-500 pl-3">
          📚 Sản phẩm liên quan
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {relatedBooks.map((relatedBook) => (
            <Link
              key={relatedBook.id}
              href={`/san-pham/${relatedBook.id}`}
              className="group"
            >
              <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-2 flex flex-col">
                {/* Ảnh */}
                <div className="aspect-[3/4] relative overflow-hidden">
                  <img
                    src={relatedBook.image}
                    alt={relatedBook.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />

                  {/* Lớp overlay khi hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>

                {/* Nội dung */}
                <div className="p-4 flex flex-col justify-between flex-grow">
                  <div>
                    <h3
                      className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors"
                      title={relatedBook.title}
                    >
                      {relatedBook.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                      {relatedBook.author || "—"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-red-600 font-bold text-base">
                      {relatedBook.price
                        ? `${relatedBook.price.toLocaleString("vi-VN")} ₫`
                        : "Liên hệ"}
                    </span>
                    <button className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-lg font-medium shadow-sm hover:shadow-md transform hover:scale-105 transition-all">
                      Mua ngay
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
