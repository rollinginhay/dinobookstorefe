"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import DatePicker, {registerLocale} from "react-datepicker";
import {vi} from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("vi", vi);

export default function BillList() {
  const [bills, setBills] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredBills, setFilteredBills] = useState<any[]>([]);
  // Khi dữ liệu load xong → tự động lọc và hiển thị
useEffect(() => {
  if (bills.length > 0) {
    handleSearch();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [bills, users]);

  // TAB STATE
  const [activeTab, setActiveTab] = useState("ALL");

  // SEARCH BAR STATES
  const [searchCode, setSearchCode] = useState("");
  const [filterType, setFilterType] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // ======================================
  // LOAD DEMO DATA
  // ======================================
  useEffect(() => {
    const demoReceipts = [
      {
        id: "100001",
        attributes: {
          totalAmount: 322000,
          status: "PENDING",
          order_type: "ONLINE",
          order_date: "2025-02-19T23:45:53",
        },
        relationships: { user: { data: { id: "1" } } },
      },
      {
        id: "100002",
        attributes: {
          totalAmount: 225000,
          status: "COMPLETED",
          order_type: "POS",
          order_date: "2025-01-10T23:44:35",
        },
        relationships: { user: { data: { id: "2" } } },
      },
      {
        id: "100003",
        attributes: {
          totalAmount: 1072000,
          status: "COMPLETED",
          order_type: "ONLINE",
          order_date: "2025-03-19T23:41:54",
        },
        relationships: { user: { data: { id: "1" } } },
      },
      {
        id: "100004",
        attributes: {
          totalAmount: 772000,
          status: "PENDING",
          order_type: "ONLINE",
          order_date: "2025-07-10T23:27:30",
        },
        relationships: { user: { data: { id: "3" } } },
      },
      {
        id: "100005",
        attributes: {
          totalAmount: 450000,
          status: "COMPLETED",
          order_type: "POS",
          order_date: "2025-01-19T22:58:11",
        },
        relationships: { user: { data: { id: "2" } } },
      },
    ];

    const demoUsers = [
      { id: "1", attributes: { name: "Nguyễn Công Ninh", phone: "0399796130" } },
      { id: "2", attributes: { name: "Khách hàng lẻ", phone: "-" } },
      { id: "3", attributes: { name: "Đỗ Hải Phong", phone: "031226948" } },
    ];

    setBills(demoReceipts);
    setUsers(demoUsers);
    setFilteredBills(demoReceipts);
  }, []);

  // Helper: lấy tên + phone
  const getCustomer = (id: string) =>
    users.find((u) => u.id === id)?.attributes || {
      name: "Khách hàng",
      phone: "-",
    };

  // ======================================
  // FILTER THEO TAB
  // ======================================
  const filterByTab = (tab: string, data: any[]) => {
    switch (tab) {
      case "PENDING":
        return data.filter((b) => b.attributes.status === "PENDING");
      case "COMPLETED":
        return data.filter((b) => b.attributes.status === "COMPLETED");
      case "SHIPPING":
      case "CANCELLED":
      case "RETURNED":
        return []; // Demo không có dữ liệu
      default:
        return data;
    }
  };

  // ======================================
  // SEARCH FUNCTION
  // ======================================
  const handleSearch = () => {
    let result = [...bills];

    // Tìm theo mã hóa đơn
    if (searchCode.trim() !== "") {
      result = result.filter((b) =>
        ("HD" + b.id).toLowerCase().includes(searchCode.toLowerCase())
      );
    }

    // Lọc theo loại đơn hàng
    if (filterType !== "") {
      result = result.filter((b) => b.attributes.order_type === filterType);
    }

    // Lọc theo ngày bắt đầu
    if (startDate) {
      result = result.filter(
        (b) => new Date(b.attributes.order_date) >= startDate
      );
    }

    // Lọc theo ngày kết thúc
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      result = result.filter(
        (b) => new Date(b.attributes.order_date) <= end
      );
    }

    // Lọc thêm theo TAB
    result = filterByTab(activeTab, result);

    setFilteredBills(result);
  };

  // Tự filter khi đổi tab
  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* SEARCH BAR */}
      <div className="card flex flex-wrap items-end gap-4">
        {/* Mã đơn */}
        <div className="w-full md:w-64">
          <label className="form-label">Tìm kiếm theo mã</label>
          <input
            type="text"
            placeholder="Nhập mã hóa đơn"
            className="input"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
          />
        </div>

        {/* Loại đơn hàng */}
        <div className="w-full md:w-48">
          <label className="form-label">Loại đơn hàng</label>
          <select
            className="select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="POS">Tại quầy</option>
            <option value="ONLINE">Trực tuyến</option>
          </select>
        </div>

        {/* Từ ngày */}
        <div className="w-full md:w-56">
          <label className="form-label">Từ ngày</label>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            dateFormat="dd/MM/yyyy"
            locale="vi"
            placeholderText="dd/mm/yyyy"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            minDate={new Date(2020, 0, 1)}
            maxDate={new Date()}
            className="input cursor-pointer"
          />
        </div>

        {/* Đến ngày */}
        <div className="w-full md:w-56">
          <label className="form-label">Đến ngày</label>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            dateFormat="dd/MM/yyyy"
            locale="vi"
            placeholderText="dd/mm/yyyy"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            minDate={new Date(2020, 0, 1)}
            maxDate={new Date()}
            className="input cursor-pointer"
          />
        </div>

        <div className="w-full md:w-auto">
          <button
            onClick={handleSearch}
            className="btn btn-primary w-full md:mt-6"
          >
            Tìm kiếm
          </button>
        </div>
      </div>

      <h2 className="section-title">Danh sách hóa đơn</h2>

      {/* STATUS TABS */}
      <div className="flex flex-wrap gap-6 mb-2 border-b border-gray-200 text-sm font-medium">
        {[
          { key: "ALL", label: "Tất cả" },
          { key: "PENDING", label: "Chờ xác nhận" },
          { key: "SHIPPING", label: "Đang vận chuyển" },
          { key: "COMPLETED", label: "Hoàn thành" },
          { key: "CANCELLED", label: "Đã hủy" },
          { key: "RETURNED", label: "Trả hàng" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-2 border-b-2 -mb-px ${
              activeTab === tab.key
                ? "text-[var(--sidebar-primary)] border-[var(--sidebar-primary)]"
                : "text-gray-600 border-transparent hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="card p-0 overflow-x-auto">
        <table className="table min-w-[900px]">
          <thead>
            <tr>
              <th>STT</th>
              <th>Mã</th>
              <th>Khách hàng</th>
              <th>SDT</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Loại đơn hàng</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {filteredBills.map((bill: any, index: number) => {
              const attrs = bill.attributes;
              const customer = getCustomer(bill.relationships?.user?.data?.id);

              return (
                <tr key={bill.id}>
                  <td>{index + 1}</td>
                  <td>HD{bill.id}</td>
                  <td>{customer.name}</td>
                  <td>{customer.phone}</td>

                  <td className="text-red-500">
                    {attrs.totalAmount.toLocaleString()} đ
                  </td>

                  <td>
                    {attrs.status === "COMPLETED" ? (
                      <span className="badge bg-green-100 text-green-600">
                        Thành công
                      </span>
                    ) : (
                      <span className="badge bg-blue-100 text-blue-600">
                        Xác nhận
                      </span>
                    )}
                  </td>

                  <td>
                    {new Date(attrs.order_date).toLocaleString("vi-VN")}
                  </td>

                  <td>
                    {attrs.order_type === "POS" ? (
                      <span className="badge bg-green-100 text-green-600">
                        Tại quầy
                      </span>
                    ) : (
                      <span className="badge bg-purple-100 text-purple-600">
                        Trực tuyến
                      </span>
                    )}
                  </td>

                  <td>
                    <div className="flex gap-3 text-lg">

  {/* Xem hóa đơn chi tiết */}
  <Link
    href={`/bill/${bill.id}`}
    className="text-blue-600 hover:text-blue-800"
    title="Hóa đơn chi tiết"
  >
    ✏️
  </Link>

  {/* In hóa đơn */}
  <Link
    href="#"
    className="text-green-600 hover:text-green-800"
    title="In hóa đơn"
  >
    🖨️
  </Link>
  
</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
