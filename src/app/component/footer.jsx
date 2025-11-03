// src/app/components/Footer.tsx
"use client";

import Link from "next/link";

export default function RootFooter() {
  return (
    <footer className="footer">
      <div className="subscribe">
        <span>ĐĂNG KÍ NHẬN TIN</span>
        <div className="subscribe-form">
          <input type="email" placeholder="📧 Email" />
          <button>✈ ĐĂNG KÝ</button>
        </div>
      </div>

      <hr className="divider" />

      <div className="footer-content">
        <div className="footer-section">
          <h4>GIỚI THIỆU</h4>
          <p>DinoStoreBook - Chuỗi Phân Phối Sách Chuẩn Hiệu</p>
          <p>📞 0862832192</p>
          <p>📧 phamduy24k@gmail.com</p>
          <p>⏰ Giờ mở cửa: 12:30 - 12:30</p>
        </div>

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

        <div className="footer-section">
          <h4>ĐỊA CHỈ CỬA HÀNG (23 CH)</h4>
          <p>
            📍 HÀ NỘI <br />
            Dục Tú Đông Anh Hà Nội
          </p>
          <p>
            📍 HÀ NỘI <br />
            Dục Tú Đông Anh Hà Nội
          </p>
          <p>
            📍 HÀ NỘI <br />
            Dục Tú Đông Anh Hà Nội
          </p>
          <p>
            📍 HÀ NỘI <br />
            Dục Tú Đông Anh Hà Nội
          </p>
          <Link href="#">XEM TẤT CẢ CỬA HÀNG</Link>
        </div>

        <div className="footer-section">
          <h4>PHƯƠNG THỨC THANH TOÁN</h4>
          <p>💳 Apple Pay | VNPay | COD</p>

          <div className="social-icons">
            <Link href="#">
              <i className="fab fa-tiktok"></i>
            </Link>
            <Link href="#">
              <i className="fab fa-youtube"></i>
            </Link>
            <Link href="#">
              <i className="fab fa-instagram"></i>
            </Link>
            <Link href="#">
              <i className="fab fa-facebook"></i>
            </Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>BẢN QUYỀN THUỘC VỀ © 160STORE</p>
      </div>
    </footer>
  );
}
