"use client";
import React, {useEffect, useRef, useState} from "react";
import TableActionButtons from "@/components/custom/TableActionButtons";
import Button from "@/components/ui/button/Button";
import {useBook} from "@/hooks/api-calls/useBook";
import Image from "next/image";
import {formatLocalDateTime} from "@/lib/dateTimeFormatter";
import ProductInfoCard from "@/components/custom/ProductInfoCard";
import {Book} from "@/types/appContextTypes";
import {useBookSingle} from "@/hooks/api-calls/useBookSingle";
import {useParams} from "next/navigation";
import {useBookDetail} from "@/hooks/api-calls/useBookDetail";


const ProductDetailTable: React.FC = () => {
    const [enabled, setEnabled] = useState(true);


    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);


    const {bookDetailQuery} = useBookDetail((useParams().id as any));
    const bookFetch = useBookSingle(useParams().id as any).data;


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


    if (bookDetailQuery.isLoading || bookFetch.isLoading) return <p className="p-6">Loading...</p>;
    const resBody = bookDetailQuery.data;
    const items: any[] = resBody?.data;
    const book = bookFetch.data;

    console.log(items)

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
                className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] mb-5">
                <ProductInfoCard book={book}/>
            </div>

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
                                Add bookDetail
                            </Button>
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
                                    <p className="text-sm text-gray-700 dark:text-gray-400">
                                        {formatLocalDateTime(e.createdAt)}
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
                                            // bookDelete.mutate(e.id);
                                        }}></TableActionButtons>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>)
        ;
};

export default ProductDetailTable;
