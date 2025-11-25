"use client";
import React, {JSX, useEffect, useRef, useState} from "react";
import TableActionButtons from "@/components/custom/TableActionButtons";
import PropertyFilterDropdown from "@/components/custom/PropertyFilterDropdown";
import {useBookProperty} from "@/hooks/api-calls/useBookProperty";
import {API_ROUTES_TREE} from "@/lib/routes";
import Button from "@/components/ui/button/Button";
import ProductPropertyForm from "@/components/custom/ProductPropertyForm";
import * as sea from "node:sea";
import {formatLocalDateTime} from "@/lib/formatters";


const ProductPropertyListTable: React.FC = () => {
    const properties = Object.keys(API_ROUTES_TREE.property).map(k => ({
        value: k,
        label: k.charAt(0).toUpperCase() + k.slice(1)
    }));
    const [limit, setLimit] = useState(8);
    const [limitInput, setLimitInput] = useState(limit.toString());

    const [selectedProperty, setSelectedProperty] = useState(properties[0]);
    const [page, setPage] = useState(0);
    const [inputValue, setInputValue] = useState(page + 1); //page smart input state
    const [searchInput, setSearchInput] = useState("");
    const [keyword, setKeyword] = useState("");
    const [enabled, setEnabled] = useState(true);


    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const {propertyQuery, propertyDelete} = useBookProperty(selectedProperty.value, page, limit, enabled, keyword);

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

    if (propertyQuery.isLoading) return <p className="p-6">Loading...</p>;
    const resBody = propertyQuery.data;
    const items: any[] = resBody?.data;
    const meta = resBody?.meta;


    const handleCategoryChange = (p: string) => {
        setSelectedProperty(properties.filter(e => e.value === p)[0]);
        setPage(0);
    };

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


    return (
        <div>

            {showForm && (
                <div className="fixed inset-0 bg-black/30 z-50 overflow-auto">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div ref={formRef} className="w-auto h-auto">
                            <ProductPropertyForm
                                editData={editingItem}
                                property={selectedProperty.value}
                                onClose={() => {
                                    setShowForm(false);
                                    setEditingItem(null);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
            <div
                className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">


                <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                    <div className="flex gap-3 sm:justify-between">
                        <div className="relative flex-1 sm:flex-auto">
                            <PropertyFilterDropdown
                                selectedCategory={selectedProperty.value}
                                categories={properties}
                                onCategoryChange={handleCategoryChange}
                            ></PropertyFilterDropdown>
                        </div>
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
                                Add {selectedProperty.label}
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
                                // onClick={() => sortBy("category")}
                                className="cursor-pointer px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                            >
                                <div className="flex items-center gap-3">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Name
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
                                {/*        <td className="px-5 py-4 whitespace-nowrap">*/}
                                {/*            <div className="flex items-center gap-3">*/}
                                {/*                <div className="h-12 w-12">*/}
                                {/*                    <Image*/}
                                {/*                        width={48}*/}
                                {/*                        height={48}*/}
                                {/*                        src={product.image}*/}
                                {/*                        className="h-12 w-12 rounded-md"*/}
                                {/*                        alt=""*/}
                                {/*                    />*/}
                                {/*                </div>*/}
                                {/*                <span className="text-sm font-medium text-gray-700 dark:text-gray-400">*/}
                                {/*  {product.name}*/}
                                {/*</span>*/}
                                {/*            </div>*/}
                                {/*        </td>*/}
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {i + 1}
                                    </p>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {e.name}
                                    </p>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <p className="text-sm text-gray-700 dark:text-gray-400">
                                        {formatLocalDateTime(e.createdAt)}
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
                                        viewLink={`/${selectedProperty.value}/${e.id}`}
                                        onEdit={() => {
                                            setEditingItem(e);
                                            setShowForm(true);
                                        }}
                                        onDelete={() => {
                                            propertyDelete.mutate(e.id);
                                        }}
                                    enableButtons={{
                                        view: true,
                                        edit: true,
                                        delete: true,
                                    }}
                                    ></TableActionButtons>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center w-full border-t border-gray-200 px-5 py-4 dark:border-gray-800">

                    {/* LEFT — LIMIT INPUT */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 dark:text-gray-400">Rows:</span>
                        <input
                            type="number"
                            min={1}
                            value={limitInput}
                            onChange={(e) => setLimitInput(e.target.value)}   // only local
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    const value = Number(limitInput);
                                    if (!Number.isFinite(value) || value <= 0) return;

                                    setLimit(value);  // <-- commit real change
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
      Page {page + 1} of {totalPages}
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

export default ProductPropertyListTable;
