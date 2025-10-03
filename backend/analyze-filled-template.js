const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function analyzeFilledTemplate() {
  try {
    console.log('📊 PHÂN TÍCH FILE MẪU ĐÃ ĐIỀN SẴN');
    console.log('=' .repeat(60));

    // Đường dẫn đến file template đã điền sẵn
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

    // Phân tích từng hàng để tìm vị trí các trường
    console.log('\n🔍 PHÂN TÍCH VỊ TRÍ CÁC TRƯỜNG:');
    console.log('=' .repeat(50));

    const fieldPositions = {};

    // Duyệt qua các hàng để tìm vị trí các trường
    for (let rowNum = 1; rowNum <= Math.min(20, worksheet.rowCount); rowNum++) {
      const row = worksheet.getRow(rowNum);
      
      row.eachCell((cell, colNum) => {
        const cellValue = cell.value;
        
        if (typeof cellValue === 'string') {
          // Tìm các trường quan trọng
          if (cellValue.includes('Giao cho') || cellValue.includes('Nhận của')) {
            fieldPositions.customer = { row: rowNum, col: colNum, value: cellValue };
            console.log(`   📍 Khách hàng: Hàng ${rowNum}, Cột ${colNum} - "${cellValue}"`);
          }
          
          if (cellValue.includes('Hãng tàu') || cellValue.includes('hãng tàu')) {
            fieldPositions.shipping_line = { row: rowNum, col: colNum, value: cellValue };
            console.log(`   📍 Hãng tàu: Hàng ${rowNum}, Cột ${colNum} - "${cellValue}"`);
          }
          
          if (cellValue.includes('Số container') || cellValue.includes('container')) {
            fieldPositions.container = { row: rowNum, col: colNum, value: cellValue };
            console.log(`   📍 Số container: Hàng ${rowNum}, Cột ${colNum} - "${cellValue}"`);
          }
          
          if (cellValue.includes('Số seal') || cellValue.includes('seal')) {
            fieldPositions.seal = { row: rowNum, col: colNum, value: cellValue };
            console.log(`   📍 Số seal: Hàng ${rowNum}, Cột ${colNum} - "${cellValue}"`);
          }
          
          if (cellValue.includes('Số xe') || cellValue.includes('xe')) {
            fieldPositions.vehicle = { row: rowNum, col: colNum, value: cellValue };
            console.log(`   📍 Số xe: Hàng ${rowNum}, Cột ${colNum} - "${cellValue}"`);
          }
          
          if (cellValue.includes('Tài xế') || cellValue.includes('tài xế')) {
            fieldPositions.driver = { row: rowNum, col: colNum, value: cellValue };
            console.log(`   📍 Tài xế: Hàng ${rowNum}, Cột ${colNum} - "${cellValue}"`);
          }
          
          if (cellValue.includes('CMND') || cellValue.includes('cmnd')) {
            fieldPositions.driver_phone = { row: rowNum, col: colNum, value: cellValue };
            console.log(`   📍 CMND: Hàng ${rowNum}, Cột ${colNum} - "${cellValue}"`);
          }
          
          if (cellValue.includes('Ngày') && cellValue.includes('tháng') && cellValue.includes('năm')) {
            fieldPositions.date = { row: rowNum, col: colNum, value: cellValue };
            console.log(`   📍 Ngày: Hàng ${rowNum}, Cột ${colNum} - "${cellValue}"`);
          }
        }
      });
    }

    // Tìm các ô có dữ liệu thực tế (không phải label)
    console.log('\n📝 TÌM CÁC Ô CÓ DỮ LIỆU THỰC TẾ:');
    console.log('=' .repeat(50));

    for (let rowNum = 1; rowNum <= Math.min(20, worksheet.rowCount); rowNum++) {
      const row = worksheet.getRow(rowNum);
      
      row.eachCell((cell, colNum) => {
        const cellValue = cell.value;
        
        if (typeof cellValue === 'string' && cellValue.trim() !== '') {
          // Kiểm tra xem có phải dữ liệu thực tế không (không phải label)
          if (!cellValue.includes(':') && 
              !cellValue.includes('Giao cho') && 
              !cellValue.includes('Hãng tàu') && 
              !cellValue.includes('Số container') && 
              !cellValue.includes('Số seal') && 
              !cellValue.includes('Số xe') && 
              !cellValue.includes('Tài xế') && 
              !cellValue.includes('CMND') && 
              !cellValue.includes('Ngày') &&
              !cellValue.includes('PHIẾU') &&
              !cellValue.includes('CÔNG TY') &&
              !cellValue.includes('Địa chỉ') &&
              !cellValue.includes('Tel') &&
              !cellValue.includes('MST') &&
              cellValue.length > 2) {
            
            console.log(`   📍 Dữ liệu: Hàng ${rowNum}, Cột ${colNum} - "${cellValue}"`);
          }
        }
      });
    }

    // Tạo mapping dựa trên phân tích
    console.log('\n🎯 MAPPING ĐƯỢC ĐỀ XUẤT:');
    console.log('=' .repeat(50));
    
    if (fieldPositions.customer) {
      console.log(`customer_name: { row: ${fieldPositions.customer.row}, col: ${fieldPositions.customer.col + 2}, description: 'Tên khách hàng' },`);
    }
    if (fieldPositions.shipping_line) {
      console.log(`shipping_line: { row: ${fieldPositions.shipping_line.row}, col: ${fieldPositions.shipping_line.col + 2}, description: 'Hãng tàu' },`);
    }
    if (fieldPositions.container) {
      console.log(`container_no: { row: ${fieldPositions.container.row}, col: ${fieldPositions.container.col + 2}, description: 'Số container' },`);
    }
    if (fieldPositions.seal) {
      console.log(`seal_number: { row: ${fieldPositions.seal.row}, col: ${fieldPositions.seal.col + 1}, description: 'Số seal' },`);
    }
    if (fieldPositions.vehicle) {
      console.log(`vehicle_plate: { row: ${fieldPositions.vehicle.row}, col: ${fieldPositions.vehicle.col + 2}, description: 'Số xe' },`);
    }
    if (fieldPositions.driver) {
      console.log(`driver_name: { row: ${fieldPositions.driver.row}, col: ${fieldPositions.driver.col + 1}, description: 'Tài xế' },`);
    }
    if (fieldPositions.driver_phone) {
      console.log(`driver_phone: { row: ${fieldPositions.driver_phone.row}, col: ${fieldPositions.driver_phone.col + 1}, description: 'CMND/SĐT tài xế' },`);
    }
    if (fieldPositions.date) {
      console.log(`date: { row: ${fieldPositions.date.row}, col: ${fieldPositions.date.col}, description: 'Ngày' },`);
    }

    console.log('\n✅ Phân tích hoàn tất!');
    console.log('📋 Bạn có thể sử dụng mapping trên để cập nhật script fill-eir-with-mapping.js');

  } catch (error) {
    console.error('❌ Lỗi khi phân tích template:', error);
  }
}

analyzeFilledTemplate();
