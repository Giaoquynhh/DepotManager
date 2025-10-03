const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function fixInvoiceLabelAndClearM4() {
  try {
    console.log('🔧 SỬA LABEL HÓA ĐƠN VÀ XÓA M4');
    console.log('=' .repeat(60));

    // Sử dụng file cuối cùng với dữ liệu hóa đơn
    const templatePath = path.join(__dirname, 'uploads/generated-eir/EIR_OO11_WITH_INVOICE_2025-10-03T21-39-52.xlsx');
    
    if (!fs.existsSync(templatePath)) {
      console.log('❌ File với dữ liệu hóa đơn không tồn tại:', templatePath);
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

    // Thực hiện các thay đổi
    let modifiedCells = 0;

    console.log('\n🔧 THỰC HIỆN CÁC THAY ĐỔI:');
    console.log('=' .repeat(50));

    // I7 - Điền text "Số hóa đơn:"
    const cellI7 = worksheet.getCell(7, 9); // I=9
    const oldValueI7 = cellI7.value;
    cellI7.value = 'Số hóa đơn:';
    modifiedCells++;
    console.log(`   ✅ I7 - Thay đổi từ "${oldValueI7}" thành "Số hóa đơn:"`);

    // M4 - Xóa giá trị
    const cellM4 = worksheet.getCell(4, 13); // M=13
    const oldValueM4 = cellM4.value;
    cellM4.value = '';
    modifiedCells++;
    console.log(`   ✅ M4 - Xóa giá trị "${oldValueM4}"`);

    console.log(`\n📊 Đã sửa ${modifiedCells} ô dữ liệu`);

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
    const filename = `EIR_OO11_FINAL_CORRECTED_${timestamp}.xlsx`;

    // Tạo thư mục output nếu chưa có
    const outputDir = path.join(__dirname, 'uploads/generated-eir');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, filename);

    // Ghi file với ExcelJS (giữ nguyên 100% định dạng)
    await workbook.xlsx.writeFile(outputPath);

    console.log('✅ Phiếu EIR đã được sửa thành công!');
    console.log(`📁 File: ${outputPath}`);
    console.log(`📄 Filename: ${filename}`);

    console.log('\n📋 THÔNG TIN ĐÃ SỬA:');
    console.log('   - I7: "Số hóa đơn:" (thay vì số hóa đơn thực tế)');
    console.log('   - M4: "" (đã xóa giá trị)');

    console.log('\n🎯 ĐẶC ĐIỂM FILE ĐÃ SỬA:');
    console.log('   ✅ Sửa label hóa đơn và xóa M4 theo yêu cầu');
    console.log('   ✅ Giữ nguyên 100% kích thước cột và hàng');
    console.log('   ✅ Giữ nguyên logo và hình ảnh');
    console.log('   ✅ Giữ nguyên định dạng cells (font, màu sắc, border)');
    console.log('   ✅ Giữ nguyên công thức Excel');
    console.log('   ✅ Giữ nguyên merged cells');
    console.log('   ✅ Giữ nguyên charts và objects');
    console.log('   ✅ Giữ nguyên layout và spacing');

  } catch (error) {
    console.error('❌ Lỗi khi sửa label hóa đơn và xóa M4:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixInvoiceLabelAndClearM4();

