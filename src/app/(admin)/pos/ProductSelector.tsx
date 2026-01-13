"use client";

import {useMemo, useState} from "react";

interface ProductSelectorProps {
    onClose: () => void;
    // multi = false: onSelect(product)
    // multi = true: onSelect(product[])
    onSelect: (product: any | any[]) => void;
    products: any[];
    multi?: boolean;
    initialSelectedIds?: string[];
    // ✅ THÊM: Truyền campaigns để tính giá giảm
    campaigns?: any[];
}

export default function ProductSelector({
                                            onClose,
                                            onSelect,
                                            products,
                                            multi = false,
                                            initialSelectedIds = [],
                                            campaigns = [],
                                        }: ProductSelectorProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        bookFormat: "", // Loại bìa
        priceRange: "", // Khoảng giá
        author: "", // Tác giả
    });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));

    // ✅ THÊM: Function tính giá đã giảm cho sản phẩm
    const calculateDiscountedPrice = (product: any) => {
        // Đảm bảo có giá trị mặc định nếu supplyPrice không tồn tại
        const supplyPrice = product.supplyPrice ?? product.salePrice ?? 0;
        
        if (!campaigns || campaigns.length === 0) {
            return { 
                discountedPrice: supplyPrice, 
                originalPrice: supplyPrice, 
                hasDiscount: false 
            };
        }

        // Tìm campaign giảm giá theo sản phẩm (combo)
        const prodVouchers = campaigns.filter(v => v.type === "PERCENTAGE_PRODUCT");
        const applicable = prodVouchers.filter((v) => {
            const campaignDetails = v.campaignDetails?.data || v.campaignDetails || [];
            return Array.isArray(campaignDetails) && 
                   campaignDetails.some((detail: any) => {
                       const bookDetailId = detail.attributes?.bookDetailId || detail.bookDetailId;
                       return String(bookDetailId) === String(product.id);
                   });
        });

        if (applicable.length > 0) {
            // ✅ SỬA: Giảm giá theo phần trăm (tối đa 50%)
            // value là phần trăm giảm giá (VD: 10 = 10%)
            const percentage = applicable[0].value || 0;
            const discountAmount = (supplyPrice * percentage) / 100;
            const discountedPrice = Math.max(0, supplyPrice - discountAmount);
            return {
                discountedPrice: discountedPrice,
                originalPrice: supplyPrice,
                hasDiscount: discountedPrice < supplyPrice
            };
        }

        return { 
            discountedPrice: supplyPrice, 
            originalPrice: supplyPrice, 
            hasDiscount: false 
        };
    };

    // Lấy danh sách unique values cho filters
    const uniqueBookFormats = useMemo(() => {
        const formats = new Set<string>();
        products.forEach(p => {
            if (p.bookFormat) formats.add(p.bookFormat);
        });
        return Array.from(formats).sort();
    }, [products]);

    const uniqueAuthors = useMemo(() => {
        const authors = new Set<string>();
        products.forEach(p => {
            if (p.author) authors.add(p.author);
        });
        return Array.from(authors).sort();
    }, [products]);

    // Filter products
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const keyword = searchTerm.toLowerCase();
            const matchSearch = !keyword || p.title.toLowerCase().includes(keyword);

            const matchFormat = !filters.bookFormat || p.bookFormat === filters.bookFormat;

            const matchAuthor = !filters.author || (p.author && p.author.toLowerCase().includes(filters.author.toLowerCase()));

            const matchPriceRange = !filters.priceRange || (() => {
                const price = p.supplyPrice || 0;
                switch (filters.priceRange) {
                    case "under100k":
                        return price < 100000;
                    case "100k-200k":
                        return price >= 100000 && price < 200000;
                    case "200k-300k":
                        return price >= 200000 && price < 300000;
                    case "over300k":
                        return price >= 300000;
                    default:
                        return true;
                }
            })();

            return matchSearch && matchFormat && matchAuthor && matchPriceRange;
        });
    }, [products, searchTerm, filters]);

    // Pagination
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredProducts, currentPage, itemsPerPage]);

    const handleChangeFilter = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleConfirmMulti = () => {
        const selected = products.filter((p) => selectedIds.has(String(p.id)));
        onSelect(selected);
        onClose();
    };

    return (
        <>
            {/* OVERLAY */}
            <div
                className="fixed inset-0 bg-black/80 z-[900]"
                onClick={onClose}
            ></div>

            {/* MODAL */}
            <div
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] max-h-[90vh] bg-white shadow-xl rounded-lg p-4 z-[999] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-3 flex-shrink-0">
                    <h2 className="text-lg font-semibold">Chọn sản phẩm</h2>
                    <button
                        className="text-gray-500 hover:text-red-500 text-xl"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                {/* Bộ lọc */}
                {/*<div className="grid grid-cols-4 gap-3 mb-3">*/}
                {/*    <div>*/}
                {/*        <label className="text-sm font-medium block mb-1">*/}
                {/*            Tên sách*/}
                {/*        </label>*/}
                {/*        <input*/}
                {/*            type="text"*/}
                {/*            className="w-full border px-3 py-2 rounded-md"*/}
                {/*            value={filters.title}*/}
                {/*            onChange={(e) =>*/}
                {/*                handleChangeFilter("title", e.target.value)*/}
                {/*            }*/}
                {/*            placeholder="Tên..."*/}
                {/*        />*/}
                {/*    </div>*/}

                {/*    /!*<div>*!/*/}
                {/*    /!*    <label className="text-sm font-medium block mb-1">Size</label>*!/*/}
                {/*    /!*    <select*!/*/}
                {/*    /!*        className="w-full border px-3 py-2 rounded-md"*!/*/}
                {/*    /!*        value={filters.size}*!/*/}
                {/*    /!*        onChange={(e) =>*!/*/}
                {/*    /!*            handleChangeFilter("size", e.target.value)*!/*/}
                {/*    /!*        }*!/*/}
                {/*    /!*    >*!/*/}
                {/*    /!*        <option value="">Tất cả</option>*!/*/}
                {/*    /!*        <option value="M">M</option>*!/*/}
                {/*    /!*        <option value="L">L</option>*!/*/}
                {/*    /!*        <option value="42">42</option>*!/*/}
                {/*    /!*    </select>*!/*/}
                {/*    /!*</div>*!/*/}

                {/*    /!*<div>*!/*/}
                {/*    /!*    <label className="text-sm font-medium block mb-1">Màu sắc</label>*!/*/}
                {/*    /!*    <select*!/*/}
                {/*    /!*        className="w-full border px-3 py-2 rounded-md"*!/*/}
                {/*    /!*        value={filters.color}*!/*/}
                {/*    /!*        onChange={(e) =>*!/*/}
                {/*    /!*            handleChangeFilter("color", e.target.value)*!/*/}
                {/*    /!*        }*!/*/}
                {/*    /!*    >*!/*/}
                {/*    /!*        <option value="">Tất cả</option>*!/*/}
                {/*    /!*        <option value="Trắng">Trắng</option>*!/*/}
                {/*    /!*        <option value="Xanh">Xanh</option>*!/*/}
                {/*    /!*    </select>*!/*/}
                {/*    /!*</div>*!/*/}

                {/*    /!*<div>*!/*/}
                {/*    /!*    <label className="text-sm font-medium block mb-1">*!/*/}
                {/*    /!*        Thương hiệu*!/*/}
                {/*    /!*    </label>*!/*/}
                {/*    /!*    <select*!/*/}
                {/*    /!*        className="w-full border px-3 py-2 rounded-md"*!/*/}
                {/*    /!*        value={filters.brand}*!/*/}
                {/*    /!*        onChange={(e) =>*!/*/}
                {/*    /!*            handleChangeFilter("brand", e.target.value)*!/*/}
                {/*    /!*        }*!/*/}
                {/*    /!*    >*!/*/}
                {/*    /!*        <option value="">Tất cả</option>*!/*/}
                {/*    /!*        <option value="Local Brand A">Local Brand A</option>*!/*/}
                {/*    /!*        <option value="Local Brand B">Local Brand B</option>*!/*/}
                {/*    /!*        <option value="Local Brand C">Local Brand C</option>*!/*/}
                {/*    /!*    </select>*!/*/}
                {/*    /!*</div>*!/*/}
                {/*</div>*/}

                {/* SEARCH */}
                <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm theo tên..."
                    className="w-full border px-3 py-1.5 rounded-md mb-3 text-sm flex-shrink-0"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset về trang 1 khi search
                    }}
                />

                {/* BỘ LỌC */}
                <div className="grid grid-cols-3 gap-2 mb-3 flex-shrink-0">
                    {/* Loại bìa */}
                    <div>
                        <label className="text-sm font-medium block mb-1">
                            Loại bìa
                        </label>
                        <select
                            className="w-full border px-3 py-2 rounded-md"
                            value={filters.bookFormat}
                            onChange={(e) => {
                                setFilters(prev => ({...prev, bookFormat: e.target.value}));
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">Tất cả</option>
                            {uniqueBookFormats.map(format => (
                                <option key={format} value={format}>{format}</option>
                            ))}
                        </select>
                    </div>

                    {/* Khoảng giá */}
                    <div>
                        <label className="text-sm font-medium block mb-1">
                            Khoảng giá
                        </label>
                        <select
                            className="w-full border px-3 py-2 rounded-md"
                            value={filters.priceRange}
                            onChange={(e) => {
                                setFilters(prev => ({...prev, priceRange: e.target.value}));
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">Tất cả</option>
                            <option value="under100k">Dưới 100.000đ</option>
                            <option value="100k-200k">100.000đ - 200.000đ</option>
                            <option value="200k-300k">200.000đ - 300.000đ</option>
                            <option value="over300k">Trên 300.000đ</option>
                        </select>
                    </div>

                    {/* Tác giả */}
                    <div>
                        <label className="text-sm font-medium block mb-1">
                            Tác giả
                        </label>
                        <input
                            type="text"
                            className="w-full border px-3 py-2 rounded-md"
                            value={filters.author}
                            onChange={(e) => {
                                setFilters(prev => ({...prev, author: e.target.value}));
                                setCurrentPage(1);
                            }}
                            placeholder="Tìm theo tác giả..."
                        />
                    </div>
                </div>

                {/* Chọn tất cả sản phẩm - chỉ hiển thị khi multi mode */}
                {multi && filteredProducts.length > 0 && (
                    <div className="mb-2 flex items-center gap-2 pb-2 border-b flex-shrink-0">
                        <input
                            type="checkbox"
                            id="select-all-products"
                            checked={
                                filteredProducts.length > 0 &&
                                filteredProducts.every((p) => selectedIds.has(String(p.id)))
                            }
                            onChange={(e) => {
                                if (e.target.checked) {
                                    // Chọn tất cả sản phẩm đã lọc
                                    const allIds = new Set(selectedIds);
                                    filteredProducts.forEach((p) => {
                                        allIds.add(String(p.id));
                                    });
                                    setSelectedIds(allIds);
                                } else {
                                    // Bỏ chọn tất cả sản phẩm đã lọc
                                    const filteredIds = new Set(
                                        filteredProducts.map((p) => String(p.id))
                                    );
                                    const remainingIds = new Set(
                                        Array.from(selectedIds).filter(
                                            (id) => !filteredIds.has(id)
                                        )
                                    );
                                    setSelectedIds(remainingIds);
                                }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded cursor-pointer"
                        />
                        <label
                            htmlFor="select-all-products"
                            className="text-sm font-medium text-gray-700 cursor-pointer"
                        >
                            Chọn tất cả sản phẩm
                            {filteredProducts.length > 0 && (
                                <span className="text-gray-500 font-normal ml-1">
                                    ({filteredProducts.length} sản phẩm)
                                </span>
                            )}
                        </label>
                    </div>
                )}

                {/* PRODUCT LIST */}
                <div className="grid grid-cols-3 gap-3 flex-1 overflow-y-auto mb-3 min-h-0">
                    {paginatedProducts.length > 0 ? (
                        paginatedProducts.map((item) => (
                            <div
                                key={item.id}
                                className={`border rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-pointer relative ${
                                    multi && selectedIds.has(String(item.id))
                                        ? "border-blue-500 ring-2 ring-blue-200"
                                        : ""
                                }`}
                                onClick={() => {
                                    if (multi) {
                                        toggleSelect(String(item.id));
                                    } else {
                                        onSelect({ ...item, quantity: 1 });
                                        onClose();
                                    }
                                }}
                            >
                                {multi && (
                                    <div className="absolute top-2 right-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(String(item.id))}
                                            readOnly
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                                        />
                                    </div>
                                )}
                                {/* Badge phần trăm giảm giá - góc trên bên trái */}
                                {(() => {
                                    const { discountedPrice, originalPrice, hasDiscount } = calculateDiscountedPrice(item);
                                    if (hasDiscount && originalPrice > 0) {
                                        const discountPercent = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
                                        if (discountPercent > 0) {
                                            return (
                                                <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold shadow-md z-10">
                                                    -{discountPercent}%
                                                </div>
                                            );
                                        }
                                    }
                                    return null;
                                })()}
                                <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-16 h-20 mx-auto mb-2 object-cover"
                                />
                                <div className="text-center font-semibold text-xs line-clamp-2">{item.title}</div>
                                {item.bookFormat && (
                                    <div className="text-center text-xs text-gray-500 mt-0.5">
                                        {item.bookFormat}
                                    </div>
                                )}
                                <div className="text-center mt-1">
                                    {(() => {
                                        const { discountedPrice, originalPrice, hasDiscount } = calculateDiscountedPrice(item);
                                        // Đảm bảo giá trị là số hợp lệ trước khi gọi toLocaleString
                                        const safeDiscountedPrice = Number(discountedPrice) || 0;
                                        const safeOriginalPrice = Number(originalPrice) || 0;
                                        return (
                                            <div className="space-y-1">
                                                <div className="text-red-600 font-bold">
                                                    {safeDiscountedPrice.toLocaleString()}đ
                                                </div>
                                                {hasDiscount && (
                                                    <div className="text-gray-500 text-xs line-through">
                                                        {safeOriginalPrice.toLocaleString()}đ
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="text-center text-xs text-gray-500 mt-0.5 font-medium">
                                    {"Còn: " + (item.stock ?? 0)}
                                </div>

                            </div>
                        ))
                    ) : (
                        <div className="col-span-3 text-center py-8 text-gray-500">
                            Không tìm thấy sản phẩm nào
                        </div>
                    )}
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t flex-shrink-0">
                        <div className="text-sm text-gray-600">
                            Hiển
                            thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)} / {filteredProducts.length} sản
                            phẩm
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                className="px-3 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                ‹ Trước
                            </button>
                            <div className="flex gap-1">
                                {Array.from({length: totalPages}, (_, i) => i + 1)
                                    .filter(page => {
                                        // Hiển thị trang đầu, cuối, và các trang xung quanh trang hiện tại
                                        if (totalPages <= 7) return true;
                                        if (page === 1 || page === totalPages) return true;
                                        if (Math.abs(page - currentPage) <= 1) return true;
                                        return false;
                                    })
                                    .map((page, index, array) => {
                                        // Thêm dấu ... nếu có khoảng trống
                                        const prevPage = array[index - 1];
                                        const showEllipsis = prevPage && page - prevPage > 1;
                                        return (
                                            <div key={page} className="flex items-center gap-1">
                                                {showEllipsis && <span className="px-2">...</span>}
                                                <button
                                                    className={`px-3 py-1 border rounded-md ${
                                                        currentPage === page
                                                            ? "bg-blue-600 text-white border-blue-600"
                                                            : "hover:bg-gray-50"
                                                    }`}
                                                    onClick={() => setCurrentPage(page)}
                                                >
                                                    {page}
                                                </button>
                                            </div>
                                        );
                                    })}
                            </div>
                            <button
                                className="px-3 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Sau ›
                            </button>
                        </div>
                    </div>
                )}

                {/* Nút xác nhận khi chọn nhiều sản phẩm */}
                {multi && (
                    <div className="mt-2 pt-2 border-t flex items-center justify-between flex-shrink-0">
                        <div className="text-sm text-gray-600">
                            Đã chọn{" "}
                            <span className="font-semibold">
                                {selectedIds.size}
                            </span>{" "}
                            sản phẩm
                        </div>
                        <button
                            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={selectedIds.size === 0}
                            onClick={handleConfirmMulti}
                        >
                            Xác nhận
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
