"use client";
import { useState } from "react";
import DiscountTable from "@/components/discount/DiscountTable";

export default function VoucherClientPage({ data }: { data: any[] }) {
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const totalPages = Math.ceil(data.length / pageSize);
  const pagedData = data.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <>
      <DiscountTable data={pagedData} />

      <div className="flex justify-center gap-2 mt-4">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            className={`px-3 py-1 rounded ${
              page === i + 1 ? "bg-blue-600 text-white" : "border"
            }`}
            onClick={() => setPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </>
  );
}
