const axios = require('axios');

async function testAPI() {
  try {
    console.log('🔍 Testing API call...');
    
    // Đăng nhập để lấy token
    const loginResponse = await axios.post('http://localhost:1000/auth/login', {
      username: 'admin@smartlog.local',
      password: 'Admin@1234'
    });
    
    const token = loginResponse.data.access_token;
    console.log('✅ Login successful, token:', token.substring(0, 20) + '...');
    
    // Test API với token
    const apiResponse = await axios.get('http://localhost:1000/reports/containers', {
      params: {
        service_status: 'SYSTEM_ADMIN_ADDED',
        page: 1,
        pageSize: 10
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📦 API Response:');
    console.log('Total items:', apiResponse.data.total);
    console.log('Items found:', apiResponse.data.items.length);
    
    apiResponse.data.items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.container_no} - ${item.service_status} - ${item.data_source}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAPI();
