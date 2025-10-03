const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function generateEIRForOO11() {
  try {
    console.log('📄 Tạo phiếu EIR cho container OO11');
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
    console.log(`   - ID: ${latestRequest.id}`);
    console.log(`   - Type: ${latestRequest.type}`);
    console.log(`   - Status: ${latestRequest.status}`);
    console.log(`   - Khách hàng: ${latestRequest.customer?.name || 'N/A'}`);
    console.log(`   - Hãng tàu: ${latestRequest.shipping_line?.name || 'N/A'}`);
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

    // Đọc template Excel
    const workbook = XLSX.readFile(templatePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    console.log('📋 Template structure loaded');

    // Tạo dữ liệu mới với thông tin container
    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    
    const worksheetData = [
      // Row 1: Tên công ty
      ['', 'CÔNG TY CỔ PHẦN LOGISTICS THÁI BÌNH', '', '', '', '', '', '', '', ''],
      
      // Row 2: Địa chỉ
      ['', 'Địa chỉ: KCN Thái Bình, Phường Trần Lãm, TP.Thái Bình, Tỉnh Thái Bình', '', '', '', '', '', '', '', ''],
      
      // Row 3: Tel và MST
      ['', 'Tel: 0227.3745.678        MST: 3701587234', '', '', '', '', '', '', '', ''],
      
      // Row 4: Tiêu đề
      ['', '', '', '', 'PHIẾU THÔNG TIN CONTAINER', '', '', '', '', ''],
      
      // Row 5: Ngày
      ['', '', '', '', '', '', '', '', `Ngày ${day} tháng ${month} năm ${year}`, ''],
      
      // Row 6: Giao cho/Nhận của
      ['Giao cho/Nhận của:', '', latestRequest.customer?.name || 'CÔNG TY TNHH FORD VIỆT NAM', '', '', '', '', '', '', ''],
      
      // Row 7: Hãng tàu và Tác nghiệp
      ['Hãng tàu:', '', latestRequest.shipping_line?.code || 'KMTU', '', '', '', '', '', '', 'Tác nghiệp:'],
      
      // Row 8: Số container, seal, booking
      ['Số container:', '', latestRequest.container_no, '', '', '', '', '', 'Số seal:', latestRequest.seal_number || ''],
      
      // Row 9: Ghi chú
      ['GHI CHÚ\nEMPTY', '', '', '', '', '', '', '', '', ''],
      
      // Row 10: Số xe
      ['Số xe:', '', latestRequest.license_plate || '67H-395.20', '', '', '', '', '', '', ''],
      
      // Row 11: Tài xế và CMND
      [`Tài xế: ${latestRequest.driver_name || 'Trần Thị Bình'}`, '', '', '', '', '', `CMND: ${latestRequest.driver_phone || '714529869'}`, '', '', ''],
      
      // Row 12: Nhân viên giao nhận
      ['Nhân viên giao nhận\nGate Check', '', '', '', '', '', 'Nhân viên kiểm hàng\nYard Check', '', '', '']
    ];

    // Tạo workbook mới
    const newWorkbook = XLSX.utils.book_new();
    const newWorksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Thiết lập độ rộng cột
    newWorksheet['!cols'] = [
      { width: 15 }, // A
      { width: 20 }, // B
      { width: 15 }, // C
      { width: 15 }, // D
      { width: 20 }, // E
      { width: 15 }, // F
      { width: 15 }, // G
      { width: 15 }, // H
      { width: 20 }, // I
      { width: 15 }  // J
    ];

    // Thiết lập độ cao hàng
    newWorksheet['!rows'] = [
      { height: 25 }, // Row 1
      { height: 25 }, // Row 2
      { height: 25 }, // Row 3
      { height: 30 }, // Row 4
      { height: 25 }, // Row 5
      { height: 25 }, // Row 6
      { height: 25 }, // Row 7
      { height: 25 }, // Row 8
      { height: 30 }, // Row 9
      { height: 25 }, // Row 10
      { height: 25 }, // Row 11
      { height: 30 }  // Row 12
    ];

    // Merge cells cho tiêu đề
    newWorksheet['!merges'] = [
      { s: { r: 0, c: 1 }, e: { r: 0, c: 9 } }, // Row 1: Tên công ty
      { s: { r: 1, c: 1 }, e: { r: 1, c: 9 } }, // Row 2: Địa chỉ
      { s: { r: 2, c: 1 }, e: { r: 2, c: 9 } }, // Row 3: Tel và MST
      { s: { r: 3, c: 4 }, e: { r: 3, c: 5 } }, // Row 4: Tiêu đề
      { s: { r: 4, c: 7 }, e: { r: 4, c: 8 } }, // Row 5: Ngày
      { s: { r: 5, c: 1 }, e: { r: 5, c: 3 } }, // Row 6: Giao cho/Nhận của
      { s: { r: 6, c: 1 }, e: { r: 6, c: 3 } }, // Row 7: Hãng tàu
      { s: { r: 6, c: 9 }, e: { r: 6, c: 9 } }, // Row 7: Tác nghiệp
      { s: { r: 7, c: 1 }, e: { r: 7, c: 3 } }, // Row 8: Số container
      { s: { r: 7, c: 7 }, e: { r: 7, c: 8 } }, // Row 8: Số seal
      { s: { r: 8, c: 0 }, e: { r: 8, c: 2 } }, // Row 9: Ghi chú
      { s: { r: 9, c: 1 }, e: { r: 9, c: 3 } }, // Row 10: Số xe
      { s: { r: 10, c: 0 }, e: { r: 10, c: 3 } }, // Row 11: Tài xế
      { s: { r: 10, c: 6 }, e: { r: 10, c: 8 } }, // Row 11: CMND
      { s: { r: 11, c: 0 }, e: { r: 11, c: 2 } }, // Row 12: Nhân viên giao nhận
      { s: { r: 11, c: 6 }, e: { r: 11, c: 8 } }  // Row 12: Nhân viên kiểm hàng
    ];

    // Thêm worksheet vào workbook
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'EIR');

    // Tạo tên file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `EIR_OO11_${timestamp}.xlsx`;

    // Tạo thư mục output nếu chưa có
    const outputDir = path.join(__dirname, 'uploads/generated-eir');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, filename);

    // Ghi file
    XLSX.writeFile(newWorkbook, outputPath);

    console.log('✅ Phiếu EIR đã được tạo thành công!');
    console.log(`📁 File: ${outputPath}`);
    console.log(`📄 Filename: ${filename}`);

    // Hiển thị thông tin chi tiết
    console.log('\n📋 Thông tin phiếu EIR:');
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
    console.error('❌ Lỗi khi tạo phiếu EIR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateEIRForOO11();

