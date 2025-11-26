"use client";
import React, {useEffect, useRef, useState} from "react";
import TableActionButtons from "@/components/custom/TableActionButtons";
import Button from "@/components/ui/button/Button";
import {getVND} from "@/lib/formatters";
import ProductInfoCard from "@/components/custom/ProductInfoCard";
import {useBookSingle} from "@/hooks/api-calls/useBookSingle";
import {useParams} from "next/navigation";
import {useBookDetail} from "@/hooks/api-calls/useBookDetail";
import {useModal} from "@/hooks/useModal";
import {Modal} from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Form from "@/components/form/Form";
import {deserializeBook} from "@/lib/serializers";
import {BaseProperty} from "@/components/custom/MultiSelectCreatable";


const ProductDetailTable: React.FC = () => {
    const params = useParams();
    const {isOpen, openModal, closeModal} = useModal();
    const bookId = params.id?.toString();
    const bookFetch = useBookSingle(bookId);
    const {bookDetailCreate, bookDetailDelete} = useBookDetail(params.id!.toString());

    const [formData, setFormData] = useState({
        attributes: {
            id: 0,
            title: "",
            edition: "",
            language: "",
            published: "",
            imageUrl: "",
            blurb: "",
        },
        relationships: {
            genres: [] as BaseProperty[],
            creators: [] as BaseProperty[],
            publisher: null as BaseProperty | null,
            series: null as BaseProperty | null,
            bookCopies: [] as any[]
        }
    });

    const initEditingItem = {
        id: 0,
        isbn: "",
        bookFormat: "",
        dimensions: "",
        printLength: "",
        stock: "",
        price: "",
    };

    const isEditing = useRef(false);
    const [editingItem, setEditingItem] = useState(initEditingItem);

    useEffect(() => {
        if (!bookFetch.isSuccess) return;
        setFormData(deserializeBook(bookFetch.data.data));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookFetch.dataUpdatedAt]);


    if (bookFetch.isLoading) return <p className="p-6">Loading...</p>;
    const book = bookFetch.data.data;
    const items: any[] = formData.relationships.bookCopies;
    const sortedItems = [...items].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );


    async function handleSubmit(e) {
        e.preventDefault();
        // Build updatedFormData locally — do NOT push to state
        const updated = structuredClone(formData);
        const list = updated.relationships.bookCopies ?? [];

        if (editingItem.id === 0) {
            list.push({...editingItem});
        } else {
            // update existing bookCopy
            const idx = list.findIndex(bc => String(bc.id) === String(editingItem.id));
            if (idx !== -1) {
                list[idx] = {...editingItem};
            } else {
                list.push({...editingItem});
            }
        }

        updated.relationships.bookCopies = list;

        // do NOT setFormData(updated) else an id:0 entry would be pushed into state
        // mutate, refetch on success will refresh state
        bookDetailCreate.mutate(updated);

        closeModal();
        setEditingItem(initEditingItem);
    }


    return (
        <div>
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
                                    setEditingItem(initEditingItem);
                                    isEditing.current = false;
                                    openModal();
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
                                No.
                            </th>
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
                        {sortedItems.map((e, i) => (
                            <tr
                                key={e.id}
                                className="transition hover:bg-gray-50 dark:hover:bg-gray-900"
                            >
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {i + 1}</p>
                                </td>
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
                                        {getVND(e.price)}</p>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {e.stock}</p>
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
                      {/*  {e.enabled}*/}
                  </span>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <TableActionButtons
                                        viewLink={`/book/${e.id}`}
                                        onEdit={() => {
                                            setEditingItem(e);
                                            isEditing.current = true;
                                            openModal();
                                        }}
                                        onDelete={() => {
                                            bookDetailDelete.mutate(e.id);
                                        }}
                                        enableButtons={{
                                            view: false,
                                            edit: true,
                                            delete: true,
                                        }
                                        }
                                    ></TableActionButtons>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Modal
                isOpen={isOpen}
                onClose={closeModal}
                className="max-w-[584px] p-5 lg:p-10"
            >
                <Form onSubmit={handleSubmit}>
                    <h4 className="mb-6 text-lg font-medium text-gray-800 dark:text-white/90">
                        Book Detail
                    </h4>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                        <div>
                            <Label>ISBN</Label>
                            <Input placeholder="title"
                                   value={editingItem.isbn}
                                   onChange={(e) =>
                                       setEditingItem(prev => ({...prev, isbn: e.target.value}))
                                   }
                            />
                        </div>

                        <div>
                            <Label>Format</Label>
                            <Input placeholder="title"
                                   value={editingItem.bookFormat}
                                   onChange={(e) =>
                                       setEditingItem(prev => ({...prev, bookFormat: e.target.value}))
                                   }/>
                        </div>

                        <div>
                            <Label>Length</Label>
                            <Input placeholder="title"
                                   value={editingItem.printLength}
                                   onChange={(e) =>
                                       setEditingItem(prev => ({...prev, printLength: e.target.value}))
                                   }/>
                        </div>

                        <div>
                            <Label>Dimensions</Label>
                            <Input placeholder="title"
                                   value={editingItem.dimensions}
                                   onChange={(e) =>
                                       setEditingItem(prev => ({...prev, dimensions: e.target.value}))
                                   }/>
                        </div>

                        <div>
                            <Label>Price</Label>
                            <Input placeholder="title"
                                   value={editingItem.price}
                                   onChange={(e) =>
                                       setEditingItem(prev => ({...prev, price: e.target.value}))
                                   }/>
                        </div>

                        <div>
                            <Label>Stock</Label>
                            <Input placeholder="title"
                                   value={editingItem.stock}
                                   onChange={(e) =>
                                       setEditingItem(prev => ({...prev, stock: e.target.value}))
                                   }/>
                        </div>

                    </div>
                    <div className="flex items-center justify-end w-full gap-3 mt-6">
                        <Button size="sm" variant="outline" onClick={closeModal}>
                            Close
                        </Button>
                        <Button size="sm">
                            Save Changes
                        </Button>
                    </div>
                </Form>
            </Modal>

        </div>)
        ;
};

export default ProductDetailTable;
