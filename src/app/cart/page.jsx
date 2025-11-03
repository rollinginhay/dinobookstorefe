"use client";
import { useEffect, useState } from "react";
import "../../../style/cart.css";

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]); // lưu danh sách id đã chọn

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  const updateQuantity = (id, delta) => {
    setCart((prev) => {
      const updated = prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0);
      localStorage.setItem("cart", JSON.stringify(updated));
      return updated;
    });
  };

  const removeItem = (id) => {
    const updated = cart.filter((item) => item.id !== id);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
  };

  const toggleSelect = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === cart.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cart.map((item) => item.id));
    }
  };

  const total = cart
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="container cart-page">
      <h2>🛒 Giỏ hàng của bạn</h2>
      {cart.length === 0 ? (
        <p>Giỏ hàng trống!</p>
      ) : (
        <table className="cart-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={
                    selectedItems.length === cart.length && cart.length > 0
                  }
                  onChange={toggleSelectAll}
                />
              </th>
              <th>Ảnh</th>
              <th>Sản phẩm</th>
              <th>Giá</th>
              <th>Số lượng</th>
              <th>Thành tiền</th>
              <th>Xóa</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item) => (
              <tr key={item.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleSelect(item.id)}
                  />
                </td>
                <td>
                  <img src={item.thumbnail} alt={item.title} width={80} />
                </td>
                <td>{item.title}</td>
                <td>{item.price.toLocaleString()} đ</td>
                <td>
                  <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                  <span style={{ margin: "0 8px" }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                </td>
                <td>{(item.price * item.quantity).toLocaleString()} đ</td>
                <td>
                  <button onClick={() => removeItem(item.id)}>❌</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {cart.length > 0 && (
        <div className="cart-footer">
          <h3>
            Tổng tiền: <span>{total.toLocaleString()} đ</span>
          </h3>
          <button
            className="checkout-btn"
            disabled={selectedItems.length === 0}
            onClick={() => alert("Thanh toán " + total.toLocaleString() + " đ")}
          >
            Thanh toán ({selectedItems.length})
          </button>
        </div>
      )}
    </div>
  );
}
