"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function BillDetail() {
  const { id } = useParams(); // lấy id hóa đơn
  const router = useRouter();

  const [bill, setBill] = useState<any | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);

  // DEMO DATA giống trang bill list
  const demoReceipts = [
    {
      id: "100001",
      attributes: {
        totalAmount: 322000,
        status: "PENDING",
        order_type: "ONLINE",
        order_date: "2025-02-19T23:45:53",
        shipping_fee: 30000,
        discount: 0,
        final_total: 322000,
      },
      relationships: { user: { data: { id: "1" } } },
      items: [
        {
          id: 1,
          name: "Áo sơ mi trắng",
          price: 150000,
          qty: 2,
          image: "https://cdn-icons-png.flaticon.com/512/892/892458.png",
        },
      ],
    },
    {
      id: "100002",
      attributes: {
        totalAmount: 225000,
        status: "COMPLETED",
        order_type: "POS",
        order_date: "2025-01-10T23:44:35",
        shipping_fee: 0,
        discount: 0,
        final_total: 225000,
      },
      relationships: { user: { data: { id: "2" } } },
      items: [
        {
          id: 2,
          name: "Quần jean xanh",
          price: 250000,
          qty: 1,
          image: "https://cdn-icons-png.flaticon.com/512/892/892403.png",
        },  
      ],
    },
  ];

  const demoUsers = [
    { id: "1", attributes: { name: "Nguyễn Công Ninh", phone: "0399796130" } },
    { id: "2", attributes: { name: "Khách hàng lẻ", phone: "-" } },
    { id: "3", attributes: { name: "Đỗ Hải Phong", phone: "031226948" } },
  ];

  useEffect(() => {
    const found = demoReceipts.find((b) => b.id === id);
    setBill(found || null);

    if (found) {
      const userId = found.relationships?.user?.data?.id;
      const user = demoUsers.find((u) => u.id === userId);
      setCustomer(user?.attributes || {});
    }
  }, [id]);

  if (!bill) return <div className="p-6">Không tìm thấy hóa đơn.</div>;

  const attrs = bill.attributes;

  return (
    <div className="space-y-6 p-4">
      <h2 className="section-title">Chi tiết hóa đơn — HD{id}</h2>

      {/* Điều hướng */}
      <div>
        <button
          onClick={() => router.back()}
          className="btn bg-gray-200 hover:bg-gray-300 text-sm"
        >
          ← Quay lại
        </button>
      </div>

      {/* THÔNG TIN HÓA ĐƠN */}
      <div className="card">
        <h3 className="card-title mb-3">Thông tin hóa đơn</h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <b>Mã hóa đơn:</b> HD{id}
          </div>
          <div>
            <b>Ngày tạo:</b>{" "}
            {new Date(attrs.order_date).toLocaleString("vi-VN")}
          </div>
          <div>
            <b>Trạng thái:</b>{" "}
            {attrs.status === "COMPLETED" ? (
              <span className="badge bg-green-100 text-green-600">
                Thành công
              </span>
            ) : (
              <span className="badge bg-blue-100 text-blue-600">Xác nhận</span>
            )}
          </div>
          <div>
            <b>Loại đơn hàng:</b>{" "}
            {attrs.order_type === "POS" ? (
              <span className="badge bg-green-100 text-green-600">Tại quầy</span>
            ) : (
              <span className="badge bg-purple-100 text-purple-600">
                Trực tuyến
              </span>
            )}
          </div>
        </div>
      </div>

      {/* THÔNG TIN KHÁCH HÀNG */}
      <div className="card">
        <h3 className="card-title mb-3">Khách hàng</h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <b>Tên khách hàng:</b> {customer?.name}
          </div>
          <div>
            <b>Số điện thoại:</b> {customer?.phone}
          </div>
        </div>
      </div>

      {/* DANH SÁCH SẢN PHẨM */}
      <div className="card">
        <h3 className="card-title mb-3">Sản phẩm</h3>

        <table className="table min-w-[600px]">
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>Tên SP</th>
              <th>Đơn giá</th>
              <th>SL</th>
              <th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item: any) => (
              <tr key={item.id}>
                <td>
                  <img
                    src={item.image}
                    className="w-14 h-14 object-cover rounded"
                  />
                </td>
                <td>{item.name}</td>
                <td>{item.price.toLocaleString()}đ</td>
                <td>{item.qty}</td>
                <td className="text-blue-600 font-semibold">
                  {(item.qty * item.price).toLocaleString()}đ
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TÍNH TIỀN */}
      <div className="card space-y-2 text-sm">
        <h3 className="card-title">Tổng kết</h3>

        <div className="flex justify-between">
          <span>Tổng tiền:</span>
          <b>{attrs.totalAmount.toLocaleString()}đ</b>
        </div>

        <div className="flex justify-between">
          <span>Giảm giá:</span>
          <b>{attrs.discount?.toLocaleString() || 0}đ</b>
        </div>

        <div className="flex justify-between">
          <span>Phí ship:</span>
          <b>{attrs.shipping_fee?.toLocaleString() || 0}đ</b>
        </div>

        <div className="flex justify-between text-lg font-semibold pt-2">
          <span>Thực thu:</span>
          <b className="text-red-500">
            {attrs.final_total.toLocaleString()}đ
          </b>
        </div>
      </div>
    </div>
  );
}
