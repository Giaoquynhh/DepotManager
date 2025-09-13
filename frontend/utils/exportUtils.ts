import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface ExportData {
  containers: any;
  customers: any;
  maintenance: any;
  financial: any;
  operational: any;
}

export class ExportUtils {
  static exportToExcel(data: ExportData, timeRange: string) {
    const workbook = XLSX.utils.book_new();
    
    // Container data
    const containerData = [
      ['Tổng container', data.containers.total],
      ['Container hôm nay', data.containers.today],
      ['Container tuần này', data.containers.thisWeek],
      ['Container tháng này', data.containers.thisMonth],
      [''],
      ['Trạng thái Container', 'Số lượng'],
      ['PENDING', data.containers.byStatus.PENDING],
      ['SCHEDULED', data.containers.byStatus.SCHEDULED],
      ['GATE_IN', data.containers.byStatus.GATE_IN],
      ['IN_YARD', data.containers.byStatus.IN_YARD],
      ['IN_CAR', data.containers.byStatus.IN_CAR],
      ['GATE_OUT', data.containers.byStatus.GATE_OUT],
      ['COMPLETED', data.containers.byStatus.COMPLETED],
      [''],
      ['Loại Container', 'Số lượng'],
      ['IMPORT', data.containers.byType.IMPORT],
      ['EXPORT', data.containers.byType.EXPORT],
    ];
    
    const containerSheet = XLSX.utils.aoa_to_sheet(containerData);
    XLSX.utils.book_append_sheet(workbook, containerSheet, 'Container Statistics');
    
    // Customer data
    const customerData = [
      ['Tổng khách hàng', data.customers.total],
      ['Khách hàng hoạt động', data.customers.active],
      ['Khách hàng mới tháng này', data.customers.newThisMonth],
      [''],
      ['Top Khách hàng', 'Requests', 'Doanh thu (VND)'],
      ...data.customers.topCustomers.map(customer => [
        customer.name,
        customer.requestCount,
        customer.totalRevenue
      ])
    ];
    
    const customerSheet = XLSX.utils.aoa_to_sheet(customerData);
    XLSX.utils.book_append_sheet(workbook, customerSheet, 'Customer Statistics');
    
    // Maintenance data
    const maintenanceData = [
      ['Tổng phiếu sửa chữa', data.maintenance.total],
      ['Thời gian sửa chữa trung bình', `${data.maintenance.averageRepairTime} ngày`],
      ['Tổng chi phí sửa chữa', data.maintenance.totalCost],
      [''],
      ['Trạng thái Sửa chữa', 'Số lượng'],
      ['PENDING', data.maintenance.byStatus.PENDING],
      ['APPROVED', data.maintenance.byStatus.APPROVED],
      ['IN_PROGRESS', data.maintenance.byStatus.IN_PROGRESS],
      ['COMPLETED', data.maintenance.byStatus.COMPLETED],
      ['CANCELLED', data.maintenance.byStatus.CANCELLED],
      [''],
      ['Vấn đề thường gặp', 'Số lần'],
      ...data.maintenance.commonIssues.map(issue => [issue.issue, issue.count])
    ];
    
    const maintenanceSheet = XLSX.utils.aoa_to_sheet(maintenanceData);
    XLSX.utils.book_append_sheet(workbook, maintenanceSheet, 'Maintenance Statistics');
    
    // Financial data
    const financialData = [
      ['Tổng doanh thu', data.financial.totalRevenue],
      ['Doanh thu tháng này', data.financial.thisMonthRevenue],
      ['Doanh thu năm này', data.financial.thisYearRevenue],
      ['Chưa thanh toán', data.financial.unpaidAmount],
      ['Quá hạn', data.financial.overdueAmount],
      ['Giá trị hóa đơn trung bình', data.financial.averageInvoiceValue],
      [''],
      ['Doanh thu theo dịch vụ', 'Số tiền (VND)'],
      ...data.financial.revenueByService.map(service => [service.service, service.amount])
    ];
    
    const financialSheet = XLSX.utils.aoa_to_sheet(financialData);
    XLSX.utils.book_append_sheet(workbook, financialSheet, 'Financial Statistics');
    
    // Operational data
    const operationalData = [
      ['Gate In hôm nay', data.operational.gateInToday],
      ['Gate Out hôm nay', data.operational.gateOutToday],
      ['Tỷ lệ sử dụng xe nâng', `${data.operational.forkliftUtilization}%`],
      ['Tỷ lệ sử dụng bãi', `${data.operational.yardUtilization}%`],
      ['Thời gian xử lý trung bình', `${data.operational.averageProcessingTime} ngày`],
      ['Tỷ lệ hoàn thành', `${data.operational.completionRate}%`]
    ];
    
    const operationalSheet = XLSX.utils.aoa_to_sheet(operationalData);
    XLSX.utils.book_append_sheet(workbook, operationalSheet, 'Operational Statistics');
    
    // Save file
    const fileName = `statistics_${timeRange}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }
  
  static exportToPDF(data: ExportData, timeRange: string) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Title
    doc.setFontSize(20);
    doc.text('Thống kê tổng quan', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Khoảng thời gian: ${timeRange}`, pageWidth / 2, 30, { align: 'center' });
    doc.text(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, pageWidth / 2, 35, { align: 'center' });
    
    let yPosition = 50;
    
    // Container Statistics
    doc.setFontSize(16);
    doc.text('Thống kê Container', 20, yPosition);
    yPosition += 10;
    
    const containerTableData = [
      ['Chỉ số', 'Giá trị'],
      ['Tổng container', data.containers.total.toString()],
      ['Container hôm nay', data.containers.today.toString()],
      ['Container tuần này', data.containers.thisWeek.toString()],
      ['Container tháng này', data.containers.thisMonth.toString()],
    ];
    
    (doc as any).autoTable({
      startY: yPosition,
      head: [containerTableData[0]],
      body: containerTableData.slice(1),
      theme: 'grid',
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 20;
    
    // Customer Statistics
    doc.setFontSize(16);
    doc.text('Thống kê Khách hàng', 20, yPosition);
    yPosition += 10;
    
    const customerTableData = [
      ['Chỉ số', 'Giá trị'],
      ['Tổng khách hàng', data.customers.total.toString()],
      ['Khách hàng hoạt động', data.customers.active.toString()],
      ['Khách hàng mới tháng này', data.customers.newThisMonth.toString()],
    ];
    
    (doc as any).autoTable({
      startY: yPosition,
      head: [customerTableData[0]],
      body: customerTableData.slice(1),
      theme: 'grid',
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 20;
    
    // Financial Statistics
    doc.setFontSize(16);
    doc.text('Thống kê Tài chính', 20, yPosition);
    yPosition += 10;
    
    const financialTableData = [
      ['Chỉ số', 'Giá trị (VND)'],
      ['Tổng doanh thu', this.formatCurrency(data.financial.totalRevenue)],
      ['Doanh thu tháng này', this.formatCurrency(data.financial.thisMonthRevenue)],
      ['Chưa thanh toán', this.formatCurrency(data.financial.unpaidAmount)],
      ['Quá hạn', this.formatCurrency(data.financial.overdueAmount)],
    ];
    
    (doc as any).autoTable({
      startY: yPosition,
      head: [financialTableData[0]],
      body: financialTableData.slice(1),
      theme: 'grid',
    });
    
    // Save file
    const fileName = `statistics_${timeRange}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }
  
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }
}
