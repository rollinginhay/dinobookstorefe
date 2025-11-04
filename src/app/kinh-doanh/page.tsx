'use client';

import { useState, useMemo } from 'react';
import BookCard, { Book } from '@/components/BookCard';
import Breadcrumb from '@/components/Breadcrumb';

const allBusinessBooks: Book[] = [
  {
    id: 26,
    title: "Rich Dad Poor Dad",
    author: "Robert Kiyosaki",
    price: 125000,
    image: "/images/richdadpoordad.jpg",
    description: "Cuốn sách kinh điển về tài chính cá nhân",
    category: "Kinh doanh",
    publisher: "NXB Lao động",
    year: 2023,
    pages: 336,
    language: "Tiếng Việt",
    sold: 8900,
    rating: 4.9,
    discount: 20,
    originalPrice: 156000,
    isTrending: true,
  },
  {
    id: 27,
    title: "The Lean Startup",
    author: "Eric Ries",
    price: 145000,
    image: "/images/theleanstartup.jpg",
    description: "Phương pháp khởi nghiệp tinh gọn",
    category: "Kinh doanh",
    publisher: "NXB Trẻ",
    year: 2023,
    pages: 320,
    language: "Tiếng Việt",
    sold: 5678,
    rating: 4.7,
    discount: 18,
    originalPrice: 177000,
    isTrending: true,
  },
  {
    id: 28,
    title: "Good to Great",
    author: "Jim Collins",
    price: 165000,
    image: "/images/goodtogreat.jpg",
    description: "Từ tốt đến vĩ đại trong kinh doanh",
    category: "Kinh doanh",
    publisher: "NXB Tổng hợp",
    year: 2022,
    pages: 320,
    language: "Tiếng Việt",
    sold: 3456,
    rating: 4.8,
    discount: 22,
    originalPrice: 212000,
    isTrending: false,
  },
];

const allCategories = ['Tất cả', 'Kinh doanh'];

type SortOption = 'default' | 'bestseller' | 'newest' | 'price-asc' | 'price-desc' | 'rating';
type ViewMode = 'grid' | 'list';

export default function KinhDoanh() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const filteredBooks = useMemo(() => {
    let filtered = allBusinessBooks;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        book =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.description.toLowerCase().includes(query)
      );
    }
    if (selectedCategory !== 'Tất cả') {
      filtered = filtered.filter(book => book.category === selectedCategory);
    }
    return filtered;
  }, [searchQuery, selectedCategory]);

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

  const totalPages = Math.ceil(sortedBooks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBooks = sortedBooks.slice(startIndex, endIndex);

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb 
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Kinh doanh' }
        ]} 
      />

      <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-3">🎭 Kinh Doanh</h1>
          <p className="text-lg text-yellow-100">
            Khám phá những cuốn sách hay nhất về kinh doanh và khởi nghiệp
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Tìm kiếm sách, tác giả..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); handleFilterChange(); }}
                  className="w-full pl-12 pr-4 py-3 border-2 border-yellow-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
                <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); handleFilterChange(); }}
                className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 text-sm font-semibold"
              >
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>📚 {cat}</option>
                ))}
              </select>
              <select
                value={sortOption}
                onChange={(e) => { setSortOption(e.target.value as SortOption); handleFilterChange(); }}
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
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <p className="text-gray-600 font-medium">
            Tìm thấy <span className="text-yellow-600 font-bold">{sortedBooks.length}</span> sản phẩm
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-yellow-600 text-white'
                  : 'border-2 border-gray-300 hover:bg-gray-50'
              }`}
            >
              🔲 Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-yellow-600 text-white'
                  : 'border-2 border-gray-300 hover:bg-gray-50'
              }`}
            >
              ☰ List
            </button>
          </div>
        </div>

        {paginatedBooks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy sách</h3>
            <p className="text-gray-600 mb-6">Không có sách trong danh mục này</p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {paginatedBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}

            {viewMode === 'list' && (
              <div className="space-y-4">
                {paginatedBooks.map((book) => (
                  <div key={book.id} className="bg-white rounded-xl shadow-sm p-6 flex gap-6 hover:shadow-lg transition-all">
                    <div className="aspect-[3/4] w-32 bg-gradient-to-br from-yellow-50 to-orange-100 rounded-lg overflow-hidden relative flex-shrink-0">
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{book.title}</h3>
                      <p className="text-gray-600 mb-2">Tác giả: <span className="font-medium">{book.author}</span></p>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{book.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-red-600">
                          {book.price.toLocaleString('vi-VN')} ₫
                        </span>
                        <a
                          href={`/san-pham/${book.id}`}
                          className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
                        >
                          Xem chi tiết
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-16 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ← Trước
                  </button>
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                            currentPage === page
                              ? 'text-white bg-yellow-600 border-2 border-yellow-600'
                              : 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    }
                    return null;
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

