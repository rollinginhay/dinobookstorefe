"use client";

import {useEffect, useState} from "react";

export default function BookPropertyList() {
  const [properties, setProperties] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  // DEMO dữ liệu thuộc tính
  useEffect(() => {
    setProperties([
      { id: 1, type: "Ngôn ngữ", value: "Tiếng Việt" },
      { id: 2, type: "Ngôn ngữ", value: "Tiếng Anh" },
      { id: 3, type: "Nhà xuất bản", value: "NXB Kim Đồng" },
      { id: 4, type: "Nhà xuất bản", value: "NXB Trẻ" },
      { id: 5, type: "Tình trạng", value: "Còn hàng" },
      { id: 6, type: "Tình trạng", value: "Hết hàng" },
    ]);
  }, []);

  const filtered = properties.filter((p) =>
    `${p.type} ${p.value}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <h2 className="section-title mb-6">Thuộc tính sách</h2>

      {/* Search */}
      <div className="card mb-6 flex items-center justify-between">
        <input
          className="input w-80"
          placeholder="Tìm kiếm thuộc tính..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button className="btn btn-primary">+ Thêm thuộc tính</button>
      </div>

      {/* Table */}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Loại thuộc tính</th>
              <th>Giá trị</th>
              <th className="text-center w-24">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-500">
                  Không tìm thấy thuộc tính
                </td>
              </tr>
            )}

            {filtered.map((p, index) => (
              <tr key={p.id}>
                <td>{index + 1}</td>
                <td className="font-medium">{p.type}</td>
                <td>{p.value}</td>
                <td className="text-center">
                  <button className="text-blue-600 hover:underline mr-3">
                    Sửa
                  </button>
                  <button className="text-red-600 hover:underline">
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
