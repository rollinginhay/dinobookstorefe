"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ProductGrid() {
  const [products, setProducts] = useState([]);
  const [sortedProducts, setSortedProducts] = useState([]);
  const [sortOption, setSortOption] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 20;
  const router = useRouter();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/v1/books");
        const data = await res.json();
        setProducts(data.products || []);
        setSortedProducts(data.products || []);
      } catch (error) {
        console.error("Lỗi fetch sản phẩm:", error);
      }
    }
    fetchProducts();
  }, []);

  const handleSortChange = (e) => {
    const value = e.target.value;
    setSortOption(value);

    let sorted = [...products];
    if (value === "asc") sorted.sort((a, b) => a.price - b.price);
    else if (value === "desc") sorted.sort((a, b) => b.price - a.price);

    setSortedProducts(sorted);
    setCurrentPage(1);
  };

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = sortedProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBuyNow = (product, e) => {
    e.stopPropagation();

    if (!product) return;

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existingProduct = cart.find((item) => item.id === product.id);

    if (existingProduct) {
      existingProduct.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`Đã thêm "${product.title}" vào giỏ hàng!`);
  };

  const goToDetail = (id) => {
    router.push(`/product/detailProduct?id=${id}`);
  };

  return (
    <div className="container">
      <div className="imgBanner">
        <Image
          src="/banner_fahasa_1.webp"
          alt="Banner Fahasa"
          width={600}
          height={450}
        />
        <Image
          src="/banner_fahasa_2.webp"
          alt="Banner Fahasa"
          width={600}
          height={450}
        />
      </div>

      <div className="product-grid-container">
        <div className="filter-bar">
          <div>
            <label>Sắp xếp theo:</label>
            <select value={sortOption} onChange={handleSortChange}>
              <option value="">Mặc định</option>
              <option value="asc">Giá tăng dần</option>
              <option value="desc">Giá giảm dần</option>
            </select>
          </div>
        </div>
        <div className="product-grid">
          {currentProducts.map((p) => (
            <div
              className="product-card"
              key={p.id}
              onClick={() => goToDetail(p.id)}
              style={{ cursor: "pointer" }}
            >
              <div className="thumbnail">
                <img src={p.thumbnail} alt={p.title} />
                {p.rating > 4.5 && <span className="tag">Xu hướng 🔥</span>}
              </div>
              <h4>{p.title}</h4>
              <p className="price">
                <span className="sale">{p.price.toLocaleString()} đ</span>
                <span className="old">
                  {(p.price * 1.2).toLocaleString()} đ
                </span>
              </p>
              <button className="buy-btn" onClick={(e) => handleBuyNow(p, e)}>
                🛒 Mua ngay
              </button>
            </div>
          ))}
        </div>

        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Trước
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              className={currentPage === i + 1 ? "active" : ""}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Sau →
          </button>
        </div>
      </div>
    </div>
  );
}
