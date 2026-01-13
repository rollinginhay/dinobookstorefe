import ExcelJS from 'exceljs';

interface BillExcelData {
    id: number;
    code: string; // HD{id}
    customerName: string;
    customerPhone: string;
    totalAmount: number;
    orderDate: string;
    orderType: string;
    status: string;
}

// Helper để format tiền
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount);
}

/**
 * Xuất danh sách hóa đơn ra file Excel (chỉ đơn hoàn thành)
 * @param bills - Danh sách hóa đơn cần xuất
 * @param filename - Tên file (mặc định: "Danh_sach_hoa_don.xlsx")
 */
export async function exportBillsToExcel(
    bills: BillExcelData[],
    filename: string = `Danh_sach_hoa_don_${new Date().toISOString().split('T')[0]}.xlsx`
) {
    // Validate: Chỉ xuất đơn hoàn thành (PAID)
    const paidBills = bills.filter(bill => bill.status === 'PAID');
    
    if (!paidBills || paidBills.length === 0) {
        alert('Không có đơn hàng hoàn thành để xuất Excel. Chỉ có thể xuất đơn hàng đã hoàn thành.');
        return;
    }

    // Tạo workbook mới
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách hóa đơn');

    // Định nghĩa cột (bỏ trường Trạng thái)
    worksheet.columns = [
        { header: 'STT', key: 'stt', width: 6 },
        { header: 'Mã hóa đơn', key: 'code', width: 15 },
        { header: 'Tên khách hàng', key: 'customerName', width: 30 },
        { header: 'Số điện thoại', key: 'customerPhone', width: 15 },
        { header: 'Tổng tiền', key: 'totalAmount', width: 18 },
        { header: 'Ngày tạo', key: 'orderDate', width: 22 },
        { header: 'Loại đơn', key: 'orderType', width: 15 },
    ];

    // Style cho header
    const headerRow = worksheet.getRow(1);
    headerRow.font = {
        bold: true,
        size: 12,
        color: { argb: 'FFFFFFFF' }
    };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2980B9' } // Màu xanh đẹp
    };
    headerRow.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true
    };
    headerRow.height = 30;

    // Thêm dữ liệu
    paidBills.forEach((bill, index) => {
        const row = worksheet.addRow({
            stt: index + 1,
            code: bill.code,
            customerName: bill.customerName,
            customerPhone: bill.customerPhone,
            totalAmount: bill.totalAmount,
            orderDate: new Date(bill.orderDate).toLocaleString('vi-VN'),
            orderType: bill.orderType === 'POS' ? 'Tại quầy' : 'Trực tuyến',
        });

        // Style cho các dòng dữ liệu
        row.font = { size: 11 };
        row.alignment = { vertical: 'middle', horizontal: 'left' };
        row.height = 20;

        // Căn giữa cho STT
        row.getCell('stt').alignment = { vertical: 'middle', horizontal: 'center' };
        
        // Căn phải cho Tổng tiền
        row.getCell('totalAmount').alignment = { vertical: 'middle', horizontal: 'right' };
        row.getCell('totalAmount').numFmt = '#,##0'; // Format số với dấu phẩy
        
        // Căn giữa cho Loại đơn
        row.getCell('orderType').alignment = { vertical: 'middle', horizontal: 'center' };

        // Màu nền xen kẽ cho dễ đọc
        if (index % 2 === 0) {
            row.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF9F9F9' } // Màu xám nhạt
            };
        }
    });

    // Thêm borders cho tất cả các ô
    worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            };
        });
    });

    // Thêm dòng tổng cộng
    const totalRow = worksheet.addRow({
        stt: '',
        code: '',
        customerName: '',
        customerPhone: 'TỔNG CỘNG:',
        totalAmount: paidBills.reduce((sum, bill) => sum + bill.totalAmount, 0),
        orderDate: '',
        orderType: '',
    });

    totalRow.font = { bold: true, size: 12 };
    totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8F4F8' } // Màu xanh nhạt
    };
    totalRow.getCell('totalAmount').numFmt = '#,##0';
    totalRow.getCell('totalAmount').alignment = { vertical: 'middle', horizontal: 'right' };
    totalRow.getCell('customerPhone').alignment = { vertical: 'middle', horizontal: 'right' };
    totalRow.height = 25;

    // Thêm borders cho dòng tổng cộng
    totalRow.eachCell((cell) => {
        cell.border = {
            top: { style: 'medium', color: { argb: 'FF2980B9' } },
            left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        };
    });

    // Freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Tải file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
}
