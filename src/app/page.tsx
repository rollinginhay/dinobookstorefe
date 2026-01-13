"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import BookCard, { Book } from "@/components/BookCard";
// import VoucherSection from "@/components/VoucherSection";
import { domesticBooks } from "@/data/books";
import { BookDetail } from "@/contexts/ReceiptContext";
import { useCampaign } from "@/contexts/CampaignContext";

const FALLBACK_IMAGE = "/images/dacnhantam.jpg";

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
  discount: 0,
  sold: typeof book.sold === "number" ? book.sold : 0,
  isTrending: Boolean(book.isTrending),
  badge: book.badge,

  // ⭐ Fix bắt buộc cho TS strict
  year: book.year ?? 0,
  language: book.language ?? "Không rõ",
  bookDetailId: 0,
  bookFormat: "",
});

const fallbackFeaturedBooks = domesticBooks.slice(0, 15).map(mapToBookCard);

// Lấy campaign giảm % đang hoạt động (áp cho toàn bộ sách trên web)
// ✅ Đã xóa fetchActivePercentageCampaign và calculatePriceFromCampaign
// ✅ Giờ dùng useCampaign() từ CampaignContext để lấy campaigns

export default function Home() {
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDiscountCampaign, setOrderDiscountCampaign] = useState<{
    name: string;
    percentage: number;
    minTotal: number;
    maxDiscount: number;
    startDate?: string | Date;
    endDate?: string | Date;
  } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const itemWidthRef = useRef<number>(244); // Width của 1 item + gap
  const {
    calculatePrice,
    campaigns,
    loading: campaignsLoading,
  } = useCampaign(); // ✅ Để check discount từ campaign (PERCENTAGE_PRODUCT)
  const hasFeatured = featuredBooks.length > 0;
  // ✅ Chỉ lấy 10 cuốn cho sách nổi bật
  const displayFeatured = (
    hasFeatured ? featuredBooks : fallbackFeaturedBooks
  ).slice(0, 10);

  // 🔄 Tạo infinite loop: duplicate items ở đầu và cuối
  const loopedBooks =
    displayFeatured.length > 0
      ? [...displayFeatured, ...displayFeatured, ...displayFeatured]
      : [];

  // 🎠 Hàm scroll mượt với smooth animation
  const smoothScroll = (
    element: HTMLElement,
    target: number,
    duration: number = 600
  ) => {
    const start = element.scrollLeft;
    const change = target - start;
    const startTime = performance.now();

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-in-out cubic)
      const ease =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      element.scrollLeft = start + change * ease;

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  // 🎠 Hàm scroll carousel (scroll mượt 1-2 cuốn với infinite loop)
  const scrollCarousel = (direction: "left" | "right") => {
    if (!scrollContainerRef.current || displayFeatured.length === 0) return;
    const container = scrollContainerRef.current;
    const scrollAmount = 354;
    const itemWidth = itemWidthRef.current;
    const segmentWidth = displayFeatured.length * itemWidth;
    const currentScroll = container.scrollLeft;

    let newScrollLeft =
      direction === "left"
        ? currentScroll - scrollAmount
        : currentScroll + scrollAmount;

    // Xử lý infinite loop
    if (direction === "right" && newScrollLeft >= segmentWidth * 2) {
      const offset = newScrollLeft - segmentWidth * 2;
      container.scrollLeft = segmentWidth + offset;
      newScrollLeft = container.scrollLeft + scrollAmount;
    } else if (direction === "left" && newScrollLeft < segmentWidth) {
      const offset = segmentWidth - newScrollLeft;
      container.scrollLeft = segmentWidth * 2 - offset;
      newScrollLeft = container.scrollLeft - scrollAmount;
    }

    smoothScroll(container, newScrollLeft, 600);
  };

  // ⏰ Hàm tự động scroll sang phải (infinite loop)
  const autoScrollRight = () => {
    if (!scrollContainerRef.current || displayFeatured.length === 0) return;

    const container = scrollContainerRef.current;
    const scrollAmount = 354; // Scroll 1.5 items
    const itemWidth = itemWidthRef.current;
    const segmentWidth = displayFeatured.length * itemWidth; // Width của 1 set items gốc
    const currentScroll = container.scrollLeft;

    let targetScroll = currentScroll + scrollAmount;

    // Nếu scroll đến cuối segment thứ 2, reset về đầu segment thứ 2 (infinite loop)
    if (targetScroll >= segmentWidth * 2) {
      // Reset về vị trí tương ứng ở segment đầu (seamless loop)
      const offset = targetScroll - segmentWidth * 2;
      container.scrollLeft = segmentWidth + offset;
      targetScroll = container.scrollLeft + scrollAmount;
    }

    // Scroll sang phải mượt
    smoothScroll(container, targetScroll, 600);
  };

  // ⏰ Bắt đầu auto-scroll
  const startAutoScroll = () => {
    // Clear interval cũ nếu có
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
    }

    if (displayFeatured.length === 0) return;

    // Tạo interval mới - tự động scroll sang phải mỗi 3 giây
    autoScrollIntervalRef.current = setInterval(() => {
      autoScrollRight();
    }, 3000); // 3 giây
  };

  // ⏸️ Dừng auto-scroll
  const stopAutoScroll = () => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  };

  // 🎯 Khởi tạo scroll position ở segment giữa (segment thứ 2)
  useEffect(() => {
    if (scrollContainerRef.current && displayFeatured.length > 0) {
      const container = scrollContainerRef.current;
      const itemWidth = itemWidthRef.current;
      const segmentWidth = displayFeatured.length * itemWidth;

      // Scroll đến segment giữa (segment thứ 2) để có thể scroll cả 2 hướng
      container.scrollLeft = segmentWidth;
    }
  }, [displayFeatured.length]);

  // ⏰ Auto-scroll carousel mỗi 3 giây
  useEffect(() => {
    startAutoScroll();

    // Cleanup: Clear interval khi component unmount hoặc displayFeatured thay đổi
    return () => {
      stopAutoScroll();
    };
  }, [displayFeatured.length]);

  // 🔀 Hàm shuffle mảng (Fisher-Yates)
  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // 🟢 Fetch TOÀN BỘ SÁCH
  async function fetchAllBooks(
    campaigns: Array<{
      id?: string | number;
      attributes?: {
        campaignType?: string;
        percentage?: number;
        minTotal?: number;
        maxDiscount?: number;
        name?: string;
        startDate?: string | Date;
        endDate?: string | Date;
      };
    }> = []
  ) {
    try {
      // ✅ Tăng limit lên 100 để có nhiều sách hơn cho việc filter sách có giảm giá
      const res = await fetch(
        "http://localhost:8080/v1/books?e=true&page=0&limit=100"
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();

      const includedMap = new Map();
      json.included?.forEach((item: any) => {
        includedMap.set(`${item.type}-${item.id}`, item);
      });

      const books: Book[] =
        json.data
          ?.map((item: any) => {
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
                  (id: string) =>
                    includedMap.get(`genre-${id}`)?.attributes?.name
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

            // ✅ LẤY SUPPLY_PRICE LÀM GIÁ GỐC (KHÔNG BAO GIỜ dùng salePrice)
            const supplyPrice = detailAttrs.supplyPrice || 0;
            const bookDetailId = Number(copyIds[0]);

            // ✅ CHỈ tính giá đã giảm từ campaign PERCENTAGE_PRODUCT (giảm theo sản phẩm cụ thể)
            // ✅ KHÔNG tính PERCENTAGE_RECEIPT ở đây (sẽ tính khi tính tổng tiền đơn hàng)
            const productCampaignInfo = calculatePrice(
              bookDetailId,
              supplyPrice
            );
            const discountedPrice = productCampaignInfo.hasDiscount
              ? productCampaignInfo.discountedPrice
              : supplyPrice;
            const hasDiscount = productCampaignInfo.hasDiscount;
            const discountAmount = hasDiscount
              ? supplyPrice - discountedPrice
              : 0;
            const discount = hasDiscount
              ? Math.round((discountAmount / supplyPrice) * 100)
              : 0;

            return {
              id: item.id,
              title: item.attributes?.title || "Không có tên",
              author: authors,
              genreName,
              price: discountedPrice, // ✅ Giá đã giảm (từ campaign PERCENTAGE_PRODUCT hoặc supplyPrice)
              originalPrice: hasDiscount ? supplyPrice : undefined, // ✅ Chỉ set originalPrice nếu có giảm giá
              discount: discount,
              image: item.attributes?.imageUrl,
              sold: stock,
              bookDetailId: Number(copyIds[0]) || 0,
              bookFormat: detailAttrs.bookFormat || "Khác",
              year: item.attributes?.year || 0,
              language: item.attributes?.language || "Không rõ",
            };
          })
          .filter((book: Book | null) => book !== null) || [];

      localStorage.setItem("allBookData", JSON.stringify(books));
      setAllBooks(books);

      // 🎲 Lấy sách nổi bật: CHỈ lấy sách có discount (từ campaign) - giống code gốc
      if (books.length > 0) {
        // ✅ Phân loại: CHỈ lấy sách có discount
        const booksWithDiscount: Book[] = [];

        books.forEach((book: Book) => {
          // ✅ Check discount từ campaign: chỉ dùng book.originalPrice và book.price
          // Nếu có originalPrice và originalPrice > price → có discount
          const hasCampaignDiscount = !!(
            book.originalPrice && book.originalPrice > book.price
          );

          // Nếu có discount từ campaign
          if (hasCampaignDiscount) {
            booksWithDiscount.push(book);
          }
        });

        const featured: Book[] = [];

        // ✅ Nếu có >= 10 cuốn có discount → random lấy 10 cuốn
        if (booksWithDiscount.length >= 10) {
          const shuffledWithDiscount = shuffleArray(booksWithDiscount);
          featured.push(...shuffledWithDiscount.slice(0, 10));
        } else if (booksWithDiscount.length > 0) {
          // Nếu có < 10 cuốn có discount → lấy TẤT CẢ sách có discount
          featured.push(...booksWithDiscount);
        }
        // ✅ KHÔNG lấy sách không có discount nữa

        console.log(
          `✅ [Featured] Tìm thấy ${booksWithDiscount.length} sách có giảm giá, hiển thị ${featured.length} cuốn`
        );
        setFeaturedBooks(featured);
      } else {
        setFeaturedBooks([]);
      }
    } catch (err: any) {
      console.error("❌ Lỗi fetch all:", err);
      setAllBooks([]);
    }
  }

  // 🎯 Fetch campaign giảm giá theo đơn hàng (PERCENTAGE_RECEIPT hoặc PERCENTAGE_DISCOUNT)
  useEffect(() => {
    async function fetchOrderDiscountCampaign() {
      try {
        // ✅ Dùng /v1/activecampaigns để lấy campaigns đã được filter theo thời gian
        const res = await fetch("http://localhost:8080/v1/activecampaigns");
        if (!res.ok) {
          console.log("❌ [Banner] Campaign API không OK:", res.status);
          setOrderDiscountCampaign(null); // ✅ Clear nếu API lỗi
          return;
        }

        const data = await res.json();
        const rawCampaigns = data.data || [];
        console.log("📋 [Banner] Total active campaigns:", rawCampaigns.length);
        const now = new Date();

        // Tìm campaign PERCENTAGE_RECEIPT hoặc PERCENTAGE_DISCOUNT đang active
        const orderCampaign = rawCampaigns.find((c: any) => {
          const attrs = c.attributes || c;
          const campaignType = attrs.campaignType || c.campaignType;
          const startDate = attrs.startDate || c.startDate;
          const endDate = attrs.endDate || c.endDate;

          console.log("🔍 [Banner] Checking campaign:", {
            id: c.id,
            type: campaignType,
            name: attrs.name || c.name,
          });

          // Check type - PERCENTAGE_RECEIPT hoặc PERCENTAGE_DISCOUNT (giảm theo đơn)
          if (
            campaignType !== "PERCENTAGE_RECEIPT" &&
            campaignType !== "PERCENTAGE_DISCOUNT"
          ) {
            return false;
          }

          // ✅ Check date range (double check trên frontend)
          if (startDate && endDate) {
            try {
              const start = new Date(startDate);
              const end = new Date(endDate);
              end.setHours(23, 59, 59, 999);
              if (now < start || now > end) {
                console.log("⏰ [Banner] Campaign ngoài thời gian:", {
                  start,
                  end,
                  now,
                });
                return false;
              }
            } catch (e) {
              console.error("❌ [Banner] Lỗi parse date:", e);
              return false;
            }
          } else {
            // ✅ Nếu không có startDate hoặc endDate, skip (cần có date range)
            console.log("⚠️ [Banner] Campaign không có startDate/endDate");
            return false;
          }

          return true;
        });

        if (orderCampaign) {
          const attrs = orderCampaign.attributes || orderCampaign;
          const campaignData = {
            name: attrs.name || orderCampaign.name || "Ưu đãi",
            percentage: attrs.percentage || orderCampaign.percentage || 0,
            minTotal: attrs.minTotal || orderCampaign.minTotal || 0,
            maxDiscount: attrs.maxDiscount || orderCampaign.maxDiscount || 0,
            startDate: attrs.startDate || orderCampaign.startDate,
            endDate: attrs.endDate || orderCampaign.endDate,
          };
          console.log(
            "✅ [Banner] Found order discount campaign:",
            campaignData
          );
          setOrderDiscountCampaign(campaignData);
        } else {
          console.log(
            "⚠️ [Banner] Không tìm thấy campaign PERCENTAGE_RECEIPT/PERCENTAGE_DISCOUNT active"
          );
          setOrderDiscountCampaign(null); // ✅ Clear nếu không tìm thấy
        }
      } catch (err) {
        console.error("❌ [Banner] Lỗi fetch order discount campaign:", err);
        setOrderDiscountCampaign(null); // ✅ Clear nếu có lỗi
      }
    }

    fetchOrderDiscountCampaign();

    // ✅ Re-fetch mỗi phút để update khi campaigns hết hạn
    const interval = setInterval(() => {
      fetchOrderDiscountCampaign();
    }, 60000); // 60 giây

    return () => clearInterval(interval);
  }, []);

  // 🧠 Gọi API - Đợi campaigns load xong trước khi tính giá
  useEffect(() => {
    async function loadData() {
      // ✅ Đợi campaigns load xong trước khi fetch books và tính giá
      if (campaignsLoading) {
        console.log("⏳ [Homepage] Đang đợi campaigns load...");
        return;
      }

      try {
        setLoading(true);
        localStorage.removeItem("allBookData");
        await fetchAllBooks();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [campaignsLoading, calculatePrice]); // ✅ Re-run khi campaignsLoading hoặc calculatePrice thay đổi

  // ✅ Tự động cập nhật khi window focus hoặc tab trở nên visible
  useEffect(() => {
    const handleFocus = () => {
      if (!campaignsLoading) {
        fetchAllBooks();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && !campaignsLoading) {
        fetchAllBooks();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [campaignsLoading]);

  // ✅ Polling: Tự động refresh mỗi 30 giây để cập nhật danh sách sách và giá
  useEffect(() => {
    const interval = setInterval(() => {
      if (!campaignsLoading) {
        fetchAllBooks();
      }
    }, 30000); // Refresh mỗi 30 giây

    return () => clearInterval(interval);
  }, [campaignsLoading]);

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
            SIÊU SALE ĐẦU NĂM
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

      {/* 🏆 Sách nổi bật - Chỉ hiển thị khi có sách giảm giá */}
      {displayFeatured.length > 0 && hasFeatured && (
        <section id="featured" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-rose-50 border border-rose-100 rounded-3xl shadow-sm p-8">
              {/* ✅ Header không có "Xem tất cả" */}
              <div className="flex items-center gap-4 mb-6">
                <div className="text-4xl">🛍️</div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-rose-500">
                    Đề xuất
                  </p>
                  <h2 className="text-3xl font-bold text-slate-900">
                    Tủ Sách Nổi Bật
                  </h2>
                </div>
              </div>

              {/* 🎠 Carousel với nút điều hướng */}
              <div
                className="relative"
                onMouseEnter={stopAutoScroll}
                onMouseLeave={startAutoScroll}
              >
                {/* Gradient fade trái */}
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-rose-50 to-transparent z-10 pointer-events-none" />

                {/* Gradient fade phải */}
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-rose-50 to-transparent z-10 pointer-events-none" />

                {/* Nút điều hướng trái */}
                <button
                  onClick={() => scrollCarousel("left")}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/95 backdrop-blur-sm rounded-full p-3 shadow-xl hover:bg-white hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:scale-110 group"
                  aria-label="Scroll left"
                >
                  <svg
                    className="w-6 h-6 text-gray-700 group-hover:text-rose-600 transition-colors duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                {/* Container scroll ngang - Infinite loop */}
                <div
                  ref={scrollContainerRef}
                  className="flex gap-6 overflow-x-auto pb-4 px-14 hide-scrollbar"
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    scrollBehavior: "auto", // Dùng custom smooth scroll
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {loopedBooks.map((book, index) => (
                    <div
                      key={`${book.id}-${index}`}
                      className="flex-shrink-0 w-[200px] sm:w-[220px] transform transition-all duration-300 hover:scale-105 hover:z-10"
                    >
                      <BookCard book={book} />
                    </div>
                  ))}
                </div>

                {/* Nút điều hướng phải */}
                <button
                  onClick={() => scrollCarousel("right")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/95 backdrop-blur-sm rounded-full p-3 shadow-xl hover:bg-white hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:scale-110 group"
                  aria-label="Scroll right"
                >
                  <svg
                    className="w-6 h-6 text-gray-700 group-hover:text-rose-600 transition-colors duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 🎉 Banner ưu đãi giảm giá theo đơn hàng */}
      {orderDiscountCampaign && (
        <section className="pt-2 pb-6 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden bg-gradient-to-br from-red-700 via-red-800 to-red-900 rounded-2xl shadow-2xl">
              {/* Background pattern - sao */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(25)].map((_, i) => (
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
                    <span className="text-white text-xl opacity-50">✦</span>
                  </div>
                ))}
              </div>

              <div className="relative z-10 flex items-center justify-between px-6 md:px-8 lg:px-10 py-6 md:py-7">
                {/* Bên trái: Tên ưu đãi và thông tin */}
                <div className="flex items-center gap-5 md:gap-6 flex-1 min-w-0">
                  {/* Tên ưu đãi - lớn hơn */}
                  <div className="flex-shrink-0">
                    <h3 className="text-2xl md:text-4xl font-black text-white leading-tight whitespace-nowrap">
                      {orderDiscountCampaign.name}
                    </h3>
                  </div>

                  {/* Thông tin giảm giá */}
                  <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                    {/* Badge "GIẢM" - giảm kích thước */}
                    <div className="relative bg-yellow-400 px-4 md:px-5 py-2 md:py-2.5 rounded-xl shadow-lg flex-shrink-0">
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full opacity-80"></div>
                      <div className="relative">
                        <div className="text-red-800 font-black text-xs md:text-sm mb-0.5 leading-none">
                          GIẢM
                        </div>
                        <div className="text-red-900 font-black text-base md:text-xl leading-none">
                          -{orderDiscountCampaign.percentage}%
                        </div>
                      </div>
                    </div>

                    {/* Điều kiện */}
                    <div className="flex flex-col gap-1 min-w-0">
                      {orderDiscountCampaign.maxDiscount > 0 && (
                        <span className="text-white font-semibold text-xs md:text-sm leading-tight">
                          Tối đa{" "}
                          {orderDiscountCampaign.maxDiscount.toLocaleString(
                            "vi-VN"
                          )}
                          ₫
                        </span>
                      )}
                      <span className="text-white/90 font-medium text-xs md:text-sm leading-tight whitespace-nowrap">
                        Khi mua từ{" "}
                        {orderDiscountCampaign.minTotal.toLocaleString("vi-VN")}
                        ₫
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bên phải: Thời gian sale */}
                {orderDiscountCampaign.startDate &&
                  orderDiscountCampaign.endDate && (
                    <div className="flex-shrink-0 text-right pl-5 md:pl-6 border-l-2 border-white/30 hidden md:block">
                      <p className="text-xs text-white/80 mb-1 uppercase tracking-wide">
                        Thời gian
                      </p>
                      <p className="text-sm md:text-base font-bold text-white">
                        {new Date(
                          orderDiscountCampaign.startDate
                        ).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(
                          orderDiscountCampaign.endDate
                        ).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </p>
                    </div>
                  )}
              </div>

              {/* Thời gian sale mobile - hiển thị phía dưới */}
              {orderDiscountCampaign.startDate &&
                orderDiscountCampaign.endDate && (
                  <div className="md:hidden px-6 pb-4 pt-3 border-t border-white/20">
                    <p className="text-xs text-white/80 text-center font-medium">
                      ⏰{" "}
                      {new Date(
                        orderDiscountCampaign.startDate
                      ).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(
                        orderDiscountCampaign.endDate
                      ).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </p>
                  </div>
                )}
            </div>
          </div>
        </section>
      )}

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
              allBooks
                .slice(0, 15)
                .map((book) => <BookCard key={book.id} book={book} />)
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
