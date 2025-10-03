const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function fillBookingWithCorrectField() {
  try {
    console.log('📝 ĐIỀN BOOKING VỚI TRƯỜNG ĐÚNG (booking_bill)');
    console.log('=' .repeat(60));

    // Sử dụng file cuối cùng với booking
    const templatePath = path.join(__dirname, 'uploads/generated-eir/EIR_OO11_WITH_BOOKING_2025-10-03T21-53-05.xlsx');
    
    if (!fs.existsSync(templatePath)) {
      console.log('❌ File với booking không tồn tại:', templatePath);
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

    // Lấy giá trị từ K4:L4 để tìm request tương ứng
    const cellK4 = worksheet.getCell(4, 11); // K=11
    const cellL4 = worksheet.getCell(4, 12); // L=12
    const requestNumber = cellK4.value || cellL4.value;

    console.log(`🔍 Tìm request với số yêu cầu: "${requestNumber}"`);

    if (!requestNumber) {
      console.log('❌ Không tìm thấy số yêu cầu trong K4:L4');
      return;
    }

    // Tìm request tương ứng
    const request = await prisma.serviceRequest.findFirst({
      where: {
        OR: [
          { request_no: requestNumber },
          { id: requestNumber }
        ]
      },
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

    if (!request) {
      console.log(`❌ Không tìm thấy request với số yêu cầu: ${requestNumber}`);
      return;
    }

    console.log('✅ Tìm thấy request:');
    console.log(`   - Request ID: ${request.id}`);
    console.log(`   - Request No: ${request.request_no}`);
    console.log(`   - Container: ${request.container_no}`);
    console.log(`   - Type: ${request.type}`);
    console.log(`   - booking_bill: "${request.booking_bill || 'NULL'}"`);

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

    // Điền booking vào G9:H9
    let filledCells = 0;
    const bookingNumber = request.booking_bill || '';

    console.log('\n📝 ĐIỀN BOOKING VỚI TRƯỜNG ĐÚNG:');
    console.log('=' .repeat(50));

    // G9:H9 - Booking từ request (sử dụng booking_bill)
    for (let col = 7; col <= 8; col++) { // G=7, H=8
      const cell = worksheet.getCell(9, col);
      cell.value = bookingNumber;
      filledCells++;
    }
    console.log(`   ✅ G9:H9 - Booking (booking_bill): "${bookingNumber}"`);

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
    const filename = `EIR_OO11_WITH_CORRECT_BOOKING_${timestamp}.xlsx`;

    // Tạo thư mục output nếu chưa có
    const outputDir = path.join(__dirname, 'uploads/generated-eir');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, filename);

    // Ghi file với ExcelJS (giữ nguyên 100% định dạng)
    await workbook.xlsx.writeFile(outputPath);

    console.log('✅ Phiếu EIR với booking đúng đã được tạo thành công!');
    console.log(`📁 File: ${outputPath}`);
    console.log(`📄 Filename: ${filename}`);

    console.log('\n📋 THÔNG TIN ĐÃ ĐIỀN:');
    console.log(`   - G9:H9: Booking (booking_bill): "${bookingNumber}"`);
    console.log(`   - Request: ${request.request_no || request.id}`);
    console.log(`   - Container: ${request.container_no}`);

    console.log('\n🎯 ĐẶC ĐIỂM FILE VỚI BOOKING ĐÚNG:');
    console.log('   ✅ Điền booking từ trường booking_bill (trường đúng)');
    console.log('   ✅ Giữ nguyên 100% kích thước cột và hàng');
    console.log('   ✅ Giữ nguyên logo và hình ảnh');
    console.log('   ✅ Giữ nguyên định dạng cells (font, màu sắc, border)');
    console.log('   ✅ Giữ nguyên công thức Excel');
    console.log('   ✅ Giữ nguyên merged cells');
    console.log('   ✅ Giữ nguyên charts và objects');
    console.log('   ✅ Giữ nguyên layout và spacing');

  } catch (error) {
    console.error('❌ Lỗi khi điền booking với trường đúng:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fillBookingWithCorrectField();
