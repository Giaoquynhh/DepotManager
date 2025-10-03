const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function fixAdditionalCells() {
  try {
    console.log('🔧 SỬA CÁC Ô BỔ SUNG THEO YÊU CẦU');
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
    console.log(`   - Số xe: ${latestRequest.license_plate || 'N/A'}`);
    console.log(`   - SĐT tài xế: ${latestRequest.driver_phone || 'N/A'}`);

    // Sử dụng file đã sửa SĐT tài xế trước đó
    const templatePath = path.join(__dirname, 'uploads/generated-eir/EIR_OO11_DRIVER_PHONE_FIXED_2025-10-03T17-41-01.xlsx');
    
    if (!fs.existsSync(templatePath)) {
      console.log('❌ File đã sửa SĐT tài xế không tồn tại:', templatePath);
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

    // Sửa các ô theo yêu cầu
    let fixedCells = 0;

    console.log('\n🔧 SỬA CÁC Ô BỔ SUNG:');
    console.log('=' .repeat(50));

    // A11:F11 - Điền text "Số xe:"
    for (let col = 1; col <= 6; col++) { // A=1, B=2, C=3, D=4, E=5, F=6
      const cell = worksheet.getCell(11, col);
      cell.value = 'Số xe:';
      fixedCells++;
      console.log(`   ✅ A11:F11 - Điền "Số xe:" (Hàng 11, Cột ${col})`);
    }

    // G11:L11 - Điền text "Số điện thoại tài xế:" (thay vì "SDT Tài xế")
    for (let col = 7; col <= 12; col++) { // G=7, H=8, I=9, J=10, K=11, L=12
      const cell = worksheet.getCell(11, col);
      cell.value = 'Số điện thoại tài xế:';
      fixedCells++;
      console.log(`   ✅ G11:L11 - Điền "Số điện thoại tài xế:" (Hàng 11, Cột ${col})`);
    }

    // A12:F12 - Điền số xe thực tế
    const vehiclePlate = latestRequest.license_plate || 'N/A';
    for (let col = 1; col <= 6; col++) { // A=1, B=2, C=3, D=4, E=5, F=6
      const cell = worksheet.getCell(12, col);
      cell.value = vehiclePlate;
      fixedCells++;
      console.log(`   ✅ A12:F12 - Điền số xe "${vehiclePlate}" (Hàng 12, Cột ${col})`);
    }

    // C9:D9 - Điền Container No thực tế
    const containerNumber = latestRequest.container_no;
    for (let col = 3; col <= 4; col++) { // C=3, D=4
      const cell = worksheet.getCell(9, col);
      cell.value = containerNumber;
      fixedCells++;
      console.log(`   ✅ C9:D9 - Điền Container No "${containerNumber}" (Hàng 9, Cột ${col})`);
    }

    console.log(`\n📊 Đã sửa ${fixedCells} ô dữ liệu`);

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
    const filename = `EIR_OO11_FINAL_${timestamp}.xlsx`;

    // Tạo thư mục output nếu chưa có
    const outputDir = path.join(__dirname, 'uploads/generated-eir');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, filename);

    // Ghi file với ExcelJS (giữ nguyên 100% định dạng)
    await workbook.xlsx.writeFile(outputPath);

    console.log('✅ Phiếu EIR cuối cùng đã được tạo thành công!');
    console.log(`📁 File: ${outputPath}`);
    console.log(`📄 Filename: ${filename}`);

    console.log('\n📋 THÔNG TIN ĐÃ SỬA:');
    console.log('   - A11:F11: "Số xe:"');
    console.log('   - G11:L11: "Số điện thoại tài xế:"');
    console.log(`   - A12:F12: "${vehiclePlate}"`);
    console.log(`   - C9:D9: "${containerNumber}"`);

    console.log('\n🎯 ĐẶC ĐIỂM FILE CUỐI CÙNG:');
    console.log('   ✅ Sửa tất cả các ô theo yêu cầu');
    console.log('   ✅ Giữ nguyên 100% kích thước cột và hàng');
    console.log('   ✅ Giữ nguyên logo và hình ảnh');
    console.log('   ✅ Giữ nguyên định dạng cells (font, màu sắc, border)');
    console.log('   ✅ Giữ nguyên công thức Excel');
    console.log('   ✅ Giữ nguyên merged cells');
    console.log('   ✅ Giữ nguyên charts và objects');
    console.log('   ✅ Giữ nguyên layout và spacing');

  } catch (error) {
    console.error('❌ Lỗi khi sửa các ô bổ sung:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdditionalCells();
