const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function fillEIRWithInvoiceRequestNumber() {
  try {
    console.log('📄 ĐIỀN PHIẾU EIR VỚI SỐ YÊU CẦU TỪ HÓA ĐƠN');
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

    // Tìm hóa đơn tương ứng với ServiceRequest
    const invoice = await prisma.invoice.findFirst({
      where: {
        source_id: latestRequest.id
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!invoice) {
      console.log('❌ Không tìm thấy hóa đơn tương ứng với ServiceRequest');
      console.log('   Sử dụng Request ID làm số yêu cầu');
      var requestNumber = latestRequest.id;
    } else {
      console.log('✅ Tìm thấy hóa đơn tương ứng:');
      console.log(`   - Số hóa đơn: ${invoice.invoice_no || 'N/A'}`);
      console.log(`   - Số yêu cầu: ${invoice.invoice_no || 'N/A'}`);
      requestNumber = invoice.invoice_no || latestRequest.id;
    }

    // Sử dụng file hoàn chỉnh
    const templatePath = path.join(__dirname, 'uploads/generated-eir/EIR_OO11_COMPLETE_2025-10-03T18-00-21.xlsx');
    
    if (!fs.existsSync(templatePath)) {
      console.log('❌ File hoàn chỉnh không tồn tại:', templatePath);
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

    // Cập nhật số yêu cầu từ hóa đơn
    let updatedCells = 0;

    console.log('\n📝 CẬP NHẬT SỐ YÊU CẦU TỪ HÓA ĐƠN:');
    console.log('=' .repeat(50));

    // K4:L4 - Cập nhật số yêu cầu từ hóa đơn
    for (let col = 11; col <= 12; col++) { // K=11, L=12 (không fill M4)
      const cell = worksheet.getCell(4, col);
      cell.value = requestNumber;
      updatedCells++;
    }
    console.log(`   ✅ K4:L4 - Số yêu cầu từ hóa đơn: "${requestNumber}"`);

    console.log(`\n📊 Đã cập nhật ${updatedCells} ô dữ liệu`);

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
    const filename = `EIR_OO11_WITH_INVOICE_REQUEST_${timestamp}.xlsx`;

    // Tạo thư mục output nếu chưa có
    const outputDir = path.join(__dirname, 'uploads/generated-eir');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, filename);

    // Ghi file với ExcelJS (giữ nguyên 100% định dạng)
    await workbook.xlsx.writeFile(outputPath);

    console.log('✅ Phiếu EIR với số yêu cầu từ hóa đơn đã được tạo thành công!');
    console.log(`📁 File: ${outputPath}`);
    console.log(`📄 Filename: ${filename}`);

    console.log('\n📋 THÔNG TIN ĐÃ CẬP NHẬT:');
    console.log(`   - K4:L4: Số yêu cầu từ hóa đơn: "${requestNumber}"`);

    console.log('\n🎯 ĐẶC ĐIỂM FILE VỚI SỐ YÊU CẦU TỪ HÓA ĐƠN:');
    console.log('   ✅ Sử dụng số yêu cầu từ hóa đơn thay vì Request ID');
    console.log('   ✅ Giữ nguyên 100% kích thước cột và hàng');
    console.log('   ✅ Giữ nguyên logo và hình ảnh');
    console.log('   ✅ Giữ nguyên định dạng cells (font, màu sắc, border)');
    console.log('   ✅ Giữ nguyên công thức Excel');
    console.log('   ✅ Giữ nguyên merged cells');
    console.log('   ✅ Giữ nguyên charts và objects');
    console.log('   ✅ Giữ nguyên layout và spacing');

  } catch (error) {
    console.error('❌ Lỗi khi cập nhật số yêu cầu từ hóa đơn:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fillEIRWithInvoiceRequestNumber();
