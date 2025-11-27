"use client";
import React, {useState} from "react";
import {useModal} from "../../hooks/useModal";
import {Modal} from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Image from "next/image";
import {Book} from "@/types/appContextTypes";
import {formatdateForInput, normalizeLocalDateTime} from "@/lib/dateTimeFormatter";

export default function ProductInfoCard({book}) {
    const {isOpen, openModal, closeModal} = useModal();
    const [showBlurb, setShowBlurb] = useState(false);
    const handleSave = () => {
        // Handle save logic here
        closeModal();
    };
    return (
        <>
            <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="h-12 w-12">
                                <Image
                                    width={48}
                                    height={48}
                                    src="/images/product/product-02.jpg"
                                    className="h-12 w-12 rounded-md"
                                    alt="image"
                                />
                            </div>

                            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                                {book.title}
                            </h4>
                        </div>


                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                            <div>
                                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                    Authors
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    {book.creators.data.map(e => e.name).join(", ")}
                                </p>
                            </div>

                            <div>
                                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                    Edition
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    {book.edition}
                                </p>
                            </div>


                            <div>
                                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                    Genres
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    {book.genres.data.map(e => e.name).join(", ")}
                                </p>
                            </div>

                            <div>
                                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                    Publisher
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    {book.publisher.data.name}
                                </p>
                            </div>

                            <div>
                                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                    Published
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    {normalizeLocalDateTime(book.published)}
                                </p>
                            </div>
                            <div>
                                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                                    Series
                                </p>
                                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                    {book.series.data.name}
                                </p>
                            </div>
                        </div>
                    </div>
                    <Button
                        className="bg-emerald-500 shadow-sm hover inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600"
                        // onClick={() => {
                        //     setEditingItem(null);
                        //     setShowForm(true);
                        // }}
                        onClick={openModal}
                    >
                        <svg
                            className="fill-current"
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                                fill=""
                            />
                        </svg>
                        Edit
                    </Button>

                </div>
                <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                    {/*<button*/}
                    {/*    onClick={() => setShowBlurb(!showBlurb)}*/}
                    {/*    className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"*/}
                    {/*>*/}
                    {/*    {showBlurb ? "Hide Blurb" : "Show Blurb"}*/}
                    {/*    <svg*/}
                    {/*        className={`w-4 h-4 transition-transform ${showBlurb ? "rotate-180" : ""}`}*/}
                    {/*        fill="none"*/}
                    {/*        stroke="currentColor"*/}
                    {/*        strokeWidth="2"*/}
                    {/*        viewBox="0 0 24 24"*/}
                    {/*    >*/}
                    {/*        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>*/}
                    {/*    </svg>*/}
                    {/*</button>*/}

                    <div
                        className={`
      mt-2 text-sm text-gray-700 dark:text-gray-300 transition-all overflow-hidden
      ${showBlurb ? "max-h-[500px]" : "max-h-20"}
    `}
                    >
                        <p className={`${showBlurb ? "" : "line-clamp-3"}`}>
                            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Beatae consequatur delectus eos
                            fuga labore laborum libero maxime nostrum, nulla obcaecati, odio officia optio perspiciatis
                            porro quaerat sed, totam vero voluptatibus?
                            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Atque autem, doloremque eum ipsam
                            laboriosam maxime molestias officia perferendis soluta. Cumque facilis iusto odio temporibus
                            voluptates voluptatibus. A ducimus maxime numquam.
                        </p>
                    </div>
                </div>
            </div>
            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
                <div
                    className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
                    <div className="px-2 pr-14">
                        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                            Edit BookDetail
                        </h4>
                        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                            Update your details to keep your profile up-to-date.
                        </p>
                    </div>
                    <form className="flex flex-col">
                        <div className="px-2 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                                <div>
                                    <Label>Edition</Label>
                                    <Input type="text" defaultValue={book.edition}/>
                                </div>
                                <div>
                                    <Label>Published</Label>
                                    <Input type="date" defaultValue={formatdateForInput(book.published)}/>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                            <Button size="sm" variant="outline" onClick={closeModal}>
                                Close
                            </Button>
                            <Button size="sm" onClick={handleSave}>
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}
