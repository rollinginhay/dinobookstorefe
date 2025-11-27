"use client";
import React, {useEffect, useRef, useState} from "react";
import TableActionButtons from "@/components/custom/TableActionButtons";
import Button from "@/components/ui/button/Button";
import {useBook} from "@/hooks/api-calls/useBook";
import Image from "next/image";
import {normalizeLocalDateTime} from "@/lib/dateTimeFormatter";


const ProductListTable: React.FC = () => {
    const limit = 6

    ;
    const [page, setPage] = useState(0);
    const [inputValue, setInputValue] = useState(page + 1); //page smart input state
    const [searchInput, setSearchInput] = useState("");
    const [keyword, setKeyword] = useState("");
    const [enabled, setEnabled] = useState(true);


    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const {bookQuery, bookDelete} = useBook(page, limit, enabled, keyword);

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

    if (bookQuery.isLoading) return <p className="p-6">Loading...</p>;
    const resBody = bookQuery.data;
    const items: any[] = resBody?.data;
    const meta = resBody?.meta;

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

    const totalPages = meta.totalPages;

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
                    <div className="flex gap-3 sm:justify-between">
                        <div className="flex gap-3">
                            <Button
                                className="bg-brand-500 shadow-sm hover inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600"
                                onClick={() => {
                                    setEditingItem(null);
                                    setShowForm(true);
                                }}
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
                                Add book
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                    <div className="flex gap-3 sm:justify-between">
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
                                placeholder="Search..."
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
                                        No.
                                    </p>
                                    <span className="flex flex-col gap-0.5">
                    <svg
                        // className={
                        //     sort.key === "name" && sort.asc
                        //         ? "text-gray-500 dark:text-gray-400"
                        //         : "text-gray-300 dark:text-gray-400/50"
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
                        //     sort.key === "name" && !sort.asc
                        //         ? "text-gray-500 dark:text-gray-400"
                        //         : "text-gray-300 dark:text-gray-400/50"
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
                                // onClick={() => sortBy("name")}
                                className="cursor-pointer px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                            >
                                <div className="flex items-center gap-3">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Title
                                    </p>
                                    <span className="flex flex-col gap-0.5">
                    <svg
                        // className={
                        //     sort.key === "name" && sort.asc
                        //         ? "text-gray-500 dark:text-gray-400"
                        //         : "text-gray-300 dark:text-gray-400/50"
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
                        //     sort.key === "name" && !sort.asc
                        //         ? "text-gray-500 dark:text-gray-400"
                        //         : "text-gray-300 dark:text-gray-400/50"
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
                                // onClick={() => sortBy("category")}
                                className="cursor-pointer px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                            >
                                <div className="flex items-center gap-3">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Published
                                    </p>
                                    <span className="flex flex-col gap-0.5">
                    <svg
                        // className={
                        //     sort.key === "category" && sort.asc
                        //         ? "text-gray-500 dark:text-gray-400"
                        //         : "text-gray-300 dark:text-gray-400/50"
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
                        //     sort.key === "category" && !sort.asc
                        //         ? "text-gray-500 dark:text-gray-400"
                        //         : "text-gray-300 dark:text-gray-400/50"
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
                                // onClick={() => sortBy("brand")}
                                className="cursor-pointer px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                            >
                                <div className="flex items-center gap-3">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Created At
                                    </p>
                                    <span className="flex flex-col gap-0.5">
                    <svg
                        // className={
                        //     sort.key === "brand" && sort.asc
                        //         ? "text-gray-500 dark:text-gray-400"
                        //         : "text-gray-300 dark:text-gray-400/50"
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
                        //     sort.key === "brand" && !sort.asc
                        //         ? "text-gray-500 dark:text-gray-400"
                        //         : "text-gray-300 dark:text-gray-400/50"
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
                                        Variations
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
                                onClick={() => setEnabled(!enabled)}
                                className="cursor-pointer px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                            >
                                <div className="flex items-center gap-3">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Status
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
                            <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                Action
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                <div className="relative">
                                    <span className="sr-only">Action</span>
                                </div>
                            </th>
                        </tr>
                        </thead>
                        <tbody className="divide-x divide-y divide-gray-200 dark:divide-gray-800">
                        {items.map((e, i) => (
                            <tr
                                key={e.id}
                                className="transition hover:bg-gray-50 dark:hover:bg-gray-900"
                            >
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {i + 1}
                                    </p>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12">
                                            <Image
                                                width={48}
                                                height={48}
                                                src={e.imageUrl}
                                                className="h-12 w-12 rounded-md"
                                                alt="image"
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                                        {e.title}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <p className="text-sm text-gray-700 dark:text-gray-400">
                                        {normalizeLocalDateTime(e.published)}
                                    </p>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <p className="text-sm text-gray-700 dark:text-gray-400">
                                        {normalizeLocalDateTime(e.createdAt)}
                                    </p>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <p className="text-sm text-gray-700 dark:text-gray-400 pl-4">
                                        {e.bookCopies.data.length}
                                    </p>
                                </td>


                                <td className="px-5 py-4 whitespace-nowrap">
                  <span
                      className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                          e.enabled
                              ? "bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-500"
                              : "bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-500"
                      }`}
                  >
                    {e.enabled ? "Active" : "Disabled"}
                  </span>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <TableActionButtons
                                        viewLink={`/book/${e.id}`}
                                        onEdit={() => {
                                            setEditingItem(e);
                                            setShowForm(true);
                                        }}
                                        onDelete={() => {
                                            bookDelete.mutate(e.id);
                                        }}></TableActionButtons>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                <div
                    className="flex items-center flex-col sm:flex-row justify-between border-t border-gray-200 px-5 py-4 dark:border-gray-800">
                    <div className="pb-3 sm:pb-0">
                    </div>
                    <div
                        className="flex w-full items-center justify-between gap-2 rounded-lg bg-gray-50 p-4 sm:w-auto sm:justify-normal sm:rounded-none sm:bg-transparent sm:p-0 dark:bg-gray-900 dark:sm:bg-transparent">
                        <button
                            onClick={prevPage}
                            disabled={page === 0}
                            className="shadow-sm flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:p-2.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
                        >
            <span>
              <svg
                  className="fill-current"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
              >
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M2.58203 9.99868C2.58174 10.1909 2.6549 10.3833 2.80152 10.53L7.79818 15.5301C8.09097 15.8231 8.56584 15.8233 8.85883 15.5305C9.15183 15.2377 9.152 14.7629 8.85921 14.4699L5.13911 10.7472L16.6665 10.7472C17.0807 10.7472 17.4165 10.4114 17.4165 9.99715C17.4165 9.58294 17.0807 9.24715 16.6665 9.24715L5.14456 9.24715L8.85919 5.53016C9.15199 5.23717 9.15184 4.7623 8.85885 4.4695C8.56587 4.1767 8.09099 4.17685 7.79819 4.46984L2.84069 9.43049C2.68224 9.568 2.58203 9.77087 2.58203 9.99715C2.58203 9.99766 2.58203 9.99817 2.58203 9.99868Z"
                />
              </svg>
            </span>
                        </button>
                        <span className="block text-sm font-medium text-gray-700 sm:hidden dark:text-gray-400">
            Page <span>{page + 1}</span> of <span>{totalPages}</span>
          </span>
                        <ul className="hidden items-center gap-0.5 sm:flex">
                            {/* START PAGE BUTTONS */}
                            {Array.from(
                                {length: Math.min(3, totalPages)}, // show first few pages
                                (_, i) => i
                            ).map((n) => (
                                <li key={`start-${n}`}>
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            goToPage(n);
                                        }}
                                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${
                                            page === n
                                                ? "bg-brand-500 text-white"
                                                : "text-gray-700 dark:text-gray-400 hover:bg-brand-500 hover:text-white dark:hover:text-white"
                                        }`}
                                    >
                                        <span>{n + 1}</span>
                                    </a>
                                </li>
                            ))}

                            {/* PAGE INPUT */}
                            <li>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const num = Number(inputValue);
                                        if (!Number.isFinite(num)) return;
                                        const target = Math.min(Math.max(num - 1, 0), totalPages - 1);
                                        goToPage(target);
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        type="number"
                                        min={1}
                                        max={totalPages}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value as any)}
                                        className="h-10 w-16 rounded-lg border border-gray-300 mx-3 px-1 pl-3 text-center dark:bg-gray-800 dark:text-white"
                                    />
                                </form>
                            </li>

                            {/* END PAGE BUTTONS */}
                            {Array.from(
                                {length: Math.min(3, totalPages)}, // show last few pages
                                (_, i) => totalPages - Math.min(3, totalPages) + i
                            )
                                .filter((n) => n >= 0 && n >= 3) // avoid duplicates when small page count
                                .map((n) => (
                                    <li key={`end-${n}`}>
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                goToPage(n);
                                            }}
                                            className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${
                                                page === n
                                                    ? "bg-brand-500 text-white"
                                                    : "text-gray-700 dark:text-gray-400 hover:bg-brand-500 hover:text-white dark:hover:text-white"
                                            }`}
                                        >
                                            <span>{n + 1}</span>
                                        </a>
                                    </li>
                                ))}

                            {/*{Array.from({length: totalPages}, (_, i) => i).map((n) => (*/}
                            {/*    <li key={n}>*/}
                            {/*        <a*/}
                            {/*            href="#"*/}
                            {/*            onClick={(e) => {*/}
                            {/*                e.preventDefault();*/}
                            {/*                goToPage(n);*/}
                            {/*            }}*/}
                            {/*            className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${*/}
                            {/*                page === n*/}
                            {/*                    ? "bg-brand-500 text-white"*/}
                            {/*                    : "text-gray-700 dark:text-gray-400 hover:bg-brand-500 hover:text-white dark:hover:text-white"*/}
                            {/*            }`}*/}
                            {/*        >*/}
                            {/*            <span>{n + 1}</span>*/}
                            {/*        </a>*/}
                            {/*    </li>*/}
                            {/*))}*/}
                        </ul>
                        <button
                            onClick={nextPage}
                            disabled={page === totalPages - 1}
                            className="shadow-sm flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-2 text-gray-700 hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:p-2.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
                        >
            <span>
              <svg
                  className="fill-current"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
              >
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M17.4165 9.9986C17.4168 10.1909 17.3437 10.3832 17.197 10.53L12.2004 15.5301C11.9076 15.8231 11.4327 15.8233 11.1397 15.5305C10.8467 15.2377 10.8465 14.7629 11.1393 14.4699L14.8594 10.7472L3.33203 10.7472C2.91782 10.7472 2.58203 10.4114 2.58203 9.99715C2.58203 9.58294 2.91782 9.24715 3.33203 9.24715L14.854 9.24715L11.1393 5.53016C10.8465 5.23717 10.8467 4.7623 11.1397 4.4695C11.4327 4.1767 11.9075 4.17685 12.2003 4.46984L17.1578 9.43049C17.3163 9.568 17.4165 9.77087 17.4165 9.99715C17.4165 9.99763 17.4165 9.99812 17.4165 9.9986Z"
                />
              </svg>
            </span>
                        </button>
                    </div>
                </div>
            </div>

        </div>)
        ;
};

export default ProductListTable;
