"use client";

import { useEffect, useState } from "react";

export default function InvoicePage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then((r) => r.json())
      .then((data) => setInvoice(data));
  }, []);

  if (!invoice) return <div>Đang tải...</div>;

  return (
    <div className="w-[800px] mx-auto my-10 bg-white p-10 shadow">
      <h1 className="text-3xl font-bold text-center mb-2">BERRY STORE</h1>
      <p className="text-center text-gray-600">199 Đội Cấn, Hà Nội</p>

      <hr className="my-4" />

      <div className="flex justify-between mb-4">
        <div>
          <p><b>Mã hóa đơn:</b> {invoice.code}</p>
          <p><b>Khách hàng:</b> {invoice.customerName}</p>
          <p><b>Số điện thoại:</b> {invoice.phone}</p>
        </div>
        <div>
          <p><b>Ngày:</b> {invoice.date}</p>
          <p><b>Nhân viên:</b> {invoice.staffName}</p>
        </div>
      </div>

      <h3 className="font-semibold mb-2">Nội dung đơn hàng</h3>

      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">#</th>
            <th className="border p-2">Tên</th>
            <th className="border p-2">Giá</th>
            <th className="border p-2">SL</th>
            <th className="border p-2">Tổng</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item: any, i: number) => (
            <tr key={i}>
              <td className="border p-2 text-center">{i + 1}</td>
              <td className="border p-2">{item.name}</td>
              <td className="border p-2">{item.price.toLocaleString()}đ</td>
              <td className="border p-2 text-center">{item.qty}</td>
              <td className="border p-2 text-right">
                {(item.price * item.qty).toLocaleString()}đ
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-right mt-4 space-y-1">
        <p><b>Tổng tiền hàng:</b> {invoice.total.toLocaleString()}đ</p>
        <p><b>Giảm giá:</b> {invoice.discount.toLocaleString()}đ</p>
        <p><b>Thanh toán:</b> {invoice.final.toLocaleString()}đ</p>
      </div>

      <button
        onClick={() => window.print()}
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded"
      >
        In hóa đơn
      </button>
    </div>
  );
}
