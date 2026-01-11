"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import DatePicker, {registerLocale} from "react-datepicker";
import {vi} from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import {BillService} from "@/service/bill.service";

registerLocale("vi", vi);

export default function BillList() {
    const [bills, setBills] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [filteredBills, setFilteredBills] = useState<any[]>([]);
    // 🔍 CHỖ NÀY NÈ — THÊM STATE PHÂN TRANG
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const itemsPerPage = 10;
    // Khi dữ liệu load xong → tự động lọc và hiển thị
    useEffect(() => {
        if (bills.length > 0) {
            handleSearch();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bills, users]);

    // TAB STATE
    const [activeTab, setActiveTab] = useState("ALL");

    // Search states
    const [searchCode, setSearchCode] = useState("");
    const [filterType, setFilterType] = useState("");
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);


1203    // Load API function
    const loadBills = () => {
        setLoading(true);
        setError(null);
        BillService.getList(0, 1000) // Tăng limit lên 1000 để load đủ đơn
            .then((data) => {
                const sorted = [...data].sort((a, b) => {
                    // ✅ Đơn yêu cầu trả hàng (returnStatus === "REQUESTED") lên trên
                    const aHasReturnRequest = a.returnStatus === "REQUESTED";
                    const bHasReturnRequest = b.returnStatus === "REQUESTED";
                    
                    if (aHasReturnRequest && !bHasReturnRequest) return -1;
                    if (!aHasReturnRequest && bHasReturnRequest) return 1;
                    
                    // Nếu cả hai đều có hoặc không có yêu cầu trả hàng, sắp xếp theo ngày (mới nhất trước)
                    return new Date(b.orderDate || 0).getTime() - new Date(a.orderDate || 0).getTime();
                });

                setBills(sorted);
                setFilteredBills(sorted);
            })
            .catch((error) => {
                console.error("Error loading bills:", error);
                setError("Không thể tải danh sách hóa đơn. Vui lòng thử lại sau.");
                setBills([]);
                setFilteredBills([]);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // Load API on mount
    useEffect(() => {
        loadBills();
    }, []);

    // Refetch when window gains focus or tab becomes visible (user comes back to this tab)
    useEffect(() => {
        const handleFocus = () => {
            loadBills();
        };

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                loadBills();
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);


    // ===========================
    // FILTER BY TAB
    // ===========================
    const filterByTab = (tab: string, data: any[]) => {
        switch (tab) {
            case "PENDING":
                return data.filter((b) => b.status === "PENDING");

            case "AUTHORIZED":
                return data.filter((b) => b.status === "AUTHORIZED");

            case "IN_TRANSIT":
                return data.filter((b) => b.status === "IN_TRANSIT");

            case "PAID":
                return data.filter((b) => b.status === "PAID");

            case "CANCELLED":
                return data.filter((b) => b.status === "CANCELLED");
            
            case "FAILED":
                return data.filter((b) => b.status === "FAILED");


            case "REFUNDED":
                return data.filter((b) => b.status === "REFUNDED");

            case "WAITING_REFUND_INFO":
                return data.filter((b) => b.status === "WAITING_REFUND_INFO");

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

        // Loại đơn hàng
        if (filterType !== "") {
            result = result.filter((b) => b.orderType === filterType);
        }

        // Từ ngày
        if (startDate) {
            result = result.filter((b) => new Date(b.orderDate) >= startDate);
        }

        // Đến ngày
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59);
            result = result.filter((b) => new Date(b.orderDate) <= end);
        }

        // Lọc theo tab
        result = filterByTab(activeTab, result);

        // ⭐ THÊM DÒNG NÀY — sort mới nhất trước
        result = result.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

        setCurrentPage(1);
        setFilteredBills(result);

    };

    // Tự lọc khi đổi tab
    useEffect(() => {
        handleSearch();
    }, [activeTab]); // eslint-disable-line

    // ===========================
    // STATUS BADGE
    // ===========================
    const renderStatusBadge = (status: string, returnStatus?: "REQUESTED" | "REJECTED" | "APPROVED" | null) => {
        let statusBadge;
        switch (status) {
            case "PENDING":
                statusBadge = <span className="badge bg-yellow-100 text-yellow-600">Chờ xác nhận</span>;
                break;

            case "AUTHORIZED":
                statusBadge = <span className="badge bg-cyan-100 text-cyan-600">Đã xác nhận</span>;
                break;

            case "IN_TRANSIT":
                statusBadge = <span className="badge bg-blue-100 text-blue-600">Đang vận chuyển</span>;
                break;

            case "PAID":
                statusBadge = <span className="badge bg-green-100 text-green-600">Hoàn thành</span>;
                break;

            case "CANCELLED":
                statusBadge = <span className="badge bg-red-100 text-red-600">Đã hủy</span>;
                break;
            case "FAILED":
                statusBadge = <span className="badge bg-orange-100 text-orange-600">Thất bại</span>;
                break;

            case "REFUNDED":
                statusBadge = <span className="badge bg-gray-100 text-gray-600">Hoàn tiền</span>;
                break;

            case "WAITING_REFUND_INFO":
                statusBadge = <span className="badge bg-yellow-100 text-yellow-700">Chờ thông tin hoàn tiền</span>;
                break;

            default:
                statusBadge = <span className="badge bg-gray-200 text-gray-700">{status}</span>;
        }

        // Thêm badge trạng thái return request nếu có
        if (returnStatus === "REQUESTED") {
            return (
                <div className="flex flex-col gap-1 items-start">
                    {statusBadge}
                    <span className="badge bg-orange-100 text-orange-600 text-xs whitespace-nowrap">🟠 Yêu cầu trả hàng</span>
                </div>
            );
        }
        if (returnStatus === "REJECTED") {
            return (
                <div className="flex flex-col gap-1 items-start">
                    {statusBadge}
                    <span className="badge bg-red-100 text-red-600 text-xs whitespace-nowrap">🔴 Trả hàng bị từ chối</span>
                </div>
            );
        }
        if (returnStatus === "APPROVED") {
            return (
                <div className="flex flex-col gap-1 items-start">
                    {statusBadge}
                    <span className="badge bg-purple-100 text-purple-600 text-xs whitespace-nowrap">🟣 Hoàn tiền</span>
                </div>
            );
        }

        return statusBadge;
    };

// TÍNH BILL THEO TRANG
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentBills = filteredBills.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="space-y-6">

            {/* SEARCH BAR */}
            <div className="card flex flex-wrap items-end gap-4">
                <div className="w-full md:w-64">
                    <label className="form-label">Tìm kiếm theo mã</label>
                    <input
                        type="text"
                        className="input"
                        placeholder="Nhập mã hóa đơn"
                        value={searchCode}
                        onChange={(e) => setSearchCode(e.target.value)}
                    />
                </div>

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


                <button className="btn btn-primary" onClick={handleSearch}>
                    Tìm kiếm
                </button>
            </div>

            {/* ✅ THÔNG BÁO ĐƠN CHỜ HOÀN TIỀN - CHỈ HIỂN THỊ KHI KHÁCH ĐÃ SUBMIT THÔNG TIN HOÀN TIỀN */}
            {(() => {
                // Chỉ lấy các đơn có status WAITING_REFUND_INFO và đã có thông tin hoàn tiền (refundBankAccount trong note)
                const waitingRefundBills = bills.filter((b) => {
                    if (b.status !== "WAITING_REFUND_INFO") return false;
                    
                    // Kiểm tra xem note có chứa thông tin hoàn tiền hay không
                    const note = b.note || "";
                    if (!note) return false;
                    
                    // Kiểm tra xem có JSON với refundBankAccount không
                    const jsonStart = note.indexOf('{"refundBankAccount"');
                    if (jsonStart === -1) return false;
                    
                    try {
                        const jsonEnd = note.indexOf("}", jsonStart);
                        if (jsonEnd === -1) return false;
                        
                        const jsonStr = note.substring(jsonStart, jsonEnd + 1);
                        const refundData = JSON.parse(jsonStr);
                        
                        // Chỉ trả về true nếu đã có refundBankAccount (đã submit)
                        return refundData.refundBankAccount && refundData.refundBankAccount.trim() !== "";
                    } catch (e) {
                        return false;
                    }
                });
                
                const waitingRefundCount = waitingRefundBills.length;
                
                return waitingRefundCount > 0 ? (
                    <div className="card bg-yellow-50 border-2 border-yellow-300 mb-4">
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">💰</span>
                                <div>
                                    <p className="font-semibold text-yellow-800">
                                        Có {waitingRefundCount} đơn hàng đang chờ hoàn tiền
                                    </p>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        Các đơn hàng này cần được xử lý hoàn tiền cho khách hàng
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveTab("WAITING_REFUND_INFO")}
                                className="btn bg-yellow-600 hover:bg-yellow-700 text-white font-semibold"
                            >
                                Xem danh sách ({waitingRefundCount})
                            </button>
                        </div>
                    </div>
                ) : null;
            })()}

            {/* TABS */}
            <div className="flex gap-6 border-b pb-2 text-sm font-medium flex-wrap">
                {[
                    { key: "ALL", label: "Tất cả" },
                    { key: "PENDING", label: "Chờ xác nhận" },
                    { key: "AUTHORIZED", label: "Đã xác nhận" },
                    { key: "IN_TRANSIT", label: "Đang vận chuyển" },
                    { key: "PAID", label: "Hoàn thành" },
                    { key: "CANCELLED", label: "Đã hủy" },
                    { key: "FAILED", label: "Thất bại" },
                    { key: "WAITING_REFUND_INFO", label: "Chờ hoàn tiền" },
                    { key: "REFUNDED", label: "Hoàn tiền" },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`pb-2 border-b-2 ${
                            activeTab === tab.key
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-600 hover:text-gray-800"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* LOADING STATE */}
            {loading && (
                <div className="card p-6 text-center">
                    <p className="text-gray-500">Đang tải dữ liệu...</p>
                </div>
            )}

            {/* ERROR STATE */}
            {error && !loading && (
                <div className="card p-6 text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn btn-primary"
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {/* TABLE */}
            {!loading && !error && (
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
                    {currentBills.map((bill: any, index: number) => {
                        return (
                            <tr key={bill.id}>
                                <td>{startIndex + index + 1}</td>
                                <td>HD{bill.id}</td>
                                <td>{bill.customerName}</td>
                                <td>{bill.customerPhone}</td>

                                <td className="text-red-500">
                                    {(bill.totalAmount || 0).toLocaleString()} đ
                                </td>

                                <td className="align-top">{renderStatusBadge(bill.status, bill.returnStatus)}</td>

                                <td>{new Date(bill.orderDate).toLocaleString("vi-VN")}</td>

                                <td>
                                    {bill.orderType === "POS" ? (
                                        <span className="badge bg-green-100 text-green-600">Tại quầy</span>
                                    ) : (
                                        <span className="badge bg-purple-100 text-purple-600">Trực tuyến</span>
                                    )}
                                </td>

                                <td>
                                    <div className="flex gap-3 text-lg">
                                        <Link href={`/bill/${bill.id}`} className="text-blue-600">
                                            📄
                                        </Link>
                                        <Link href="#" className="text-green-600">
                                            🖨️
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}

                    {filteredBills.length === 0 && (
                        <tr>
                            <td colSpan={9} className="text-center py-6 text-gray-500">
                                Không có hóa đơn nào phù hợp.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
                {/* PAGINATION */}
                <div className="flex justify-center items-center gap-4 py-5">
                    <button
                        className={`px-4 py-2 rounded-md border text-sm 
                ${currentPage === 1
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white hover:bg-gray-100"}`}
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                    >
                        ← Trước
                    </button>

                    <span className="text-sm font-medium px-3 py-1 bg-gray-100 rounded-md">
    Trang {currentPage}
  </span>

                    <button
                        className={`px-4 py-2 rounded-md border text-sm 
                ${(startIndex + itemsPerPage) >= filteredBills.length
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white hover:bg-gray-100"}`}
                        disabled={(startIndex + itemsPerPage) >= filteredBills.length}
                        onClick={() => setCurrentPage(currentPage + 1)}
                    >
                        Sau →
                    </button>
                </div>
            </div>
            )}
        </div>
    );
}