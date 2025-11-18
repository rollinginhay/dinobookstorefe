'use client';

import { useState } from 'react';

interface FilterSidebarProps {
  onFilterChange: (filters: any) => void;
}

export default function FilterSidebar({ onFilterChange }: FilterSidebarProps) {
  const [filters, setFilters] = useState({
    priceRange: '',
    category: '',
    publisher: '',
    author: '',
    year: '',
    language: ''
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="w-64 bg-white rounded-lg shadow-sm p-4">
      <h3 className="font-semibold text-lg mb-4 text-gray-800">Bộ lọc</h3>
      
      {/* Khoảng giá */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Khoảng giá</h4>
        <div className="space-y-2">
          {[
            { value: '0-50000', label: 'Dưới 50.000₫', count: 125 },
            { value: '50000-100000', label: '50.000₫ - 100.000₫', count: 342 },
            { value: '100000-200000', label: '100.000₫ - 200.000₫', count: 567 },
            { value: '200000-500000', label: '200.000₫ - 500.000₫', count: 234 },
            { value: '500000+', label: 'Trên 500.000₫', count: 89 }
          ].map((option) => (
            <label key={option.value} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1 rounded">
              <div className="flex items-center">
                <input
                  type="radio"
                  name="priceRange"
                  value={option.value}
                  checked={filters.priceRange === option.value}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  className="mr-2 text-orange-600"
                />
                <span className="text-sm text-gray-600">{option.label}</span>
              </div>
              <span className="text-xs text-gray-400">({option.count})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Thể loại */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Thể loại</h4>
        <div className="space-y-2">
          {[
            { name: 'Kỹ năng sống', count: 156 },
            { name: 'Giáo dục', count: 234 },
            { name: 'Văn học', count: 189 },
            { name: 'Lịch sử', count: 98 },
            { name: 'Phát triển bản thân', count: 145 },
            { name: 'Kinh doanh', count: 167 },
            { name: 'Khoa học', count: 123 },
            { name: 'Nghệ thuật', count: 87 }
          ].map((category) => (
            <label key={category.name} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1 rounded">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.category === category.name}
                  onChange={(e) => handleFilterChange('category', e.target.checked ? category.name : '')}
                  className="mr-2 text-orange-600"
                />
                <span className="text-sm text-gray-600">{category.name}</span>
              </div>
              <span className="text-xs text-gray-400">({category.count})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Nhà xuất bản */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Nhà xuất bản</h4>
        <div className="space-y-2">
          {[
            { name: 'NXB Tổng hợp TP.HCM', count: 234 },
            { name: 'NXB Trẻ', count: 189 },
            { name: 'NXB Hội Nhà văn', count: 156 },
            { name: 'NXB Thế giới', count: 123 },
            { name: 'NXB Lao động', count: 98 },
            { name: 'NXB Kim Đồng', count: 167 },
            { name: 'NXB Giáo dục', count: 145 }
          ].map((publisher) => (
            <label key={publisher.name} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1 rounded">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.publisher === publisher.name}
                  onChange={(e) => handleFilterChange('publisher', e.target.checked ? publisher.name : '')}
                  className="mr-2 text-orange-600"
                />
                <span className="text-sm text-gray-600">{publisher.name}</span>
              </div>
              <span className="text-xs text-gray-400">({publisher.count})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Năm xuất bản */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Năm xuất bản</h4>
        <div className="space-y-2">
          {[
            { year: '2024', count: 234 },
            { year: '2023', count: 456 },
            { year: '2022', count: 189 },
            { year: '2021', count: 123 },
            { year: '2020', count: 98 }
          ].map((item) => (
            <label key={item.year} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1 rounded">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.year === item.year}
                  onChange={(e) => handleFilterChange('year', e.target.checked ? item.year : '')}
                  className="mr-2 text-orange-600"
                />
                <span className="text-sm text-gray-600">{item.year}</span>
              </div>
              <span className="text-xs text-gray-400">({item.count})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Ngôn ngữ */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Ngôn ngữ</h4>
        <div className="space-y-2">
          {[
            { name: 'Tiếng Việt', count: 1234 },
            { name: 'English', count: 567 },
            { name: '中文', count: 89 },
            { name: '日本語', count: 45 }
          ].map((language) => (
            <label key={language.name} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1 rounded">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.language === language.name}
                  onChange={(e) => handleFilterChange('language', e.target.checked ? language.name : '')}
                  className="mr-2 text-orange-600"
                />
                <span className="text-sm text-gray-600">{language.name}</span>
              </div>
              <span className="text-xs text-gray-400">({language.count})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tình trạng sách */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Tình trạng</h4>
        <div className="space-y-2">
          {[
            { name: 'Còn hàng', count: 1456 },
            { name: 'Sắp có hàng', count: 23 },
            { name: 'Hết hàng', count: 12 }
          ].map((status) => (
            <label key={status.name} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1 rounded">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2 text-orange-600"
                />
                <span className="text-sm text-gray-600">{status.name}</span>
              </div>
              <span className="text-xs text-gray-400">({status.count})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Đánh giá */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Đánh giá</h4>
        <div className="space-y-2">
          {[
            { stars: 5, count: 234 },
            { stars: 4, count: 456 },
            { stars: 3, count: 189 },
            { stars: 2, count: 45 },
            { stars: 1, count: 12 }
          ].map((rating) => (
            <label key={rating.stars} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1 rounded">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2 text-orange-600"
                />
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-3 h-3 ${i < rating.stars ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                    </svg>
                  ))}
                </div>
              </div>
              <span className="text-xs text-gray-400">({rating.count})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Nút xóa bộ lọc */}
      <button
        onClick={() => {
          const resetFilters = {
            priceRange: '',
            category: '',
            publisher: '',
            author: '',
            year: '',
            language: ''
          };
          setFilters(resetFilters);
          onFilterChange(resetFilters);
        }}
        className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors font-medium"
      >
        Xóa bộ lọc
      </button>
    </div>
  );
}
