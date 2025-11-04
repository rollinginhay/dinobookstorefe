'use client';

import Link from 'next/link';
import BookCard from '@/components/BookCard';
import { Book } from '@/components/BookCard';
import VoucherSection from '@/components/VoucherSection';

// Dữ liệu sách phong phú và đa dạng
const featuredBooks: Book[] = [
  {
    id: 1,
    title: "Đắc Nhân Tâm",
    author: "Dale Carnegie",
    price: 85000,
    image: "/images/dacnhantam.jpg",
    description: "Cuốn sách kinh điển về nghệ thuật giao tiếp và ứng xử",
    category: "Kỹ năng sống",
    publisher: "NXB Tổng hợp TP.HCM",
    year: 2023,
    pages: 320,
    language: "Tiếng Việt",
    sold: 8900,
    rating: 4.8,
    discount: 20,
    originalPrice: 106000,
    isTrending: true,
  },
  {
    id: 2,
    title: "Atomic Habits - Thói Quen Nguyên Tử",
    author: "James Clear",
    price: 110000,
    image: "/images/thoiquennguyentu.jpg",
    description: "Xây dựng thói quen tốt và phá vỡ thói quen xấu",
    category: "Phát triển bản thân",
    publisher: "NXB Lao động",
    year: 2023,
    pages: 320,
    language: "Tiếng Việt",
    sold: 5678,
    rating: 4.6,
    discount: 15,
    originalPrice: 129000,
    isTrending: true,
  },
  {
    id: 3,
    title: "Harry Potter và Hòn Đá Phù Thủy",
    author: "J.K. Rowling",
    price: 160000,
    image: "/images/harrypottervahondaphuthuy.jpg",
    description: "Phần đầu tiên của series Harry Potter",
    category: "Fantasy",
    publisher: "NXB Trẻ",
    year: 2022,
    pages: 450,
    language: "Tiếng Việt",
    sold: 12345,
    rating: 4.9,
    discount: 10,
    originalPrice: 178000,
    isTrending: true,
  },
  {
    id: 4,
    title: "Sapiens: Lược Sử Loài Người",
    author: "Yuval Noah Harari",
    price: 180000,
    image: "/images/sapiensluocsuloainguoi.jpg",
    description: "Khám phá lịch sử tiến hóa của loài người",
    category: "Lịch sử",
    publisher: "NXB Thế giới",
    year: 2023,
    pages: 450,
    language: "Tiếng Việt",
    sold: 4123,
    rating: 4.7,
    discount: 25,
    originalPrice: 240000,
    isTrending: false,
  },
  {
    id: 5,
    title: "7 Thói Quen Của Người Thành Đạt",
    author: "Stephen R. Covey",
    price: 160000,
    image: "/images/7thoiquencuanguoithanhdat.jpg",
    description: "Nguyên tắc vàng để thành công trong cuộc sống",
    category: "Kinh doanh",
    publisher: "NXB Tổng hợp TP.HCM",
    year: 2022,
    pages: 380,
    language: "Tiếng Việt",
    sold: 5123,
    rating: 4.6,
    discount: 20,
    originalPrice: 200000,
    isTrending: true,
  },
  {
    id: 6,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    price: 110000,
    image: "/images/thegreatgatsby.jpg",
    description: "Tiểu thuyết kinh điển về thời đại Jazz",
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
    id: 7,
    title: "Tôi Tài Giỏi, Bạn Cũng Thế",
    author: "Adam Khoo",
    price: 120000,
    image: "/images/toitaigioibancungthe.jpg",
    description: "Phương pháp học tập hiệu quả và phát triển tư duy",
    category: "Giáo dục",
    publisher: "NXB Trẻ",
    year: 2023,
    pages: 280,
    language: "Tiếng Việt",
    sold: 6789,
    rating: 4.7,
    discount: 25,
    originalPrice: 160000,
    isTrending: true,
  },
  {
    id: 8,
    title: "Nhà Giả Kim",
    author: "Paulo Coelho",
    price: 95000,
    image: "/images/nhagiakim.jpg",
    description: "Hành trình tìm kiếm ý nghĩa cuộc sống",
    category: "Văn học",
    publisher: "NXB Hội Nhà văn",
    year: 2022,
    pages: 200,
    language: "Tiếng Việt",
    sold: 9876,
    rating: 4.8,
    discount: 12,
    originalPrice: 108000,
    isTrending: true,
  },
];

const allBooks: Book[] = [
  ...featuredBooks,
  {
    id: 9,
    title: "Chainsaw Man - Tập 9",
    author: "Tatsuki Fujimoto",
    price: 35000,
    image: "/images/chainsawmantap9.jpg",
    description: "Manga hành động siêu nhiên nổi tiếng",
    category: "Manga",
    publisher: "NXB Trẻ",
    year: 2024,
    pages: 180,
    language: "Tiếng Việt",
    sold: 15432,
    rating: 4.9,
    discount: 10,
    originalPrice: 39000,
    isTrending: true,
  },
  {
    id: 10,
    title: "Lão Tử - Đạo Đức Kinh",
    author: "Nguyễn Hiến Lê",
    price: 75000,
    image: "/images/laotudaoduckinh.jpg",
    description: "Trí tuệ cổ xưa về đạo đức và triết học",
    category: "Triết học",
    publisher: "NXB Văn Học",
    year: 2022,
    pages: 220,
    language: "Tiếng Việt",
    sold: 2341,
    rating: 4.6,
    discount: 15,
    originalPrice: 88000,
    isTrending: false,
  },
  {
    id: 11,
    title: "One Piece - Tập 105",
    author: "Eiichiro Oda",
    price: 45000,
    image: "/images/onepiecetap105.jpg",
    description: "Hành trình của cậu bé Luffy",
    category: "Manga",
    publisher: "NXB Kim Đồng",
    year: 2024,
    pages: 200,
    language: "Tiếng Việt",
    sold: 28901,
    rating: 5.0,
    discount: 5,
    originalPrice: 47000,
    isTrending: true,
  },
  {
    id: 12,
    title: "Dune - Xứ Cát",
    author: "Frank Herbert",
    price: 195000,
    image: "/images/dune-samac.jpg",
    description: "Tiểu thuyết khoa học viễn tưởng kinh điển",
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
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner 11.11 */}
      <section className="relative bg-gradient-to-br from-red-700 via-red-800 to-red-900 overflow-hidden">
        {/* Animated stars */}
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

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            {/* Lightning bolt + 11.11 */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <svg className="w-20 h-20 md:w-28 md:h-28 text-yellow-400 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.3 1.046a1 1 0 011.414 0l2 2a1 1 0 01-.707 1.707h-4a1 1 0 01-.707-1.707zM15 9a1 1 0 100-2h-4l-4-4H2a1 1 0 00-1 1v6a1 1 0 001 1zM14 18h-4a1 1 0 01-1-1v-6a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1zM6 8H2a1 1 0 01-1-1V2a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1zM12 14l3 2v2h-3v-4z" />
              </svg>
              <h1 
                className="text-7xl md:text-9xl font-black tracking-tight text-white"
                style={{ textShadow: '0 0 30px rgba(255,255,255,0.6), 0 0 60px rgba(255,255,255,0.4)' }}
              >
                11.11
              </h1>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white" style={{ textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>
              NGÀY ĐÔI SALE VÔ LỖI
            </h2>
            
            <p className="text-xl md:text-2xl text-red-100 mb-8">
              Săn deal ngay - Ưu đãi hấp dẫn đến 50%
            </p>

            {/* Promotion Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-10">
              <div className="bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-2xl p-6 transform hover:scale-105 transition-all cursor-pointer">
                <div className="text-5xl mb-3">📚</div>
                <p className="text-2xl font-bold mb-2 text-white">Sách Đồng Giá 110K</p>
                <p className="text-red-100">Hàng ngàn đầu sách hot</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-2xl p-6 transform hover:scale-105 transition-all cursor-pointer">
                <div className="text-5xl mb-3">🎁</div>
                <p className="text-2xl font-bold mb-2 text-white">Giảm Đến 49%</p>
                <p className="text-red-100">Voucher độc quyền</p>
              </div>
            </div>

            <Link
              href="#products"
              className="inline-block bg-yellow-400 hover:bg-yellow-500 text-red-900 font-bold text-xl px-12 py-4 rounded-full transition-all transform hover:scale-105 shadow-2xl"
            >
              🛒 KHÁM PHÁ NGAY
            </Link>
          </div>
        </div>
      </section>

      {/* Voucher Section */}
      <VoucherSection />

      {/* Featured Books */}
      <section id="products" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-3">🔥 Sách Bán Chạy Nhất</h2>
              <div className="w-32 h-2 bg-gradient-to-r from-red-600 to-orange-500 rounded"></div>
            </div>
            <Link
              href="/sach-trong-nuoc"
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 group"
            >
              Xem tất cả
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {featuredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      </section>

      {/* Deal Schedule */}
      <section className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16 text-white" style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>
            🗓️ Lịch Săn Deal
          </h2>
          
          {/* Event Icons */}
          <div className="grid grid-cols-4 md:grid-cols-8 gap-6 mb-16">
            {[
              { icon: '11.11', label: 'SALE VÔ ĐỐI' },
              { icon: '⚡', label: 'FLASH SALE' },
              { icon: '🏷️', label: 'MÃ HOT' },
              { icon: '🚚', label: 'FREESHIP' },
              { icon: '🛒', label: 'BLACK FRIDAY' },
              { icon: '🔥', label: 'BÁN CHẠY' },
              { icon: '🎁', label: 'THƯƠNG HIỆU' },
              { icon: '📦', label: 'XẢ KHO' }
            ].map((event, idx) => (
              <div key={idx} className="text-center transform hover:scale-110 transition-all">
                <div className="w-20 h-20 md:w-24 md:h-24 mx-auto bg-white/20 backdrop-blur-lg rounded-2xl border-2 border-white/30 flex items-center justify-center mb-3 text-2xl md:text-3xl font-bold hover:bg-white/30">
                  {event.icon}
                </div>
                <p className="text-sm font-semibold text-white">{event.label}</p>
              </div>
            ))}
          </div>

          {/* Calendar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { date: '11.11', title: 'DEAL KHỦNG', subtitle: 'SALE NGÀY ĐÔI' },
              { date: '15.11', title: 'DEAL VÀNG', subtitle: 'SALE GIỮA THÁNG' },
              { date: '25.11', title: 'DEAL HOT', subtitle: 'SALE CUỐI THÁNG' },
              { date: '26.11', title: 'XẢ KHO', subtitle: 'VẠN DEAL SÁCH' },
              { date: 'THỨ 4', title: 'NGÀY VÀNG', subtitle: 'FREESHIP TẤT CẢ' }
            ].map((event, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-2xl p-6 text-center hover:bg-white/20 transition-all transform hover:-translate-y-2">
                <div className="text-5xl font-bold mb-3 text-white">{event.date}</div>
                <div className="text-lg font-bold text-white mb-1">{event.title}</div>
                <div className="text-sm text-red-100">{event.subtitle}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Products */}
      <section className="py-16 bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 relative">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="text-4xl">⭐</span>
              <h2 className="text-4xl font-bold text-green-800">
                Gợi Ý Cho Bạn
              </h2>
              <span className="text-4xl">⭐</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
              <div className="text-9xl">📖</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {allBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: '🚀', title: 'Giao hàng nhanh', desc: 'Toàn quốc' },
              { icon: '🔒', title: 'Thanh toán an toàn', desc: 'Đa dạng phương thức' },
              { icon: '↩️', title: 'Đổi trả dễ dàng', desc: '30 ngày miễn phí' },
              { icon: '💬', title: 'Hỗ trợ 24/7', desc: 'Luôn sẵn sàng' }
            ].map((feature, idx) => (
              <div key={idx} className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-all transform hover:-translate-y-2">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="font-bold text-lg mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
