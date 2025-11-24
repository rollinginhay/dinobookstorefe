"use client";

import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useFavorite } from "@/contexts/FavoriteContext";

interface Book {
  id: number;
  title: string;
  author: string;
  price: number;
  genreId?: number;
  genreName?: string;
  image?: string;
  description?: string;
  category?: string;
  publisher?: string;
  year: any;
  pages?: number;
  language: string;
  sold?: number;
  rating: number;
  originalPrice?: number;
  discount?: number;
  isTrending?: boolean;
  badge?: string;
  genres?: string[];
}

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorite();
  const isFav = isFavorite(book.id);

  const discount = book.discount || 15;
  const originalPrice =
    book.originalPrice || Math.round(book.price * (1 + discount / 100));
  const soldCount = book.sold || 0;
  const rating = book.rating || 4.5;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFav) {
      removeFromFavorites(book.id);
    } else {
      addToFavorites(book);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(book, 1);
  };

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-2 flex flex-col">
      {/* Image */}
      <Link href={`/san-pham/${book.id}`}>
        <div className="relative aspect-[3/4] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
          {/* Ảnh thật */}
          <img
            src={book.image}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Lớp overlay mờ khi hover */}
          <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>

          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-red-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg">
              -{discount}%
            </div>
          )}

          {/* Trending Badge */}
          {book.isTrending && (
            <div className="absolute top-3 left-16 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Hot
            </div>
          )}

          {/* Favorite Button */}
          <button
            className={`absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-all z-10 transform hover:scale-110 ${
              isFav ? "text-red-500" : "text-gray-400"
            }`}
            onClick={handleFavoriteClick}
          >
            <svg
              className="w-5 h-5"
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
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-grow p-4 justify-between">
        <div>
          <Link href={`/san-pham/${book.id}`}>
            <h3
              className="font-bold text-sm mb-2 text-gray-900 hover:text-blue-600 cursor-pointer transition-colors line-clamp-1 break-words"
              title={book.title} // để hiện tooltip khi hover
            >
              {book.title}
            </h3>
          </Link>

          {/* Author */}
          <p className="text-gray-600 text-xs mb-3">
            Tác giả: <span className="font-medium">{book.author}</span>
          </p>

          {/* Rating */}
          {rating > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.round(rating) ? "fill-current" : "text-gray-300"
                    }`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-gray-500">({rating})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-red-600 font-bold text-lg">
              {book.price.toLocaleString("vi-VN")} ₫
            </span>
            {discount > 0 && (
              <span className="text-gray-400 text-xs line-through">
                {originalPrice.toLocaleString("vi-VN")} ₫
              </span>
            )}
          </div>

          {/* Sold Count */}
          {soldCount > 0 && (
            <p className="text-xs text-gray-600 mb-3">
              Đã bán{" "}
              <span className="font-semibold text-orange-600">
                {soldCount > 1000
                  ? `${(soldCount / 1000).toFixed(1)}k`
                  : soldCount}
              </span>
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <button
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2.5 px-4 rounded-lg transition-all font-semibold text-sm shadow-sm hover:shadow-md transform hover:scale-105"
            onClick={handleAddToCart}
          >
            Thêm vào giỏ
          </button>
          <Link href={`/san-pham/${book.id}`}>
            <button className="px-4 py-2.5 border-2 border-gray-300 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-all">
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export type { Book };
