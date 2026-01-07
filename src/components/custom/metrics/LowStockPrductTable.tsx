import {Table, TableBody, TableCell, TableHeader, TableRow,} from "@/components/ui/table";
import Image from "next/image";
import {Book} from "@/types/appContextTypes";


interface PopularProductTableProps {
    books: Book[];
}

export default function LowStockPrductTable({books}: PopularProductTableProps) {
    const flatBooks = extractBookDetails(books);

    const lowStockBooks = flatBooks.filter(b => b.stock < 5).sort((a, b) => a.stock - b.stock);

    function extractBookDetails(books: any[]) {
        return books.flatMap((book) => {
            // top-level fields (your data shape)
            const bookId = String(book.id ?? "");
            const title = book.title ?? "";
            const imageUrl = book.imageUrl ?? "";

            // bookCopies structure: { data: [...] }
            const copies = Array.isArray(book.bookCopies?.data)
                ? book.bookCopies.data
                : [];

            return copies.map((bc: any) => ({
                bookId,
                title: title,
                imageUrl,
                id: String(bc.id ?? ""),

                createdAt: bc.createdAt ?? "",
                updatedAt: bc.updatedAt ?? "",
                enabled: bc.enabled ?? false,
                note: bc.note ?? "",

                isbn: bc.isbn ?? "",
                bookFormat: bc.bookFormat ?? "",
                dimensions: bc.dimensions ?? "",
                printLength: Number(bc.printLength ?? 0),
                stock: Number(bc.stock ?? 0),
                supplyPrice: Number(bc.supplyPrice ?? 0),
                salePrice: Number(bc.salePrice ?? 0),
                bookCondition: bc.bookCondition ?? "",
            }));
        });
    }

    return (
        <div
            className="h-full rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] flex flex-col">
            <div className="px-4 pt-4 pb-0 sm:px-6 flex-shrink-0">
                <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                    Sách sắp hết hàng
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-3 sm:px-6">
                <Table>
                    <TableHeader
                        className="border-y border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-white/[0.03] z-10 before:absolute before:inset-x-0 before:-top-4 before:h-4 before:bg-white dark:before:bg-white/[0.03]">
                        <TableRow>
                            <TableCell isHeader>Sách</TableCell>
                            <TableCell isHeader>Còn lại</TableCell>
                            <TableCell isHeader>Giá</TableCell>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {lowStockBooks.map((book) => (
                            <TableRow key={book.id}>
                                <TableCell className="py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-[50px] w-[50px] overflow-hidden rounded-md flex-shrink-0">
                                            <Image
                                                src={book.imageUrl}
                                                width={50}
                                                height={50}
                                                alt={book.title}
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-800 dark:text-white/90 truncate">
                                                {book.title}
                                            </p>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {book.bookFormat}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>

                                <TableCell className="text-gray-500 dark:text-gray-400">
                                    {book.stock}
                                </TableCell>

                                <TableCell className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    {book.salePrice.toLocaleString("vi-VN")}đ
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
