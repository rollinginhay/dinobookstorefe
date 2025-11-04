'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Book } from '@/components/BookCard';
import { findBookById, findRelatedBooks } from '@/data/books';
import Breadcrumb from '@/components/Breadcrumb';
import PromotionBanner from '@/components/PromotionBanner';
import { useCart } from '@/contexts/CartContext';
import { useFavorite } from '@/contexts/FavoriteContext';
import Link from 'next/link';

// Dữ liệu được lấy từ nguồn tập trung `src/data/books.ts`

export default function ProductDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorite();
  const bookId = parseInt(params.id);
  const book = findBookById(bookId);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'reviews'>('description');

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy sản phẩm</h2>
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
    if (value < 1) return;
    if (value > 10) return;
    setQuantity(value);
  };

  const handleAddToCart = () => {
    addToCart(book, quantity);
  };

  const handleBuyNow = () => {
    addToCart(book, quantity);
    router.push('/thanh-toan');
  };

  const handleFavorite = () => {
    if (isFav) {
      removeFromFavorites(book.id);
    } else {
      addToFavorites(book);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Promotion Banner */}
      <PromotionBanner />
      
      {/* Breadcrumb */}
      <Breadcrumb 
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Sách', href: '/sach' },
          { label: book.category, href: `/the-loai/${book.category}` },
          { label: book.title }
        ]} 
      />

      {/* Product Detail Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Left: Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-[3/4] bg-gray-50 rounded-lg overflow-hidden relative group">
                <img src={book.image} alt={book.title} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute top-4 left-4 bg-red-500 text-white text-xl px-4 py-2 rounded-full font-bold">
                  -{discount}%
                </div>
              </div>
              
              {/* Thumbnail Images */}
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((idx) => (
                  <div key={idx} className="aspect-square rounded-lg cursor-pointer hover:ring-2 ring-blue-500 overflow-hidden">
                    <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Product Info */}
            <div className="space-y-6">
              {/* Title and Author */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
                <p className="text-xl text-gray-600">Tác giả: <span className="font-semibold text-blue-600">{book.author}</span></p>
              </div>

              {/* Rating and Reviews */}
              <div className="flex items-center gap-4 border-b pb-4">
                <div className="flex items-center">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                      </svg>
                    ))}
                  </div>
                  <span className="text-gray-700 ml-2 font-medium">4.5</span>
                </div>
                <span className="text-gray-500">|</span>
                <span className="text-blue-600 hover:underline cursor-pointer font-medium">
                  123 đánh giá
                </span>
                <span className="text-gray-500">|</span>
                <span className="text-gray-600">
                  Đã bán: <span className="font-medium text-orange-500">2,456</span>
                </span>
              </div>

              {/* Price */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-4xl font-bold text-red-600">
                      {book.price.toLocaleString('vi-VN')} ₫
                    </span>
                    <span className="text-gray-500 text-xl line-through ml-3">
                      {originalPrice.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                  <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    Giảm {discount}%
                  </div>
                </div>
              </div>

              {/* Product Details Grid */}
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="text-gray-600">NXB: <span className="font-medium">{book.publisher}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-600">Năm XB: <span className="font-medium">{book.year}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="text-gray-600">Số trang: <span className="font-medium">{book.pages}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  <span className="text-gray-600">Ngôn ngữ: <span className="font-medium">{book.language}</span></span>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-medium">Số lượng:</span>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="w-16 text-center border-x border-gray-300 py-2 focus:outline-none focus:ring-0"
                    min="1"
                    max="10"
                  />
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <span className="text-gray-500 text-sm">(Còn 50 sản phẩm)</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button 
                  onClick={handleAddToCart}
                  className="flex-1 bg-orange-500 text-white py-4 px-6 rounded-lg hover:bg-orange-600 transition-colors font-semibold text-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
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
                  className={`px-4 py-4 border rounded-lg transition-colors ${isFav ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:bg-gray-50'}`}
                >
                  <svg className={`w-5 h-5 ${isFav ? 'text-red-500' : 'text-gray-600'}`} fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              {/* Benefits */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-3">Ưu đãi đặc biệt:</h4>
                <ul className="space-y-2 text-sm text-green-700">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Miễn phí vận chuyển cho đơn hàng trên 299.000₫
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Đổi trả miễn phí trong 30 ngày
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Thanh toán linh hoạt, đảm bảo an toàn
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="border-t">
            {/* Tab Navigation */}
            <div className="flex border-b">
              {[
                { id: 'description', label: 'Mô tả sản phẩm' },
                { id: 'details', label: 'Thông tin chi tiết' },
                { id: 'reviews', label: 'Đánh giá (123)' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-8 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {activeTab === 'description' && (
                <div className="prose max-w-none">
                  <p className="text-gray-700 text-lg leading-relaxed mb-6">{book.description}</p>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900">Giới thiệu về cuốn sách</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Đây là một cuốn sách đặc biệt với nội dung phong phú và giá trị văn học cao. 
                      Cuốn sách mang đến cho độc giả những trải nghiệm độc đáo và ý nghĩa sâu sắc 
                      về cuộc sống, tình yêu và những giá trị nhân văn cao đẹp.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      Tác giả đã dành nhiều tâm huyết để xây dựng nên một câu chuyện hấp dẫn với 
                      những tình tiết gay cấn, những nhân vật đầy tính cách và những bài học sâu sắc. 
                      Cuốn sách không chỉ là một tác phẩm văn học mà còn là một hành trình khám phá 
                      bản thân và thế giới xung quanh.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'details' && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Tên sách:</span>
                      <span className="font-medium">{book.title}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Tác giả:</span>
                      <span className="font-medium">{book.author}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Nhà xuất bản:</span>
                      <span className="font-medium">{book.publisher}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Năm xuất bản:</span>
                      <span className="font-medium">{book.year}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Số trang:</span>
                      <span className="font-medium">{book.pages}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Ngôn ngữ:</span>
                      <span className="font-medium">{book.language}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Thể loại:</span>
                      <span className="font-medium">{book.category}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Bìa:</span>
                      <span className="font-medium">Bìa cứng</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {/* Review Summary */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-blue-600">4.5</div>
                        <div className="flex text-yellow-400 mt-2">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                            </svg>
                          ))}
                        </div>
                        <div className="text-gray-600 text-sm mt-2">Dựa trên 123 đánh giá</div>
                      </div>
                      <div className="flex-1 space-y-2">
                        {[5, 4, 3, 2, 1].map((stars) => (
                          <div key={stars} className="flex items-center gap-2">
                            <span className="w-8 text-sm text-gray-600">{stars} sao</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-yellow-400 h-2 rounded-full" 
                                style={{ width: `${stars === 5 ? 60 : stars === 4 ? 25 : stars === 3 ? 10 : 5}%` }}
                              ></div>
                            </div>
                            <span className="w-8 text-sm text-gray-600 text-right">
                              {stars === 5 ? 74 : stars === 4 ? 30 : stars === 3 ? 12 : 5}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Individual Reviews */}
                  {[
                    { username: 'Nguyễn Văn A', rating: 5, date: '2 ngày trước', comment: 'Cuốn sách rất hay, nội dung sâu sắc và đáng đọc. Tôi rất hài lòng với chất lượng sách.' },
                    { username: 'Trần Thị B', rating: 5, date: '5 ngày trước', comment: 'Tuyệt vời! Sách đúng như mô tả, giao hàng nhanh, bao bì cẩn thận. Sẽ mua thêm.' },
                    { username: 'Lê Văn C', rating: 4, date: '1 tuần trước', comment: 'Nội dung hay nhưng bìa sách hơi mỏng. Nhìn chung là hài lòng.' }
                  ].map((review, idx) => (
                    <div key={idx} className="border-b pb-6">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold text-gray-900">{review.username}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                                </svg>
                              ))}
                            </div>
                            <span className="text-gray-500 text-sm">{review.date}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 mt-3">{review.comment}</p>
                    </div>
                  ))}

                  <button className="w-full py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                    Xem thêm đánh giá
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Sản phẩm liên quan</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {findRelatedBooks(book.category, bookId, 5).map((relatedBook) => (
            <Link key={relatedBook.id} href={`/san-pham/${relatedBook.id}`}>
              <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100">
                <div className="aspect-[3/4] relative group overflow-hidden">
                  <img src={relatedBook.image} alt={relatedBook.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2 text-gray-800 hover:text-blue-600">
                    {relatedBook.title}
                  </h3>
                  <p className="text-gray-600 text-xs mb-2">{relatedBook.author}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-red-600 font-bold text-base">
                      {relatedBook.price.toLocaleString('vi-VN')} ₫
                    </span>
                    <button className="px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600">
                      Mua
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

