const fs = require('fs');
const path = require('path');

// Test API EIR mới
async function testEIRAPI() {
  console.log('🧪 Test API EIR mới...\n');
  
  try {
    // Kiểm tra thư mục uploads
    const uploadDir = 'D:\\container21\\manageContainer\\backend\\uploads';
    if (!fs.existsSync(uploadDir)) {
      console.log('❌ Thư mục uploads không tồn tại:', uploadDir);
      return;
    }
    
    console.log('✅ Thư mục uploads tồn tại:', uploadDir);
    
    // Liệt kê các file EIR
    const files = fs.readdirSync(uploadDir);
    const eirFiles = files.filter(file => file.startsWith('EIR_'));
    
    console.log(`📁 Tìm thấy ${eirFiles.length} file EIR:`);
    eirFiles.forEach(file => {
      console.log(`  - ${file}`);
    });
    
    if (eirFiles.length === 0) {
      console.log('\n❌ Không có file EIR nào để test');
      return;
    }
    
    // Test với file EIR đầu tiên
    const testFile = eirFiles[0];
    console.log(`\n🎯 Test với file: ${testFile}`);
    
    // Parse container number từ tên file
    const match = testFile.match(/EIR_(.+?)_\d+-\d+_/);
    if (match) {
      const containerNo = match[1];
      console.log(`📦 Container number: ${containerNo}`);
      
      console.log('\n🚀 Test API endpoints:');
      console.log(`1. GET /finance/eir/container/${containerNo}`);
      console.log(`2. GET /finance/eir/${testFile}`);
      
      console.log('\n📋 Để test thực tế:');
      console.log('1. Khởi động backend: npm run dev');
      console.log('2. Test API 1 (EIR theo container):');
      console.log(`   curl -X GET "http://localhost:5001/finance/eir/container/${containerNo}"`);
      console.log('3. Test API 2 (EIR theo filename):');
      console.log(`   curl -X GET "http://localhost:5001/finance/eir/${testFile}"`);
      console.log('4. Test frontend:');
      console.log(`   http://localhost:5002/finance/eir/container/${containerNo}`);
      
      // Test upload EIR mới
      console.log('\n📤 Test Upload EIR mới:');
      console.log('1. Tạo file test:');
      console.log(`   echo "Test EIR for ${containerNo}" > test-eir.txt`);
      console.log('2. Upload file:');
      console.log(`   curl -X POST "http://localhost:5001/finance/upload/eir" \\`);
      console.log(`     -H "Authorization: Bearer YOUR_TOKEN" \\`);
      console.log(`     -F "file=@test-eir.txt" \\`);
      console.log(`     -F "container_no=${containerNo}" \\`);
      console.log(`     -F "type=EIR"`);
      
    } else {
      console.log('❌ Không thể parse container number từ tên file');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Chạy test
testEIRAPI();
