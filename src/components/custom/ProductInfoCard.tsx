"use client";
import React from "react";
import Image from "next/image";
import {getDisplayDate} from "@/lib/formatters";
import Link from "@/components/ui/links/Link";

export default function ProductInfoCard({book}) {
    return (
        <>
            <div
                className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 bg-white dark:bg-gray-900">
                {/* NOTE: changed lg:items-start -> lg:items-stretch so left column can match right column height */}
                <div className="flex flex-col lg:flex-row gap-6 lg:items-stretch lg:justify-between">

                    {/* LEFT — BOOK IMAGE (now stretches to match right content height) */}
                    <div className="w-full lg:w-56 flex-shrink-0 self-stretch">
                        {/* parent must have explicit height for Image fill() to work; h-full here */}
                        <div
                            className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 h-full w-full min-h-[160px] shadow-sm">
                            <Image
                                src={book.imageUrl || "/images/product/product-02.jpg"}
                                alt={book.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>

                    {/* RIGHT — ORIGINAL CONTENT */}
                    <div className="flex-grow flex flex-col gap-6 self-stretch">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

                            <div>
                                <div className="flex items-center gap-3 mb-5">
                                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                                        {book.title}
                                    </h4>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-7 2xl:gap-x-32">
                                    <div>
                                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Authors</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                            {book.creators.data.map(e => e.name).join(", ")}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Edition</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">{book.edition}</p>
                                    </div>

                                    <div>
                                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Genres</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                            {book.genres.data.map(e => e.name).join(", ")}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Publisher</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                            {book.publisher.data.name}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Published</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                            {getDisplayDate(book.published)}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Series</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                            {book.series.data?.name}
                                        </p>
                                    </div>

                                    {/* BLURB — full width row */}
                                    <div className="col-span-full">
                                        <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Blurb</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                                            {book.blurb}
                                            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Accusamus
                                            aspernatur autem delectus dignissimos, ducimus exercitationem perferendis
                                            possimus reprehenderit. Cupiditate, eos esse nam obcaecati odio repellat
                                            suscipit! Ea nam repellat suscipit.
                                            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dolorum facere
                                            impedit inventore nemo quis, repellat. Deserunt dicta eligendi facere harum
                                            id maiores, necessitatibus nihil obcaecati veritatis voluptates. Eligendi,
                                            expedita, ut.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Link
                                href={`/book/${book.id}/edit`}
                                className="bg-emerald-500 shadow-sm hover inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600"
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
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}


// "use client";
// import React, {useState} from "react";
// import {useModal} from "../../hooks/useModal";
// import {Modal} from "../ui/modal";
// import Button from "../ui/button/Button";
// import Input from "../form/input/InputField";
// import Label from "../form/Label";
// import Image from "next/image";
// import {Book} from "@/types/appContextTypes";
// import {formatDateForInput, formatLocalDateTime} from "@/lib/formatters";
//
// export default function ProductInfoCard({book}) {
//     const {isOpen, openModal, closeModal} = useModal();
//     const [showBlurb, setShowBlurb] = useState(false);
//     const handleSave = () => {
//         // Handle save logic here
//         closeModal();
//     };
//     return (
//         <>
//             <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
//                 <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
//                     <div>
//                         <div className="flex items-center gap-3 mb-5">
//                             <div className="h-12 w-12">
//                                 <Image
//                                     width={48}
//                                     height={48}
//                                     src="/images/product/product-02.jpg"
//                                     className="h-12 w-12 rounded-md"
//                                     alt="image"
//                                 />
//                             </div>
//
//                             <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
//                                 {book.title}
//                             </h4>
//                         </div>
//
//
//                         <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
//                             <div>
//                                 <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
//                                     Authors
//                                 </p>
//                                 <p className="text-sm font-medium text-gray-800 dark:text-white/90">
//                                     {book.creators.data.map(e => e.name).join(", ")}
//                                 </p>
//                             </div>
//
//                             <div>
//                                 <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
//                                     Edition
//                                 </p>
//                                 <p className="text-sm font-medium text-gray-800 dark:text-white/90">
//                                     {book.edition}
//                                 </p>
//                             </div>
//
//
//                             <div>
//                                 <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
//                                     Genres
//                                 </p>
//                                 <p className="text-sm font-medium text-gray-800 dark:text-white/90">
//                                     {book.genres.data.map(e => e.name).join(", ")}
//                                 </p>
//                             </div>
//
//                             <div>
//                                 <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
//                                     Publisher
//                                 </p>
//                                 <p className="text-sm font-medium text-gray-800 dark:text-white/90">
//                                     {book.publisher.data.name}
//                                 </p>
//                             </div>
//
//                             <div>
//                                 <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
//                                     Published
//                                 </p>
//                                 <p className="text-sm font-medium text-gray-800 dark:text-white/90">
//                                     {formatLocalDateTime(book.published)}
//                                 </p>
//                             </div>
//                             <div>
//                                 <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
//                                     Series
//                                 </p>
//                                 <p className="text-sm font-medium text-gray-800 dark:text-white/90">
//                                     {book.series.data.name}
//                                 </p>
//                             </div>
//                         </div>
//                     </div>
//                     <Button
//                         className="bg-emerald-500 shadow-sm hover inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600"
//                         // onClick={() => {
//                         //     setEditingItem(null);
//                         //     setShowForm(true);
//                         // }}
//                         onClick={openModal}
//                     >
//                         <svg
//                             className="fill-current"
//                             width="18"
//                             height="18"
//                             viewBox="0 0 18 18"
//                             fill="none"
//                             xmlns="http://www.w3.org/2000/svg"
//                         >
//                             <path
//                                 fillRule="evenodd"
//                                 clipRule="evenodd"
//                                 d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
//                                 fill=""
//                             />
//                         </svg>
//                         Edit
//                     </Button>
//
//                 </div>
//                 <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
//                     <div
//                         className={`
//       mt-2 text-sm text-gray-700 dark:text-gray-300 transition-all overflow-hidden
//       ${showBlurb ? "max-h-[500px]" : "max-h-20"}
//     `}
//                     >
//                         <p className={`${showBlurb ? "" : "line-clamp-3"}`}>
//                             {book.blurb}
//                         </p>
//                     </div>
//                 </div>
//             </div>
//             <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
//                 <div
//                     className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
//                     <div className="px-2 pr-14">
//                         <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
//                             Edit BookDetail
//                         </h4>
//                         <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
//                             Update your details to keep your profile up-to-date.
//                         </p>
//                     </div>
//                     <form className="flex flex-col">
//                         <div className="px-2 overflow-y-auto custom-scrollbar">
//                             <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
//                                 <div>
//                                     <Label>Edition</Label>
//                                     <Input type="text" defaultValue={book.edition}/>
//                                 </div>
//                                 <div>
//                                     <Label>Published</Label>
//                                     <Input type="date" defaultValue={formatDateForInput(book.published)}/>
//                                 </div>
//                             </div>
//                         </div>
//                         <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
//                             <Button size="sm" variant="outline" onClick={closeModal}>
//                                 Close
//                             </Button>
//                             <Button size="sm" onClick={handleSave}>
//                                 Save Changes
//                             </Button>
//                         </div>
//                     </form>
//                 </div>
//             </Modal>
//         </>
//     );
// }
