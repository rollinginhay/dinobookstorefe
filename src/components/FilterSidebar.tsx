"use client";

import { useState, useMemo } from "react";
import { Book } from "@/components/BookCard";

interface FilterSidebarProps {
  onFilterChange: (filters: any) => void;
  priceCounts: {
    "0-50000": number;
    "50000-100000": number;
    "100000-200000": number;
    "200000-500000": number;
    "500000+": number;
  };
  publisherCounts: Record<string, number>;
  books: Book[];
}

export default function FilterSidebar({
  onFilterChange,
  priceCounts,
  publisherCounts,
  books,
}: FilterSidebarProps) {
  const [filters, setFilters] = useState({
    priceRange: [] as string[],
    publisher: [] as string[],
    genres: [] as string[],
  });

  // ============================
  // ⭐ ĐẾM GENRE CON
  // ============================
  const genreCounts = useMemo(() => {
    const map: Record<string, number> = {};

    books.forEach((b) => {
      const list = b.genres || ["Khác"];

      list.forEach((g) => {
        map[g] = (map[g] || 0) + 1;
      });
    });

    return map;
  }, [books]);

  // ============================
  // ⭐ Toggle giá trị trong array
  // ============================
  const toggleArrayValue = (key: keyof typeof filters, value: string) => {
    const arr = filters[key] as string[];
    const newArr = arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];

    const newFilters = { ...filters, [key]: newArr };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="w-64 bg-white rounded-lg shadow-sm p-4">
      <h3 className="font-semibold text-lg mb-4 text-gray-800">Bộ lọc</h3>

      {/* =================== */}
      {/* ⭐ KHOẢNG GIÁ */}
      {/* =================== */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Khoảng giá</h4>
        <div className="space-y-2">
          {[
            { value: "0-50000", label: "Dưới 50.000₫" },
            { value: "50000-100000", label: "50.000₫ - 100.000₫" },
            { value: "100000-200000", label: "100.000₫ - 200.000₫" },
            { value: "200000-500000", label: "200.000₫ - 500.000₫" },
            { value: "500000+", label: "Trên 500.000₫" },
          ].map((option) => (
            <label
              key={option.value}
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1 rounded"
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.priceRange.includes(option.value)}
                  onChange={() => toggleArrayValue("priceRange", option.value)}
                  className="mr-2 text-orange-600"
                />
                <span className="text-sm text-gray-600">{option.label}</span>
              </div>

              <span className="text-xs text-gray-400">
                ({priceCounts[option.value as keyof typeof priceCounts]})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* =================== */}
      {/* ⭐ GENRE CON */}
      {/* =================== */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Thể loại</h4>
        <div className="space-y-2">
          {Object.entries(genreCounts).map(([name, count]) => (
            <label
              key={name}
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1 rounded"
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.genres.includes(name)}
                  onChange={() => toggleArrayValue("genres", name)}
                  className="mr-2 text-orange-600"
                />
                <span className="text-sm text-gray-600">{name}</span>
              </div>

              <span className="text-xs text-gray-400">({count})</span>
            </label>
          ))}
        </div>
      </div>

      {/* =================== */}
      {/* ⭐ NHÀ XUẤT BẢN */}
      {/* =================== */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Nhà xuất bản</h4>
        <div className="space-y-2">
          {Object.entries(publisherCounts).map(([name, count]) => (
            <label
              key={name}
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1 rounded"
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.publisher.includes(name)}
                  onChange={() => toggleArrayValue("publisher", name)}
                  className="mr-2 text-orange-600"
                />
                <span className="text-sm text-gray-600">{name}</span>
              </div>

              <span className="text-xs text-gray-400">({count})</span>
            </label>
          ))}
        </div>
      </div>

      {/* =================== */}
      {/* ⭐ RESET */}
      {/* =================== */}
      <button
        onClick={() => {
          const reset = {
            priceRange: [],
            publisher: [],
            genres: [],
          };
          setFilters(reset);
          onFilterChange(reset);
        }}
        className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors font-medium"
      >
        Xóa bộ lọc
      </button>
    </div>
  );
}
