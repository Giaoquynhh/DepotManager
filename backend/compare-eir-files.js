const fs = require('fs');
const path = require('path');

function compareEIRFiles() {
  console.log('📊 So sánh các phiếu EIR đã tạo cho container OO11');
  console.log('=' .repeat(70));

  const generatedDir = path.join(__dirname, 'uploads/generated-eir');
  
  if (!fs.existsSync(generatedDir)) {
    console.log('❌ Thư mục generated-eir không tồn tại');
    return;
  }

  const files = fs.readdirSync(generatedDir)
    .filter(file => file.includes('EIR_OO11'))
    .sort();

  console.log(`📁 Tìm thấy ${files.length} phiếu EIR:`);
  
  files.forEach((file, index) => {
    const filePath = path.join(generatedDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    
    console.log(`\n${index + 1}. ${file}`);
    console.log(`   📏 Kích thước: ${sizeKB} KB`);
    console.log(`   📅 Ngày tạo: ${stats.birthtime.toLocaleString('vi-VN')}`);
    
    // Phân loại file
    if (file.includes('EXCELJS')) {
      console.log(`   🎯 Loại: ExcelJS (GIỮ NGUYÊN LOGO & ĐỊNH DẠNG)`);
      console.log(`   ✅ Khuyến nghị: SỬ DỤNG FILE NÀY`);
    } else if (file.includes('FILLED')) {
      console.log(`   🎯 Loại: XLSX với template gốc`);
      console.log(`   ⚠️  Có thể mất logo`);
    } else {
      console.log(`   🎯 Loại: Tạo mới hoàn toàn`);
      console.log(`   ❌ Mất logo và định dạng`);
    }
  });

  console.log('\n🎯 KHUYẾN NGHỊ:');
  console.log('   📄 Sử dụng file có tên chứa "EXCELJS"');
  console.log('   🎨 File này giữ nguyên:');
  console.log('      - Logo và hình ảnh');
  console.log('      - Định dạng cells (font, màu sắc, border)');
  console.log('      - Công thức Excel');
  console.log('      - Merged cells');
  console.log('      - Charts và objects');
  console.log('      - Kích thước và layout gốc');

  console.log('\n📋 Thông tin container OO11 đã điền:');
  console.log('   - Container: OO11');
  console.log('   - Khách hàng: Tổng công ty Logistics Việt Nam');
  console.log('   - Hãng tàu: Korea Marine Transport Co. (KMTU)');
  console.log('   - Loại container: 40\' Ventilated Container');
  console.log('   - Seal số: 03');
  console.log('   - Số xe: 88A-45423');
  console.log('   - Tài xế: HHA');
  console.log('   - SĐT tài xế: 050150512');
}

compareEIRFiles();


