const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

class EnhancedEIRService {
  
  /**
   * Generate EIR với logic hoàn chỉnh như script đã tạo
   */
  async generateCompleteEIR(requestId) {
    try {
      console.log('📄 EnhancedEIRService: Generating complete EIR for request:', requestId);

      // Lấy thông tin request với các thông tin liên quan
      const request = await prisma.serviceRequest.findUnique({
        where: { id: requestId },
        include: {
          customer: {
            select: { id: true, name: true, code: true, address: true, tax_code: true, phone: true }
          },
          shipping_line: {
            select: { id: true, name: true, code: true, template_eir: true }
          },
          container_type: {
            select: { id: true, code: true, description: true }
          }
        }
      });

      if (!request) {
        return {
          success: false,
          message: 'Request không tồn tại'
        };
      }

      if (request.status !== 'GATE_OUT' && request.status !== 'IN_YARD' && request.status !== 'IN_CAR') {
        return {
          success: false,
          message: 'Chỉ có thể tạo EIR cho container ở trạng thái GATE_OUT, IN_YARD hoặc IN_CAR'
        };
      }

      // Kiểm tra trạng thái thanh toán
      if (!request.is_paid) {
        return {
          success: false,
          message: 'Chỉ có thể tạo EIR cho container đã thanh toán'
        };
      }

      console.log('📋 Request details:', {
        container_no: request.container_no,
        customer: request.customer?.name,
        shipping_line: request.shipping_line?.name,
        status: request.status
      });

      // Lấy template EIR từ shipping line
      const templateEir = request.shipping_line?.template_eir;
      if (!templateEir) {
        return {
          success: false,
          message: 'Hãng tàu chưa có template EIR'
        };
      }

      // Đọc template file
      const templatePath = path.join(__dirname, '../../../uploads/shipping-lines-eir', templateEir);
      
      if (!fs.existsSync(templatePath)) {
        return {
          success: false,
          message: 'Template EIR không tồn tại'
        };
      }

      console.log('📁 Template path:', templatePath);

      // Đọc template Excel với ExcelJS
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(templatePath);
      
      console.log('📋 Template structure loaded...');

      // Lấy worksheet đầu tiên
      const worksheet = workbook.getWorksheet(1);
      console.log(`📊 Worksheet: ${worksheet.name}, có ${worksheet.rowCount} hàng, ${worksheet.columnCount} cột`);

      // Lưu lại tất cả thuộc tính định dạng gốc
      const originalProperties = {
        cols: [],
        rows: [],
        merges: worksheet.model.merges || [],
        images: worksheet.model.images || [],
        drawings: worksheet.model.drawings || []
      };

      // Lưu lại kích thước cột
      for (let i = 1; i <= worksheet.columnCount; i++) {
        const col = worksheet.getColumn(i);
        originalProperties.cols.push({
          width: col.width,
          hidden: col.hidden,
          style: col.style
        });
      }

      // Lưu lại kích thước hàng
      for (let i = 1; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        originalProperties.rows.push({
          height: row.height,
          hidden: row.hidden,
          style: row.style
        });
      }

      console.log(`📐 Đã lưu ${originalProperties.cols.length} cột và ${originalProperties.rows.length} hàng`);

      // Tìm hóa đơn liên quan đến request này
      const invoice = await prisma.invoice.findFirst({
        where: {
          source_module: 'REQUESTS',
          source_id: request.id
        },
        include: {
          items: true
        }
      });

      // Điền thông tin theo logic hoàn chỉnh
      let filledCells = 0;

      console.log('\n📝 ĐIỀN THÔNG TIN HOÀN CHỈNH:');
      console.log('=' .repeat(50));

      // C7:H7 - Tên khách hàng
      const customerName = request.customer?.name || '';
      for (let col = 3; col <= 8; col++) { // C=3, D=4, E=5, F=6, G=7, H=8
        const cell = worksheet.getCell(7, col);
        cell.value = customerName;
        filledCells++;
      }
      console.log(`   ✅ C7:H7 - Tên khách hàng: "${customerName}"`);

      // C8:D8 - Hãng tàu
      const shippingLine = request.shipping_line?.code || request.shipping_line?.name || '';
      for (let col = 3; col <= 4; col++) { // C=3, D=4
        const cell = worksheet.getCell(8, col);
        cell.value = shippingLine;
        filledCells++;
      }
      console.log(`   ✅ C8:D8 - Hãng tàu: "${shippingLine}"`);

      // G8:H8 - Loại tác nghiệp
      const operationType = request.type === 'IMPORT' ? 'Hạ container' : 'Nâng container';
      for (let col = 7; col <= 8; col++) { // G=7, H=8
        const cell = worksheet.getCell(8, col);
        cell.value = operationType;
        filledCells++;
      }
      console.log(`   ✅ G8:H8 - Loại tác nghiệp: "${operationType}"`);

      // J8:L8 - Loại container
      const containerType = request.container_type?.code || request.container_type?.description || '';
      for (let col = 10; col <= 12; col++) { // J=10, K=11, L=12
        const cell = worksheet.getCell(8, col);
        cell.value = containerType;
        filledCells++;
      }
      console.log(`   ✅ J8:L8 - Loại container: "${containerType}"`);

      // C9:D9 - Container No
      const containerNo = request.container_no;
      for (let col = 3; col <= 4; col++) { // C=3, D=4
        const cell = worksheet.getCell(9, col);
        cell.value = containerNo;
        filledCells++;
      }
      console.log(`   ✅ C9:D9 - Container No: "${containerNo}"`);

      // G9:H9 - Booking
      const bookingNumber = request.booking_bill || '';
      for (let col = 7; col <= 8; col++) { // G=7, H=8
        const cell = worksheet.getCell(9, col);
        cell.value = bookingNumber;
        filledCells++;
      }
      console.log(`   ✅ G9:H9 - Booking: "${bookingNumber}"`);

      // J9:L9 - Số seal
      const sealNumber = request.seal_number || '';
      for (let col = 10; col <= 12; col++) { // J=10, K=11, L=12
        const cell = worksheet.getCell(9, col);
        cell.value = sealNumber;
        filledCells++;
      }
      console.log(`   ✅ J9:L9 - Số seal: "${sealNumber}"`);

      // C10:L10 - Ghi chú
      const notes = request.notes || '';
      for (let col = 3; col <= 12; col++) { // C=3, D=4, E=5, F=6, G=7, H=8, I=9, J=10, K=11, L=12
        const cell = worksheet.getCell(10, col);
        cell.value = notes;
        filledCells++;
      }
      console.log(`   ✅ C10:L10 - Ghi chú: "${notes}"`);

      // A11:F11 - Text "Số xe:"
      for (let col = 1; col <= 6; col++) { // A=1, B=2, C=3, D=4, E=5, F=6
        const cell = worksheet.getCell(11, col);
        cell.value = 'Số xe:';
        filledCells++;
      }
      console.log(`   ✅ A11:F11 - Text "Số xe:"`);

      // G11:L11 - Text "Số điện thoại tài xế:"
      for (let col = 7; col <= 12; col++) { // G=7, H=8, I=9, J=10, K=11, L=12
        const cell = worksheet.getCell(11, col);
        cell.value = 'Số điện thoại tài xế:';
        filledCells++;
      }
      console.log(`   ✅ G11:L11 - Text "Số điện thoại tài xế:"`);

      // A12:F12 - Số xe
      const vehiclePlate = request.license_plate || '';
      for (let col = 1; col <= 6; col++) { // A=1, B=2, C=3, D=4, E=5, F=6
        const cell = worksheet.getCell(12, col);
        cell.value = vehiclePlate;
        filledCells++;
      }
      console.log(`   ✅ A12:F12 - Số xe: "${vehiclePlate}"`);

      // G12:L12 - SĐT tài xế
      const driverPhone = request.driver_phone || '';
      for (let col = 7; col <= 12; col++) { // G=7, H=8, I=9, J=10, K=11, L=12
        const cell = worksheet.getCell(12, col);
        cell.value = driverPhone;
        filledCells++;
      }
      console.log(`   ✅ G12:L12 - SĐT tài xế: "${driverPhone}"`);

      // I7 - Text "Số hóa đơn:"
      const cellI7 = worksheet.getCell(7, 9); // I=9
      cellI7.value = 'Số hóa đơn:';
      filledCells++;
      console.log(`   ✅ I7 - Text "Số hóa đơn:"`);

      // J7:L7 - Số hóa đơn (nếu có)
      const invoiceNumber = invoice?.invoice_no || '';
      for (let col = 10; col <= 12; col++) { // J=10, K=11, L=12
        const cell = worksheet.getCell(7, col);
        cell.value = invoiceNumber;
        filledCells++;
      }
      console.log(`   ✅ J7:L7 - Số hóa đơn: "${invoiceNumber}"`);

      // K4:L4 - Số yêu cầu
      const requestNumber = request.request_no || request.id;
      for (let col = 11; col <= 12; col++) { // K=11, L=12
        const cell = worksheet.getCell(4, col);
        cell.value = requestNumber;
        filledCells++;
      }
      console.log(`   ✅ K4:L4 - Số yêu cầu: "${requestNumber}"`);

      console.log(`\n📊 Đã điền ${filledCells} ô dữ liệu`);

      // Khôi phục lại tất cả thuộc tính định dạng gốc
      console.log('🔄 Khôi phục định dạng gốc...');
      
      // Khôi phục kích thước cột
      originalProperties.cols.forEach((colProps, index) => {
        const col = worksheet.getColumn(index + 1);
        if (colProps.width !== undefined) {
          col.width = colProps.width;
        }
        if (colProps.hidden !== undefined) {
          col.hidden = colProps.hidden;
        }
        if (colProps.style) {
          col.style = colProps.style;
        }
      });

      // Khôi phục kích thước hàng
      originalProperties.rows.forEach((rowProps, index) => {
        const row = worksheet.getRow(index + 1);
        if (rowProps.height !== undefined) {
          row.height = rowProps.height;
        }
        if (rowProps.hidden !== undefined) {
          row.hidden = rowProps.hidden;
        }
        if (rowProps.style) {
          row.style = rowProps.style;
        }
      });

      // Khôi phục merged cells
      if (originalProperties.merges && originalProperties.merges.length > 0) {
        worksheet.model.merges = originalProperties.merges;
      }

      // Khôi phục hình ảnh
      if (originalProperties.images && originalProperties.images.length > 0) {
        worksheet.model.images = originalProperties.images;
      }

      // Khôi phục drawings
      if (originalProperties.drawings && originalProperties.drawings.length > 0) {
        worksheet.model.drawings = originalProperties.drawings;
      }

      console.log('✅ Đã khôi phục hoàn toàn định dạng gốc');

      // Tạo tên file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `EIR_${request.container_no}_${timestamp}.xlsx`;

      // Tạo buffer từ workbook
      const buffer = await workbook.xlsx.writeBuffer();

      console.log('✅ Phiếu EIR hoàn chỉnh đã được tạo thành công!');
      console.log(`📄 Filename: ${filename}`);

      return {
        success: true,
        data: {
          filename,
          fileBuffer: buffer
        }
      };

    } catch (error) {
      console.error('❌ Lỗi khi tạo phiếu EIR hoàn chỉnh:', error);
      return {
        success: false,
        message: 'Lỗi khi tạo phiếu EIR hoàn chỉnh: ' + error.message
      };
    }
  }
}

module.exports = { EnhancedEIRService };

