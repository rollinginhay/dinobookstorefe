interface BillData {
    id: number;
    customerName: string;
    customerPhone: string;
    totalAmount: number;
    orderDate: string;
    orderType: string;
    status: string;
    items?: Array<{
        name: string;
        quantity: number;
        pricePerUnit: number;
    }>;
    shippingFee?: number;
    discount?: number;
    voucher?: number;
}

// Helper để format tiền
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

// Helper để format ngày
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Helper để map status
function getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
        'PENDING': 'Chờ xác nhận',
        'AUTHORIZED': 'Đã xác nhận',
        'IN_TRANSIT': 'Đang vận chuyển',
        'PAID': 'Hoàn thành',
        'CANCELLED': 'Đã hủy',
        'FAILED': 'Thất bại',
        'REFUNDED': 'Hoàn tiền',
        'WAITING_REFUND_INFO': 'Chờ hoàn tiền'
    };
    return statusMap[status] || status;
}

export async function exportBillToPDF(bill: BillData) {
    // Tính tổng tiền hàng
    let totalItems = 0;
    if (bill.items && bill.items.length > 0) {
        totalItems = bill.items.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0);
    }
    
    // Tạo HTML đẹp
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Hóa đơn HD${bill.id}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        @media print {
            @page {
                margin: 15mm;
                size: A4;
            }
            body {
                margin: 0;
            }
            .no-print {
                display: none !important;
            }
        }
        body {
            font-family: 'Inter', 'Arial', sans-serif;
            padding: 20px;
            color: #333;
            background: white;
            font-size: 12px;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
        }
        .header {
            background: linear-gradient(135deg, #2980b9 0%, #3498db 100%);
            color: white;
            padding: 25px;
            border-radius: 8px 8px 0 0;
            text-align: center;
        }
        .header h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 5px;
        }
        .header .bill-code {
            font-size: 14px;
            opacity: 0.95;
        }
        .content {
            padding: 25px;
            border: 1px solid #e0e0e0;
            border-top: none;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #2980b9;
            margin-bottom: 10px;
            padding-bottom: 6px;
            border-bottom: 2px solid #2980b9;
        }
        .info-row {
            display: flex;
            margin-bottom: 6px;
            font-size: 12px;
        }
        .info-label {
            font-weight: 600;
            width: 130px;
            color: #555;
        }
        .info-value {
            color: #333;
            flex: 1;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 11px;
        }
        table thead {
            background: #2980b9;
            color: white;
        }
        table th {
            padding: 10px 6px;
            text-align: left;
            font-weight: 600;
        }
        table th:nth-child(1) { width: 40px; text-align: center; }
        table th:nth-child(2) { width: auto; }
        table th:nth-child(3) { width: 60px; text-align: center; }
        table th:nth-child(4) { width: 100px; text-align: right; }
        table th:nth-child(5) { width: 100px; text-align: right; }
        table td {
            padding: 8px 6px;
            border-bottom: 1px solid #eee;
        }
        table tbody tr:nth-child(even) {
            background: #f9f9f9;
        }
        table td:nth-child(1) { text-align: center; }
        table td:nth-child(3) { text-align: center; }
        table td:nth-child(4) { text-align: right; }
        table td:nth-child(5) { text-align: right; font-weight: 600; }
        .summary-box {
            background: #f8f9fa;
            border: 2px solid #2980b9;
            border-radius: 6px;
            padding: 15px;
            margin-top: 15px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 12px;
        }
        .summary-label {
            color: #555;
        }
        .summary-value {
            font-weight: 600;
            color: #333;
        }
        .total-row {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 2px solid #2980b9;
            display: flex;
            justify-content: space-between;
            font-size: 16px;
            font-weight: 700;
            color: #2980b9;
        }
        .footer {
            text-align: center;
            margin-top: 25px;
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
            color: #888;
            font-size: 10px;
        }
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: #2980b9;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 1000;
        }
        .print-button:hover {
            background: #3498db;
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">🖨️ In PDF</button>
    <div class="invoice-container">
        <div class="header">
            <h1>HÓA ĐƠN BÁN HÀNG</h1>
            <div class="bill-code">Mã hóa đơn: HD${bill.id}</div>
        </div>
        
        <div class="content">
            <div class="section">
                <div class="section-title">Thông tin hóa đơn</div>
                <div class="info-row">
                    <span class="info-label">Ngày tạo:</span>
                    <span class="info-value">${formatDate(bill.orderDate)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Loại đơn:</span>
                    <span class="info-value">${bill.orderType === 'POS' ? 'Tại quầy' : 'Trực tuyến'}</span>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Thông tin khách hàng</div>
                <div class="info-row">
                    <span class="info-label">Tên khách hàng:</span>
                    <span class="info-value">${bill.customerName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Số điện thoại:</span>
                    <span class="info-value">${bill.customerPhone}</span>
                </div>
            </div>
            
            ${bill.items && bill.items.length > 0 ? `
            <div class="section">
                <div class="section-title">Chi tiết sản phẩm</div>
                <table>
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Tên sản phẩm</th>
                            <th>SL</th>
                            <th>Đơn giá</th>
                            <th>Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bill.items.map((item, index) => {
                            const itemTotal = item.pricePerUnit * item.quantity;
                            return `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${item.name}</td>
                                    <td>${item.quantity}</td>
                                    <td>${formatCurrency(item.pricePerUnit)}</td>
                                    <td>${formatCurrency(itemTotal)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
            
            <div class="summary-box">
                <div class="summary-row">
                    <span class="summary-label">Tổng tiền hàng:</span>
                    <span class="summary-value">${formatCurrency(totalItems)}</span>
                </div>
                ${bill.shippingFee && bill.shippingFee > 0 ? `
                <div class="summary-row">
                    <span class="summary-label">Phí vận chuyển:</span>
                    <span class="summary-value">${formatCurrency(bill.shippingFee)}</span>
                </div>
                ` : ''}
                ${bill.discount && bill.discount > 0 ? `
                <div class="summary-row">
                    <span class="summary-label">Giảm giá:</span>
                    <span class="summary-value" style="color: #e74c3c;">-${formatCurrency(bill.discount)}</span>
                </div>
                ` : ''}
                ${bill.voucher && bill.voucher > 0 ? `
                <div class="summary-row">
                    <span class="summary-label">Voucher:</span>
                    <span class="summary-value" style="color: #e74c3c;">-${formatCurrency(bill.voucher)}</span>
                </div>
                ` : ''}
                <div class="total-row">
                    <span>TỔNG CỘNG:</span>
                    <span>${formatCurrency(bill.totalAmount)}</span>
                </div>
            </div>
            
            <div class="footer">
                Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!
            </div>
        </div>
    </div>
</body>
</html>
    `;
    
    // Tạo element tạm để render HTML
    const element = document.createElement('div');
    element.style.position = 'fixed';
    element.style.left = '-9999px';
    element.style.top = '0';
    element.style.width = '800px';
    element.style.backgroundColor = 'white';
    
    // Parse HTML để lấy body content
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const bodyEl = doc.body;
    
    // Copy styles từ head vào element
    const styles = doc.head.querySelectorAll('style');
    styles.forEach(style => {
        const styleEl = document.createElement('style');
        styleEl.textContent = style.textContent;
        element.appendChild(styleEl);
    });
    
    // Tạo wrapper div
    const wrapper = document.createElement('div');
    wrapper.innerHTML = bodyEl.innerHTML;
    element.appendChild(wrapper);
    
    document.body.appendChild(element);
    
    // Đợi fonts và images load
    await new Promise(resolve => {
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                setTimeout(resolve, 500);
            });
        } else {
            setTimeout(resolve, 1000);
        }
    });
    
    // Đợi render xong
    await new Promise(resolve => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setTimeout(resolve, 300);
            });
        });
    });
    
    // Lấy element thực tế để render
    const elementToRender = wrapper.querySelector('.invoice-container') || wrapper;
    
    // Import html2pdf dynamically
    const html2pdf = (await import('html2pdf.js')).default;
    
    // Cấu hình html2pdf để tự động tải PDF
    const opt = {
        margin: [5, 5, 5, 5],
        filename: `HoaDon_HD${bill.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            letterRendering: true,
            logging: false,
            backgroundColor: '#ffffff'
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    try {
        await html2pdf().set(opt).from(elementToRender).save();
    } catch (error) {
        console.error('Lỗi khi xuất PDF:', error);
        alert('Không thể xuất PDF. Vui lòng thử lại.');
    } finally {
        // Xóa element tạm
        if (element.parentNode) {
            document.body.removeChild(element);
        }
    }
}

// Hàm preview hóa đơn - hiển thị preview thay vì tải về
export async function previewBill(bill: BillData) {
    // Tính tổng tiền hàng
    let totalItems = 0;
    if (bill.items && bill.items.length > 0) {
        totalItems = bill.items.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0);
    }
    
    // Tạo HTML đẹp (giống như exportBillToPDF)
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Hóa đơn HD${bill.id}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        @media print {
            @page {
                margin: 15mm;
                size: A4;
            }
            body {
                margin: 0;
            }
            .no-print {
                display: none !important;
            }
        }
        body {
            font-family: 'Inter', 'Arial', sans-serif;
            padding: 20px;
            color: #333;
            background: white;
            font-size: 12px;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
        }
        .header {
            background: linear-gradient(135deg, #2980b9 0%, #3498db 100%);
            color: white;
            padding: 25px;
            border-radius: 8px 8px 0 0;
            text-align: center;
        }
        .header h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 5px;
        }
        .header .bill-code {
            font-size: 14px;
            opacity: 0.95;
        }
        .content {
            padding: 25px;
            border: 1px solid #e0e0e0;
            border-top: none;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #2980b9;
            margin-bottom: 10px;
            padding-bottom: 6px;
            border-bottom: 2px solid #2980b9;
        }
        .info-row {
            display: flex;
            margin-bottom: 6px;
            font-size: 12px;
        }
        .info-label {
            font-weight: 600;
            width: 130px;
            color: #555;
        }
        .info-value {
            color: #333;
            flex: 1;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 11px;
        }
        table thead {
            background: #2980b9;
            color: white;
        }
        table th {
            padding: 10px 6px;
            text-align: left;
            font-weight: 600;
        }
        table th:nth-child(1) { width: 40px; text-align: center; }
        table th:nth-child(2) { width: auto; }
        table th:nth-child(3) { width: 60px; text-align: center; }
        table th:nth-child(4) { width: 100px; text-align: right; }
        table th:nth-child(5) { width: 100px; text-align: right; }
        table td {
            padding: 8px 6px;
            border-bottom: 1px solid #eee;
        }
        table tbody tr:nth-child(even) {
            background: #f9f9f9;
        }
        table td:nth-child(1) { text-align: center; }
        table td:nth-child(3) { text-align: center; }
        table td:nth-child(4) { text-align: right; }
        table td:nth-child(5) { text-align: right; font-weight: 600; }
        .summary-box {
            background: #f8f9fa;
            border: 2px solid #2980b9;
            border-radius: 6px;
            padding: 15px;
            margin-top: 15px;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 12px;
        }
        .summary-label {
            color: #555;
        }
        .summary-value {
            font-weight: 600;
            color: #333;
        }
        .total-row {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 2px solid #2980b9;
            display: flex;
            justify-content: space-between;
            font-size: 16px;
            font-weight: 700;
            color: #2980b9;
        }
        .footer {
            text-align: center;
            margin-top: 25px;
            padding-top: 15px;
            border-top: 1px solid #e0e0e0;
            color: #888;
            font-size: 10px;
        }
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: #2980b9;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 1000;
        }
        .print-button:hover {
            background: #3498db;
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">🖨️ In / Tải PDF</button>
    <div class="invoice-container">
        <div class="header">
            <h1>HÓA ĐƠN BÁN HÀNG</h1>
            <div class="bill-code">Mã hóa đơn: HD${bill.id}</div>
        </div>
        
        <div class="content">
            <div class="section">
                <div class="section-title">Thông tin hóa đơn</div>
                <div class="info-row">
                    <span class="info-label">Ngày tạo:</span>
                    <span class="info-value">${formatDate(bill.orderDate)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Loại đơn:</span>
                    <span class="info-value">${bill.orderType === 'POS' ? 'Tại quầy' : 'Trực tuyến'}</span>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Thông tin khách hàng</div>
                <div class="info-row">
                    <span class="info-label">Tên khách hàng:</span>
                    <span class="info-value">${bill.customerName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Số điện thoại:</span>
                    <span class="info-value">${bill.customerPhone}</span>
                </div>
            </div>
            
            ${bill.items && bill.items.length > 0 ? `
            <div class="section">
                <div class="section-title">Chi tiết sản phẩm</div>
                <table>
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Tên sản phẩm</th>
                            <th>SL</th>
                            <th>Đơn giá</th>
                            <th>Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bill.items.map((item, index) => {
                            const itemTotal = item.pricePerUnit * item.quantity;
                            return `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td>${item.name}</td>
                                    <td>${item.quantity}</td>
                                    <td>${formatCurrency(item.pricePerUnit)}</td>
                                    <td>${formatCurrency(itemTotal)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
            
            <div class="summary-box">
                <div class="summary-row">
                    <span class="summary-label">Tổng tiền hàng:</span>
                    <span class="summary-value">${formatCurrency(totalItems)}</span>
                </div>
                ${bill.shippingFee && bill.shippingFee > 0 ? `
                <div class="summary-row">
                    <span class="summary-label">Phí vận chuyển:</span>
                    <span class="summary-value">${formatCurrency(bill.shippingFee)}</span>
                </div>
                ` : ''}
                ${bill.discount && bill.discount > 0 ? `
                <div class="summary-row">
                    <span class="summary-label">Giảm giá:</span>
                    <span class="summary-value" style="color: #e74c3c;">-${formatCurrency(bill.discount)}</span>
                </div>
                ` : ''}
                ${bill.voucher && bill.voucher > 0 ? `
                <div class="summary-row">
                    <span class="summary-label">Voucher:</span>
                    <span class="summary-value" style="color: #e74c3c;">-${formatCurrency(bill.voucher)}</span>
                </div>
                ` : ''}
                <div class="total-row">
                    <span>TỔNG CỘNG:</span>
                    <span>${formatCurrency(bill.totalAmount)}</span>
                </div>
            </div>
            
            <div class="footer">
                Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!
            </div>
        </div>
    </div>
</body>
</html>
    `;
    
    // Mở cửa sổ mới để hiển thị preview
    const previewWindow = window.open('', '_blank', 'width=900,height=800,scrollbars=yes');
    if (previewWindow) {
        previewWindow.document.write(htmlContent);
        previewWindow.document.close();
    } else {
        alert('Vui lòng cho phép popup để xem preview hóa đơn');
    }
}
