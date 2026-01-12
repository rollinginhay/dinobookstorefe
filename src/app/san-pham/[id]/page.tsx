"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Book } from "@/components/BookCard";
import Breadcrumb from "@/components/Breadcrumb";
import PromotionBanner from "@/components/PromotionBanner";
import { useCart } from "@/contexts/CartContext";
import { useFavorite } from "@/contexts/FavoriteContext";
import { calculateDiscountedPrice, fetchCampaigns, Campaign } from "@/utils/campaign.utils";
import Link from "next/link";

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorite();
  const resolvedParams = use(params);
  const bookId = parseInt(resolvedParams.id);

  const [book, setBook] = useState<Book | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<
    "description" | "details"
  >("description");
  const [loading, setLoading] = useState(true);
  const [campaignDiscount, setCampaignDiscount] = useState<number>(0);
  const [campaignName, setCampaignName] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBookAndRelated() {
      try {
        setLoading(true);

        // =============================
        // FETCH CHI TIẾT SÁCH
        // =============================
        const res = await fetch(
          `http://localhost:8080/v1/book/${bookId}?e=true`
        );
        if (!res.ok) throw new Error("Không thể tải dữ liệu sách");
        const json = await res.json();

        const includedMap = new Map();
        json.included?.forEach((item: any) =>
          includedMap.set(`${item.type}-${item.id}`, item)
        );

        const item = json.data;

        // --- Tác giả ---
        const creatorIds =
          item.relationships?.creators?.data?.map((c: any) => c.id) || [];
        const authors =
          creatorIds
            .map(
              (id: string) => includedMap.get(`creator-${id}`)?.attributes?.name
            )
            .filter(Boolean)
            .join(", ") || "Không rõ tác giả";

        // --- Thể loại ---
        const genreIds =
          item.relationships?.genres?.data?.map((g: any) => g.id) || [];
        const genreList =
          genreIds
            .map(
              (id: string) => includedMap.get(`genre-${id}`)?.attributes?.name
            )
            .filter(Boolean) || [];
        
        const genreName = genreList.join(", ") || "Chưa phân loại";

        // Parent genres cần loại bỏ
        const parentGenres = [
          "Sách trong nước",
          "Sách nước ngoài",
          "Sách thiếu nhi",
          "Kinh doanh",
          "Kỹ năng sống",
          "Manga / Comic",
        ];

        // Lọc bỏ parent genres để lấy genre con (genre cụ thể hơn)
        const childGenres = genreList.filter(
          (g: string) => !parentGenres.includes(g)
        );

        // Genre CHÍNH để dùng tìm sách liên quan
        // Ưu tiên genre con, nếu không có thì mới dùng parent genre
        const mainGenreName = childGenres.length > 0
          ? childGenres[0]?.trim() || ""
          : genreList.find((g: string) => parentGenres.includes(g))?.trim() || "";
        
        // Debug logs
  

        // --- NXB ---
        const publisherId = item.relationships?.publisher?.data?.id;
        const publisherName = publisherId
          ? includedMap.get(`publisher-${publisherId}`)?.attributes?.name
          : "Không rõ NXB";

        // --- Năm xuất bản ---
        const publishedDate = item.attributes?.published;
        const year = publishedDate
          ? new Date(publishedDate).getFullYear()
          : "Không rõ năm xuất bản";

        // --- Ngôn ngữ ---
        const language = item.attributes?.language || "Không rõ ngôn ngữ";

        // --- GIÁ + BOOK DETAIL (CỰC QUAN TRỌNG) ---
        const copyIds =
          item.relationships?.bookCopies?.data?.map((b: any) => b.id) || [];
        const firstCopy = includedMap.get(`bookDetail-${copyIds[0]}`) || {};

        // const price = firstCopy?.attributes?.supplyPrice || 0;
        // const pages = firstCopy?.attributes?.pages || "Không rõ";
        const stock = firstCopy.attributes?.stock || 0;
        const enabled = firstCopy.attributes?.enabled !== false; // enabled mặc định là true nếu không có

        // ✅ Filter: Nếu stock = 0 hoặc enabled = false thì redirect về trang chủ
        if (stock <= 0 || !enabled) {
          router.push("/");
          return;
        }

        const detailObj = includedMap.get(`bookDetail-${copyIds[0]}`);
        const detail = detailObj?.attributes || detailObj || {};

        // ✅ LẤY SUPPLY_PRICE LÀM GIÁ GỐC (KHÔNG BAO GIỜ dùng salePrice)
        const supplyPrice = Number(detail.supplyPrice || 0);
        
        const pages = detail.pages || detail.printLength || "Không rõ";
        const isbn = detail.isbn || "Không rõ";
        const bookFormat = detail.bookFormat || "Khác";
        const bookDetailId = Number(copyIds[0]);

        // --- DỮ LIỆU HOÀN CHỈNH (giá sẽ được tính sau khi fetch campaign) ---
        const bookData: Book = {
          id: Number(item.id),
          title: item.attributes?.title,
          author: authors,
          price: supplyPrice, // ✅ Tạm thời dùng supplyPrice, sẽ cập nhật sau khi tính discount từ campaign
          originalPrice: undefined,
          discount: 0,
          genreName,
          description: item.attributes?.description || "",
          image: item.attributes?.imageUrl || "/default-book.jpg",
          sold: stock,
          publisher: publisherName,
          year,
          pages,
          language,

          isbn,
          // ⭐ CỰC QUAN TRỌNG: gửi xuống đúng bookDetailId
          bookDetailId,
          copyId: bookDetailId,
          bookFormat,
        };

        // ✅ Fetch campaign và tính giá giảm từ PERCENTAGE_PRODUCT (giống CartContext và trang chủ)
        try {
          console.log("🔍 [ProductDetail] Đang fetch campaigns...");
          const campaigns = await fetchCampaigns();
          console.log("📊 [ProductDetail] Tổng số campaigns:", campaigns.length);
          
          // ✅ Tính giá đã giảm từ campaign PERCENTAGE_PRODUCT (giảm theo sản phẩm cụ thể)
          const priceInfo = calculateDiscountedPrice(bookDetailId, supplyPrice, campaigns);
          const discountedPrice = priceInfo.discountedPrice;
          const hasDiscount = priceInfo.hasDiscount;
          const discountPercent = hasDiscount 
            ? Math.round(((supplyPrice - discountedPrice) / supplyPrice) * 100)
            : 0;
          
          // ✅ Giá hiển thị: giá đã giảm (từ campaign hoặc supplyPrice)
          const finalPrice = discountedPrice;
          // ✅ Giá gốc: supplyPrice nếu supplyPrice > finalPrice
          const originalPrice = supplyPrice > finalPrice ? supplyPrice : undefined;

          console.log("✅ [ProductDetail] Tính giá từ supplyPrice:", {
            bookDetailId,
            supplyPrice,
            finalPrice,
            originalPrice,
            discountPercent,
            campaignName: priceInfo.campaignName
          });

          // Cập nhật bookData với giá đã tính
          bookData.price = finalPrice;
          bookData.originalPrice = originalPrice;
          bookData.discount = discountPercent;
          
          console.log("📦 [ProductDetail] Final bookData:", {
            price: bookData.price,
            originalPrice: bookData.originalPrice,
            discount: bookData.discount
          });
          
          setBook(bookData);
          setCampaignDiscount(discountPercent);
          setCampaignName(priceInfo.campaignName || null);
        } catch (error) {
          console.error("❌ [ProductDetail] Không thể tải campaign đang hoạt động:", error);
          // Fallback: dùng supplyPrice nếu không fetch được campaign
          bookData.price = supplyPrice;
          bookData.originalPrice = undefined;
          bookData.discount = 0;
          setBook(bookData);
          setCampaignDiscount(0);
          setCampaignName(null);
        }

        // =============================
        // FETCH SÁCH CHO COMBO THEO CATEGORY/GENRE
        // Gộp sách từ nhiều series cùng thể loại (Cross-series)
        // =============================
        let comboBooks: Book[] = [];
        
        // Tìm sách liên quan theo genre
        // Ưu tiên genre con, nếu không có thì dùng parent genre
        if (mainGenreName) {
          console.log("🔍 Đang tìm sách với genre:", mainGenreName);
          
          // Lấy nhiều sách hơn để có thể tạo combo đa dạng (20-30 cuốn)
          const relatedRes = await fetch(
            `http://localhost:8080/v1/books?e=true&page=0&limit=30&genre=${encodeURIComponent(
              mainGenreName
            )}`
          );

          if (!relatedRes.ok) {
            const msg = await relatedRes.text();
            console.error("❌ Lỗi fetch combo books:", relatedRes.status, msg);
          } else {
            const relatedJson = await relatedRes.json();
            console.log("📦 API trả về:", relatedJson.data?.length || 0, "sách");

            const relIncludedMap = new Map();
            relatedJson.included?.forEach((i: any) =>
              relIncludedMap.set(`${i.type}-${i.id}`, i)
            );

            // Parse tất cả sách cùng genre
            const allBooksInGenre: Book[] =
              relatedJson.data
                // Loại bỏ chính cuốn hiện tại
                ?.filter((b: any) => String(b.id) !== String(item.id))
                .map((b: any) => {
                  const detailId =
                    b.relationships?.bookCopies?.data?.[0]?.id || null;

                  const detObj = relIncludedMap.get(`bookDetail-${detailId}`);
                  const det = detObj?.attributes || detObj || {};

                  const creatorIds =
                    b.relationships?.creators?.data?.map((c: any) => c.id) ||
                    [];
                  const authors =
                    creatorIds
                      .map(
                        (id: string) =>
                          relIncludedMap.get(`creator-${id}`)?.attributes?.name
                      )
                      .filter(Boolean)
                      .join(", ") || "—";

                  // ✅ LẤY SUPPLY_PRICE LÀM GIÁ GỐC (KHÔNG BAO GIỜ dùng salePrice)
                  const priceRel = Number(det.supplyPrice || 0);
                  const stockRel = det.stock || 0;

                  // Chỉ lọc sách có đủ thông tin cơ bản VÀ còn hàng
                  if (!b.id || !b.attributes?.title || priceRel <= 0 || stockRel <= 0) {
                    return null;
                  }

                  return {
                    id: Number(b.id),
                    title: b.attributes?.title,
                    author: authors,
                    price: priceRel,
                    image: b.attributes?.imageUrl || "/default-book.jpg",
                    bookDetailId: Number(detailId) || 0,
                    copyId: Number(detailId) || 0,
                    bookFormat: det.bookFormat || "Khác",
                    year: b.attributes?.year || 0,
                    language: b.attributes?.language || "Không rõ",
                    sold: stockRel,
                  } as Book;
                })
                .filter((b: Book | null): b is Book => b !== null) || []; // Lọc sách hợp lệ

            console.log("✅ Sách hợp lệ sau khi parse:", allBooksInGenre.length);
            console.log("📖 Chi tiết sách:", allBooksInGenre.map(b => ({ id: b.id, title: b.title, price: b.price })));

            if (allBooksInGenre.length > 0) {
              // Ưu tiên sách từ các tác giả/series khác nhau để tạo combo đa dạng
              const authorGroups = new Map<string, Book[]>();
              allBooksInGenre.forEach((book) => {
                const authorKey = book.author || "Unknown";
                if (!authorGroups.has(authorKey)) {
                  authorGroups.set(authorKey, []);
                }
                authorGroups.get(authorKey)!.push(book);
              });

              // Lấy tối đa 1-2 cuốn từ mỗi tác giả để đảm bảo đa dạng
              const diversifiedBooks: Book[] = [];
              const maxPerAuthor = 2;
              const maxComboSize = 6; // Tối đa 6 cuốn trong combo

              for (const [, books] of authorGroups.entries()) {
                if (diversifiedBooks.length >= maxComboSize) break;
                const booksToAdd = books.slice(0, maxPerAuthor);
                diversifiedBooks.push(...booksToAdd);
              }

              // Nếu chưa đủ, lấy thêm từ các tác giả khác
              if (diversifiedBooks.length < maxComboSize) {
                const remaining = allBooksInGenre.filter(
                  (b) => !diversifiedBooks.find((db) => db.id === b.id)
                );
                diversifiedBooks.push(
                  ...remaining.slice(0, maxComboSize - diversifiedBooks.length)
                );
              }

              // Giới hạn tối đa 6 cuốn cho combo
              comboBooks = diversifiedBooks.slice(0, maxComboSize);
              
              // Nếu chưa đủ, lấy thêm từ tất cả sách có sẵn
              if (comboBooks.length < 2) {
                comboBooks = allBooksInGenre.slice(0, 6);
              }
              
              console.log("✅ Combo books sau khi xử lý:", comboBooks.length, "cuốn");
            } else {
              console.log("⚠️ Không có sách hợp lệ trong genre:", mainGenreName);
            }
          }
        } else {
          console.log("⚠️ Không có mainGenreName để tìm sách liên quan");
        }

        // Fallback: Nếu không có sách cùng genre con, thử lấy sách từ parent genre
        // Hoặc nếu không có genre con, lấy trực tiếp từ parent genre
        if (comboBooks.length === 0 && genreList.length > 0) {
          // Tìm parent genre từ danh sách genres
          const parentGenre = genreList.find((g: string) => parentGenres.includes(g));
          
          // Nếu có parent genre và (chưa tìm được sách hoặc mainGenreName là parent genre)
          if (parentGenre) {
            try {
              const fallbackRes = await fetch(
                `http://localhost:8080/v1/books?e=true&page=0&limit=30&genre=${encodeURIComponent(
                  parentGenre
                )}`
              );
              
              if (fallbackRes.ok) {
                const fallbackJson = await fallbackRes.json();
                console.log("📦 Fallback API trả về:", fallbackJson.data?.length || 0, "sách");
                
                const fallbackIncludedMap = new Map();
                fallbackJson.included?.forEach((i: any) =>
                  fallbackIncludedMap.set(`${i.type}-${i.id}`, i)
                );

                const fallbackBooks: Book[] = fallbackJson.data
                  ?.filter((b: any) => String(b.id) !== String(item.id))
                  .map((b: any) => {
                    const detailId = b.relationships?.bookCopies?.data?.[0]?.id || null;
                    const detObj = fallbackIncludedMap.get(`bookDetail-${detailId}`);
                    const det = detObj?.attributes || detObj || {};
                    const creatorIds = b.relationships?.creators?.data?.map((c: any) => c.id) || [];
                    const authors = creatorIds
                      .map((id: string) => fallbackIncludedMap.get(`creator-${id}`)?.attributes?.name)
                      .filter(Boolean)
                      .join(", ") || "—";
                    // ✅ LẤY SUPPLY_PRICE LÀM GIÁ GỐC (KHÔNG BAO GIỜ dùng salePrice)
                    const priceRel = Number(det.supplyPrice || 0);
                    const stockRel = det.stock || 0;

                    // Chỉ lọc sách có đủ thông tin cơ bản VÀ còn hàng
                    if (!b.id || !b.attributes?.title || priceRel <= 0 || stockRel <= 0) {
                      return null;
                    }

                    return {
                      id: Number(b.id),
                      title: b.attributes?.title,
                      author: authors,
                      price: priceRel,
                      image: b.attributes?.imageUrl || "/default-book.jpg",
                      bookDetailId: Number(detailId) || 0,
                      copyId: Number(detailId) || 0,
                      bookFormat: det.bookFormat || "Khác",
                      year: b.attributes?.year || 0,
                      language: b.attributes?.language || "Không rõ",
                      sold: stockRel,
                    } as Book;
                  })
                  .filter((b: Book | null): b is Book => b !== null) || [];
                  
                console.log("✅ Fallback books hợp lệ:", fallbackBooks.length);

                if (fallbackBooks.length > 0) {
                  // Áp dụng logic đa dạng hóa tương tự
                  const authorGroups = new Map<string, Book[]>();
                  fallbackBooks.forEach((book) => {
                    const authorKey = book.author || "Unknown";
                    if (!authorGroups.has(authorKey)) {
                      authorGroups.set(authorKey, []);
                    }
                    authorGroups.get(authorKey)!.push(book);
                  });

                  const diversifiedFallback: Book[] = [];
                  const maxPerAuthor = 2;
                  const maxComboSize = 6;

                  for (const [, books] of authorGroups.entries()) {
                    if (diversifiedFallback.length >= maxComboSize) break;
                    const booksToAdd = books.slice(0, maxPerAuthor);
                    diversifiedFallback.push(...booksToAdd);
                  }

                  if (diversifiedFallback.length < maxComboSize) {
                    const remaining = fallbackBooks.filter(
                      (b) => !diversifiedFallback.find((db) => db.id === b.id)
                    );
                    diversifiedFallback.push(
                      ...remaining.slice(0, maxComboSize - diversifiedFallback.length)
                    );
                  }

                  comboBooks = diversifiedFallback.slice(0, maxComboSize);
                  
                  if (comboBooks.length < 2) {
                    comboBooks = fallbackBooks.slice(0, 6);
                  }
                }
              }
            } catch (err) {
              console.error("Lỗi khi lấy sách từ parent genre:", err);
            }
          }
        }

        // =============================
        // TÍNH DISCOUNT CHO SÁCH LIÊN QUAN (giống trang chủ)
        // =============================
        console.log("📚 Final combo books:", comboBooks.length, "cuốn");
        if (comboBooks.length > 0) {
          console.log("📖 Danh sách sách:", comboBooks.map(b => b.title));
        }

        // ✅ Fetch campaign và tính discount từ PERCENTAGE_PRODUCT (giống CartContext)
        try {
          console.log("🔍 [RelatedBooks] Đang fetch campaigns để tính discount...");
          const campaigns = await fetchCampaigns();
          
          // ✅ Tính discount cho từng sách từ PERCENTAGE_PRODUCT
          const booksWithDiscount = comboBooks.map((book) => {
            // ✅ book.price đã là supplyPrice (từ dòng 271, 384)
            const supplyPrice = book.price;
            // ✅ Tính giá đã giảm từ campaign PERCENTAGE_PRODUCT
            const priceInfo = calculateDiscountedPrice(book.bookDetailId || book.id, supplyPrice, campaigns);
            const discountedPrice = priceInfo.discountedPrice;
            const hasDiscount = priceInfo.hasDiscount;
            const discount = hasDiscount 
              ? Math.round(((supplyPrice - discountedPrice) / supplyPrice) * 100)
              : 0;
            
            // ✅ Giá hiển thị: giá đã giảm (từ campaign hoặc supplyPrice)
            const finalPrice = discountedPrice;
            // ✅ Giá gốc: supplyPrice nếu supplyPrice > finalPrice
            const originalPrice = supplyPrice > finalPrice ? supplyPrice : undefined;

            return {
              ...book,
              price: finalPrice,
              originalPrice,
              discount
            };
          });

          console.log("✅ [RelatedBooks] Đã tính discount cho", booksWithDiscount.length, "sách");
          setRelatedBooks(booksWithDiscount);
        } catch (error) {
          console.error("❌ [RelatedBooks] Không thể tải campaign:", error);
          // Fallback: dùng supplyPrice nếu không fetch được campaign
          setRelatedBooks(comboBooks);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchBookAndRelated();
  }, [bookId, router]);
  // =========================
  // API TẠO HÓA ĐƠN
  // =========================
  async function createReceipt() {
    const res = await fetch("http://localhost:8080/v1/receipt/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          type: "receipt",
          attributes: {
            status: "PENDING",
            total: 0,
          },
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("❌ Backend error:", text);
      throw new Error("Không thể tạo hóa đơn");
    }

    return (await res.json()).data.id;
  }

  // =========================
  // API TẠO RECEIPT DETAIL
  // =========================
  async function createReceiptDetail(price: number, quantity: number) {
    const res = await fetch("http://localhost:8080/v1/receiptDetail/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          type: "receiptDetail",
          attributes: { price, quantity },
        },
      }),
    });

    if (!res.ok) throw new Error("Không thể tạo chi tiết hóa đơn");
    const json = await res.json();
    return json.data.id; // receiptDetailId
  }

  // =========================
  // API GẮN RECEIPT DETAIL VÀO RECEIPT
  // =========================
  async function attachDetail(receiptId: number, detailId: number) {
    const res = await fetch(
      `http://localhost:8080/v1/receipt/${receiptId}/relationships/receiptDetail`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [{ type: "receiptDetail", id: detailId }],
        }),
      }
    );

    if (!res.ok) throw new Error("Không thể gắn sản phẩm vào hóa đơn");
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Đang tải dữ liệu sách...
      </div>
    );

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Không tìm thấy sản phẩm
          </h2>
          <Link href="/" className="text-blue-600 hover:underline">
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // ✅ Sử dụng giá từ book (đã được tính từ discountPrice từ BE)
  const discount = book.discount || 0;
  const originalPrice = book.originalPrice && book.originalPrice > book.price 
    ? book.originalPrice 
    : null;
  const discountedPrice = book.price; // ✅ Giá sau giảm (từ campaign PERCENTAGE_PRODUCT hoặc supplyPrice)
  const isFav = isFavorite(book.id);

  // Debug log
  console.log("💰 [Price] Giá gốc:", originalPrice || discountedPrice, "| Discount:", discount + "%", "| Giá sau giảm:", discountedPrice);

  const handleQuantityChange = (v: number) => {
    if (v < 1 || v > 10) return;
    setQuantity(v);
  };

  const handleAddToCart = () => {
    // Kiểm tra đăng nhập
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      router.push("/dang-nhap");
      return;
    }
    addToCart(book, quantity);
  };

  const handleBuyNow = async () => {
    // Kiểm tra đăng nhập
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      router.push("/dang-nhap");
      return;
    }

    try {
      // 1) Tạo hóa đơn
      const receiptId = await createReceipt();
      // 2) Tạo receipt detail (sản phẩm)
      const detailId = await createReceiptDetail(book.price, quantity);
      // 3) Gắn vào hóa đơn
      await attachDetail(receiptId, detailId);
      // 4) Điều hướng sang trang thanh toán
      router.push(`/thanh-toan?receiptId=${receiptId}`);
    } catch (err) {
      console.error("Lỗi khi thanh toán:", err);
      alert("Có lỗi xảy ra, vui lòng thử lại!");
    }
  };

  const handleFavorite = () => {
    if (isFav) removeFromFavorites(book.id);
    else addToFavorites(book);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PromotionBanner />

      <Breadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Sách", href: "/sach" },
          { label: book.genreName, href: `/the-loai/${book.genreName}` },
          { label: book.title },
        ]}
      />

      {/* Product Detail Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Left: Images */}
            <div className="space-y-4">
              <div className="aspect-[3/4] bg-gray-50 rounded-lg overflow-hidden relative group">
                <img
                  src={book.image}
                  alt={book.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {discount > 0 && originalPrice && originalPrice > discountedPrice && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-xl px-4 py-2 rounded-full font-bold">
                  -{discount}%
                </div>
                )}
              </div>
            </div>

            {/* Right: Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {book.title}
                </h1>
                <p className="text-xl text-gray-600">
                  Tác giả:{" "}
                  <span className="font-semibold text-blue-600">
                    {book.author}
                  </span>
                </p>
              </div>


              {/* Giá */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    {/* Giá giảm (đỏ, to, đậm) - bên trái */}
                    <span className="text-red-600 text-4xl font-bold">
                      {discountedPrice.toLocaleString("vi-VN")} ₫
                    </span>
                    {/* Giá gốc (xám, nhỏ, gạch ngang) - bên phải, chỉ hiển thị khi có discount */}
                    {originalPrice && originalPrice > discountedPrice && (
                    <span className="text-gray-400 text-xl line-through">
                      {originalPrice.toLocaleString("vi-VN")} ₫
                    </span>
                    )}
                  </div>
                  {discount > 0 && originalPrice && originalPrice > discountedPrice && (
                  <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    Giảm {discount}%
                      {campaignName ? ` • ${campaignName}` : ""}
                  </div>
                  )}
                </div>
              </div>

              {/* Thông tin nhanh */}
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  <span className="text-gray-600">
                    NXB: <span className="font-medium">{book.publisher}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-gray-600">
                    Năm XB: <span className="font-medium">{book.year}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                  <span className="text-gray-600">
                    Số trang: <span className="font-medium">{book.pages}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                    />
                  </svg>
                  <span className="text-gray-600">
                    Ngôn ngữ:{" "}
                    <span className="font-medium">{book.language}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5h18M3 12h18M3 19h18"
                    />
                  </svg>
                  <span className="text-gray-600">
                    ISBN: <span className="font-medium">{book.isbn}</span>
                  </span>
                </div>
              </div>

              {/* Bộ chọn số lượng & tồn kho */}
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-medium">Số lượng:</span>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 12H4"
                      />
                    </svg>
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      handleQuantityChange(parseInt(e.target.value) || 1)
                    }
                    className="w-16 text-center border-x border-gray-300 py-2 focus:outline-none focus:ring-0"
                    min={1}
                    max={10}
                  />
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                </div>
                <span className="text-gray-500 text-sm">
                  {book.sold} sản phẩm
                </span>
              </div>

              {/* Các nút hành động */}
              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-orange-500 text-white py-4 px-6 rounded-lg hover:bg-orange-600 transition-colors font-semibold text-lg flex items-center justify-center gap-2"
                >
                  Thêm vào giỏ hàng
                </button>
                <button
                  onClick={handleFavorite}
                  className={`px-4 py-4 border rounded-lg transition-colors ${
                    isFav
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <svg
                    className={`w-5 h-5 ${
                      isFav ? "text-red-500" : "text-gray-600"
                    }`}
                    fill={isFav ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>

              {/* Ưu đãi đặc biệt */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-3">
                  Ưu đãi đặc biệt:
                </h4>
                <ul className="space-y-2 text-sm text-green-700">
                  <li className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Miễn phí vận chuyển cho đơn hàng trên 299.000₫
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Đổi trả miễn phí trong 30 ngày
                  </li>
                  <li className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Thanh toán linh hoạt, đảm bảo an toàn
                  </li>
                </ul>
              </div>
            </div>
          </div>


          {/* TABS */}
          <div className="border-t">
            {/* Tab Navigation */}
            <div className="flex border-b">
              {[
                { id: "description", label: "Mô tả sản phẩm" },
                { id: "details", label: "Thông tin chi tiết" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as "description" | "details")}
                  className={`px-8 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {activeTab === "description" && (
                <div className="prose max-w-none">
                  <p className="text-gray-700 text-lg leading-relaxed mb-6">
                    {book.description}
                  </p>

                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Giới thiệu về cuốn sách
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      Đây là một cuốn sách đặc biệt với nội dung phong phú và
                      giá trị văn học cao. Cuốn sách mang đến cho độc giả những
                      trải nghiệm độc đáo và ý nghĩa sâu sắc.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      Tác giả xây dựng câu chuyện hấp dẫn, đầy tính nhân văn và
                      cảm xúc.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "details" && (
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
                      <span className="font-medium">{book.genreName}</span>
                    </div>

                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Bìa:</span>
                      <span className="font-medium">Bìa cứng</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Sản phẩm liên quan */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-l-4 border-orange-500 pl-3">
          📚 Sản phẩm liên quan
        </h2>

        {relatedBooks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            Hiện chưa tìm thấy sản phẩm liên quan phù hợp. Bạn có thể xem thêm
            các sản phẩm khác ở trang chủ hoặc các danh mục sách.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {relatedBooks.map((relatedBook) => (
              <Link
                key={relatedBook.id}
                href={`/san-pham/${relatedBook.id}`}
                className="group"
              >
                <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-2 flex flex-col">
                  {/* Ảnh */}
                  <div className="aspect-[3/4] relative overflow-hidden">
                    <img
                      src={relatedBook.image}
                      alt={relatedBook.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>

                  {/* Nội dung */}
                  <div className="p-4 flex flex-col justify-between flex-grow">
                    <div>
                      <h3
                        className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors"
                        title={relatedBook.title}
                      >
                        {relatedBook.title}
                      </h3>
                      <p className="text-xs text-gray-500 mb-3">
                        {relatedBook.author || "—"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        {/* Giá giảm (đỏ, to hơn) - hiển thị khi có discount */}
                        <span className="text-red-600 font-bold text-base">
                          {relatedBook.price
                            ? `${relatedBook.price.toLocaleString("vi-VN")} ₫`
                            : "Liên hệ"}
                        </span>
                        {/* Giá gốc (xám, gạch ngang) - chỉ hiển thị khi có discount */}
                        {relatedBook.originalPrice && relatedBook.originalPrice > relatedBook.price && (
                          <span className="text-gray-400 text-xs line-through">
                            {relatedBook.originalPrice.toLocaleString("vi-VN")} ₫
                          </span>
                        )}
                      </div>
                      {/* Đã bỏ nút Mua ngay ở gợi ý combo trên trang chi tiết */}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
