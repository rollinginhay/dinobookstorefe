import {Table, TableBody, TableCell, TableHeader, TableRow,} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Image from "next/image";

// Define the TypeScript interface for the table rows
interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  price: string;
  status: "Available" | "Borrowed" | "Out of Stock";
  image: string;
}


// Define the table data using the interface
const tableData: Book[] = [
  {
    id: 1,
    title: "1984",
    author: "George Orwell",
    category: "Dystopian",
    price: "$12.00",
    status: "Available",
    image: "/images/1984.jpg",
  },
  {
    id: 2,
    title: "Animal Farm",
    author: "George Orwell",
    category: "Political Satire",
    price: "$10.00",
    status: "Borrowed",
    image: "/images/animalfarm.jpg",
  },
  {
    id: 3,
    title: "Brave New World",
    author: "Aldous Huxley",
    category: "Science Fiction",
    price: "$14.00",
    status: "Available",
    image: "/images/bravenewworld.jpg",
  },
  {
    id: 4,
    title: "Crime and Punishment",
    author: "Fyodor Dostoevsky",
    category: "Classic",
    price: "$18.00",
    status: "Out of Stock",
    image: "/images/crimeandpunishment.jpg",
  },
  {
    id: 5,
    title: "Chainsaw Man Vol. 9",
    author: "Tatsuki Fujimoto",
    category: "Manga",
    price: "$9.50",
    status: "Available",
    image: "/images/chainsawmantap9.jpg",
  },
];


export default function BookTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Book List
      </h3>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-y border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell isHeader>Book</TableCell>
              <TableCell isHeader>Category</TableCell>
              <TableCell isHeader>Price</TableCell>
              <TableCell isHeader>Status</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {tableData.map((book) => (
              <TableRow key={book.id}>
                {/* BOOK INFO */}
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-[50px] w-[50px] overflow-hidden rounded-md">
                      <Image
                        src={book.image}
                        width={50}
                        height={50}
                        alt={book.title}
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white/90">
                        {book.title}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {book.author}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* CATEGORY */}
                <TableCell className="text-gray-500 dark:text-gray-400">
                  {book.category}
                </TableCell>

                {/* PRICE */}
                <TableCell className="text-gray-500 dark:text-gray-400">
                  {book.price}
                </TableCell>

                {/* STATUS */}
                <TableCell>
                  <Badge
                    size="sm"
                    color={
                      book.status === "Available"
                        ? "success"
                        : book.status === "Borrowed"
                        ? "warning"
                        : "error"
                    }
                  >
                    {book.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
