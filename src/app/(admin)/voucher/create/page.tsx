"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateVoucher() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    type: "MONEY",
    minOrder: "",
    discount: "",
    quantity: "",
    maxDiscount: "",
    start: "",
    end: "",
    description: "",
  });

  const updateForm = (key: string, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // =============================
  // LƯU VOUCHER
  // =============================
  const handleSave = () => {
    // Validate đơn giản
    if (!form.name || !form.discount || !form.minOrder || !form.quantity) {
      alert("⚠ Vui lòng nhập đầy đủ thông tin bắt buộc!");
      return;
    }

    // Tạo mã ngẫu nhiên VCxxxxx
    const newVoucher = {
      id: "VC" + Math.floor(Math.random() * 99999).toString().padStart(5, "0"),
      name: form.name,
      type: form.type,
      minOrder: Number(form.minOrder),
      discount: Number(form.discount),
      maxDiscount: Number(form.maxDiscount || 0),
      quantity: Number(form.quantity),
      used: 0,
      start: form.start,
      end: form.end,
      description: form.description,
    };

    // Lấy danh sách cũ
    const saved = localStorage.getItem("vouchers");
    const list = saved ? JSON.parse(saved) : [];

    // Thêm voucher mới
    list.push(newVoucher);

    // Lưu lại
    localStorage.setItem("vouchers", JSON.stringify(list));

    alert("✔ Thêm phiếu giảm giá thành công!");

    // Redirect về danh sách
    router.push("/voucher/new");
  };

  return (
    <div className="space-y-6">
      {/* nút quay lại */}
      <button
        onClick={() => router.push("/voucher/new")}
        className="px-4 py-2 bg-gray-100 border rounded-md hover:bg-gray-200"
      >
        ← Quay lại
      </button>

      <h2 className="section-title">Thêm Phiếu Giảm Giá</h2>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        {/* FORM */}
        <div className="card space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tên phiếu */}
            <div>
              <label className="form-label">Tên Phiếu</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                placeholder="Giảm 10K"
              />
            </div>

            {/* Loại phiếu */}
            <div>
              <label className="form-label">Loại phiếu</label>
              <select
                className="select"
                value={form.type}
                onChange={(e) => updateForm("type", e.target.value)}
              >
                <option value="MONEY">Tiền mặt</option>
                <option value="PERCENT">Phần trăm</option>
              </select>
            </div>

            {/* Giá trị đơn tối thiểu */}
            <div>
              <label className="form-label">Giá trị đơn hàng tối thiểu</label>
              <input
                className="input"
                type="number"
                value={form.minOrder}
                onChange={(e) => updateForm("minOrder", e.target.value)}
              />
            </div>

            {/* Số tiền giảm */}
            <div>
              <label className="form-label">Số tiền giảm / %</label>
              <input
                className="input"
                type="number"
                value={form.discount}
                onChange={(e) => updateForm("discount", e.target.value)}
              />
            </div>

            {/* Ngày bắt đầu */}
            <div>
              <label className="form-label">Ngày bắt đầu</label>
              <input
                className="input"
                type="datetime-local"
                value={form.start}
                onChange={(e) => updateForm("start", e.target.value)}
              />
            </div>

            {/* Ngày kết thúc */}
            <div>
              <label className="form-label">Ngày kết thúc</label>
              <input
                className="input"
                type="datetime-local"
                value={form.end}
                onChange={(e) => updateForm("end", e.target.value)}
              />
            </div>

            {/* Số lượng */}
            <div>
              <label className="form-label">Số lượng</label>
              <input
                className="input"
                type="number"
                value={form.quantity}
                onChange={(e) => updateForm("quantity", e.target.value)}
              />
            </div>

            {/* Giảm tối đa – chỉ hiện khi phần trăm */}
            {form.type === "PERCENT" && (
              <div>
                <label className="form-label">Giảm tối đa</label>
                <input
                  className="input"
                  type="number"
                  value={form.maxDiscount}
                  onChange={(e) => updateForm("maxDiscount", e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Mô tả */}
          <label className="form-label">Mô tả</label>
          <textarea
            className="textarea"
            rows={4}
            value={form.description}
            onChange={(e) => updateForm("description", e.target.value)}
          />
        </div>

        {/* PREVIEW */}
        <div className="card">
          <h3 className="font-semibold mb-3">Xem trước mã</h3>

          <div className="border rounded-lg p-4 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-xl font-bold">VCXXXXX</div>

              <div className="text-sm text-gray-600">
                Điều kiện: áp dụng cho đơn từ{" "}
                {form.minOrder
                  ? Number(form.minOrder).toLocaleString() + "đ"
                  : "..."}
              </div>

              <div className="text-sm text-gray-600">
                Giảm:{" "}
                {form.type === "MONEY"
                  ? form.discount
                    ? Number(form.discount).toLocaleString() + "đ"
                    : "0đ"
                  : form.discount + "%"}
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="btn btn-primary w-full mt-4"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
