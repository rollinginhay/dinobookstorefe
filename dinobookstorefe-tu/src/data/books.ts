import { Book } from '@/components/BookCard';

// Sách trong nước
export const domesticBooks: Book[] = [
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
    id: 3,
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
  // Thêm các sách khác từ trang sách trong nước
];

// Sách nước ngoài  
export const foreignBooks: Book[] = [
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
  // Thêm các sách khác từ trang sách nước ngoài
];

// Tất cả sách
export const allBooks: Book[] = [...domesticBooks, ...foreignBooks];

// Hàm tìm sách theo ID
export function findBookById(id: number): Book | undefined {
  return allBooks.find(book => book.id === id);
}

// Hàm tìm sách liên quan
export function findRelatedBooks(category: string, excludeId: number, limit: number = 5): Book[] {
  return allBooks
    .filter(book => book.category === category && book.id !== excludeId)
    .slice(0, limit);
}

