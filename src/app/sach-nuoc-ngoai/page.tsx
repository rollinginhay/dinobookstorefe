'use client';

import { useState, useMemo } from 'react';
import BookCard, { Book } from '@/components/BookCard';
import Breadcrumb from '@/components/Breadcrumb';

// Dữ liệu phong phú cho sách nước ngoài
const allForeignBooks: Book[] = [
  {
    id: 101,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    price: 110000,
    image: "/images/thegreatgatsby.jpg",
    description: "A classic American novel about the Jazz Age",
    category: "Literature",
    publisher: "Scribner",
    year: 2023,
    pages: 180,
    language: "English",
    sold: 3245,
    rating: 4.5,
    discount: 15,
    originalPrice: 129000,
    isTrending: false,
  },
  {
    id: 102,
    title: "1984",
    author: "George Orwell",
    price: 110000,
    image: "/images/1984.jpg",
    description: "A dystopian social science fiction novel",
    category: "Science Fiction",
    publisher: "Secker & Warburg",
    year: 2023,
    pages: 328,
    language: "English",
    sold: 2890,
    rating: 4.4,
    discount: 15,
    originalPrice: 129000,
    isTrending: false,
  },
  {
    id: 103,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    price: 130000,
    image: "/images/tokillamockingbird.jpg",
    description: "A novel about racial injustice and childhood innocence",
    category: "Literature",
    publisher: "J.B. Lippincott & Co.",
    year: 2022,
    pages: 281,
    language: "English",
    sold: 1567,
    rating: 4.5,
    discount: 18,
    originalPrice: 159000,
    isTrending: false,
  },
  {
    id: 104,
    title: "Pride and Prejudice",
    author: "Jane Austen",
    price: 100000,
    image: "/images/prideandprejudice.jpg",
    description: "A romantic novel of manners",
    category: "Romance",
    publisher: "T. Egerton, Whitehall",
    year: 2023,
    pages: 432,
    language: "English",
    sold: 5234,
    rating: 4.7,
    discount: 20,
    originalPrice: 125000,
    isTrending: true,
  },
  {
    id: 105,
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    price: 115000,
    image: "/images/thecatcherintherye.jpg",
    description: "A coming-of-age story about teenage rebellion",
    category: "Literature",
    publisher: "Little, Brown and Company",
    year: 2022,
    pages: 277,
    language: "English",
    sold: 3789,
    rating: 4.3,
    discount: 12,
    originalPrice: 131000,
    isTrending: false,
  },
  {
    id: 106,
    title: "Lord of the Flies",
    author: "William Golding",
    price: 105000,
    image: "/images/lordoftheflies.jpg",
    description: "A novel about a group of British boys stranded on an island",
    category: "Literature",
    publisher: "Faber and Faber",
    year: 2023,
    pages: 224,
    language: "English",
    sold: 2456,
    rating: 4.6,
    discount: 15,
    originalPrice: 124000,
    isTrending: false,
  },
  {
    id: 107,
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    price: 140000,
    image: "/images/thehobbit.jpg",
    description: "A fantasy novel about a hobbit's unexpected journey",
    category: "Fantasy",
    publisher: "George Allen & Unwin",
    year: 2023,
    pages: 310,
    language: "English",
    sold: 8912,
    rating: 4.8,
    discount: 18,
    originalPrice: 171000,
    isTrending: true,
  },
  {
    id: 108,
    title: "Dune",
    author: "Frank Herbert",
    price: 195000,
    image: "/images/dune-samac.jpg",
    description: "Epic science fiction masterpiece",
    category: "Science Fiction",
    publisher: "Ace Books",
    year: 2023,
    pages: 688,
    language: "English",
    sold: 1567,
    rating: 4.8,
    discount: 20,
    originalPrice: 244000,
    isTrending: false,
  },
  {
    id: 109,
    title: "One Hundred Years of Solitude",
    author: "Gabriel García Márquez",
    price: 165000,
    image: "/images/onehundredyearsofsolitude.jpg",
    description: "Magical realism masterpiece",
    category: "Literature",
    publisher: "Harper & Row",
    year: 2022,
    pages: 417,
    language: "English",
    sold: 3890,
    rating: 4.9,
    discount: 25,
    originalPrice: 220000,
    isTrending: true,
  },
  {
    id: 110,
    title: "The Picture of Dorian Gray",
    author: "Oscar Wilde",
    price: 95000,
    image: "/images/thepictureofdoriangray.jpg",
    description: "Philosophical fantasy novel",
    category: "Gothic Fiction",
    publisher: "Ward, Lock & Co.",
    year: 2021,
    pages: 254,
    language: "English",
    sold: 5678,
    rating: 4.7,
    discount: 15,
    originalPrice: 112000,
    isTrending: false,
  },
  {
    id: 111,
    title: "Jane Eyre",
    author: "Charlotte Brontë",
    price: 125000,
    image: "/images/janeeyre.jpg",
    description: "Gothic romance and coming-of-age novel",
    category: "Romance",
    publisher: "Smith, Elder & Co.",
    year: 2023,
    pages: 610,
    language: "English",
    sold: 4567,
    rating: 4.7,
    discount: 22,
    originalPrice: 160000,
    isTrending: true,
  },
  {
    id: 112,
    title: "Brave New World",
    author: "Aldous Huxley",
    price: 115000,
    image: "/images/bravenewworld.jpg",
    description: "Dystopian social science fiction",
    category: "Science Fiction",
    publisher: "Chatto & Windus",
    year: 2022,
    pages: 311,
    language: "English",
    sold: 3214,
    rating: 4.6,
    discount: 18,
    originalPrice: 140000,
    isTrending: false,
  },
  {
    id: 113,
    title: "The Old Man and the Sea",
    author: "Ernest Hemingway",
    price: 85000,
    image: "/images/theoldmanandthesea.jpg",
    description: "Nobel Prize-winning novella",
    category: "Literature",
    publisher: "Scribner",
    year: 2023,
    pages: 127,
    language: "English",
    sold: 6789,
    rating: 4.8,
    discount: 12,
    originalPrice: 97000,
    isTrending: true,
  },
  {
    id: 114,
    title: "Animal Farm",
    author: "George Orwell",
    price: 80000,
    image: "/images/animalfarm.jpg",
    description: "Political satire and allegory",
    category: "Political Fiction",
    publisher: "Secker & Warburg",
    year: 2022,
    pages: 112,
    language: "English",
    sold: 9876,
    rating: 4.9,
    discount: 10,
    originalPrice: 89000,
    isTrending: true,
  },
  {
    id: 115,
    title: "The Chronicles of Narnia",
    author: "C.S. Lewis",
    price: 180000,
    image: "/images/thechroniclesofnarnia.jpg",
    description: "Complete boxed set fantasy series",
    category: "Fantasy",
    publisher: "Geoffrey Bles",
    year: 2023,
    pages: 784,
    language: "English",
    sold: 12345,
    rating: 5.0,
    discount: 15,
    originalPrice: 212000,
    isTrending: true,
  },
  {
    id: 116,
    title: "The Lord of the Rings",
    author: "J.R.R. Tolkien",
    price: 250000,
    image: "/images/thelordoftherings.jpg",
    description: "Epic fantasy trilogy",
    category: "Fantasy",
    publisher: "George Allen & Unwin",
    year: 2023,
    pages: 1178,
    language: "English",
    sold: 14567,
    rating: 5.0,
    discount: 20,
    originalPrice: 312500,
    isTrending: true,
  },
  {
    id: 117,
    title: "Crime and Punishment",
    author: "Fyodor Dostoevsky",
    price: 145000,
    image: "/images/crimeandpunishment.jpg",
    description: "Psychological thriller masterpiece",
    category: "Literature",
    publisher: "The Russian Messenger",
    year: 2022,
    pages: 671,
    language: "English",
    sold: 2345,
    rating: 4.8,
    discount: 18,
    originalPrice: 177000,
    isTrending: false,
  },
  {
    id: 118,
    title: "War and Peace",
    author: "Leo Tolstoy",
    price: 220000,
    image: "/images/warandpeace.jpg",
    description: "Epic historical novel",
    category: "Literature",
    publisher: "The Russian Messenger",
    year: 2023,
    pages: 1225,
    language: "English",
    sold: 1876,
    rating: 4.9,
    discount: 25,
    originalPrice: 293000,
    isTrending: false,
  },
  {
    id: 119,
    title: "Moby Dick",
    author: "Herman Melville",
    price: 135000,
    image: "/images/mobydick.jpg",
    description: "Adventure novel about whaling",
    category: "Adventure",
    publisher: "Harper & Brothers",
    year: 2022,
    pages: 635,
    language: "English",
    sold: 3456,
    rating: 4.6,
    discount: 15,
    originalPrice: 159000,
    isTrending: false,
  },
  {
    id: 120,
    title: "Don Quixote",
    author: "Miguel de Cervantes",
    price: 150000,
    image: "/images/donquixote.jpg",
    description: "The first modern novel",
    category: "Literature",
    publisher: "Francisco de Robles",
    year: 2023,
    pages: 863,
    language: "English",
    sold: 2789,
    rating: 4.7,
    discount: 22,
    originalPrice: 192000,
    isTrending: false,
  },
];

// Tất cả các danh mục
const allCategories = ['Tất cả', ...Array.from(new Set(allForeignBooks.map(b => b.category)))];

type SortOption = 'default' | 'bestseller' | 'newest' | 'price-asc' | 'price-desc' | 'rating';
type ViewMode = 'grid' | 'list';

export default function SachNuocNgoai() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Lọc và tìm kiếm sách
  const filteredBooks = useMemo(() => {
    let filtered = allForeignBooks;

    // Tìm kiếm
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        book =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.description.toLowerCase().includes(query)
      );
    }

    // Lọc theo danh mục
    if (selectedCategory !== 'Tất cả') {
      filtered = filtered.filter(book => book.category === selectedCategory);
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  // Sắp xếp sách
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

  // Phân trang
  const totalPages = Math.ceil(sortedBooks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBooks = sortedBooks.slice(startIndex, endIndex);

  // Reset về trang 1 khi thay đổi filter
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    handleFilterChange();
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    handleFilterChange();
  };

  const handleSortChange = (value: SortOption) => {
    setSortOption(value);
    handleFilterChange();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb 
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Sách nước ngoài' }
        ]} 
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-3">🌍 Sách Nước Ngoài</h1>
          <p className="text-lg text-purple-100">
            Khám phá những tác phẩm kinh điển và bestseller từ khắp nơi trên thế giới
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
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-semibold"
              >
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>📚 {cat}</option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortOption}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm font-semibold"
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

        {/* Results Info & View Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <p className="text-gray-600 font-medium">
            Tìm thấy <span className="text-purple-600 font-bold">{sortedBooks.length}</span> sản phẩm
            {selectedCategory !== 'Tất cả' && (
              <span className="text-gray-500"> trong danh mục <span className="font-semibold">{selectedCategory}</span></span>
            )}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-purple-600 text-white'
                  : 'border-2 border-gray-300 hover:bg-gray-50'
              }`}
            >
              🔲 Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-purple-600 text-white'
                  : 'border-2 border-gray-300 hover:bg-gray-50'
              }`}
            >
              ☰ List
            </button>
          </div>
        </div>

        {/* Books Display */}
        {paginatedBooks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy sách</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? `Không có kết quả cho "${searchQuery}"` : 'Không có sách trong danh mục này'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Tất cả');
                setCurrentPage(1);
              }}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {paginatedBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {paginatedBooks.map((book) => (
                  <div key={book.id} className="bg-white rounded-xl shadow-sm p-6 flex gap-6 hover:shadow-lg transition-all">
                    <div className="aspect-[3/4] w-32 bg-gradient-to-br from-purple-50 to-indigo-100 rounded-lg overflow-hidden relative flex-shrink-0">
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      {book.discount && book.discount > 0 && (
                        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                          -{book.discount}%
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{book.title}</h3>
                      <p className="text-gray-600 mb-2">Tác giả: <span className="font-medium">{book.author}</span></p>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{book.description}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl font-bold text-red-600">
                              {book.price.toLocaleString('vi-VN')} ₫
                            </span>
                            {book.originalPrice && (
                              <span className="text-gray-400 text-sm line-through">
                                {book.originalPrice.toLocaleString('vi-VN')} ₫
                              </span>
                            )}
                          </div>
                          {book.rating && (
                            <div className="flex items-center gap-2">
                              <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                  <svg key={i} className={`w-4 h-4 ${i < Math.round(book.rating || 0) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                                  </svg>
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">({book.rating})</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={`/san-pham/${book.id}`}
                            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                          >
                            Xem chi tiết
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
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
                    // Hiển thị trang đầu, cuối, trang hiện tại và các trang xung quanh
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                            currentPage === page
                              ? 'text-white bg-purple-600 border-2 border-purple-600'
                              : 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2 text-gray-500">
                          ...
                        </span>
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
