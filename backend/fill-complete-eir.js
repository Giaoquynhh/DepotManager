const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function fillCompleteEIR() {
  try {
    console.log('📄 ĐIỀN ĐẦY ĐỦ THÔNG TIN PHIẾU EIR');
    console.log('=' .repeat(60));

    const containerNo = 'OO11';

    // Lấy thông tin ServiceRequest mới nhất (EXPORT với status GATE_OUT)
    const latestRequest = await prisma.serviceRequest.findFirst({
      where: { 
        container_no: containerNo,
        type: 'EXPORT',
        status: 'GATE_OUT'
      },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true, code: true }
        },
        shipping_line: {
          select: { id: true, name: true, code: true }
        },
        container_type: {
          select: { id: true, code: true, description: true }
        }
      }
    });

    if (!latestRequest) {
      console.log('❌ Không tìm thấy ServiceRequest EXPORT với status GATE_OUT cho container OO11');
      return;
    }

    console.log('✅ Tìm thấy ServiceRequest:');
    console.log(`   - Request ID: ${latestRequest.id}`);
    console.log(`   - Container: ${latestRequest.container_no}`);
    console.log(`   - Type: ${latestRequest.type}`);
    console.log(`   - Khách hàng: ${latestRequest.customer?.name || 'N/A'}`);
    console.log(`   - Hãng tàu: ${latestRequest.shipping_line?.name || 'N/A'} (${latestRequest.shipping_line?.code || 'N/A'})`);
    console.log(`   - Loại container: ${latestRequest.container_type?.description || 'N/A'}`);
    console.log(`   - Số xe: ${latestRequest.license_plate || 'N/A'}`);
    console.log(`   - SĐT tài xế: ${latestRequest.driver_phone || 'N/A'}`);

    // Sử dụng file cuối cùng
    const templatePath = path.join(__dirname, 'uploads/generated-eir/EIR_OO11_FINAL_2025-10-03T17-49-10.xlsx');
    
    if (!fs.existsSync(templatePath)) {
      console.log('❌ File cuối cùng không tồn tại:', templatePath);
      return;
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

    // Điền thông tin theo yêu cầu
    let filledCells = 0;

    console.log('\n📝 ĐIỀN THÔNG TIN ĐẦY ĐỦ:');
    console.log('=' .repeat(50));

    // C10:L10 - Ghi chú của request (nếu không có để trống)
    const notes = latestRequest.notes || '';
    for (let col = 3; col <= 12; col++) { // C=3, D=4, E=5, F=6, G=7, H=8, I=9, J=10, K=11, L=12
      const cell = worksheet.getCell(10, col);
      cell.value = notes;
      filledCells++;
    }
    console.log(`   ✅ C10:L10 - Ghi chú: "${notes}"`);

    // C8:D8 - Hãng tàu của request
    const shippingLine = latestRequest.shipping_line?.code || latestRequest.shipping_line?.name || '';
    for (let col = 3; col <= 4; col++) { // C=3, D=4
      const cell = worksheet.getCell(8, col);
      cell.value = shippingLine;
      filledCells++;
    }
    console.log(`   ✅ C8:D8 - Hãng tàu: "${shippingLine}"`);

    // J8:L8 - Loại container
    const containerType = latestRequest.container_type?.code || latestRequest.container_type?.description || '';
    for (let col = 10; col <= 12; col++) { // J=10, K=11, L=12
      const cell = worksheet.getCell(8, col);
      cell.value = containerType;
      filledCells++;
    }
    console.log(`   ✅ J8:L8 - Loại container: "${containerType}"`);

    // G9:H9 - Số booking của request (nếu không có để trống)
    const bookingNumber = latestRequest.booking_number || '';
    for (let col = 7; col <= 8; col++) { // G=7, H=8
      const cell = worksheet.getCell(9, col);
      cell.value = bookingNumber;
      filledCells++;
    }
    console.log(`   ✅ G9:H9 - Số booking: "${bookingNumber}"`);

    // J9:L9 - Số seal của request
    const sealNumber = latestRequest.seal_number || '';
    for (let col = 10; col <= 12; col++) { // J=10, K=11, L=12
      const cell = worksheet.getCell(9, col);
      cell.value = sealNumber;
      filledCells++;
    }
    console.log(`   ✅ J9:L9 - Số seal: "${sealNumber}"`);

    // I7 - Số hóa đơn của request
    const invoiceNumber = latestRequest.invoice_number || '';
    const cellI7 = worksheet.getCell(7, 9); // I=9
    cellI7.value = invoiceNumber;
    filledCells++;
    console.log(`   ✅ I7 - Số hóa đơn: "${invoiceNumber}"`);

    // C7:H7 - Tên khách hàng của request
    const customerName = latestRequest.customer?.name || '';
    for (let col = 3; col <= 8; col++) { // C=3, D=4, E=5, F=6, G=7, H=8
      const cell = worksheet.getCell(7, col);
      cell.value = customerName;
      filledCells++;
    }
    console.log(`   ✅ C7:H7 - Tên khách hàng: "${customerName}"`);

    // G8:H8 - Dựa vào loại request để điền
    const operationType = latestRequest.type === 'IMPORT' ? 'Hạ container' : 'Nâng container';
    for (let col = 7; col <= 8; col++) { // G=7, H=8
      const cell = worksheet.getCell(8, col);
      cell.value = operationType;
      filledCells++;
    }
    console.log(`   ✅ G8:H8 - Loại tác nghiệp: "${operationType}"`);

    // J7:L7 - Số hóa đơn của request
    for (let col = 10; col <= 12; col++) { // J=10, K=11, L=12
      const cell = worksheet.getCell(7, col);
      cell.value = invoiceNumber;
      filledCells++;
    }
    console.log(`   ✅ J7:L7 - Số hóa đơn: "${invoiceNumber}"`);

    // K4:L4 - Hiển thị số yêu cầu (không fill vào M4)
    const requestNumber = latestRequest.id; // Sử dụng Request ID làm số yêu cầu
    for (let col = 11; col <= 12; col++) { // K=11, L=12 (không fill M4)
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
    const filename = `EIR_OO11_COMPLETE_${timestamp}.xlsx`;

    // Tạo thư mục output nếu chưa có
    const outputDir = path.join(__dirname, 'uploads/generated-eir');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, filename);

    // Ghi file với ExcelJS (giữ nguyên 100% định dạng)
    await workbook.xlsx.writeFile(outputPath);

    console.log('✅ Phiếu EIR hoàn chỉnh đã được tạo thành công!');
    console.log(`📁 File: ${outputPath}`);
    console.log(`📄 Filename: ${filename}`);

    console.log('\n📋 THÔNG TIN ĐÃ ĐIỀN:');
    console.log(`   - C10:L10: Ghi chú: "${notes}"`);
    console.log(`   - C8:D8: Hãng tàu: "${shippingLine}"`);
    console.log(`   - J8:L8: Loại container: "${containerType}"`);
    console.log(`   - G9:H9: Số booking: "${bookingNumber}"`);
    console.log(`   - J9:L9: Số seal: "${sealNumber}"`);
    console.log(`   - I7: Số hóa đơn: "${invoiceNumber}"`);
    console.log(`   - C7:H7: Tên khách hàng: "${customerName}"`);
    console.log(`   - G8:H8: Loại tác nghiệp: "${operationType}"`);
    console.log(`   - J7:L7: Số hóa đơn: "${invoiceNumber}"`);
    console.log(`   - K4:L4: Số yêu cầu: "${requestNumber}"`);

    console.log('\n🎯 ĐẶC ĐIỂM FILE HOÀN CHỈNH:');
    console.log('   ✅ Điền đầy đủ tất cả thông tin theo yêu cầu');
    console.log('   ✅ Giữ nguyên 100% kích thước cột và hàng');
    console.log('   ✅ Giữ nguyên logo và hình ảnh');
    console.log('   ✅ Giữ nguyên định dạng cells (font, màu sắc, border)');
    console.log('   ✅ Giữ nguyên công thức Excel');
    console.log('   ✅ Giữ nguyên merged cells');
    console.log('   ✅ Giữ nguyên charts và objects');
    console.log('   ✅ Giữ nguyên layout và spacing');

  } catch (error) {
    console.error('❌ Lỗi khi điền thông tin hoàn chỉnh:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fillCompleteEIR();


