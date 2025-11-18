"use client";
import React, {useEffect, useRef, useState} from "react";
import TableActionButtons from "@/components/custom/TableActionButtons";
import Button from "@/components/ui/button/Button";
import {useBook} from "@/hooks/api-calls/useBook";
import Image from "next/image";
import {normalizeLocalDateTime} from "@/lib/dateTimeFormatter";
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
    const bookFetch = useBookSingle(useParams().id as any);


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
    const book = bookFetch.data.data;

    console.log(items);

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
                            <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                ISBN
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                Format
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                Length
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                Dimensions
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                Price
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                Stock
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                Created at
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                Status
                            </th>
                            <th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                                Action
                            </th>

                            {/*<th className="px-5 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400">*/}
                            {/*    <div className="relative">*/}
                            {/*        <span className="sr-only">Action</span>*/}
                            {/*    </div>*/}
                            {/*</th>*/}
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
                                        {e.isbn}</p>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {e.bookFormat}</p>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {e.printLength}</p>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {e.dimensions}</p>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {e.price}</p>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {e.stock}</p>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <p className="text-sm text-gray-700 dark:text-gray-400">
                                        {normalizeLocalDateTime(e.createdAt)}
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
