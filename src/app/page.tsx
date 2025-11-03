"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { SetStateAction, useEffect, useState } from "react";
import Image from "next/image";
import "../../style/home.css";

import banner1 from "../../public/banner_fahasa.png";
import banner2 from "../../public/banner_wed_nang.jpg";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const slides = [banner1, banner2];

const Home = () => {
  interface Product {
    id: number;
    thumbnail: string;
    title: string;
    price: number;
    discountPercentage: Number;
  }
  const promos = [
    {
      code: "OCT20",
      title: "GIẢM 20K",
      desc: "giảm 20K (đơn từ 299K)",
      expiry: "31/10/2025",
    },
    {
      code: "OCT40",
      title: "GIẢM 40K",
      desc: "đơn từ 599K (số lượng có hạn)",
      expiry: "31/10/2025",
    },
    {
      code: "OCT70",
      title: "GIẢM 70K",
      desc: "đơn từ 899K (số lượng có hạn)",
      expiry: "31/10/2025",
    },
    {
      code: "OCT100",
      title: "GIẢM 100K",
      desc: "đơn từ 1199K (số lượng có hạn)",
      expiry: "31/10/2025",
    },
  ];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(`Đã sao chép mã: ${code}`);
  };
  const [discountBooks, setDiscountBooks] = useState([]);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 phút

  const [products, setProducts] = useState<Product[]>([]);
  const [newProducts, setNewProduct] = useState<Product[]>([]);
  const [comicProduct, setComicProduct] = useState<Product[]>([]);
  const [novalProduct, setNovalProduct] = useState<Product[]>([]);
  const [historyProduct, setHistoryProduct] = useState<Product[]>([]);
  const [economyProduct, setEconomy] = useState<Product[]>([]);
  const [comicCurrentPage, setComicCurrentPage] = useState(1);
  const [novalCurrentPage, setNovalCurrentPage] = useState(1);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [economyCurrentPage, setEconomyCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const comicProductsPerPage = 3;
  const novalProductsPerPage = 3;
  const historyProductsPerPage = 3;
  const economyProductsPerPage = 3;
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("https://dummyjson.com/products?limit=30"); // san pham noi bat
        const data = await res.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error("Lỗi fetch sản phẩm:", error);
      }
    }
    fetchProducts();
  }, []);
  useEffect(() => {
    async function FetchNewProducts() {
      try {
        const res = await fetch("https://dummyjson.com/products?limit=10"); // san pham mới
        const data = await res.json();
        setNewProduct(data.products || []);
        console.log(data.products);
      } catch (error) {
        console.error("Lỗi fetch sản phẩm:", error);
      }
    }
    FetchNewProducts();
  }, []);
  useEffect(() => {
    async function fetchComicProducts() {
      try {
        const res = await fetch("https://dummyjson.com/products?limit=6"); // truyện tranh
        const data = await res.json();
        setComicProduct(data.products || []);
        setLoading(false);
      } catch (error) {
        console.error("Lỗi fetch sản phẩm:", error);
      }
    }
    fetchComicProducts();
  }, []);
  useEffect(() => {
    async function fetchNovalProducts() {
      try {
        const res = await fetch("https://dummyjson.com/products?limit=6"); // tiểu thuyết
        const data = await res.json();
        setNovalProduct(data.products || []);
        setLoading(false);
      } catch (error) {
        console.error("Lỗi fetch sản phẩm:", error);
      }
    }
    fetchNovalProducts();
  }, []);

  useEffect(() => {
    async function fetchHistoryProducts() {
      try {
        const res = await fetch("https://dummyjson.com/products?limit=6"); // lịch sử
        const data = await res.json();
        setHistoryProduct(data.products || []);
        setLoading(false);
      } catch (error) {
        console.error("Lỗi fetch sản phẩm:", error);
      }
    }
    fetchHistoryProducts();
  }, []);
  useEffect(() => {
    async function fetchEconomyProducts() {
      try {
        const res = await fetch("https://dummyjson.com/products?limit=6"); // kinh tế
        const data = await res.json();
        setEconomy(data.products || []);
        setLoading(false);
      } catch (error) {
        console.error("Lỗi fetch sản phẩm:", error);
      }
    }
    fetchEconomyProducts();
  }, []);
  useEffect(() => {
    async function fetchDiscountBooks() {
      try {
        const res = await fetch("https://dummyjson.com/products?limit=6"); // sách giảm giá
        const data = await res.json();
        setDiscountBooks(data.products || []);
        setLoading(false);
      } catch (error) {
        console.error("Lỗi fetch sản phẩm:", error);
      }
    }
    fetchDiscountBooks();
  }, []);
  const comicTotalPages = Math.ceil(comicProduct.length / comicProductsPerPage);
  const novalTotalPages = Math.ceil(novalProduct.length / novalProductsPerPage);
  const historyTotalPages = Math.ceil(
    historyProduct.length / historyProductsPerPage
  );
  const economyTotalPages = Math.ceil(
    economyProduct.length / economyProductsPerPage
  );

  const comicStartIndex = (comicCurrentPage - 1) * comicProductsPerPage;
  const novalStartIndex = (novalCurrentPage - 1) * novalProductsPerPage;
  const historyStartIndex = (historyCurrentPage - 1) * historyProductsPerPage;
  const economyStartIndex = (economyCurrentPage - 1) * economyProductsPerPage;

  const currentComicProducts = comicProduct.slice(
    comicStartIndex,
    comicStartIndex + comicProductsPerPage
  );
  const currentNovalProducts = novalProduct.slice(
    novalStartIndex,
    novalStartIndex + novalProductsPerPage
  );
  const currentHistoryProducts = historyProduct.slice(
    historyStartIndex,
    historyStartIndex + historyProductsPerPage
  );
  const currentEconomyProducts = novalProduct.slice(
    economyStartIndex,
    economyStartIndex + economyProductsPerPage
  );
  if (loading) {
    return <div>Loading...</div>;
  }
  const handleComicPageClick = (page: SetStateAction<number>) => {
    setComicCurrentPage(page);
  };

  const handleNovalPageClick = (page: SetStateAction<number>) => {
    setNovalCurrentPage(page);
  };
  const handleHistoryPageClick = (page: SetStateAction<number>) => {
    setHistoryCurrentPage(page);
  };

  const handleEconomyPageClick = (page: SetStateAction<number>) => {
    setEconomyCurrentPage(page);
  };
  const formatTime = (seconds: any) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <>
      <div className="container">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          pagination={{ clickable: true }}
          navigation
          loop
          autoplay={{ delay: 5000 }}
          className="banner-swiper"
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={index}>
              <Image
                src={slide.src || slide}
                alt={`Slide ${index + 1}`}
                className="banner-image"
                width={1900}
                height={500}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      {/* code */}
      <div className="container">
        <h3 className="title">ƯU ĐÃI DÀNH CHO BẠN</h3>
        <div className="promo-container">
          {promos.map(({ code, title, desc, expiry }) => (
            <div key={code} className="promo-card">
              <div className="promo-bar"></div>
              <div className="promo-content">
                <div className="promo-code">{code}</div>
                <div className="promo-title">{title}</div>
                <div className="promo-desc">{desc}</div>
                <div className="promo-footer">
                  <div>
                    Mã: <strong>{code}</strong> <br />
                    HSD: {expiry}
                  </div>
                  <button className="copy-btn" onClick={() => handleCopy(code)}>
                    Sao chép mã
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Sản phẩm nổi bật */}
      <div className="container">
        <div className="product-swiper-wrapper">
          <Swiper
            modules={[Navigation]}
            navigation
            spaceBetween={20}
            slidesPerView={5}
            className="product-swiper"
          >
            {products.map((p) => (
              <SwiperSlide key={p.id}>
                <div className="product-card">
                  <div className="product-image-box">
                    <img
                      src={p.thumbnail}
                      alt={p.title}
                      className="product-image"
                    />
                  </div>
                  <div className="product-info">
                    <p className="product-name">{p.title}</p>
                    <div className="product-tags">
                      <span className="tag-new">Hàng Mới</span>
                      <span className="tag-voucher">Voucher 20K</span>
                    </div>
                    <p className="product-price">{p.price}₫</p>
                    <button className="cart-btn">🛒</button>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
      {/* Sản phẩm mới */}
      <div className="container">
        <h2 className="product-new-title">🆕 Sản phẩm mới</h2>
        <div className="product-new-grid">
          {newProducts.map((p) => (
            <div key={p.id} className="product-new-card">
              <div className="product-new-image-box">
                <img
                  src={p.thumbnail}
                  alt={p.title}
                  className="product-new-image"
                />
              </div>

              <div className="product-new-info">
                <p className="product-new-name">{p.title}</p>
                <div className="product-new-tags">
                  <span className="tag-new">Hàng Mới</span>
                  <span className="tag-voucher">Voucher 20K</span>
                </div>
                <p className="product-new-price">{p.price}₫</p>
                <button className="product-new-cart-btn">
                  🛒 Thêm vào giỏ
                </button>
              </div>
            </div>
          ))}
        </div>
        <button className="button-see-all">
          <a rel="stylesheet" href="#">
            Xem tất cả
          </a>
        </button>
      </div>
      {/* giảm giá sách */}
      <div className="container">
        <div className="flash-sale-container">
          <div className="flash-sale-header">
            <h2>⚡ FLASH SALE</h2>
            <span>Kết thúc trong {formatTime(timeLeft)}</span>
            <a href="#" className="see-all">
              Xem tất cả ➜
            </a>
          </div>

          {/* Swiper hiển thị 4 sản phẩm mỗi slide */}
          <Swiper
            modules={[Navigation]}
            spaceBetween={15}
            slidesPerView={5}
            navigation
            breakpoints={{
              1024: { slidesPerView: 4 },
              768: { slidesPerView: 2 },
              480: { slidesPerView: 1 },
            }}
            className="flash-sale-swiper"
          >
            {discountBooks.map((item: any) => (
              <SwiperSlide key={item.id}>
                <div className="item">
                  <img src={item.thumbnail} alt={item.title} />
                  <h3>{item.title}</h3>
                  <p className="price">
                    <span className="sale">{item.price} đ</span>
                    <span className="old">{item.price_old} đ</span>
                    <span className="discount">
                      -{item.discountPercentage}%
                    </span>
                  </p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
      {/* Cấc loại sách */}
      <div className="container">
        <div className="categories">
          {/* TRUYỆN TRANH Section */}
          <section className="category">
            <div className="header-category">
              <h2>TRUYỆN TRANH</h2>
              <button className="button-see-all">
                <a href="#">Xem tất cả </a>
              </button>
            </div>

            <div className="category-product-grid">
              {currentComicProducts.map((comic) => (
                <div className="category-product-card" key={comic.id}>
                  <img
                    src={comic.thumbnail}
                    alt={comic.title}
                    className="category-product-image"
                  />
                  <div className="product-info">
                    <p className="product-name">{comic.title}</p>
                    <div className="product-tags">
                      <span className="tag-new">Hàng Mới</span>
                      <span className="tag-voucher">Voucher 20K</span>
                    </div>
                    <div className="buying">
                      <p className="product-price">{comic.price}₫</p>
                      <button className="cart-btn">🛒</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination for TRUYỆN TRANH */}
            <div className="pagination">
              {[...Array(comicTotalPages)].map((_, index) => (
                <span
                  key={index}
                  className={`dot ${
                    comicCurrentPage === index + 1 ? "active" : ""
                  }`}
                  onClick={() => handleComicPageClick(index + 1)}
                />
              ))}
            </div>
          </section>

          {/* TIỂU THUYẾT Section */}
          <section className="category">
            <div className="header-category">
              <h2>TIỂU THUYẾT</h2>
              <button className="button-see-all">
                <a href="#">Xem tất cả </a>
              </button>
            </div>
            <div className="category-product-grid">
              {currentNovalProducts.map((noval) => (
                <div className="category-product-card" key={noval.id}>
                  <img
                    src={noval.thumbnail}
                    alt={noval.title}
                    className="category-product-image"
                  />
                  <div className="product-info">
                    <p className="product-name">{noval.title}</p>
                    <div className="product-tags">
                      <span className="tag-new">Hàng Mới</span>
                      <span className="tag-voucher">Voucher 20K</span>
                    </div>
                    <div className="buying">
                      <p className="product-price">{noval.price}₫</p>
                      <button className="cart-btn">🛒</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination for TIỂU THUYẾT */}
            <div className="pagination">
              {[...Array(novalTotalPages)].map((_, index) => (
                <span
                  key={index}
                  className={`dot ${
                    novalCurrentPage === index + 1 ? "active" : ""
                  }`}
                  onClick={() => handleNovalPageClick(index + 1)}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
      <div className="container">
        <div className="categories">
          {/* lỊCH SỬ Section */}
          <section className="category">
            <div className="header-category">
              <h2>LỊCH SỬ</h2>
              <button className="button-see-all">
                <a href="#">Xem tất cả</a>
              </button>
            </div>

            <div className="category-product-grid">
              {currentHistoryProducts.map((history) => (
                <div className="category-product-card" key={history.id}>
                  <img
                    src={history.thumbnail}
                    alt={history.title}
                    className="category-product-image"
                  />
                  <div className="product-info">
                    <p className="product-name">{history.title}</p>
                    <div className="product-tags">
                      <span className="tag-new">Hàng Mới</span>
                      <span className="tag-voucher">Voucher 20K</span>
                    </div>
                    <div className="buying">
                      <p className="product-price">{history.price}₫</p>
                      <button className="cart-btn">🛒</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination for LỊCH SỬ */}
            <div className="pagination">
              {[...Array(historyTotalPages)].map((_, index) => (
                <span
                  key={index}
                  className={`dot ${
                    historyCurrentPage === index + 1 ? "active" : ""
                  }`}
                  onClick={() => handleHistoryPageClick(index + 1)}
                />
              ))}
            </div>
          </section>

          {/* KINH TẾSection */}
          <section className="category">
            <div className="header-category">
              <h2>KINH TẾ</h2>
              <button className="button-see-all">
                <a href="#">Xem tất cả</a>
              </button>
            </div>
            <div className="category-product-grid">
              {currentEconomyProducts.map((economy) => (
                <div className="category-product-card" key={economy.id}>
                  <img
                    src={economy.thumbnail}
                    alt={economy.title}
                    className="category-product-image"
                  />
                  <div className="product-info">
                    <p className="product-name">{economy.title}</p>
                    <div className="product-tags">
                      <span className="tag-new">Hàng Mới</span>
                      <span className="tag-voucher">Voucher 20K</span>
                    </div>
                    <div className="buying">
                      <p className="product-price">{economy.price}₫</p>
                      <button className="cart-btn">🛒</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination for KINH TẾ*/}
            <div className="pagination">
              {[...Array(economyTotalPages)].map((_, index) => (
                <span
                  key={index}
                  className={`dot ${
                    economyCurrentPage === index + 1 ? "active" : ""
                  }`}
                  onClick={() => handleEconomyPageClick(index + 1)}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default Home;
