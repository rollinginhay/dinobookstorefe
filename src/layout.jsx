"use client";
import { Link, Outlet } from "react-router-dom";
import logo from "./assests/imgs/logo.webp";
const Header = () => {
  return (
    <header className="header">
      <div className="top-bar">
        <div className="logo">
          <Link href="/">
            <img src={logo} alt="Logo" width={120} height={40} />
          </Link>
        </div>
        <div className="search-box">
          <input type="text" placeholder="Bạn đang tìm gì..." />
          <button>
            <i className="fas fa-search"></i>
          </button>
        </div>

        <div className="icons">
          <div>
            <i className="fas fa-map-marker-alt"></i> <span>Cửa hàng</span>
          </div>
          <div>
            <i className="fas fa-user"></i> <span>Đăng nhập</span>
          </div>
          <div>
            <i className="fas fa-shopping-cart"></i> <span>Giỏ hàng</span>
          </div>
        </div>
      </div>

      <nav className="menu-bar">
        <Link href="#">
          🔍 HÀNG MỚI <span className="new">New</span>
        </Link>
        <Link href="#">SẢN PHẨM</Link>
        <Link href="#">SÁCH NƯỚC NGOÀI</Link>
        <Link href="#">SÁCH TRONG NƯỚC</Link>
        <Link href="#">PHỤ KIỆN</Link>
        <Link href="#">
          {" "}
          <span className="outlet">-50% OUTLET</span>
        </Link>
        <Link href="#">TIN VỀ SÁCH</Link>
      </nav>
    </header>
  );
};
const Footer = () => {
  return (
    <footer className="footer">
      {/* Đăng ký nhận tin */}
      <div className="subscribe">
        <span>ĐĂNG KÍ NHẬN TIN</span>
        <div className="subscribe-form">
          <input type="email" placeholder="📧 Email" />
          <button>✈ ĐĂNG KÝ</button>
        </div>
      </div>

      <hr className="divider" />

      {/* Nội dung chính */}
      <div className="footer-content">
        {/* Giới thiệu */}
        <div className="footer-section">
          <h4>GIỚI THIỆU</h4>
          <p>DinoStoreBook - Chuỗi Phân Phối Sách Chuẩn Hiệu</p>
          <p>📞 0862832192</p>
          <p>📧 phamduy24k@gmail.com</p>
          <p>⏰ Giờ mở cửa: 12:30 - 12:30</p>

          <div className="certification">
            <img src="/thongbao.png" alt="Thông báo" width={80} height={50} />
            <img src="/dmca.png" alt="DMCA" width={80} height={50} />
            <img src="/tuithethao.png" alt="Quà tặng" width={80} height={50} />
          </div>
        </div>

        {/* Chính sách */}
        <div className="footer-section">
          <h4>CHÍNH SÁCH</h4>
          <ul>
            <li>
              <Link href="#">Hướng dẫn đặt hàng</Link>
            </li>
            <li>
              <Link href="#">Chính sách</Link>
            </li>
          </ul>
        </div>

        {/* Địa chỉ cửa hàng */}
        <div className="footer-section">
          <h4>ĐỊA CHỈ CỬA HÀNG (23 CH)</h4>
          <p>
            📍 HÀ NỘI
            <br />
            Dục Tú Đông Anh Hà Nội
          </p>
          <p>
            📍 HÀ NỘI
            <br />
            Dục Tú Đông Anh Hà Nội
          </p>
          <p>
            📍 HÀ NỘI
            <br />
            Dục Tú Đông Anh Hà Nội
          </p>
          <p>
            📍 HÀ NỘI
            <br />
            Dục Tú Đông Anh Hà Nội
          </p>
          <Link href="#">XEM TẤT CẢ CỬA HÀNG</Link>
        </div>
        <div className="footer-section">
          <h4>PHƯƠNG THỨC THANH TOÁN</h4>
          <p>💳 Apple Pay | VNPay | COD</p>

          <div className="social-icons">
            <a href="#">
              <i className="fab fa-tiktok"></i>
            </a>
            <a href="#">
              <i className="fab fa-youtube"></i>
            </a>
            <a href="#">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="#">
              <i className="fab fa-facebook"></i>
            </a>
          </div>
        </div>
      </div>

      {/* Bản quyền */}
      <div className="footer-bottom">
        <p>BẢN QUYỀN THUỘC VỀ © 160STORE</p>
      </div>
    </footer>
  );
};
export default function Layout() {
  return (
    <html lang="vi">
      <body>
        <Header />
        <Outlet />
        <Footer />
      </body>
    </html>
  );
}
