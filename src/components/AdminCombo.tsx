"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Book } from "@/components/BookCard";
import { useCart } from "@/contexts/CartContext";
import Link from "next/link";

interface Combo {
  id: string;
  name: string;
  percentage: number;
  maxDiscount: number;
  books: Book[];
}

interface AdminComboProps {
  bookDetailId: number;
  mainBook: Book;
}

export default function AdminCombo({ bookDetailId, mainBook }: AdminComboProps) {
  const { addComboToCart } = useCart();
  const router = useRouter();

  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<{ [comboId: string]: number }>({});
  const [isAdding, setIsAdding] = useState<{ [comboId: string]: boolean }>({});
  const [showDetails, setShowDetails] = useState<{ [comboId: string]: boolean }>({});

  useEffect(() => {
    async function fetchCombos() {
      if (!bookDetailId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("🔍 [AdminCombo] Fetching combos for bookDetailId:", bookDetailId);
        
        const res = await fetch(`http://localhost:8080/v1/campaigns/combo?bookDetailId=${bookDetailId}`);
        if (!res.ok) {
          console.log("❌ [AdminCombo] API returned:", res.status);
          setCombos([]);
          return;
        }
        
        const json = await res.json();
        const campaigns = json.data || [];
        console.log("📦 [AdminCombo] Campaigns found:", campaigns.length);
        console.log("📋 [AdminCombo] Campaigns data:", campaigns.map((c: any) => ({
          id: c.id,
          name: c.attributes?.name,
          type: c.attributes?.campaignType,
          percentage: c.attributes?.percentage
        })));

        const comboList: Combo[] = [];
        
        // ✅ Fetch tất cả books 1 lần để tìm bookId từ bookDetailId
        let allBooksData: any = null;
        try {
          console.log(`📥 [AdminCombo] Fetching all books for bookId lookup...`);
          const booksRes = await fetch(`http://localhost:8080/v1/books?e=true&page=0&limit=1000`);
          if (booksRes.ok) {
            allBooksData = await booksRes.json();
            console.log(`✅ [AdminCombo] Fetched ${allBooksData.data?.length || 0} books for lookup`);
          }
        } catch (err) {
          console.error(`❌ [AdminCombo] Error fetching all books:`, err);
        }
        
        for (const campaign of campaigns) {
          const attrs = campaign.attributes || {};
          
          // Lấy campaignDetails từ endpoint relationships
          let campaignDetails: any[] = [];
          try {
            const detailsRes = await fetch(`http://localhost:8080/v1/campaign/${campaign.id}/relationships/campaignDetail`);
            if (detailsRes.ok) {
              const detailsJson = await detailsRes.json();
              const allDetails = detailsJson.data || [];
              // ✅ CHỈ LẤY campaignDetails với enabled = true
              campaignDetails = allDetails.filter((cd: any) => {
                const enabled = cd.attributes?.enabled !== undefined ? cd.attributes.enabled : cd.enabled;
                return enabled !== false; // Chỉ lấy enabled = true hoặc undefined (mặc định là true)
              });
              console.log(`📋 [AdminCombo] Campaign ${campaign.id} - Total details: ${allDetails.length}, Enabled: ${campaignDetails.length}`);
            }
          } catch (err) {
            console.error("❌ [AdminCombo] Error fetching campaign details:", err);
          }
          
          if (campaignDetails.length === 0) {
            console.log(`⚠️ [AdminCombo] Campaign ${campaign.id} has no enabled campaignDetails`);
            continue;
          }

          // Fetch thông tin sách cho mỗi campaignDetail
          const bookPromises = campaignDetails.map(async (cd: any) => {
            const detailId = cd.attributes?.bookDetailId || cd.bookDetailId;
            console.log(`🔍 [AdminCombo] Processing campaignDetail with bookDetailId: ${detailId}`);
            if (!detailId) {
              console.log(`⚠️ [AdminCombo] CampaignDetail has no bookDetailId`);
              return null;
            }
            
            try {
              // ✅ CÁCH 1: Fetch bookDetail với ?e=true để lấy included data
              console.log(`📥 [AdminCombo] Fetching bookDetail/${detailId}?e=true...`);
              const detailRes = await fetch(`http://localhost:8080/v1/bookDetail/${detailId}?e=true`);
              if (!detailRes.ok) {
                console.log(`❌ [AdminCombo] bookDetail/${detailId} returned status: ${detailRes.status}`);
                return null;
              }
              const detailJson = await detailRes.json();
              console.log(`📋 [AdminCombo] bookDetail/${detailId} response:`, {
                data: detailJson.data,
                relationships: detailJson.data?.relationships,
                included: detailJson.included?.length || 0
              });
              
              // Thử nhiều cách lấy bookId
              let bookId = detailJson.data?.relationships?.book?.data?.id;
              
              // ✅ CÁCH 1.5: Thử bookDetailId = bookId (trong nhiều trường hợp chúng bằng nhau)
              if (!bookId) {
                // Thử fetch book trực tiếp với id = detailId
                try {
                  const testBookRes = await fetch(`http://localhost:8080/v1/book/${detailId}?e=true`);
                  if (testBookRes.ok) {
                    const testBookJson = await testBookRes.json();
                    // Kiểm tra xem book này có bookDetailId này trong bookCopies không
                    const bookCopyIds = testBookJson.data?.relationships?.bookCopies?.data?.map((bc: any) => bc.id) || [];
                    if (bookCopyIds.includes(String(detailId))) {
                      bookId = detailId;
                      console.log(`✅ [AdminCombo] Found bookId = bookDetailId: ${bookId}`);
                    }
                  }
                } catch (err) {
                  // Ignore, try next method
                }
              }
              
              // ✅ CÁCH 2: Tìm bookCopy trong included, rồi lấy bookId từ bookCopy
              if (!bookId && detailJson.included) {
                const bookCopy = detailJson.included.find((item: any) => 
                  item.type === 'bookCopy' && 
                  (item.relationships?.bookDetail?.data?.id === String(detailId) ||
                   item.id === String(detailId))
                );
                if (bookCopy?.relationships?.book?.data?.id) {
                  bookId = bookCopy.relationships.book.data.id;
                  console.log(`✅ [AdminCombo] Found bookId from bookCopy: ${bookId}`);
                }
              }
              
              // ✅ CÁCH 3: Tìm book trực tiếp trong included
              if (!bookId && detailJson.included) {
                const book = detailJson.included.find((item: any) => item.type === 'book');
                if (book?.id) {
                  // Kiểm tra xem book này có bookCopy trỏ đến bookDetail này không
                  const bookCopies = detailJson.included.filter((item: any) => 
                    item.type === 'bookCopy' && 
                    item.relationships?.book?.data?.id === book.id &&
                    item.relationships?.bookDetail?.data?.id === String(detailId)
                  );
                  if (bookCopies.length > 0) {
                    bookId = book.id;
                    console.log(`✅ [AdminCombo] Found bookId from included book: ${bookId}`);
                  }
                }
              }
              
              // ✅ CÁCH 4: Tìm book từ allBooksData đã fetch sẵn
              // bookCopies.data[].id chính là bookDetailId
              if (!bookId && allBooksData) {
                // Tìm book có bookCopies.data chứa bookDetailId này
                const foundBook = allBooksData.data?.find((bookItem: any) => {
                  const bookCopyIds = bookItem.relationships?.bookCopies?.data?.map((bc: any) => bc.id) || [];
                  return bookCopyIds.includes(String(detailId));
                });
                
                if (foundBook?.id) {
                  bookId = foundBook.id;
                  console.log(`✅ [AdminCombo] Found bookId from cached books: ${bookId}`);
                } else {
                  console.log(`⚠️ [AdminCombo] No book found with bookDetailId ${detailId} in bookCopies`);
                }
              }
              
              console.log(`📖 [AdminCombo] bookDetail/${detailId} -> bookId: ${bookId}`);
              if (!bookId) {
                console.log(`⚠️ [AdminCombo] bookDetail/${detailId} has no bookId after all attempts`);
                console.log(`🔍 [AdminCombo] Full detailJson:`, JSON.stringify(detailJson, null, 2));
                return null;
              }

              // Fetch book để lấy thông tin đầy đủ
              console.log(`📥 [AdminCombo] Fetching book/${bookId}...`);
              const bookRes = await fetch(`http://localhost:8080/v1/book/${bookId}?e=true`);
              if (!bookRes.ok) {
                console.log(`❌ [AdminCombo] book/${bookId} returned status: ${bookRes.status}`);
                return null;
              }
              const bookJson = await bookRes.json();
              const bookItem = bookJson.data;
              const bookAttrs = bookItem.attributes || {};

              const includedMap = new Map();
              bookJson.included?.forEach((item: any) =>
                includedMap.set(`${item.type}-${item.id}`, item)
              );
              
              const bookDetailIncluded = includedMap.get(`bookDetail-${detailId}`);
              const bookDetailAttrs = bookDetailIncluded?.attributes || {};
              
              console.log(`📊 [AdminCombo] bookDetailAttrs for ${detailId}:`, {
                stock: bookDetailAttrs.stock,
                salePrice: bookDetailAttrs.salePrice,
                supplyPrice: bookDetailAttrs.supplyPrice
              });
              
              const creatorIds = bookItem.relationships?.creators?.data?.map((c: any) => c.id) || [];
              const authors = creatorIds
                .map((id: string) => includedMap.get(`creator-${id}`)?.attributes?.name)
                .filter(Boolean)
                .join(", ") || "Không rõ tác giả";
              
              const publisherId = bookItem.relationships?.publisher?.data?.id;
              const publisherName = publisherId
                ? includedMap.get(`publisher-${publisherId}`)?.attributes?.name || "Không rõ NXB"
                : "Không rõ NXB";

              // ✅ Lấy giá từ salePrice (giá gốc để tính discount)
              const salePrice = bookDetailAttrs.salePrice || bookDetailAttrs.supplyPrice || 0;
              const stock = bookDetailAttrs.stock || 0;
              
              console.log(`✅ [AdminCombo] Book parsed:`, {
                id: bookItem.id,
                title: bookAttrs.title,
                stock,
                salePrice,
                bookDetailId: detailId
              });
              
              return {
                id: Number(bookItem.id),
                title: bookAttrs.title || "Không có tên",
                author: authors,
                price: salePrice, // Giá gốc (salePrice)
                image: bookAttrs.imageUrl || "/default-book.jpg",
                sold: stock,
                bookDetailId: Number(detailId),
                year: bookAttrs.year || 0,
                language: bookAttrs.language || "Không rõ",
                rating: bookAttrs.rating || 0,
                bookFormat: bookDetailAttrs.bookFormat || "Khác",
                publisher: publisherName,
              } as Book;
            } catch (error) {
              console.error(`❌ [AdminCombo] Error fetching book for detailId ${detailId}:`, error);
              return null;
            }
          });

          const allBooks = await Promise.all(bookPromises);
          console.log(`📦 [AdminCombo] Campaign ${campaign.id} - All books fetched:`, allBooks.length);
          console.log(`📋 [AdminCombo] Campaign ${campaign.id} - Books details:`, allBooks.map(b => b ? {
            id: b.id,
            title: b.title,
            stock: b.sold,
            price: b.price
          } : null));
          
          // ✅ Filter: chỉ cần sách có giá > 0 (không cần stock > 0 vì combo vẫn có thể hiển thị)
          const books = allBooks.filter(
            (b): b is Book => {
              if (b === null) {
                console.log(`⚠️ [AdminCombo] Book is null`);
                return false;
              }
              const price = b.price || 0;
              if (price <= 0) {
                console.log(`⚠️ [AdminCombo] Book ${b.id} (${b.title}) has price = ${price}, filtering out`);
                return false;
              }
              return true;
            }
          );
          
          console.log(`📚 [AdminCombo] Campaign ${campaign.id} has ${books.length} valid books (with stock > 0)`);
          if (books.length > 0) {
            console.log(`📖 [AdminCombo] Books in campaign ${campaign.id}:`, books.map(b => ({
              id: b.id,
              title: b.title,
              price: b.price
            })));
          }
          
          // Cần ít nhất 2 sách để tạo combo
          if (books.length < 2) {
            console.log(`⚠️ [AdminCombo] Campaign ${campaign.id} has less than 2 books, skipping`);
            continue;
          }

          comboList.push({
            id: String(campaign.id),
            name: attrs.name || "Combo",
            percentage: attrs.percentage || 0,
            maxDiscount: attrs.maxDiscount || 0,
            books,
          });
          console.log(`✅ [AdminCombo] Added combo: ${attrs.name || "Combo"} with ${books.length} books`);
        }
        
        console.log("✅ [AdminCombo] Final combos:", comboList.length);
        if (comboList.length > 0) {
          console.log("📋 [AdminCombo] Combo details:", comboList.map(c => ({
            id: c.id,
            name: c.name,
            percentage: c.percentage,
            maxDiscount: c.maxDiscount,
            bookCount: c.books.length
          })));
        }
        setCombos(comboList);
        
        // Khởi tạo quantities
        const initQuantities: { [key: string]: number } = {};
        comboList.forEach(c => { initQuantities[c.id] = 1; });
        setQuantities(initQuantities);
        
      } catch (error) {
        console.error("❌ [AdminCombo] Error:", error);
        setCombos([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCombos();
  }, [bookDetailId]);

  const handleQuantityChange = (comboId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[comboId] || 1;
      const newVal = current + delta;
      if (newVal >= 1 && newVal <= 10) {
        return { ...prev, [comboId]: newVal };
      }
      return prev;
    });
  };

  const calculateOriginalPrice = (combo: Combo) =>
    combo.books.reduce((sum, book) => sum + book.price, 0);

  const calculateComboPrice = (combo: Combo) => {
    const totalPrice = calculateOriginalPrice(combo);
    // ✅ Tính số tiền giảm: totalPrice * (percentage / 100)
    let discountAmount = (totalPrice * combo.percentage) / 100;
    
    // ✅ Áp dụng maxDiscount nếu có
    if (combo.maxDiscount && discountAmount > combo.maxDiscount) {
      discountAmount = combo.maxDiscount;
    }
    
    const finalPrice = Math.round(totalPrice - discountAmount);
    console.log(`💰 [AdminCombo] Combo "${combo.name}" - Original: ${totalPrice}, Discount: ${discountAmount}, Final: ${finalPrice}`);
    return finalPrice;
  };

  const handleAddToCart = async (combo: Combo) => {
    const comboId = combo.id;
    if (isAdding[comboId]) return;
    
    setIsAdding(prev => ({ ...prev, [comboId]: true }));
    try {
      const qty = quantities[comboId] || 1;
      await addComboToCart(
        combo.books,
        combo.name,
        calculateComboPrice(combo),
        calculateOriginalPrice(combo),
        combo.percentage,
        qty
      );
      alert(`Đã thêm ${combo.name} vào giỏ hàng!`);
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setIsAdding(prev => ({ ...prev, [comboId]: false }));
    }
  };

  const handleBuyNow = async (combo: Combo) => {
    const comboId = combo.id;
    if (isAdding[comboId]) return;
    
    setIsAdding(prev => ({ ...prev, [comboId]: true }));
    try {
      const qty = quantities[comboId] || 1;
      await addComboToCart(
        combo.books,
        combo.name,
        calculateComboPrice(combo),
        calculateOriginalPrice(combo),
        combo.percentage,
        qty
      );
      router.push("/thanh-toan");
    } catch (error) {
      console.error("Lỗi khi mua:", error);
      alert("Có lỗi xảy ra, vui lòng thử lại!");
      setIsAdding(prev => ({ ...prev, [comboId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 my-6">
        <p className="text-gray-600">Đang tải combo khuyến mãi...</p>
      </div>
    );
  }

  if (combos.length === 0) {
    return null; // Không hiển thị gì nếu không có combo
  }

  return (
    <div className="space-y-4 my-6">
      {combos.map((combo) => {
        const comboId = combo.id;
        const qty = quantities[comboId] || 1;
        const originalPrice = calculateOriginalPrice(combo);
        const comboPrice = calculateComboPrice(combo);
        const saved = originalPrice - comboPrice;
        const totalPrice = comboPrice * qty;

        return (
          <div key={comboId} className="bg-white rounded-lg shadow-md border border-red-200 overflow-hidden hover:shadow-lg transition-shadow">
            {/* Header gọn */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 text-white px-2.5 py-0.5 rounded text-xs font-bold">
                    COMBO
                  </span>
                  <span className="text-white text-sm font-semibold">-{combo.percentage}%</span>
                  <span className="text-white/90 text-xs">({combo.books.length} cuốn)</span>
                </div>
                <h3 className="text-white font-bold text-sm truncate max-w-[200px]">{combo.name}</h3>
              </div>
            </div>

            <div className="p-4">

            {/* Bundle Card - Gọn */}
            <div className="mb-3">
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/san-pham/${mainBook.id}`}
                    className="w-16 aspect-[3/4] bg-white rounded overflow-hidden hover:shadow-md transition-shadow flex-shrink-0"
                  >
                    <img
                      src={mainBook.image}
                      alt={mainBook.title}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {combo.books.map((b) => b.title).join(", ")}
                    </div>
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-red-600 font-bold text-lg">
                          {comboPrice.toLocaleString("vi-VN")} ₫
                        </div>
                        <div className="text-gray-400 text-xs line-through">
                          {originalPrice.toLocaleString("vi-VN")} ₫
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nút xem chi tiết - Gọn */}
              <button
                onClick={() => setShowDetails(prev => ({ ...prev, [comboId]: !prev[comboId] }))}
                className="w-full mt-2 flex items-center justify-between text-xs text-gray-600 hover:text-red-600 transition-colors py-1.5"
              >
                <span>{showDetails[comboId] ? "Ẩn chi tiết" : "Xem chi tiết"}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showDetails[comboId] ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Chi tiết combo - Grid compact */}
              {showDetails[comboId] && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {combo.books.map((book) => (
                      <Link
                        key={book.id}
                        href={`/san-pham/${book.id}`}
                        className="flex flex-col items-center p-2 bg-gray-50 rounded hover:bg-red-50 transition-colors group"
                      >
                        <img 
                          src={book.image} 
                          alt={book.title} 
                          className="w-12 h-16 object-cover rounded mb-1 group-hover:scale-105 transition-transform"
                        />
                        <p className="text-xs font-medium text-gray-900 line-clamp-2 text-center mb-1 group-hover:text-red-600">
                          {book.title}
                        </p>
                        <p className="text-xs font-bold text-red-600">
                          {book.price.toLocaleString("vi-VN")} ₫
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Số lượng và Giá - Gọn */}
            <div className="mb-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Số lượng:</span>
                <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                  <button
                    onClick={() => handleQuantityChange(comboId, -1)}
                    disabled={qty <= 1}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      if (val >= 1 && val <= 10) setQuantities(prev => ({ ...prev, [comboId]: val }));
                    }}
                    className="w-12 text-center border-x border-gray-300 py-1 text-sm focus:outline-none"
                    min={1}
                    max={10}
                  />
                  <button
                    onClick={() => handleQuantityChange(comboId, 1)}
                    disabled={qty >= 10}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Price breakdown - Gọn */}
              <div className="bg-orange-50 rounded p-2.5 border border-orange-200 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Giá gốc:</span>
                  <span className="text-gray-500 line-through">
                    {(originalPrice * qty).toLocaleString("vi-VN")} ₫
                  </span>
                </div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-gray-600">Tiết kiệm:</span>
                  <span className="text-green-600 font-semibold">
                    -{(saved * qty).toLocaleString("vi-VN")} ₫
                  </span>
                </div>
                <div className="border-t border-orange-300 pt-1.5 mt-1.5">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">Tổng thanh toán:</span>
                    <span className="text-lg font-bold text-red-600">
                      {totalPrice.toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Các nút hành động - Gọn */}
            <div className="flex gap-2">
              <button
                onClick={() => handleAddToCart(combo)}
                disabled={isAdding[comboId]}
                className="flex-1 bg-orange-500 text-white py-2.5 px-4 rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAdding[comboId] ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang thêm...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Thêm vào giỏ
                  </>
                )}
              </button>
              <button
                onClick={() => handleBuyNow(combo)}
                disabled={isAdding[comboId]}
                className="px-4 py-2.5 border-2 border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-semibold text-sm disabled:opacity-50 bg-white"
              >
                {isAdding[comboId] ? "..." : "Mua ngay"}
              </button>
            </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
