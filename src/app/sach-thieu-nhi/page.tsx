'use client';

import { useState, useMemo } from 'react';
import BookCard, { Book } from '@/components/BookCard';
import Breadcrumb from '@/components/Breadcrumb';

const allChildrenBooks: Book[] = [
  {
    id: 12,
    title: "Dế Mèn Phiêu Lưu Ký",
    author: "Tô Hoài",
    price: 50000,
    image: "/images/de-men-phieu-luu-ky.jpg",
    description: "Câu chuyện phiêu lưu tuổi thơ bất hủ",
    category: "Thiếu nhi",
    publisher: "NXB Kim Đồng",
    year: 2023,
    pages: 150,
    language: "Tiếng Việt",
    sold: 15234,
    rating: 4.9,
    discount: 20,
    originalPrice: 62500,
    isTrending: true,
  },
  {
    id: 15,
    title: "Sơn Tinh Thủy Tinh",
    author: "Truyện dân gian",
    price: 35000,
    image: "/images/sontinhthuytinh.jpg",
    description: "Truyện cổ tích dân gian Việt Nam",
    category: "Thiếu nhi",
    publisher: "NXB Kim Đồng",
    year: 2023,
    pages: 80,
    language: "Tiếng Việt",
    sold: 23098,
    rating: 4.9,
    discount: 22,
    originalPrice: 45000,
    isTrending: true,
  },
  {
    id: 19,
    title: "Nghìn Lẻ Một Đêm",
    author: "Truyện cổ tích Ả Rập",
    price: 125000,
    image: "/images/nghinlemotdem.jpg",
    description: "Tuyển tập truyện cổ tích nổi tiếng",
    category: "Thiếu nhi",
    publisher: "NXB Kim Đồng",
    year: 2023,
    pages: 800,
    language: "Tiếng Việt",
    sold: 8901,
    rating: 4.9,
    discount: 20,
    originalPrice: 156000,
    isTrending: true,
  },
];

const allCategories = ['Tất cả', 'Thiếu nhi'];

type SortOption = 'default' | 'bestseller' | 'newest' | 'price-asc' | 'price-desc' | 'rating';
type ViewMode = 'grid' | 'list';

export default function SachThieuNhi() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const filteredBooks = useMemo(() => {
    let filtered = allChildrenBooks;
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
          { label: 'Sách thiếu nhi' }
        ]} 
      />

      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-3">👶 Sách Thiếu Nhi</h1>
          <p className="text-lg text-cyan-100">
            Khám phá thế giới sách đầy màu sắc dành cho các bé
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
                  className="w-full pl-12 pr-4 py-3 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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
                className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 text-sm font-semibold"
              >
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>📚 {cat}</option>
                ))}
              </select>
              <select
                value={sortOption}
                onChange={(e) => { setSortOption(e.target.value as SortOption); handleFilterChange(); }}
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
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <p className="text-gray-600 font-medium">
            Tìm thấy <span className="text-cyan-600 font-bold">{sortedBooks.length}</span> sản phẩm
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-cyan-600 text-white'
                  : 'border-2 border-gray-300 hover:bg-gray-50'
              }`}
            >
              🔲 Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-cyan-600 text-white'
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
                    <div className="aspect-[3/4] w-32 rounded-lg overflow-hidden relative flex-shrink-0">
                      <img src={book.image} alt={book.title} className="absolute inset-0 w-full h-full object-cover" />
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
                              ? 'text-white bg-cyan-600 border-2 border-cyan-600'
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

