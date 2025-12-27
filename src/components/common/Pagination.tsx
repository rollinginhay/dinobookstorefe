type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export default function Pagination({ page, totalPages, onChange }: Props) {
  return (
    <div className="flex justify-end items-center gap-1 px-4 py-4">
      <button
        disabled={page === 1}
        onClick={() => onChange(1)}
        className="px-2 py-1 border rounded disabled:opacity-40"
      >
        «
      </button>

      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="px-2 py-1 border rounded disabled:opacity-40"
      >
        ‹
      </button>

      {Array.from({ length: totalPages }).map((_, i) => {
        const p = i + 1;
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`px-3 py-1 rounded ${
              page === p
                ? "bg-blue-600 text-white"
                : "border hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        );
      })}

      <button
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        className="px-2 py-1 border rounded disabled:opacity-40"
      >
        ›
      </button>

      <button
        disabled={page === totalPages}
        onClick={() => onChange(totalPages)}
        className="px-2 py-1 border rounded disabled:opacity-40"
      >
        »
      </button>
    </div>
  );
}
