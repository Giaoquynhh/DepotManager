const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function fillEIRWithExcelJS() {
  try {
    console.log('📄 Điền thông tin container OO11 vào phiếu EIR mẫu (sử dụng ExcelJS)');
    console.log('=' .repeat(70));

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
    console.log(`   - Container: ${latestRequest.container_no}`);
    console.log(`   - Khách hàng: ${latestRequest.customer?.name || 'N/A'}`);
    console.log(`   - Hãng tàu: ${latestRequest.shipping_line?.name || 'N/A'} (${latestRequest.shipping_line?.code || 'N/A'})`);
    console.log(`   - Loại container: ${latestRequest.container_type?.description || 'N/A'}`);
    console.log(`   - Seal số: ${latestRequest.seal_number || 'N/A'}`);
    console.log(`   - License plate: ${latestRequest.license_plate || 'N/A'}`);
    console.log(`   - Driver name: ${latestRequest.driver_name || 'N/A'}`);
    console.log(`   - Driver phone: ${latestRequest.driver_phone || 'N/A'}`);

    // Đường dẫn đến file template EIR
    const templatePath = path.join(__dirname, 'uploads/shipping-lines-eir/EIR_KMTU_1759508813838.xlsx');
    
    if (!fs.existsSync(templatePath)) {
      console.log('❌ File template EIR không tồn tại:', templatePath);
      return;
    }

    console.log('📁 Template path:', templatePath);

    // Đọc template Excel với ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    
    console.log('📋 Template structure loaded với ExcelJS, giữ nguyên định dạng và logo...');

    // Lấy worksheet đầu tiên
    const worksheet = workbook.getWorksheet(1);
    console.log(`📊 Worksheet: ${worksheet.name}, có ${worksheet.rowCount} hàng, ${worksheet.columnCount} cột`);

    // Tìm và điền thông tin vào các ô cụ thể
    let filledCells = 0;

    // Duyệt qua tất cả các ô để tìm và điền thông tin
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        const cellValue = cell.value;
        
        if (typeof cellValue === 'string') {
          // Tìm và điền thông tin khách hàng
          if (cellValue.includes('Giao cho/Nhận của') || cellValue.includes('Giao cho')) {
            const customerCell = worksheet.getCell(rowNumber, colNumber + 2);
            customerCell.value = latestRequest.customer?.name || 'CÔNG TY TNHH FORD VIỆT NAM';
            filledCells++;
            console.log(`   ✅ Điền khách hàng: ${customerCell.value}`);
          }
          
          // Tìm và điền số container
          if (cellValue.includes('Số container') || cellValue.includes('container')) {
            const containerCell = worksheet.getCell(rowNumber, colNumber + 2);
            containerCell.value = latestRequest.container_no;
            filledCells++;
            console.log(`   ✅ Điền số container: ${containerCell.value}`);
          }
          
          // Tìm và điền số seal
          if (cellValue.includes('Số seal') || cellValue.includes('seal')) {
            const sealCell = worksheet.getCell(rowNumber, colNumber + 1);
            sealCell.value = latestRequest.seal_number || '';
            filledCells++;
            console.log(`   ✅ Điền số seal: ${sealCell.value}`);
          }
          
          // Tìm và điền số xe
          if (cellValue.includes('Số xe') || cellValue.includes('xe')) {
            const vehicleCell = worksheet.getCell(rowNumber, colNumber + 2);
            vehicleCell.value = latestRequest.license_plate || '67H-395.20';
            filledCells++;
            console.log(`   ✅ Điền số xe: ${vehicleCell.value}`);
          }
          
          // Tìm và điền tài xế
          if (cellValue.includes('Tài xế') || cellValue.includes('tài xế')) {
            const driverCell = worksheet.getCell(rowNumber, colNumber + 1);
            driverCell.value = `Tài xế: ${latestRequest.driver_name || 'Trần Thị Bình'}`;
            filledCells++;
            console.log(`   ✅ Điền tài xế: ${driverCell.value}`);
          }
          
          // Tìm và điền CMND
          if (cellValue.includes('CMND') || cellValue.includes('cmnd')) {
            const cmndCell = worksheet.getCell(rowNumber, colNumber + 1);
            cmndCell.value = `CMND: ${latestRequest.driver_phone || '714529869'}`;
            filledCells++;
            console.log(`   ✅ Điền CMND: ${cmndCell.value}`);
          }
          
          // Tìm và điền ngày
          if (cellValue.includes('Ngày') && cellValue.includes('tháng') && cellValue.includes('năm')) {
            const currentDate = new Date();
            const day = currentDate.getDate();
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            cell.value = `Ngày ${day} tháng ${month} năm ${year}`;
            filledCells++;
            console.log(`   ✅ Điền ngày: ${cell.value}`);
          }
        }
      });
    });

    console.log(`📊 Đã điền ${filledCells} ô dữ liệu`);

    // Tạo tên file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `EIR_OO11_EXCELJS_${timestamp}.xlsx`;

    // Tạo thư mục output nếu chưa có
    const outputDir = path.join(__dirname, 'uploads/generated-eir');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, filename);

    // Ghi file với ExcelJS (giữ nguyên tất cả định dạng)
    await workbook.xlsx.writeFile(outputPath);

    console.log('✅ Phiếu EIR đã được điền thông tin thành công với ExcelJS!');
    console.log(`📁 File: ${outputPath}`);
    console.log(`📄 Filename: ${filename}`);

    // Hiển thị thông tin chi tiết
    console.log('\n📋 Thông tin đã điền vào phiếu EIR:');
    console.log(`   - Container: ${latestRequest.container_no}`);
    console.log(`   - Khách hàng: ${latestRequest.customer?.name || 'N/A'}`);
    console.log(`   - Hãng tàu: ${latestRequest.shipping_line?.name || 'N/A'} (${latestRequest.shipping_line?.code || 'N/A'})`);
    console.log(`   - Loại container: ${latestRequest.container_type?.description || 'N/A'}`);
    console.log(`   - Seal số: ${latestRequest.seal_number || 'N/A'}`);
    console.log(`   - Số xe: ${latestRequest.license_plate || 'N/A'}`);
    console.log(`   - Tài xế: ${latestRequest.driver_name || 'N/A'}`);
    console.log(`   - SĐT tài xế: ${latestRequest.driver_phone || 'N/A'}`);

    console.log('\n🎯 Ưu điểm của ExcelJS:');
    console.log('   - Giữ nguyên logo và hình ảnh');
    console.log('   - Giữ nguyên định dạng cells (font, màu sắc, border)');
    console.log('   - Giữ nguyên công thức Excel');
    console.log('   - Giữ nguyên merged cells');
    console.log('   - Giữ nguyên charts và objects');

  } catch (error) {
    console.error('❌ Lỗi khi điền thông tin vào phiếu EIR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fillEIRWithExcelJS();
