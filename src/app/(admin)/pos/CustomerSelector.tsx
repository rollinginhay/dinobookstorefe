"use client";

import { useState } from "react";
import AddCustomerForm from "./AddCustomerForm";

interface CustomerSelectorProps {
  onClose: () => void;
  onSelect: (customer: any) => void;
}

export default function CustomerSelector({
  onClose,
  onSelect,
}: CustomerSelectorProps) {
  // Popup Add Customer
  const [showAddForm, setShowAddForm] = useState(false);

  // Tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data bảng khách hàng
  const customers = [
    {
      id: 1,
      avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      email: "dangdph40710@gmail.com",
      name: "Đỗ Hải Đăng",
      dob: "2003-01-07",
      phone: "0332129648",
      gender: "Nam",
    },
    {
      id: 2,
      avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      email: "binthannhe2004@gmail.com",
      name: "Nguyễn Công Ninh",
      dob: "2004-09-08",
      phone: "0399796130",
      gender: "Nam",
    },
    {
      id: 3,
      avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      email: "hanthanh2k4@gmail.com",
      name: "Hàn Hồng Thanh",
      dob: "2004-01-06",
      phone: "0972129648",
      gender: "Nam",
    },
  ];

  // Filter tìm kiếm
  const filteredCustomers = customers.filter((c) => {
    const keyword = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(keyword) ||
      c.phone.toLowerCase().includes(keyword)
    );
  });

  return (
    <>
      <div
  className="fixed inset-0 bg-black/80 z-[900]"
  onClick={onClose}
></div>



      {/* Modal chọn khách hàng */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] bg-white shadow-xl rounded-lg p-6 z-[999]">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Chọn khách hàng</h2>
          <button
            className="text-gray-500 hover:text-red-500 text-xl"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Ô tìm kiếm */}
        <input
          type="text"
          placeholder="Tìm kiếm khách hàng theo tên hoặc số điện thoại..."
          className="w-full border px-4 py-2 rounded-md mb-4"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Nút thêm khách hàng */}
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md mb-4"
          onClick={() => setShowAddForm(true)}
        >
          + Thêm khách hàng
        </button>

        {/* Bảng danh sách */}
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">STT</th>
                <th className="p-3">Ảnh</th>
                <th className="p-3">Email</th>
                <th className="p-3">Họ tên</th>
                <th className="p-3">Ngày sinh</th>
                <th className="p-3">Số điện thoại</th>
                <th className="p-3">Giới tính</th>
                <th className="p-3">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map((c, index) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">
                    <img
                      src={c.avatar}
                      className="w-10 h-10 rounded-full border"
                      alt=""
                    />
                  </td>
                  <td className="p-3">{c.email}</td>
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3">{c.dob}</td>
                  <td className="p-3">{c.phone}</td>
                  <td className="p-3">{c.gender}</td>
                  <td className="p-3">
                    <button
                      onClick={() => onSelect(c)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md"
                    >
                      Chọn
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500">Trang 1</div>
          <select className="border rounded-md px-2 py-1">
            <option>5 / page</option>
            <option>10 / page</option>
            <option>20 / page</option>
          </select>
        </div>
      </div>

      {/* Popup thêm khách hàng */}
      {showAddForm && (
        <AddCustomerForm
          onClose={() => setShowAddForm(false)}
          onSave={(data: any) =>
            console.log("Đã thêm khách hàng (mock):", data)
          }
        />
      )}
    </>
  );
}
