"use client";

interface AddCustomerFormProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function AddCustomerForm({
  onClose,
  onSave,
}: AddCustomerFormProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[900]"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                      w-[600px] bg-white rounded-lg shadow-xl z-[999] p-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Thêm khách hàng mới</h2>
          <button
            className="text-gray-500 hover:text-red-500 text-xl"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form
          className="grid grid-cols-1 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.currentTarget));
            onSave(data);
            onClose();
          }}
        >
          {/* Avatar */}
          <div>
            <label className="font-medium">Ảnh đại diện (URL)</label>
            <input
              name="avatar"
              type="text"
              placeholder="https://..."
              className="w-full border px-3 py-2 rounded-md mt-1"
            />
          </div>

          {/* Name */}
          <div>
            <label className="font-medium">Họ tên</label>
            <input
              name="name"
              required
              type="text"
              placeholder="Nguyễn Văn A"
              className="w-full border px-3 py-2 rounded-md mt-1"
            />
          </div>

          {/* Email */}
          <div>
            <label className="font-medium">Email</label>
            <input
              name="email"
              type="email"
              placeholder="abc@gmail.com"
              className="w-full border px-3 py-2 rounded-md mt-1"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="font-medium">Số điện thoại</label>
            <input
              name="phone"
              required
              type="text"
              placeholder="0123456789"
              className="w-full border px-3 py-2 rounded-md mt-1"
            />
          </div>

          {/* DOB */}
          <div>
            <label className="font-medium">Ngày sinh</label>
            <input
              name="dob"
              type="date"
              className="w-full border px-3 py-2 rounded-md mt-1"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="font-medium">Giới tính</label>
            <select
              name="gender"
              className="w-full border px-3 py-2 rounded-md mt-1"
            >
              <option value="">-- Chọn giới tính --</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
