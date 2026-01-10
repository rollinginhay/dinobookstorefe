"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BookCard, { Book } from "@/components/BookCard";
// import VoucherSection from "@/components/VoucherSection";
import { domesticBooks } from "@/data/books";
import { BookDetail } from "@/contexts/ReceiptContext";

const FALLBACK_IMAGE = "/images/dacnhantam.jpg";

// Lấy campaign giảm % đang hoạt động (áp cho toàn bộ sách trên web)
async function fetchActivePercentageCampaign(): Promise<{
  name: string | null;
  percentage: number;
  campaigns: any[];
}> {
  try {
    console.log("🔍 [Campaign] Đang fetch campaigns từ API...");
    const res = await fetch("http://localhost:8080/v1/activecampaigns");
    if (!res.ok) {
      console.error("❌ [Campaign] API error:", res.status);
      return { name: null, percentage: 0, campaigns: [] };
    }

    const json = await res.json();
    const campaigns = json.data || [];
    console.log("📊 [Campaign] Tổng số campaigns active:", campaigns.length);
    console.log("📋 [Campaign] Danh sách campaigns:", campaigns.map((c: any) => ({
      id: c.id,
      name: c.attributes?.name,
      type: c.attributes?.campaignType,
      percentage: c.attributes?.percentage,
      maxDiscount: c.attributes?.maxDiscount,
      enabled: c.attributes?.enabled,
      endDate: c.attributes?.endDate
    })));

    // Ưu tiên campaign dạng PERCENTAGE_DISCOUNT (giảm % toàn sàn)
    const percentageCampaign = campaigns.find(
      (c: any) =>
        c.attributes?.campaignType === "PERCENTAGE_DISCOUNT" &&
        typeof c.attributes?.percentage === "number" &&
        c.attributes.percentage > 0
    );

    if (!percentageCampaign) {
      console.log("⚠️ [Campaign] Không tìm thấy PERCENTAGE_DISCOUNT campaign");
      return { name: null, percentage: 0, campaigns };
    }

    console.log("✅ [Campaign] Tìm thấy campaign:", {
      name: percentageCampaign.attributes.name,
      percentage: percentageCampaign.attributes.percentage,
      maxDiscount: percentageCampaign.attributes.maxDiscount
    });

    return {
      name: percentageCampaign.attributes.name || null,
      percentage: percentageCampaign.attributes.percentage,
      campaigns,
    };
  } catch (e) {
    console.error("❌ [Campaign] Không thể tải campaign đang hoạt động:", e);
    return { name: null, percentage: 0, campaigns: [] };
  }
}

const mapToBookCard = (book: Partial<Book>): Book => ({
  id: Number(book.id),
  title: book.title || "Không có tên",
  author: book.author || "Không rõ tác giả",
  genreName: book.genreName || "Chưa phân loại",
  price: typeof book.price === "number" ? book.price : 0,
  image: book.image || FALLBACK_IMAGE,
  description: book.description || "",
  originalPrice:
    typeof book.originalPrice === "number" && book.originalPrice > 0
      ? book.originalPrice
      : typeof book.price === "number"
      ? book.price
      : 0,
  discount:
    typeof book.discount === "number"
      ? book.discount
      : book.originalPrice && book.price && book.originalPrice > book.price
      ? Math.round(
          ((book.originalPrice - book.price) / book.originalPrice) * 100
        )
      : 0,
  sold: typeof book.sold === "number" ? book.sold : 0,
  isTrending: Boolean(book.isTrending),
  badge: book.badge,

  // ⭐ Fix bắt buộc cho TS strict
  year: book.year ?? 0,
  language: book.language ?? "Không rõ",
  bookDetailId: 0,
  bookFormat: "",
});

const fallbackFeaturedBooks = domesticBooks
  .slice(0, 15)
  .map(mapToBookCard);

export default function Home() {
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaignPercentage, setCampaignPercentage] = useState<number>(0);
  const hasFeatured = featuredBooks.length > 0;
  const displayFeatured = hasFeatured ? featuredBooks : fallbackFeaturedBooks;

  // 🟢 Fetch TOÀN BỘ SÁCH
  async function fetchAllBooks(activePercentage: number, campaigns: any[] = []) {
    try {
      const res = await fetch(
        "http://localhost:8080/v1/books?e=true&page=0&limit=30"
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();

      const includedMap = new Map();
      json.included?.forEach((item: any) => {
        includedMap.set(`${item.type}-${item.id}`, item);
      });

      const books: Book[] =
        json.data?.map((item: any) => {
          const creatorIds =
            item.relationships?.creators?.data?.map((c: any) => c.id) || [];
          const authors =
            creatorIds
              .map(
                (id: string) =>
                  includedMap.get(`creator-${id}`)?.attributes?.name
              )
              .filter(Boolean)
              .join(", ") || "Không rõ tác giả";

          const genreIds =
            item.relationships?.genres?.data?.map((g: any) => g.id) || [];
          const genreName =
            genreIds
              .map(
                (id: string) => includedMap.get(`genre-${id}`)?.attributes?.name
              )
              .filter(Boolean)
              .join(", ") || "Chưa phân loại";

          const copyIds =
            item.relationships?.bookCopies?.data?.map((b: any) => b.id) || [];

          const firstCopy = includedMap.get(`bookDetail-${copyIds[0]}`) || {};
          const detailAttrs = firstCopy?.attributes || {};
          
          // ✅ Filter: Chỉ lấy sách có stock > 0 VÀ enabled = true
          const stock = detailAttrs.stock || 0;
          const enabled = detailAttrs.enabled !== false; // enabled mặc định là true nếu không có
          if (stock <= 0 || !enabled) {
            return null; // Skip sách hết hàng hoặc đã ngừng bán
          }
          
          // ⚠️ QUAN TRỌNG: 
          // - supplyPrice = Giá nhập (giá vốn) - KHÔNG dùng để tính discount
          // - salePrice = Giá bán ra (giá gốc để tính discount)
          const salePrice = detailAttrs.salePrice || detailAttrs.supplyPrice || 0;
          const bookDetailId = Number(copyIds[0]);
          
          // ✅ Tự tính giá giảm từ campaign đang active
          let discountPercent = null;
          let maxDiscount = null;
          
          // Tìm campaign PERCENTAGE_DISCOUNT (áp dụng cho tất cả sách)
          const percentageDiscountCampaign = campaigns.find(
            (c: any) =>
              c.attributes?.campaignType === "PERCENTAGE_DISCOUNT" &&
              typeof c.attributes?.percentage === "number" &&
              c.attributes.percentage > 0
          );
          
          if (percentageDiscountCampaign) {
            discountPercent = percentageDiscountCampaign.attributes.percentage;
            maxDiscount = percentageDiscountCampaign.attributes.maxDiscount || null;
            console.log(`💰 [Price] Sách "${item.attributes?.title}" - Campaign found:`, {
              name: percentageDiscountCampaign.attributes?.name,
              percentage: discountPercent,
              maxDiscount,
              salePrice,
              startDate: percentageDiscountCampaign.attributes?.startDate,
              endDate: percentageDiscountCampaign.attributes?.endDate
            });
          } else {
            console.log(`⚠️ [Price] Sách "${item.attributes?.title}" - KHÔNG TÌM THẤY PERCENTAGE_DISCOUNT campaign`);
            console.log(`📋 [Price] Available campaigns:`, campaigns.map((c: any) => ({
              name: c.attributes?.name,
              type: c.attributes?.campaignType,
              percentage: c.attributes?.percentage
            })));
          }
          
          // Tính giá sau giảm
          let finalPrice = salePrice;
          let originalPrice = null;
          let discount = 0;
          
          if (discountPercent && discountPercent > 0 && salePrice > 0) {
            // Tính số tiền giảm
            let discountedAmount = salePrice * (discountPercent / 100);
            console.log(`💰 [Price] Sách "${item.attributes?.title}" - Discounted amount (before max):`, discountedAmount);
            
            // Áp dụng maxDiscount nếu có
            if (maxDiscount && discountedAmount > maxDiscount) {
              discountedAmount = maxDiscount;
              console.log(`💰 [Price] Sách "${item.attributes?.title}" - Applied maxDiscount:`, maxDiscount);
            }
            
            finalPrice = Math.round(salePrice - discountedAmount);
            
            // Chỉ hiển thị discount nếu thực sự có giảm giá
            if (finalPrice < salePrice && finalPrice > 0) {
              originalPrice = salePrice;
              discount = discountPercent;
              console.log(`✅ [Price] Sách "${item.attributes?.title}" - CÓ GIẢM GIÁ:`, {
                originalPrice,
                finalPrice,
                discount: discount + "%"
              });
            } else {
              finalPrice = salePrice;
              console.log(`⚠️ [Price] Sách "${item.attributes?.title}" - KHÔNG CÓ GIẢM GIÁ (finalPrice >= salePrice hoặc <= 0)`, {
                finalPrice,
                salePrice
              });
            }
          } else {
            if (salePrice <= 0) {
              console.log(`⚠️ [Price] Sách "${item.attributes?.title}" - salePrice = 0 hoặc null`);
            } else {
              console.log(`ℹ️ [Price] Sách "${item.attributes?.title}" - Không có campaign PERCENTAGE_DISCOUNT`);
            }
          }

          return {
            id: item.id,
            title: item.attributes?.title || "Không có tên",
            author: authors,
            genreName,
            price: finalPrice, // Giá hiển thị (discountPrice nếu có, salePrice nếu không)
            originalPrice: originalPrice, // Giá gốc (salePrice nếu có discount, null nếu không)
            discount,
            image: item.attributes?.imageUrl,
            sold: stock, // Lưu stock vào sold để BookCombo check
            bookDetailId: Number(copyIds[0]) || 0,
            bookFormat: detailAttrs.bookFormat || "Khác",
            year: item.attributes?.year || 0,
            language: item.attributes?.language || "Không rõ",
          };
        })
        .filter((book: Book | null) => book !== null) || [];

      localStorage.setItem("allBookData", JSON.stringify(books));
      setAllBooks(books);
    } catch (err: any) {
      console.error("❌ Lỗi fetch all:", err);
      setAllBooks([]);
    }
  }

  // 🧠 Gọi cả 2 API cùng lúc
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        localStorage.removeItem("allBookData");
        const { percentage, campaigns } = await fetchActivePercentageCampaign();
        setCampaignPercentage(percentage || 0);
        await Promise.all([fetchAllBooks(percentage || 0, campaigns || [])]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 🟡 Hiển thị loading / error
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-lg text-gray-500">
        ⏳ Đang tải dữ liệu sách...
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-lg text-red-500">
        ⚠️ Lỗi tải dữ liệu: {error}
      </div>
    );

  // 🟢 UI CHÍNH
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🎆 Banner 11.11 */}
      <section className="relative bg-gradient-to-br from-red-700 via-red-800 to-red-900 overflow-hidden">
        {/* Hiệu ứng ngôi sao */}
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

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
          <h1 className="text-7xl md:text-9xl font-black text-white mb-6">
            15.1
          </h1>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            NGÀY ĐÔI SALE VÔ LỖI
          </h2>
          <p className="text-xl md:text-2xl text-red-100 mb-8">
            Săn deal ngay - Ưu đãi hấp dẫn đến 50%
          </p>

          <Link
            href="#featured"
            className="inline-block bg-yellow-400 hover:bg-yellow-500 text-red-900 font-bold text-xl px-12 py-4 rounded-full transition-all transform hover:scale-105 shadow-2xl"
          >
            🛒 KHÁM PHÁ NGAY
          </Link>
        </div>
      </section>

      {/* 🎁 Voucher Section */}
      {/* <VoucherSection /> */}

      {/* 🏆 Sách nổi bật */}
      <section id="featured" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-rose-50 border border-rose-100 rounded-3xl shadow-sm p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="text-4xl">🛍️</div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-rose-500">
                    Tủ sách
                  </p>
                  <h2 className="text-3xl font-bold text-slate-900">
                    Tủ Sách Nổi Bật
                  </h2>
                </div>
              </div>
              <Link
                href="/sach-trong-nuoc"
                className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2"
              >
                Xem tất cả
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {displayFeatured.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 📚 Tất cả sách */}
      <section className="py-16 bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-green-800">
              📚 Gợi Ý Cho Bạn
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {allBooks.length > 0 ? (
              allBooks.slice(0, 15).map((book) => <BookCard key={book.id} book={book} />)
            ) : (
              <p className="text-gray-500 text-center w-full">
                Không có dữ liệu sách.
              </p>
            )}
          </div>

          {allBooks.length > 15 && (
            <div className="text-center mt-12">
              <Link
                href="/tat-ca-san-pham"
                className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold text-lg px-8 py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg"
              >
                Xem thêm
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
