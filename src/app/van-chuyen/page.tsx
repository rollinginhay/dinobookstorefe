'use client';

import Breadcrumb from '@/components/Breadcrumb';

export default function VanChuyen() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumb 
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Vận chuyển' }
        ]} 
      />

      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-3">🚚 Vận Chuyển</h1>
          <p className="text-lg text-purple-100">
            Thông tin chi tiết về dịch vụ vận chuyển của chúng tôi
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Phí vận chuyển</h2>
            <div className="bg-purple-50 rounded-xl p-6 mb-4">
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span><strong>Miễn phí vận chuyển</strong> cho đơn hàng từ <strong>299.000₫</strong> trở lên</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Phí vận chuyển <strong>30.000₫</strong> cho đơn hàng dưới 299.000₫</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Giao hàng nhanh trong nội thành: <strong>20.000₫</strong> (giao trong 2-4 giờ)</span>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Thời gian giao hàng</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-purple-600 pl-4">
                <h3 className="font-bold text-gray-900 mb-2">Khu vực nội thành TP.HCM/Hà Nội</h3>
                <p className="text-gray-600">1-2 ngày làm việc</p>
              </div>
              <div className="border-l-4 border-purple-600 pl-4">
                <h3 className="font-bold text-gray-900 mb-2">Các tỉnh/thành phố khác</h3>
                <p className="text-gray-600">3-5 ngày làm việc</p>
              </div>
              <div className="border-l-4 border-purple-600 pl-4">
                <h3 className="font-bold text-gray-900 mb-2">Vùng sâu, vùng xa</h3>
                <p className="text-gray-600">5-7 ngày làm việc</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Đối tác vận chuyển</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Chúng tôi hợp tác với các đơn vị vận chuyển uy tín như:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['Viettel Post', 'Vietnam Post', 'Giao Hàng Nhanh', 'Grab Express', 'Shopee Express', 'J&T Express'].map((partner) => (
                <div key={partner} className="bg-gray-50 rounded-lg p-4 text-center font-medium text-gray-700">
                  {partner}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

