const fs = require('fs');
const path = require('path');

// Test upload file EIR
async function testEIRUpload() {
  console.log('🧪 Test upload file EIR...');
  
  try {
    // Tạo file test đơn giản
    const testFilePath = path.join(__dirname, 'test-eir.txt');
    const testContent = `Test EIR file for container ISO 1234\nGenerated at: ${new Date().toISOString()}`;
    
    fs.writeFileSync(testFilePath, testContent);
    console.log('✅ Đã tạo file test:', testFilePath);
    
    // Tạo FormData (giả lập)
    const formData = {
      file: {
        name: 'test-eir.txt',
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
    
    // Xóa file test
    fs.unlinkSync(testFilePath);
    console.log('🗑️ Đã xóa file test');
    
    console.log('\n🎯 Để test thực tế:');
    console.log('1. Mở frontend: http://localhost:5002/finance/invoices');
    console.log('2. Click "Tạo hóa đơn" cho container ISO 1234');
    console.log('3. Chọn file EIR (PDF hoặc hình ảnh)');
    console.log('4. Click "Hoàn tất"');
    console.log('5. File sẽ được tự động upload vào backend/uploads');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Chạy test
testEIRUpload();
