const axios = require('axios');

async function testEIRAPI() {
  try {
    console.log('🧪 TEST EIR API ENDPOINT');
    console.log('=' .repeat(60));

    const requestId = 'cmgb09vee003n2rusdsph4s9s';
    const apiUrl = `http://localhost:5002/gate/requests/${requestId}/generate-eir`;

    console.log(`🔗 Testing API: ${apiUrl}`);

    const response = await axios.post(apiUrl, {}, {
      responseType: 'arraybuffer',
      headers: {
        'Authorization': 'Bearer your-jwt-token-here', // Cần token thực tế
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ API Response:');
    console.log(`   - Status: ${response.status}`);
    console.log(`   - Content-Type: ${response.headers['content-type']}`);
    console.log(`   - Content-Length: ${response.data.length} bytes`);

    // Lưu file để kiểm tra
    const fs = require('fs');
    const path = require('path');
    
    const outputDir = path.join(__dirname, 'uploads/generated-eir');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `EIR_API_TEST_${Date.now()}.xlsx`;
    const filePath = path.join(outputDir, filename);
    
    fs.writeFileSync(filePath, response.data);
    
    console.log(`📁 File saved: ${filePath}`);
    console.log('✅ API test completed successfully!');

  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
  }
}

testEIRAPI();

