"use client";

import {useState} from "react";
import ProductSelector from "./ProductSelector";

interface CartProps {
  items: any[];
  onItemsChange: (items: any[]) => void;
}

export default function Cart({ items, onItemsChange }: CartProps) {
  const [showProductPopup, setShowProductPopup] = useState(false);

  const handleAddProduct = (product: any) => {
    const exists = items.find((i) => i.id === product.id);
    const qtyAdd = product.qty || 1;

    if (exists) {
      onItemsChange(
        items.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + qtyAdd } : i
        )
      );
    } else {
      onItemsChange([...items, { ...product, qty: qtyAdd }]);
    }
  };

  const changeQty = (id: number, amount: number) => {
    onItemsChange(
      items
        .map((i) => {
          if (i.id === id) {
            const newQty = i.qty + amount;
            const maxStock = i.stock || i.bookCopy?.stock || Infinity;
            // Validate không cho vượt quá stock
            if (newQty < 1) {
              return { ...i, qty: 1 };
            } else if (newQty > maxStock) {
              return { ...i, qty: maxStock };
            }
            return { ...i, qty: newQty };
          }
          return i;
        })
        .filter((i) => i.qty > 0)
    );
  };

  const handleQuantityInputChange = (id: number, newQty: number) => {
    if (isNaN(newQty)) return;
    
    const item = items.find((i) => i.id === id);
    if (!item) return;
    
    const maxStock = item.stock || item.bookCopy?.stock || Infinity;
    
    // Validate không cho vượt quá stock
    if (newQty < 1) {
      newQty = 1;
    } else if (newQty > maxStock) {
      newQty = maxStock;
    }
    
    onItemsChange(
      items
        .map((i) => (i.id === id ? { ...i, qty: newQty } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const removeItem = (id: number) => {
    onItemsChange(items.filter((i) => i.id !== id));
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">

      {/* TIÊU ĐỀ */}
      <h4 className="font-semibold mb-3">Giỏ hàng</h4>

      <div className="overflow-x-auto rounded-md border">
  <table className="w-full table-fixed border-separate border-spacing-y-2">
    <thead className="bg-gray-100 text-sm text-gray-600 rounded-md">
      <tr>
        <th className="p-3 w-[60px] text-center rounded-l-md">#</th>
        <th className="p-3 w-[150px] text-center">Ảnh</th>
        <th className="p-3 w-[280px]">Sản phẩm</th>
        <th className="p-3 w-[220px] text-center">Số lượng</th>
        <th className="p-3 w-[140px] text-right">Tổng tiền</th>
        <th className="p-3 w-[80px] text-center rounded-r-md">Hành động</th>
      </tr>
    </thead>

    <tbody>
      {items.map((item, index) => (
        <tr
          key={item.id}
          className="bg-white shadow-sm rounded-md h-[120px]"
        >
          {/* STT */}
          <td className="p-3 text-center align-middle">{index + 1}</td>

          {/* IMAGE */}
          <td className="p-3 text-center align-middle">
            <img
              src={item.image}
              className="w-20 h-20 object-cover mx-auto rounded-md"
            />
          </td>

          {/* PRODUCT INFO */}
          <td className="p-3 align-middle">
            <div className="flex flex-col justify-center h-full gap-1">
              <div className="font-semibold text-[16px] leading-tight">
                {item.name}
              </div>

              <div className="text-sm text-gray-500">
                Mã SP: <span className="font-medium">SPCT00X</span>
              </div>

              <div className="text-sm text-gray-500">
                Đơn giá:{" "}
                <span className="text-red-500 font-semibold">
                  {item.price.toLocaleString()}đ
                </span>
              </div>
            </div>
          </td>

          {/* QUANTITY */}
          <td className="p-3 align-middle">
            <div className="flex items-center justify-center gap-3">
              <button
                className="w-9 h-9 border rounded flex items-center justify-center text-lg hover:bg-gray-100 transition-colors"
                onClick={() => changeQty(item.id, -1)}
              >
                -
              </button>

              <input
                type="number"
                value={item.qty}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  // Cho phép nhập rỗng tạm thời khi đang gõ
                  if (inputValue === "") {
                    return;
                  }
                  const numValue = parseInt(inputValue) || 1;
                  handleQuantityInputChange(item.id, numValue);
                }}
                onBlur={(e) => {
                  // Khi blur, đảm bảo giá trị hợp lệ
                  const numValue = parseInt(e.target.value) || 1;
                  handleQuantityInputChange(item.id, numValue);
                }}
                className="w-16 text-center font-medium text-[17px] border border-gray-300 rounded py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={1}
                max={item.stock || item.bookCopy?.stock || undefined}
              />

              <button
                className="w-9 h-9 border rounded flex items-center justify-center text-lg hover:bg-gray-100 transition-colors"
                onClick={() => changeQty(item.id, +1)}
              >
                +
              </button>
            </div>
          </td>

          {/* TOTAL PRICE */}
          <td className="p-3 text-right align-middle font-semibold text-blue-600">
            {(item.qty * item.price).toLocaleString()}đ
          </td>

          {/* DELETE */}
          <td className="p-3 text-center align-middle">
            <button
              className="text-red-500 text-xl hover:scale-110 transition"
              onClick={() => removeItem(item.id)}
            >
              🗑
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


      {/* NÚT CHỌN SẢN PHẨM */}
      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
        onClick={() => setShowProductPopup(true)}
      >
        + Chọn sản phẩm
      </button>

      {/* POPUP */}
      {showProductPopup && (
        <ProductSelector
          onClose={() => setShowProductPopup(false)}
          onSelect={(p) => {
            handleAddProduct(p);
            setShowProductPopup(false);
          }}
        />
      )}
    </div>
  );
}
