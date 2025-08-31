const fs = require('fs');
const path = require('path');

// Test API upload EIR với container ISO 1234
async function testUploadEIR1234() {
  console.log('🧪 Test API upload EIR với container ISO 1234...\n');
  
  try {
    // Tạo file test
    const testFilePath = path.join(__dirname, 'test-eir-1234.txt');
    const testContent = `Test EIR file for container ISO 1234\nGenerated at: ${new Date().toISOString()}`;
    
    fs.writeFileSync(testFilePath, testContent);
    console.log('✅ Đã tạo file test:', testFilePath);
    
    // Test data
    const formData = {
      file: {
        name: 'test-eir-1234.txt',
        path: testFilePath,
        size: fs.statSync(testFilePath).size
      },
      container_no: 'ISO 1234',
      type: 'EIR'
    };
    
    console.log('📤 FormData:', formData);
    console.log('📁 File sẽ được lưu vào: D:\\container21\\manageContainer\\backend\\uploads');
    
    // Kiểm tra thư mục upload
    const uploadDir = 'D:\\container21\\manageContainer\\backend\\uploads';
    if (fs.existsSync(uploadDir)) {
      console.log('✅ Thư mục upload đã tồn tại:', uploadDir);
      const files = fs.readdirSync(uploadDir);
      console.log('📁 Files trong thư mục upload:', files);
    } else {
      console.log('❌ Thư mục upload chưa tồn tại:', uploadDir);
    }
    
    console.log('\n🚀 Để test thực tế:');
    console.log('1. Backend đang chạy trên port 1000');
    console.log('2. Test API upload EIR:');
    console.log(`   curl -X POST "http://localhost:1000/finance/upload/eir" \\`);
    console.log(`     -H "Authorization: Bearer YOUR_TOKEN" \\`);
    console.log(`     -F "file=@test-eir-1234.txt" \\`);
    console.log(`     -F "container_no=ISO 1234" \\`);
    console.log(`     -F "type=EIR"`);
    
    console.log('\n3. Test API xem EIR:');
    console.log(`   curl -X GET "http://localhost:1000/finance/eir/container/ISO%201234"`);
    
    console.log('\n💡 Lưu ý quan trọng:');
    console.log('- Container ISO 1234 đã tồn tại trong database');
    console.log('- API sẽ tìm request theo container_no và lưu EIR vào database');
    console.log('- Tên file sẽ được tạo với container number chính xác: EIR_ISO 1234_...');
    
    // Xóa file test
    fs.unlinkSync(testFilePath);
    console.log('\n🗑️ Đã xóa file test');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Chạy test
testUploadEIR1234();
