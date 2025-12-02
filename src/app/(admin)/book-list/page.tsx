"use client";

import {useEffect, useMemo, useState} from "react";
import Link from "next/link";

type BookStatus = "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";

type Book = {
  id: number;
  code: string;
  title: string;
  author: string;
  category: string;
  price: number;
  stock: number;
  status: BookStatus;
  createdAt: string; // ISO string
  cover: string;
};

// ==============================
// DEMO DATA (sau này thay bằng API)
// ==============================
const demoBooks: Book[] = [
  {
    id: 1,
    code: "BK0001",
    title: "Dám Bị Ghét",
    author: "Koga Fumitake",
    category: "Kỹ năng sống",
    price: 98000,
    stock: 12,
    status: "ACTIVE",
    createdAt: "2025-02-01T10:00:00",
    cover:
      "https://salt.tikicdn.com/cache/750x750/ts/product/6b/11/d0/8e0c17a1f3596f91b202b4c5c1fa3f8d.jpg",
  },
  {
    id: 2,
    code: "BK0002",
    title: "Nhà Giả Kim",
    author: "Paulo Coelho",
    category: "Văn học",
    price: 120000,
    stock: 0,
    status: "OUT_OF_STOCK",
    createdAt: "2025-01-15T09:30:00",
    cover:
      "https://salt.tikicdn.com/cache/750x750/ts/product/bb/d5/21/8adf0e1b3f4a80d531c1d912c9b50da4.jpg",
  },
  {
    id: 3,
    code: "BK0003",
    title: "Tâm Lý Học Tội Phạm",
    author: "Stanton E. Samenow",
    category: "Kinh doanh",
    price: 189000,
    stock: 5,
    status: "ACTIVE",
    createdAt: "2025-02-20T14:10:00",
    cover:
      "https://salt.tikicdn.com/cache/750x750/ts/product/1d/bd/0f/7f05a7f65852dcf0d6245bf86de1c7c8.jpg",
  },
  {
    id: 4,
    code: "BK0004",
    title: "One Piece Tập 100",
    author: "Eiichiro Oda",
    category: "Manga / Comic",
    price: 28000,
    stock: 40,
    status: "ACTIVE",
    createdAt: "2025-02-25T08:45:00",
    cover:
      "https://salt.tikicdn.com/cache/750x750/media/catalog/product/o/n/one-piece-tap-100.jpg",
  },
  {
    id: 5,
    code: "BK0005",
    title: "Giải Tích 1",
    author: "Nhiều tác giả",
    category: "Giáo trình",
    price: 150000,
    stock: 3,
    status: "INACTIVE",
    createdAt: "2024-12-20T16:00:00",
    cover:
      "https://salt.tikicdn.com/cache/750x750/ts/product/7b/13/7c/0d4c2ab44fcbb40f19a1e0122972a97f.jpg",
  },
];

export default function BookListPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [priceRange, setPriceRange] = useState("");

  useEffect(() => {
    // TODO: sau này thay bằng fetch API /v1/books
    setBooks(demoBooks);
  }, []);

  // Lấy danh sách category duy nhất
  const categories = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => set.add(b.category));
    return Array.from(set);
  }, [books]);

  // Lọc theo khoảng giá
  const inPriceRange = (book: Book) => {
    if (!priceRange) return true;
    const p = book.price;

    switch (priceRange) {
      case "0-50000":
        return p <= 50000;
      case "50000-100000":
        return p > 50000 && p <= 100000;
      case "100000-200000":
        return p > 100000 && p <= 200000;
      case "200000+":
        return p > 200000;
      default:
        return true;
    }
  };

  // Danh sách sau khi filter
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchSearch =
        !searchText ||
        b.title.toLowerCase().includes(searchText.toLowerCase()) ||
        b.code.toLowerCase().includes(searchText.toLowerCase()) ||
        b.author.toLowerCase().includes(searchText.toLowerCase());

      const matchCategory = !filterCategory || b.category === filterCategory;
      const matchStatus = !filterStatus || b.status === filterStatus;
      const matchPrice = inPriceRange(b);

      return matchSearch && matchCategory && matchStatus && matchPrice;
    });
  }, [books, searchText, filterCategory, filterStatus, priceRange]);

  const renderStatusBadge = (status: BookStatus) => {
    if (status === "ACTIVE") {
      return (
        <span className="badge bg-emerald-50 text-emerald-600">
          Đang bán
        </span>
      );
    }

    if (status === "OUT_OF_STOCK") {
      return (
        <span className="badge bg-red-50 text-red-600">
          Hết hàng
        </span>
      );
    }

    return (
      <span className="badge bg-gray-100 text-gray-600">
        Ngừng bán
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER + BUTTON */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="section-title">Danh sách sách</h1>

        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            Xuất Excel
          </button>

          <Link href="/add-product" className="btn btn-primary">
            + Thêm sách
          </Link>
        </div>
      </div>

      {/* FILTER CARD */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Tìm kiếm */}
          <div>
            <label className="form-label">Tìm kiếm</label>
            <input
              className="input"
              placeholder="Tên sách / mã sách / tác giả"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          {/* Thể loại */}
          <div>
            <label className="form-label">Thể loại</label>
            <select
              className="select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">Tất cả</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Trạng thái */}
          <div>
            <label className="form-label">Trạng thái</label>
            <select
              className="select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="ACTIVE">Đang bán</option>
              <option value="OUT_OF_STOCK">Hết hàng</option>
              <option value="INACTIVE">Ngừng bán</option>
            </select>
          </div>

          {/* Giá */}
          <div>
            <label className="form-label">Khoảng giá</label>
            <select
              className="select"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="0-50000">0 - 50.000đ</option>
              <option value="50000-100000">50.000 - 100.000đ</option>
              <option value="100000-200000">100.000 - 200.000đ</option>
              <option value="200000+">&gt; 200.000đ</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            Tổng: <span className="font-semibold">{filteredBooks.length}</span> sách
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="table min-w-[960px]">
            <thead>
              <tr>
                <th className="w-[60px]">STT</th>
                <th className="w-[80px]">Ảnh</th>
                <th className="w-[260px]">Tên sách</th>
                <th className="w-[180px]">Tác giả</th>
                <th className="w-[160px]">Thể loại</th>
                <th className="w-[120px] text-right">Giá bán</th>
                <th className="w-[90px] text-center">Tồn kho</th>
                <th className="w-[130px] text-center">Trạng thái</th>
                <th className="w-[160px]">Ngày tạo</th>
                <th className="w-[120px] text-center">Hành động</th>
              </tr>
            </thead>

            <tbody>
              {filteredBooks.map((book, index) => (
                <tr key={book.id}>
                  <td>{index + 1}</td>

                  <td>
                    <div className="w-12 h-16 rounded overflow-hidden bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>

                  <td>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {book.title}
                      </span>
                      <span className="text-xs text-gray-500">
                        Mã: {book.code}
                      </span>
                    </div>
                  </td>

                  <td>{book.author}</td>

                  <td>{book.category}</td>

                  <td className="text-right font-semibold text-blue-600">
                    {book.price.toLocaleString("vi-VN")} đ
                  </td>

                  <td className="text-center">
                    {book.stock > 0 ? (
                      <span>{book.stock}</span>
                    ) : (
                      <span className="text-red-500 font-medium">0</span>
                    )}
                  </td>

                  <td className="text-center">{renderStatusBadge(book.status)}</td>

                  <td>
                    {new Date(book.createdAt).toLocaleString("vi-VN")}
                  </td>

                  <td>
                    <div className="flex items-center justify-center gap-3 text-sm">
                      <Link
                        href={`/edit-product/${book.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        Sửa
                      </Link>
                      <button
                        className="text-red-500 hover:underline"
                        onClick={() => {
                          // TODO: confirm + call API xóa
                          if (
                            window.confirm(
                              `Bạn chắc chắn muốn xóa sách "${book.title}"?`
                            )
                          ) {
                            setBooks((prev) =>
                              prev.filter((b) => b.id !== book.id)
                            );
                          }
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredBooks.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-gray-500">
                    Không có sách nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
