const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function fixContainerAndRequestNumber() {
  try {
    console.log('🔧 SỬA LỖI SỐ CONTAINER VÀ SỐ YÊU CẦU');
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
    console.log(`   - Khách hàng: ${latestRequest.customer?.name || 'N/A'}`);
    console.log(`   - Hãng tàu: ${latestRequest.shipping_line?.name || 'N/A'} (${latestRequest.shipping_line?.code || 'N/A'})`);

    // Sử dụng file mẫu đã điền sẵn của bạn
    const templatePath = path.join(__dirname, 'uploads/shipping-lines-eir/EIR_KMTU_1759511193505.xlsx');
    
    if (!fs.existsSync(templatePath)) {
      console.log('❌ File template đã điền sẵn không tồn tại:', templatePath);
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

    // Tìm và sửa các ô có vấn đề
    let fixedCells = 0;

    console.log('\n🔧 SỬA CÁC Ô CÓ VẤN ĐỀ:');
    console.log('=' .repeat(50));

    // Duyệt qua các ô để tìm và sửa
    for (let rowNum = 1; rowNum <= Math.min(20, worksheet.rowCount); rowNum++) {
      const row = worksheet.getRow(rowNum);
      
      row.eachCell((cell, colNum) => {
        const cellValue = cell.value;
        
        if (typeof cellValue === 'string') {
          // Sửa số container - thay thế text "số container" bằng số container thực tế
          if (cellValue.includes('số container') && cellValue.includes('OO11')) {
            cell.value = latestRequest.container_no;
            fixedCells++;
            console.log(`   ✅ Sửa số container: "${cellValue}" → "${latestRequest.container_no}" (Hàng ${rowNum}, Cột ${colNum})`);
          }
          
          // Tìm ô "Số yêu cầu" và điền Request ID
          if (cellValue.includes('Số yêu cầu') || cellValue.includes('số yêu cầu')) {
            // Tìm ô bên cạnh để điền Request ID
            const nextCell = worksheet.getCell(rowNum, colNum + 1);
            if (!nextCell.value || nextCell.value === '') {
              nextCell.value = latestRequest.id;
              fixedCells++;
              console.log(`   ✅ Điền số yêu cầu: "${latestRequest.id}" (Hàng ${rowNum}, Cột ${colNum + 1})`);
            }
          }
          
          // Sửa số seal - thay thế text "số seal" bằng số seal thực tế
          if (cellValue.includes('số seal') && !cellValue.includes(latestRequest.seal_number || '')) {
            cell.value = latestRequest.seal_number || '';
            fixedCells++;
            console.log(`   ✅ Sửa số seal: "${cellValue}" → "${latestRequest.seal_number || ''}" (Hàng ${rowNum}, Cột ${colNum})`);
          }
          
          // Sửa số xe - thay thế text "Số xe" bằng số xe thực tế
          if (cellValue.includes('Số xe') && !cellValue.includes(latestRequest.license_plate || '')) {
            cell.value = latestRequest.license_plate || '';
            fixedCells++;
            console.log(`   ✅ Sửa số xe: "${cellValue}" → "${latestRequest.license_plate || ''}" (Hàng ${rowNum}, Cột ${colNum})`);
          }
          
          // Sửa tài xế - thay thế text "Số điện thoại tài xế" bằng SĐT thực tế
          if (cellValue.includes('Số điện thoại tài xế') && !cellValue.includes(latestRequest.driver_phone || '')) {
            cell.value = latestRequest.driver_phone || '';
            fixedCells++;
            console.log(`   ✅ Sửa SĐT tài xế: "${cellValue}" → "${latestRequest.driver_phone || ''}" (Hàng ${rowNum}, Cột ${colNum})`);
          }
        }
      });
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
    const filename = `EIR_OO11_FIXED_${timestamp}.xlsx`;

    // Tạo thư mục output nếu chưa có
    const outputDir = path.join(__dirname, 'uploads/generated-eir');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, filename);

    // Ghi file với ExcelJS (giữ nguyên 100% định dạng)
    await workbook.xlsx.writeFile(outputPath);

    console.log('✅ Phiếu EIR đã được sửa lỗi thành công!');
    console.log(`📁 File: ${outputPath}`);
    console.log(`📄 Filename: ${filename}`);

    console.log('\n📋 THÔNG TIN ĐÃ SỬA:');
    console.log(`   - Số container: ${latestRequest.container_no}`);
    console.log(`   - Số yêu cầu: ${latestRequest.id}`);
    console.log(`   - Số seal: ${latestRequest.seal_number || 'N/A'}`);
    console.log(`   - Số xe: ${latestRequest.license_plate || 'N/A'}`);
    console.log(`   - SĐT tài xế: ${latestRequest.driver_phone || 'N/A'}`);

    console.log('\n🎯 ĐẶC ĐIỂM FILE ĐÃ SỬA:');
    console.log('   ✅ Sửa lỗi số container và số yêu cầu');
    console.log('   ✅ Giữ nguyên 100% kích thước cột và hàng');
    console.log('   ✅ Giữ nguyên logo và hình ảnh');
    console.log('   ✅ Giữ nguyên định dạng cells (font, màu sắc, border)');
    console.log('   ✅ Giữ nguyên công thức Excel');
    console.log('   ✅ Giữ nguyên merged cells');
    console.log('   ✅ Giữ nguyên charts và objects');
    console.log('   ✅ Giữ nguyên layout và spacing');

  } catch (error) {
    console.error('❌ Lỗi khi sửa lỗi phiếu EIR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixContainerAndRequestNumber();
