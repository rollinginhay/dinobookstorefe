"use client";
import React, {JSX, useEffect, useRef, useState} from "react";
import TableActionButtons from "@/components/custom/TableActionButtons";
import Button from "@/components/ui/button/Button";
import {useBook} from "@/hooks/api-calls/useBook";
import {useBookProperty} from "@/hooks/api-calls/useBookProperty";
import {getDisplayDate, getVND} from "@/lib/formatters";
import Link from "@/components/ui/links/Link";
import {ChevronDownIcon} from "@/icons";
import Input from "@/components/form/input/InputField";


const ProductListTable: React.FC = () => {
    const [displayLimit, setDisplayLimit] = useState<number>(10); // Số items hiển thị mỗi trang
    const [limitInput, setLimitInput] = useState(displayLimit.toString());
    const [fetchLimit] = useState<number>(1000); // Fetch nhiều books để đủ data cho filter

    const [page, setPage] = useState(0);
    const [inputValue, setInputValue] = useState(page + 1); //page smart input state
    const [searchInput, setSearchInput] = useState("");
    const [keyword, setKeyword] = useState("");
    const [enabled, setEnabled] = useState<boolean | null>(null);
    const [selectedGenre, setSelectedGenre] = useState<string>("");
    const [selectedPublisher, setSelectedPublisher] = useState<string>("");
    const [selectedCreator, setSelectedCreator] = useState<string>("");
    const [showFilters, setShowFilters] = useState(false);
    const [hoveredBookId, setHoveredBookId] = useState<number | null>(null);
    const [startPublishedDate, setStartPublishedDate] = useState<string>("");
    const [endPublishedDate, setEndPublishedDate] = useState<string>("");
    
    // Fetch filter options
    const {propertyQuery: genreQuery} = useBookProperty("genre", 0, 100, true);
    const {propertyQuery: publisherQuery} = useBookProperty("publisher", 0, 100, true);
    const {propertyQuery: creatorQuery} = useBookProperty("creator", 0, 100, true);


    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Fetch tất cả books (không dùng pagination từ API) để có đủ data cho filter
    const {bookQuery, bookDelete} = useBook(0, fetchLimit, enabled ?? true, keyword);

    const formRef: any = useRef(null);

    useEffect(() => {
        if (!showForm) return;

        function handleClick(e: MouseEvent) {
            if (formRef.current && !formRef.current.contains(e.target)) {
                setShowForm(false);
                setEditingItem(null);
            }
        }

        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [showForm]);

    useEffect(() => {
        setInputValue(page + 1);
    }, [page]);

    if (bookQuery.isLoading || genreQuery.isLoading || publisherQuery.isLoading || creatorQuery.isLoading) {
        return <p className="p-6">Đang tải...</p>;
    }
    const resBody = bookQuery.data;
    const items: any[] = resBody?.data || [];
    const meta = resBody?.meta;
    
    // Tạo mảng rows để hiển thị: mỗi copy là một row (bao gồm cả ngừng bán)
    const tableRows: any[] = [];
    items.forEach((book) => {
        const allCopies = book.bookCopies?.data || [];
        allCopies.forEach((copy: any, copyIndex: number) => {
            tableRows.push({
                bookId: book.id,
                bookTitle: book.title,
                bookEnabled: book.enabled,
                book: book, // Lưu toàn bộ book để filter
                copy: copy,
                isFirstCopy: copyIndex === 0, // Để biết có merge cell không
                totalCopies: allCopies.length
            });
        });
    });
    
    // Apply filters
    let filteredRows = tableRows;
    if (selectedGenre) {
        filteredRows = filteredRows.filter(row => 
            row.book.genres?.data?.some((g: any) => String(g.id) === selectedGenre)
        );
    }
    if (selectedPublisher) {
        filteredRows = filteredRows.filter(row => 
            row.book.publisher?.data && String(row.book.publisher.data.id) === selectedPublisher
        );
    }
    if (selectedCreator) {
        filteredRows = filteredRows.filter(row => 
            row.book.creators?.data?.some((c: any) => String(c.id) === selectedCreator)
        );
    }
    if (enabled !== null) {
        filteredRows = filteredRows.filter(row => row.copy.enabled === enabled);
    }
    if (startPublishedDate) {
        filteredRows = filteredRows.filter(row => {
            const published = row.book.attributes?.published || row.book.published;
            if (!published) return false;
            const bookDate = new Date(published);
            const filterStartDate = new Date(startPublishedDate);
            filterStartDate.setHours(0, 0, 0, 0);
            return bookDate >= filterStartDate;
        });
    }
    if (endPublishedDate) {
        filteredRows = filteredRows.filter(row => {
            const published = row.book.attributes?.published || row.book.published;
            if (!published) return false;
            const bookDate = new Date(published);
            const filterEndDate = new Date(endPublishedDate);
            filterEndDate.setHours(23, 59, 59, 999);
            return bookDate <= filterEndDate;
        });
    }
    
    // Tính lại totalCopies và isFirstCopy sau khi filter
    const bookGroups: { [key: string]: any[] } = {};
    filteredRows.forEach(row => {
        const bookKey = String(row.bookId);
        if (!bookGroups[bookKey]) {
            bookGroups[bookKey] = [];
        }
        bookGroups[bookKey].push(row);
    });
    
    // Cập nhật totalCopies và isFirstCopy cho mỗi row
    filteredRows = filteredRows.map(row => {
        const bookKey = String(row.bookId);
        const groupRows = bookGroups[bookKey];
        const indexInGroup = groupRows.findIndex(r => r.copy.id === row.copy.id);
        return {
            ...row,
            totalCopies: groupRows.length,
            isFirstCopy: indexInGroup === 0
        };
    });
    
    // Pagination cho filtered rows - hiển thị 10 items mỗi trang
    const totalFilteredPages = Math.ceil(filteredRows.length / displayLimit);
    const startIndex = page * displayLimit;
    const endIndex = startIndex + displayLimit;
    const paginatedRows = filteredRows.slice(startIndex, endIndex);

    const handleSearchSubmit = () => {
        setKeyword(searchInput);
        setPage(0);
    }


    // const [sort, setSort] = useState<Sort>({key: "name", asc: true});
    // const [page, setPage] = useState(1);
    // const [perPage] = useState(7);
    // // const [showFilter, setShowFilter] = useState(false);

    // const sortedProducts = () => {
    //     return [...products].sort((a, b) => {
    //         let valA = a[sort.key];
    //         let valB = b[sort.key];
    //         if (sort.key === "price") {
    //             valA = parseFloat(String(valA).replace(/[^\d.]/g, ""));
    //             valB = parseFloat(String(valB).replace(/[^\d.]/g, ""));
    //         }
    //         if (valA < valB) return sort.asc ? -1 : 1;
    //         if (valA > valB) return sort.asc ? 1 : -1;
    //         return 0;
    //     });
    // };

    // const paginatedProducts = () => {
    //     const start = (page - 1) * perPage;
    //     return sortedProducts().slice(start, start + perPage);
    // };

    // Tính total pages dựa trên filtered rows
    const totalPages = totalFilteredPages > 0 ? totalFilteredPages : 1;

    const goToPage = (n: number) => {
        if (n >= 0 && n <= totalPages - 1) setPage(n);
    };

    const prevPage = () => {
        if (page > 0) setPage(page - 1);
    };

    const nextPage = () => {
        if (page < totalPages - 1) setPage(page + 1);
    };


    // const sortBy = (key: keyof Product) => {
    //     setSort((prev) => ({
    //         key,
    //         asc: prev.key === key ? !prev.asc : true,
    //     }));
    // };

    /*
    TODO: toggle book form
     */
    return (
        <div>

            {/*{showForm && (*/}
            {/*    <div className="fixed inset-0 bg-black/30 z-50 overflow-auto">*/}
            {/*        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">*/}
            {/*            <div ref={formRef} className="w-auto h-auto">*/}
            {/*                <ProductPropertyForm*/}
            {/*                    editData={editingItem}*/}
            {/*                    property={selectedProperty.value}*/}
            {/*                    onClose={() => {*/}
            {/*                        setShowForm(false);*/}
            {/*                        setEditingItem(null);*/}
            {/*                    }}*/}
            {/*                />*/}
            {/*            </div>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*)}*/}
            <div
                className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">


                <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-3 sm:justify-between items-center">
                            <div className="flex gap-3 items-center">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="inline-flex items-center gap-2"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                    >
                                        <path
                                            d="M2 4H14M4 8H12M6 12H10"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    {showFilters ? "Ẩn bộ lọc" : "Hiển thị bộ lọc"}
                                </Button>
                                <div className="relative flex-1 sm:flex-auto">
                <span className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <svg
                      className="fill-current"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M3.04199 9.37336937363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"
                        fill=""
                    />
                  </svg>
                </span>
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm theo tiêu đề..."
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleSearchSubmit();
                                            }
                                        }}
                                        className="shadow-sm focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pr-4 pl-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-none sm:w-[300px] sm:min-w-[300px] dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                                    />
                                </div>
                            </div>
                            <Button
                                className="bg-brand-500 shadow-sm hover inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                >
                                    <path
                                        d="M5 10.0002H15.0006M10.0002 5V15.0006"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                <Link href="/create-book">Tạo mới</Link>
                            </Button>
                        </div>
                        
                        {showFilters && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Thể loại
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedGenre}
                                            onChange={(e) => {
                                                setSelectedGenre(e.target.value);
                                                setPage(0);
                                            }}
                                            className="h-10 w-full appearance-none rounded-lg border border-gray-300 
                                              bg-transparent px-3 py-2 pr-8 text-sm shadow-sm
                                              placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden 
                                              focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 
                                              dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 
                                              dark:focus:border-brand-800"
                                        >
                                            <option value="">Tất cả thể loại</option>
                                            {genreQuery.data?.data?.map((genre: any) => (
                                                <option key={genre.id} value={genre.id}>
                                                    {genre.name}
                                                </option>
                                            ))}
                                        </select>
                                        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-2 top-1/2 dark:text-gray-400">
                                            <ChevronDownIcon />
                                        </span>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Nhà xuất bản
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedPublisher}
                                            onChange={(e) => {
                                                setSelectedPublisher(e.target.value);
                                                setPage(0);
                                            }}
                                            className="h-10 w-full appearance-none rounded-lg border border-gray-300 
                                              bg-transparent px-3 py-2 pr-8 text-sm shadow-sm
                                              placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden 
                                              focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 
                                              dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 
                                              dark:focus:border-brand-800"
                                        >
                                            <option value="">Tất cả nhà xuất bản</option>
                                            {publisherQuery.data?.data?.map((publisher: any) => (
                                                <option key={publisher.id} value={publisher.id}>
                                                    {publisher.name}
                                                </option>
                                            ))}
                                        </select>
                                        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-2 top-1/2 dark:text-gray-400">
                                            <ChevronDownIcon />
                                        </span>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Tác giả
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedCreator}
                                            onChange={(e) => {
                                                setSelectedCreator(e.target.value);
                                                setPage(0);
                                            }}
                                            className="h-10 w-full appearance-none rounded-lg border border-gray-300 
                                              bg-transparent px-3 py-2 pr-8 text-sm shadow-sm
                                              placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden 
                                              focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 
                                              dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 
                                              dark:focus:border-brand-800"
                                        >
                                            <option value="">Tất cả tác giả</option>
                                            {creatorQuery.data?.data?.map((creator: any) => (
                                                <option key={creator.id} value={creator.id}>
                                                    {creator.name}
                                                </option>
                                            ))}
                                        </select>
                                        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-2 top-1/2 dark:text-gray-400">
                                            <ChevronDownIcon />
                                        </span>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Trạng thái
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={enabled === null ? "" : enabled ? "true" : "false"}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setEnabled(value === "" ? null : value === "true");
                                                setPage(0);
                                            }}
                                            className="h-10 w-full appearance-none rounded-lg border border-gray-300 
                                              bg-transparent px-3 py-2 pr-8 text-sm shadow-sm
                                              placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden 
                                              focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 
                                              dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 
                                              dark:focus:border-brand-800"
                                        >
                                            <option value="">Tất cả</option>
                                            <option value="true">Đang bán</option>
                                            <option value="false">Ngừng bán</option>
                                        </select>
                                        <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-2 top-1/2 dark:text-gray-400">
                                            <ChevronDownIcon />
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Khoảng cách giữa 4 trường đầu và 2 trường ngày xuất bản */}
                                <div className="hidden lg:block"></div>
                                
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Ngày xuất bản từ
                                    </label>
                                    <Input
                                        type="date"
                                        value={startPublishedDate}
                                        onChange={(e) => {
                                            setStartPublishedDate(e.target.value);
                                            setPage(0);
                                        }}
                                        className="h-10"
                                    />
                                </div>
                                
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                        Ngày xuất bản đến
                                    </label>
                                    <Input
                                        type="date"
                                        value={endPublishedDate}
                                        onChange={(e) => {
                                            setEndPublishedDate(e.target.value);
                                            setPage(0);
                                        }}
                                        className="h-10"
                                        min={startPublishedDate || undefined}
                                    />
                                </div>
                                
                                {(selectedGenre || selectedPublisher || selectedCreator || enabled !== null || startPublishedDate || endPublishedDate) && (
                                    <div className="sm:col-span-2 lg:col-span-7 flex justify-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedGenre("");
                                                setSelectedPublisher("");
                                                setSelectedCreator("");
                                                setEnabled(null);
                                                setStartPublishedDate("");
                                                setEndPublishedDate("");
                                                setPage(0);
                                            }}
                                        >
                                            Xóa bộ lọc
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full">
                        <thead>
                        <tr className="border-b border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                            <th
                                // onClick={() => sortBy("name")}
                                className="cursor-pointer px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                            >
                                <div className="flex items-center gap-3">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        STT
                                    </p>
                                </div>
                            </th>
                            <th
                                // onClick={() => sortBy("name")}
                                className="cursor-pointer px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                            >
                                <div className="flex items-center gap-3">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Mã sách
                                    </p>
                                </div>
                            </th>
                            <th
                                // onClick={() => sortBy("name")}
                                className="cursor-pointer px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                            >
                                <div className="flex items-center gap-3">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Tên sách
                                    </p>
                                </div>
                            </th>
                            <th
                                className="cursor-pointer px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                            >
                                <div className="flex items-center gap-3">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Định dạng
                                    </p>
                                </div>
                            </th>
                            <th
                                className="cursor-pointer px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                            >
                                <div className="flex items-center gap-3">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        ISBN
                                    </p>
                                </div>
                            </th>
                            <th
                                className="cursor-pointer px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                            >
                                <div className="flex items-center gap-3">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Giá
                                    </p>
                                </div>
                            </th>
                            <th
                                className="cursor-pointer px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                            >
                                <div className="flex items-center gap-3">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Tồn kho
                                    </p>
                                </div>
                            </th>
                            <th
                                onClick={() => setEnabled(!enabled)}
                                className="cursor-pointer px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                            >
                                <div className="flex items-center gap-3">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Trạng thái
                                    </p>
                                    <span className="flex flex-col gap-0.5">
                    <svg
                        // className={
                        //     sort.key === "price" && sort.asc
                        //         ? "text-gray-500 dark:text-gray-400"
                        //         : "text-gray-300"
                        // }
                        width="8"
                        height="5"
                        viewBox="0 0 8 5"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                          d="M4.40962 0.585167C4.21057 0.300808 3.78943 0.300807 3.59038 0.585166L1.05071 4.21327C0.81874 4.54466 1.05582 5 1.46033 5H6.53967C6.94418 5 7.18126 4.54466 6.94929 4.21327L4.40962 0.585167Z"
                          fill="currentColor"
                      />
                    </svg>
                    <svg
                        // className={
                        //     sort.key === "price" && !sort.asc
                        //         ? "text-gray-500 dark:text-gray-400"
                        //         : "text-gray-300"
                        // }
                        width="8"
                        height="5"
                        viewBox="0 0 8 5"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                          d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z"
                          fill="currentColor"
                      />
                    </svg>
                  </span>
                                </div>
                            </th>
                            <th
                                className="cursor-pointer px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                            >
                                <div className="flex items-center gap-3">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Ngày xuất bản
                                    </p>
                                </div>
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                Hành động
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                <div className="relative">
                                    <span className="sr-only">Hành động</span>
                                </div>
                            </th>
                        </tr>
                        </thead>
                        <tbody className="divide-x divide-y divide-gray-200 dark:divide-gray-800">
                        {paginatedRows.map((row, i) => {
                            // Tính STT dựa trên vị trí trong filteredRows, không phải paginatedRows
                            const actualIndex = startIndex + i;
                            const isHovered = hoveredBookId === row.bookId;
                            return (
                            <tr
                                key={`${row.bookId}-${row.copy.id}-${i}`}
                                className={`transition ${
                                    isHovered 
                                        ? "bg-gray-50 dark:bg-gray-900" 
                                        : "hover:bg-gray-50 dark:hover:bg-gray-900"
                                }`}
                                onMouseEnter={() => setHoveredBookId(row.bookId)}
                                onMouseLeave={() => setHoveredBookId(null)}
                            >
                                {/* STT - chỉ render khi là copy đầu tiên */}
                                {row.isFirstCopy && (
                                    <td 
                                        className="px-5 py-4 whitespace-nowrap"
                                        rowSpan={row.totalCopies}
                                    >
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {actualIndex + 1}
                                        </p>
                                    </td>
                                )}
                                
                                {/* Mã sách - chỉ render khi là copy đầu tiên */}
                                {row.isFirstCopy && (
                                    <td 
                                        className="px-5 py-4 whitespace-nowrap"
                                        rowSpan={row.totalCopies}
                                    >
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {"B" + row.bookId}
                                        </p>
                                    </td>
                                )}

                                {/* Tên sách - chỉ render khi là copy đầu tiên */}
                                {row.isFirstCopy && (
                                    <td 
                                        className="px-5 py-4 whitespace-nowrap"
                                        rowSpan={row.totalCopies}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                                                {row.bookTitle}
                                            </span>
                                        </div>
                                    </td>
                                )}
                                
                                {/* Định dạng - mỗi copy một dòng */}
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <p className="text-sm text-gray-700 dark:text-gray-400">
                                        {row.copy.bookFormat || "-"}
                                    </p>
                                </td>
                                
                                {/* ISBN - mỗi copy một dòng */}
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <p className="text-sm text-gray-700 dark:text-gray-400">
                                        {row.copy.isbn || "Chưa có ISBN"}
                                    </p>
                                </td>
                                
                                {/* Giá - mỗi copy một dòng */}
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <p className="text-sm text-gray-700 dark:text-gray-400">
                                        {(() => {
                                            const price = row.copy.salePrice;
                                            if (!price || isNaN(price)) {
                                                return "Không có giá";
                                            }
                                            return getVND(price);
                                        })()}
                                    </p>
                                </td>
                                
                                {/* Tồn kho - mỗi copy một dòng */}
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <p className="text-sm text-gray-700 dark:text-gray-400">
                                        {parseInt(row.copy.stock) || 0}
                                    </p>
                                </td>
                                
                                {/* Trạng thái - mỗi copy một dòng */}
                                <td className="px-5 py-4 whitespace-nowrap">
                  <span
                      className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                          row.copy.enabled
                              ? "bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-500"
                              : "bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-500"
                      }`}
                  >
                    {row.copy.enabled ? "Đang bán" : "Ngừng bán"}
                  </span>
                                </td>
                                
                                {/* Ngày xuất bản - merge nếu không phải copy đầu tiên */}
                                {row.isFirstCopy && (
                                    <td 
                                        className="px-5 py-4 whitespace-nowrap"
                                        rowSpan={row.totalCopies}
                                    >
                                        <p className="text-sm text-gray-700 dark:text-gray-400">
                                            {(() => {
                                                const published = row.book.attributes?.published || row.book.published;
                                                return published ? getDisplayDate(published) : "-";
                                            })()}
                                        </p>
                                    </td>
                                )}
                                
                                {/* Hành động - chỉ render khi là copy đầu tiên */}
                                {row.isFirstCopy && (
                                    <td 
                                        className="px-5 py-4"
                                        rowSpan={row.totalCopies}
                                    >
                                        <TableActionButtons
                                            viewLink={`/book/${row.bookId}`}
                                            enableButtons={{
                                                view: true,
                                                edit: false,
                                                delete: false,
                                            }}
                                        />
                                    </td>
                                )}
                            </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
                {/* PAGINATION BLOCK*/}
                <div className="flex items-center w-full border-t border-gray-200 px-5 py-4 dark:border-gray-800">

                    {/* LEFT — LIMIT INPUT */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 dark:text-gray-400">Số dòng:</span>
                        <input
                            type="number"
                            min={1}
                            value={limitInput}
                            onChange={(e) => setLimitInput(e.target.value)}   // only local
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    const value = Number(limitInput);
                                    if (!Number.isFinite(value) || value <= 0) return;

                                    setDisplayLimit(value);  // <-- commit real change
                                    setPage(0);       // optional reset
                                    e.currentTarget.blur(); // optional: unfocus after applying
                                }
                            }}
                            className="h-9 w-20 rounded-lg border border-gray-300 px-2 text-sm text-gray-700
             dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                    </div>

                    {/* CENTER — PAGE INDICATOR */}
                    <div className="flex-1 flex justify-center">
    <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
      Trang {page + 1} / {totalPages}
    </span>
                    </div>

                    {/* RIGHT — PAGINATION BUTTONS */}
                    <div className="flex items-center gap-2">

                        {/* FIRST PAGE */}
                        <button
                            onClick={() => goToPage(0)}
                            disabled={page === 0}
                            className="shadow-sm flex items-center justify-center rounded-lg border border-gray-300 bg-white
                 h-10 px-4 text-gray-700 font-bold hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50
                 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400
                 dark:hover:bg-white/5 dark:hover:text-gray-200"
                        >
                            «
                        </button>

                        {/* PREV PAGE */}
                        <button
                            onClick={prevPage}
                            disabled={page === 0}
                            className="shadow-sm flex items-center justify-center rounded-lg border border-gray-300 bg-white
                 h-10 px-4 text-gray-700 font-bold hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50
                 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400
                 dark:hover:bg-white/5 dark:hover:text-gray-200"
                        >
                            ‹
                        </button>

                        {/* NUMBERED BUTTONS */}
                        <ul className="flex items-center gap-1">
                            {(() => {
                                const buttons: JSX.Element[] = [];

                                let start = Math.max(0, page - 2);
                                let end = start + 5;

                                if (end > totalPages) {
                                    end = totalPages;
                                    start = Math.max(0, end - 5);
                                }

                                for (let i = start; i < end; i++) {
                                    buttons.push(
                                        <li key={i}>
                                            <button
                                                onClick={() => goToPage(i)}
                                                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${
                                                    page === i
                                                        ? "bg-brand-500 text-white"
                                                        : "text-gray-700 dark:text-gray-400 hover:bg-brand-500 hover:text-white dark:hover:text-white"
                                                }`}
                                            >
                                                {i + 1}
                                            </button>
                                        </li>
                                    );
                                }

                                return buttons;
                            })()}
                        </ul>

                        {/* NEXT PAGE */}
                        <button
                            onClick={nextPage}
                            disabled={page === totalPages - 1}
                            className="shadow-sm flex items-center justify-center rounded-lg border border-gray-300 bg-white
                 h-10 px-4 text-gray-700 font-bold hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50
                 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400
                 dark:hover:bg-white/5 dark:hover:text-gray-200"
                        >
                            ›
                        </button>

                        {/* LAST PAGE */}
                        <button
                            onClick={() => goToPage(totalPages - 1)}
                            disabled={page === totalPages - 1}
                            className="shadow-sm flex items-center justify-center rounded-lg border border-gray-300 bg-white
                 h-10 px-4 text-gray-700 font-bold hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50
                 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400
                 dark:hover:bg-white/5 dark:hover:text-gray-200"
                        >
                            »
                        </button>

                    </div>

                </div>
            </div>

        </div>)
        ;
};

export default ProductListTable;
