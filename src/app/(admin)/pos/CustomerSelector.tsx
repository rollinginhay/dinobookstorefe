"use client";

import {useState} from "react";
import AddCustomerForm from "./AddCustomerForm";

interface CustomerSelectorProps {
    onClose: () => void;
    onSelect: (customer: any) => void;
    customers: any[];
    onSave: (customer: any) => void;
}

export default function CustomerSelector({
                                             onClose,
                                             onSelect,
                                             customers,
                                             onSave
                                         }: CustomerSelectorProps) {
    console.log("customers", customers);
    // Popup Add Customer
    const [showAddForm, setShowAddForm] = useState(false);

    // Tìm kiếm
    const [searchTerm, setSearchTerm] = useState("");

    // {
    //     id: 1,
    //         avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    //     email: "dangdph40710@gmail.com",
    //     name: "Đỗ Hải Đăng",
    //     dob: "2003-01-07",
    //     phone: "0332129648",
    //     gender: "Nam",
    // },

    // Filter tìm kiếm
    const filteredCustomers = customers.filter((c) => {
        const keyword = searchTerm.toLowerCase();
        return (
            c.personName.toLowerCase().includes(keyword) ||
            c.email
                .toLowerCase().includes(keyword) ||
            c.phoneNumber.toLowerCase().includes(keyword)
        );
    });

    return (
        <>
            <div
                className="fixed inset-0 bg-black/80 z-[900]"
                onClick={onClose}
            ></div>


            {/* Modal chọn khách hàng */}
            <div
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] bg-white shadow-xl rounded-lg p-6 z-[999]">
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
                <div className="border rounded-md overflow-hidden max-h-[400px] overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3">STT</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Họ tên</th>
                            <th className="p-3">Số điện thoại</th>
                            <th className="p-3">Thao tác</th>
                        </tr>
                        </thead>

                        <tbody>
                        {filteredCustomers.map((c, index) => (
                            <tr key={c.id} className="border-t">
                                <td className="p-3">{index + 1}</td>
                                <td className="p-3">{c.email}</td>
                                <td className="p-3 font-medium">{c.personName}</td>
                                <td className="p-3">{c.phoneNumber}</td>
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
            </div>

            {/* Popup thêm khách hàng */}
            {showAddForm && (
                <AddCustomerForm
                    onClose={() => setShowAddForm(false)}
                    onSave={(data: any) => {
                        onSave(data);
                    }
                    }
                />
            )}
        </>
    );
}
