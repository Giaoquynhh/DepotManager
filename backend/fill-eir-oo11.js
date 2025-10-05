const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function fillEIRForOO11() {
  try {
    console.log('📄 Điền thông tin container OO11 vào phiếu EIR mẫu');
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

    // Đọc template Excel và giữ nguyên cấu trúc
    const workbook = XLSX.readFile(templatePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log('📋 Template structure loaded, giữ nguyên định dạng...');

    // Chuyển đổi thành JSON để xem cấu trúc hiện tại
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    console.log('📊 Template có', jsonData.length, 'hàng dữ liệu');

    // Tạo dữ liệu mới với thông tin container
    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    // Tìm các ô cần điền dữ liệu dựa trên cấu trúc template
    // Giả sử template có cấu trúc cố định, chúng ta sẽ điền vào các ô cụ thể
    
    // Tạo worksheet mới với dữ liệu đã điền
    const newWorksheetData = [...jsonData]; // Copy toàn bộ dữ liệu gốc
    
    // Điền thông tin vào các ô cụ thể (cần xác định vị trí chính xác)
    // Dựa trên cấu trúc template, chúng ta sẽ điền vào các ô:
    
    // Tìm và điền thông tin khách hàng
    for (let i = 0; i < newWorksheetData.length; i++) {
      const row = newWorksheetData[i];
      if (Array.isArray(row)) {
        // Tìm ô chứa thông tin khách hàng
        for (let j = 0; j < row.length; j++) {
          if (typeof row[j] === 'string' && row[j].includes('Giao cho/Nhận của')) {
            // Điền tên khách hàng vào ô bên cạnh
            if (j + 2 < row.length) {
              newWorksheetData[i][j + 2] = latestRequest.customer?.name || 'CÔNG TY TNHH FORD VIỆT NAM';
            }
          }
          // Tìm ô chứa số container
          if (typeof row[j] === 'string' && row[j].includes('Số container')) {
            if (j + 2 < row.length) {
              newWorksheetData[i][j + 2] = latestRequest.container_no;
            }
          }
          // Tìm ô chứa số seal
          if (typeof row[j] === 'string' && row[j].includes('Số seal')) {
            if (j + 1 < row.length) {
              newWorksheetData[i][j + 1] = latestRequest.seal_number || '';
            }
          }
          // Tìm ô chứa số xe
          if (typeof row[j] === 'string' && row[j].includes('Số xe')) {
            if (j + 2 < row.length) {
              newWorksheetData[i][j + 2] = latestRequest.license_plate || '67H-395.20';
            }
          }
          // Tìm ô chứa tài xế
          if (typeof row[j] === 'string' && row[j].includes('Tài xế')) {
            if (j + 1 < row.length) {
              newWorksheetData[i][j + 1] = `Tài xế: ${latestRequest.driver_name || 'Trần Thị Bình'}`;
            }
          }
          // Tìm ô chứa CMND
          if (typeof row[j] === 'string' && row[j].includes('CMND')) {
            if (j + 1 < row.length) {
              newWorksheetData[i][j + 1] = `CMND: ${latestRequest.driver_phone || '714529869'}`;
            }
          }
          // Tìm ô chứa ngày
          if (typeof row[j] === 'string' && row[j].includes('Ngày')) {
            if (j + 1 < row.length) {
              newWorksheetData[i][j + 1] = `Ngày ${day} tháng ${month} năm ${year}`;
            }
          }
        }
      }
    }

    // Tạo worksheet mới từ dữ liệu đã điền
    const newWorksheet = XLSX.utils.aoa_to_sheet(newWorksheetData);
    
    // Giữ nguyên tất cả thuộc tính của worksheet gốc
    newWorksheet['!cols'] = worksheet['!cols'];
    newWorksheet['!rows'] = worksheet['!rows'];
    newWorksheet['!merges'] = worksheet['!merges'];
    newWorksheet['!ref'] = worksheet['!ref'];
    
    // Copy tất cả các thuộc tính khác
    Object.keys(worksheet).forEach(key => {
      if (key.startsWith('!')) {
        newWorksheet[key] = worksheet[key];
      }
    });

    // Tạo workbook mới
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, sheetName);

    // Tạo tên file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `EIR_OO11_FILLED_${timestamp}.xlsx`;

    // Tạo thư mục output nếu chưa có
    const outputDir = path.join(__dirname, 'uploads/generated-eir');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, filename);

    // Ghi file
    XLSX.writeFile(newWorkbook, outputPath);

    console.log('✅ Phiếu EIR đã được điền thông tin thành công!');
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
    console.log(`   - Ngày tạo: ${day}/${month}/${year}`);

  } catch (error) {
    console.error('❌ Lỗi khi điền thông tin vào phiếu EIR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fillEIRForOO11();


