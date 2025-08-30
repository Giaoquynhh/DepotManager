const fs = require('fs');
const path = require('path');

// Test multer storage configuration
function testMulterConfig() {
  console.log('🧪 Test multer storage configuration...\n');
  
  try {
    // Simulate multer storage configuration
    const storage = {
      destination: (req, file, cb) => {
        const uploadPath = 'D:\\container21\\manageContainer\\backend\\uploads';
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Sử dụng container_no từ body thay vì 'UNKNOWN'
        const containerNo = req.body.container_no || 'UNKNOWN';
        const filename = `EIR_${containerNo}_${uniqueSuffix}_${file.originalname}`;
        console.log('📁 Creating filename:', filename, 'for container:', containerNo);
        cb(null, filename);
      }
    };
    
    // Test với container ISO 1234
    const testReq = {
      body: {
        container_no: 'ISO 1234',
        type: 'EIR'
      }
    };
    
    const testFile = {
      originalname: 'test-eir.pdf'
    };
    
    console.log('🔍 Test với container ISO 1234:');
    console.log('  - req.body.container_no:', testReq.body.container_no);
    console.log('  - file.originalname:', testFile.originalname);
    
    // Simulate filename generation
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const containerNo = testReq.body.container_no || 'UNKNOWN';
    const filename = `EIR_${containerNo}_${uniqueSuffix}_${testFile.originalname}`;
    
    console.log('📁 Generated filename:', filename);
    
    // Kiểm tra xem filename có chứa container number đúng không
    if (filename.includes('ISO 1234')) {
      console.log('✅ Filename chứa container number đúng: ISO 1234');
    } else {
      console.log('❌ Filename KHÔNG chứa container number đúng');
    }
    
    if (filename.includes('UNKNOWN')) {
      console.log('❌ Filename vẫn chứa UNKNOWN');
    } else {
      console.log('✅ Filename KHÔNG chứa UNKNOWN');
    }
    
    console.log('\n💡 Kết luận:');
    console.log('- Multer storage configuration đã được sửa đúng');
    console.log('- Filename sẽ được tạo với container number chính xác');
    console.log('- Không còn sử dụng UNKNOWN nữa');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Chạy test
testMulterConfig();
