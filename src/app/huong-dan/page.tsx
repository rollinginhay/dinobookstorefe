'use client';

import Breadcrumb from '@/components/Breadcrumb';

export default function HuongDan() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb 
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Hướng dẫn mua hàng' }
        ]} 
      />

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-3">📖 Hướng Dẫn Mua Hàng</h1>
          <p className="text-lg text-blue-100">
            Hướng dẫn chi tiết cách mua sách tại Dino Bookstore
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-3xl">1️⃣</span>
              Tìm kiếm sách
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Bạn có thể tìm kiếm sách bằng cách sử dụng thanh tìm kiếm ở đầu trang, hoặc duyệt theo danh mục như 
              Sách trong nước, Sách nước ngoài, Kỹ năng sống, Kinh doanh, Manga/Comic, Sách thiếu nhi.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-3xl">2️⃣</span>
              Xem chi tiết sản phẩm
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Click vào sách bạn muốn để xem thông tin chi tiết bao gồm mô tả, đánh giá, giá cả, và các thông tin khác.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-3xl">3️⃣</span>
              Thêm vào giỏ hàng
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Chọn số lượng sách bạn muốn mua và click vào nút "Thêm vào giỏ hàng". Bạn có thể tiếp tục mua sắm 
              hoặc vào giỏ hàng để kiểm tra đơn hàng.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-3xl">4️⃣</span>
              Thanh toán
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Khi đã sẵn sàng, vào giỏ hàng và click "Tiến hành đặt hàng". Điền thông tin giao hàng và chọn phương thức 
              thanh toán phù hợp với bạn.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-3xl">5️⃣</span>
              Xác nhận đơn hàng
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Sau khi hoàn tất thanh toán, bạn sẽ nhận được email xác nhận đơn hàng. Chúng tôi sẽ xử lý đơn hàng 
              và giao hàng đến địa chỉ bạn đã cung cấp.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

