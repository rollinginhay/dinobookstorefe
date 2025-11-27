'use client';

import Breadcrumb from '@/components/Breadcrumb';

export default function DoiTra() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb 
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Chính sách đổi trả' }
        ]} 
      />

      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-3">↩️ Chính Sách Đổi Trả</h1>
          <p className="text-lg text-green-100">
            Chúng tôi cam kết đảm bảo quyền lợi của khách hàng
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Thời gian đổi trả</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Chúng tôi hỗ trợ đổi trả miễn phí trong vòng <strong>30 ngày</strong> kể từ ngày nhận hàng. 
              Sản phẩm phải còn nguyên vẹn, chưa sử dụng, còn tem nhãn và bao bì gốc.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Điều kiện đổi trả</h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Sách bị lỗi in ấn, thiếu trang, hoặc sai nội dung</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Sách bị hư hỏng trong quá trình vận chuyển</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Giao nhầm sản phẩm so với đơn hàng</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Khách hàng thay đổi ý định trong vòng 7 ngày đầu</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quy trình đổi trả</h2>
            <ol className="space-y-4 text-gray-600">
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">1</span>
                <span>Liên hệ hotline <strong>1900 1234 567</strong> hoặc email <strong>support@dinobookstore.com</strong> để yêu cầu đổi trả</span>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">2</span>
                <span>Cung cấp mã đơn hàng và hình ảnh sản phẩm (nếu có lỗi)</span>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">3</span>
                <span>Chúng tôi sẽ xác nhận và hướng dẫn bạn đóng gói sản phẩm</span>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">4</span>
                <span>Nhân viên đến lấy hàng hoặc bạn gửi qua bưu điện (miễn phí)</span>
              </li>
              <li className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">5</span>
                <span>Sau khi kiểm tra, chúng tôi sẽ hoàn tiền hoặc đổi sách mới cho bạn</span>
              </li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

