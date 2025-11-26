"use client";

import { useState } from "react";

interface ProductSelectorProps {
  onClose: () => void;
  onSelect: (product: any) => void;
}

export default function ProductSelector({
  onClose,
  onSelect,
}: ProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    code: "",
    size: "",
    color: "",
    brand: "",
  });

  // ❌ ĐÃ BỎ selectedProduct & qty
  // const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  // const [qty, setQty] = useState(1);

  const products = [
    {
      id: 1,
      code: "SP001",
      name: "Áo sơ mi trắng",
      price: 150000,
      size: "M",
      color: "Trắng",
      brand: "Local Brand A",
      image: "https://cdn-icons-png.flaticon.com/512/892/892458.png",
    },
    {
      id: 2,
      code: "SP002",
      name: "Quần jean xanh",
      price: 250000,
      size: "L",
      color: "Xanh",
      brand: "Local Brand B",
      image: "https://cdn-icons-png.flaticon.com/512/892/892403.png",
    },
    {
      id: 3,
      code: "SP003",
      name: "Giày sneaker",
      price: 500000,
      size: "42",
      color: "Trắng",
      brand: "Local Brand C",
      image: "https://cdn-icons-png.flaticon.com/512/892/892781.png",
    },
  ];

  const filteredProducts = products.filter((p) => {
    const keyword = searchTerm.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(keyword) ||
      p.code.toLowerCase().includes(keyword);

    const matchCode =
      !filters.code ||
      p.code.toLowerCase().includes(filters.code.toLowerCase());
    const matchSize = !filters.size || p.size === filters.size;
    const matchColor = !filters.color || p.color === filters.color;
    const matchBrand = !filters.brand || p.brand === filters.brand;

    return (
      matchSearch && matchCode && matchSize && matchColor && matchBrand
    );
  });

  const handleChangeFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      {/* OVERLAY */}
      <div
        className="fixed inset-0 bg-black/80 z-[900]"
        onClick={onClose}
      ></div>

      {/* MODAL */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] bg-white shadow-xl rounded-lg p-6 z-[999]">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Chọn sản phẩm</h2>
          <button
            className="text-gray-500 hover:text-red-500 text-xl"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Bộ lọc */}
        <div className="grid grid-cols-4 gap-3 mb-3">
          <div>
            <label className="text-sm font-medium block mb-1">
              Mã sản phẩm
            </label>
            <input
              type="text"
              className="w-full border px-3 py-2 rounded-md"
              value={filters.code}
              onChange={(e) =>
                handleChangeFilter("code", e.target.value)
              }
              placeholder="SP001..."
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Size</label>
            <select
              className="w-full border px-3 py-2 rounded-md"
              value={filters.size}
              onChange={(e) =>
                handleChangeFilter("size", e.target.value)
              }
            >
              <option value="">Tất cả</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="42">42</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Màu sắc</label>
            <select
              className="w-full border px-3 py-2 rounded-md"
              value={filters.color}
              onChange={(e) =>
                handleChangeFilter("color", e.target.value)
              }
            >
              <option value="">Tất cả</option>
              <option value="Trắng">Trắng</option>
              <option value="Xanh">Xanh</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">
              Thương hiệu
            </label>
            <select
              className="w-full border px-3 py-2 rounded-md"
              value={filters.brand}
              onChange={(e) =>
                handleChangeFilter("brand", e.target.value)
              }
            >
              <option value="">Tất cả</option>
              <option value="Local Brand A">Local Brand A</option>
              <option value="Local Brand B">Local Brand B</option>
              <option value="Local Brand C">Local Brand C</option>
            </select>
          </div>
        </div>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm theo tên / mã..."
          className="w-full border px-4 py-2 rounded-md mb-4"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* PRODUCT LIST */}
        <div className="grid grid-cols-3 gap-4 max-h-[360px] overflow-y-auto">
          {filteredProducts.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-pointer"
              onClick={() => {
                onSelect({ ...item, qty: 1 });
                onClose();
              }}
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-20 mx-auto mb-3"
              />
              <div className="text-center font-semibold">{item.name}</div>
              <div className="text-center text-sm text-gray-500">
                Mã: {item.code}
              </div>
              <div className="text-center text-sm text-gray-500">
                Size: {item.size} • Màu: {item.color}
              </div>
              <div className="text-center text-blue-600 font-bold mt-1">
                {item.price.toLocaleString()}đ
              </div>
            </div>
          ))}
        </div>

        {/* Paging fake */}
        <div className="flex justify-end mt-4">
          <select className="border rounded-md px-2 py-1">
            <option>6 / page</option>
            <option>12 / page</option>
            <option>24 / page</option>
          </select>
        </div>
      </div>
    </>
  );
}
