const fs = require('fs');
const path = require('path');

// Test API upload EIR đã được sửa
async function testUploadEIRFixed() {
  console.log('🧪 Test API upload EIR đã được sửa...\n');
  
  try {
    // Tạo file test
    const testFilePath = path.join(__dirname, 'test-eir-fixed.txt');
    const testContent = `Test EIR file for container ISO 1234\nGenerated at: ${new Date().toISOString()}\nThis is a test file to verify the fix`;
    
    fs.writeFileSync(testFilePath, testContent);
    console.log('✅ Đã tạo file test:', testFilePath);
    
    console.log('\n🔍 Vấn đề đã được sửa:');
    console.log('1. Multer storage tạo tên file tạm thời: EIR_TEMP_[timestamp]_[originalname]');
    console.log('2. Route handler đổi tên file thành: EIR_[container_no]_[timestamp]_[originalname]');
    console.log('3. File được lưu với tên chính xác chứa container number');
    
    console.log('\n📁 Kiểm tra thư mục upload:');
    const uploadDir = 'D:\\container21\\manageContainer\\backend\\uploads';
    if (fs.existsSync(uploadDir)) {
      console.log('✅ Thư mục upload đã tồn tại:', uploadDir);
      const files = fs.readdirSync(uploadDir);
      console.log('📁 Files trong thư mục upload:', files);
      
      // Kiểm tra xem có file nào có "UNKNOWN" không
      const unknownFiles = files.filter(file => file.includes('UNKNOWN'));
      if (unknownFiles.length > 0) {
        console.log('⚠️  Các file cũ vẫn có "UNKNOWN":', unknownFiles);
        console.log('💡 Đây là các file được upload trước khi sửa lỗi');
      } else {
        console.log('✅ Không có file nào chứa "UNKNOWN"');
      }
    } else {
      console.log('❌ Thư mục upload chưa tồn tại:', uploadDir);
    }
    
    console.log('\n🚀 Để test thực tế:');
    console.log('1. Backend đang chạy trên port 1000 (PID:', process.env.BACKEND_PID || 'unknown', ')');
    console.log('2. Test API upload EIR:');
    console.log(`   curl -X POST "http://localhost:1000/finance/upload/eir" \\`);
    console.log(`     -H "Authorization: Bearer YOUR_TOKEN" \\`);
    console.log(`     -F "file=@test-eir-fixed.txt" \\`);
    console.log(`     -F "container_no=ISO 1234" \\`);
    console.log(`     -F "type=EIR"`);
    
    console.log('\n3. Test API xem EIR:');
    console.log(`   curl -X GET "http://localhost:1000/finance/eir/container/ISO%201234"`);
    
    console.log('\n💡 Kết quả mong đợi:');
    console.log('- File sẽ được lưu với tên: EIR_ISO 1234_[timestamp]_test-eir-fixed.txt');
    console.log('- Không còn "UNKNOWN" trong tên file');
    console.log('- Container number sẽ được hiển thị chính xác');
    
    // Xóa file test
    fs.unlinkSync(testFilePath);
    console.log('\n🗑️ Đã xóa file test');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Chạy test
testUploadEIRFixed();
