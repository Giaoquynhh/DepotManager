const fs = require('fs');
const path = require('path');

// Test API xem EIR
async function testEIRViewAPI() {
  console.log('🧪 Test API xem EIR...\n');
  
  try {
    console.log('🔍 Kiểm tra file EIR mới:');
    const uploadDir = 'D:\\container21\\manageContainer\\backend\\uploads';
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      
      // Tìm file EIR mới với container ISO 1234
      const eirFiles = files.filter(file => file.includes('EIR_ISO 1234'));
      if (eirFiles.length > 0) {
        console.log('✅ Tìm thấy file EIR mới:', eirFiles);
        
        // Kiểm tra file đầu tiên
        const eirFile = eirFiles[0];
        const filePath = path.join(uploadDir, eirFile);
        const stats = fs.statSync(filePath);
        
        console.log('📁 Thông tin file:');
        console.log('  - Tên file:', eirFile);
        console.log('  - Đường dẫn:', filePath);
        console.log('  - Kích thước:', (stats.size / 1024).toFixed(2), 'KB');
        console.log('  - Loại file:', path.extname(eirFile));
        
        // Kiểm tra xem file có thể đọc được không
        try {
          const fileContent = fs.readFileSync(filePath);
          console.log('✅ File có thể đọc được, kích thước:', fileContent.length, 'bytes');
        } catch (readError) {
          console.error('❌ Không thể đọc file:', readError.message);
        }
        
      } else {
        console.log('❌ Không tìm thấy file EIR nào với container ISO 1234');
      }
      
      // Kiểm tra các file cũ có UNKNOWN
      const unknownFiles = files.filter(file => file.includes('UNKNOWN'));
      if (unknownFiles.length > 0) {
        console.log('⚠️  Các file cũ vẫn có "UNKNOWN":', unknownFiles);
      }
    } else {
      console.log('❌ Thư mục upload không tồn tại:', uploadDir);
    }
    
    console.log('\n🚀 Test API endpoints:');
    console.log('1. Backend đang chạy trên port 1000');
    console.log('2. API xem EIR theo container:');
    console.log(`   GET /finance/eir/container/ISO%201234`);
    
    console.log('\n💡 Lưu ý quan trọng:');
    console.log('- API cần authentication token hợp lệ');
    console.log('- Frontend đã được sửa để sử dụng api instance với authentication');
    console.log('- File EIR mới đã được lưu với tên chính xác: EIR_ISO 1234_[timestamp]_[originalname]');
    
    console.log('\n🔧 Để test hoàn chỉnh:');
    console.log('1. Restart frontend để áp dụng thay đổi');
    console.log('2. Đăng nhập lại để có token mới');
    console.log('3. Click "Xem EIR" cho container ISO 1234');
    console.log('4. File sẽ được hiển thị trực tiếp trên trang');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Chạy test
testEIRViewAPI();
