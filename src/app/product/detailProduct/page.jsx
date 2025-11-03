"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const res = await fetch(`https://dummyjson.com/products/${id}`);
        if (!res.ok) throw new Error("Không lấy được dữ liệu sản phẩm");
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        console.error("Lỗi khi tải chi tiết sản phẩm:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchProduct();
  }, [id]);

  const addToCart = (product) => {
    if (!product) return;
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`Đã thêm "${product.title}" vào giỏ hàng!`);
  };

  if (loading) return <p className="loading">⏳ Đang tải sản phẩm...</p>;
  if (!product) return <p className="not-found">❌ Không tìm thấy sản phẩm!</p>;

  // const discountedPrice = (
  //   product.price *
  //   (1 - product.discountPercentage / 100)
  // ).toFixed(2);

  return (
    <div className="product-detail-container">
      <div className="product-detail">
        <div className="detail-left">
          <Image
            src={product.thumbnail}
            alt={product.title}
            width={400}
            height={400}
            className="main-image"
            priority
          />
          <div className="thumbnail-list">
            {product.images?.slice(0, 4).map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Ảnh ${i + 1}`}
                className="thumbnail-item"
                loading="lazy"
              />
            ))}
          </div>
        </div>

        <div className="detail-right">
          <h2>{product.title}</h2>
          <p className="brand">Thương hiệu: {product.brand}</p>

          <div className="rating-stock">
            <span className="rating">⭐ {product.rating}</span>
            <span className="stock">({product.stock} sản phẩm có sẵn)</span>
          </div>

          <div className="price">
            <span className="new-price">{discountedPrice} $</span>
            <del className="old-price">{product.price} $</del>
            <span className="discount">-{product.discountPercentage}%</span>
          </div>

          <p className="description">{product.description}</p>

          <div className="button-group">
            <button className="btn-buy" onClick={() => addToCart(product)}>
              🛒 Mua ngay
            </button>
            <button className="btn-add" onClick={() => addToCart(product)}>
              ➕ Thêm vào giỏ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
