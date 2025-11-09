'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';
import BookCard, { Book } from '@/components/BookCard';
import Breadcrumb from '@/components/Breadcrumb';

type SortOption = 'default' | 'bestseller' | 'newest' | 'price-asc' | 'price-desc' | 'rating';
type ViewMode = 'grid' | 'list';

function SachTrongNuoc() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

 const [page, setPage] = useState(0);
const limit = 10;

useEffect(() => {
  async function fetchBooks() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`http://localhost:8080/v1/books?e=true&page=${page}&limit=${limit}`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      console.log("📚 Dữ liệu BE trả về:", json);

      // Nếu BE trả JSON:API
      const books = json.data?.map((item: any) => ({
        id: item.id,
        title: item.attributes?.title || "Không có tên",
        author: item.attributes?.author || "Không rõ tác giả",
        price: item.attributes?.price || 0,
      })) || [];

      setBooks(books);
    } catch (err: any) {
      setError(err.message);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }

  fetchBooks();
}, [page]);


  // 🟢 Tạo danh mục từ genreName (BE trả là chuỗi, không phải mảng)
  const allCategories = [
    'Tất cả',
    ...Array.from(new Set(books.map((b) => b.genreName).filter(Boolean))),
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // 🟢 Lọc + tìm kiếm
  const filteredBooks = useMemo(() => {
    let filtered = books;

    // Tìm kiếm
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.description?.toLowerCase().includes(query)
      );
    }

    // Lọc theo thể loại
    if (selectedCategory !== 'Tất cả') {
      filtered = filtered.filter(
        (book) =>
          book.genreName &&
          book.genreName.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    return filtered;
  }, [books, searchQuery, selectedCategory]);

  // 🟢 Sắp xếp
  const sortedBooks = useMemo(() => {
    const sorted = [...filteredBooks];
    switch (sortOption) {
      case 'bestseller':
        return sorted.sort((a, b) => (b.sold || 0) - (a.sold || 0));
      case 'newest':
        return sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      default:
        return sorted;
    }
  }, [filteredBooks, sortOption]);

  // 🟢 Phân trang
  const totalPages = Math.ceil(sortedBooks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBooks = sortedBooks.slice(startIndex, startIndex + itemsPerPage);

  // Reset khi thay filter
  const handleFilterChange = () => setCurrentPage(1);

  // 🟢 Nếu đang load hoặc lỗi
  if (loading)
    return (
      <div className="flex justify-center items-center h-96 text-gray-500 text-lg">
        ⏳ Đang tải dữ liệu sách...
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-96 text-red-500 text-lg">
        ⚠️ Lỗi khi tải dữ liệu: {error}
      </div>
    );

  // 🟢 UI chính
  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Sách trong nước' },
        ]}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-3">📚 Sách Trong Nước</h1>
          <p className="text-lg text-blue-100">
            Khám phá những cuốn sách hay nhất được xuất bản tại Việt Nam
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Bar */}
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
                    handleFilterChange();
                  }}
                  className="w-full pl-12 pr-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            </div>

            {/* Category Filter */}
            <div className="flex gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  handleFilterChange();
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
                onChange={(e) => {
                  setSortOption(e.target.value as SortOption);
                  handleFilterChange();
                }}
                className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-semibold"
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
        </div>

        {/* Kết quả */}
        {paginatedBooks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Không tìm thấy sách
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? `Không có kết quả cho "${searchQuery}"`
                : 'Không có sách trong danh mục này'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Tất cả');
                setCurrentPage(1);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <>
            {/* Grid */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {paginatedBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}
            {/* 🟦 Pagination */}
<div className="flex justify-center items-center gap-4 mt-10">
  <button 
  onClick={() => setPage(page - 1)} 
  disabled={page === 1}
>
  ← Trước
</button>

<button 
  onClick={() => setPage(page + 1)} 
  disabled={books.length < limit} // <= nếu số sách ít hơn limit thì hết trang
>
  Sau →
</button>

</div>

          </>
        )}
      </div>
    </div>
  );
}

// 🟢 Disable SSR để tránh hydration mismatch
export default dynamic(() => Promise.resolve(SachTrongNuoc), { ssr: false });
