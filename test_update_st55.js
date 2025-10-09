const axios = require('axios');

async function testUpdateST55() {
  try {
    console.log('🔍 Testing update container ST55...\n');
    
    // Test data
    const containerNo = 'ST55';
    const updateData = {
      container_quality: 'NEED_REPAIR'
    };
    
    console.log('📋 Update data:', updateData);
    
    // Gọi API update (cần token authentication)
    const response = await axios.put(`http://localhost:1000/containers/${containerNo}`, updateData, {
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE' // Cần token thực tế
      }
    });
    
    console.log('✅ API Response:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Cần authentication token. Hãy:');
      console.log('1. Đăng nhập vào hệ thống');
      console.log('2. Lấy token từ browser DevTools');
      console.log('3. Thêm vào header Authorization');
    }
  }
}

// Chạy test
testUpdateST55();
