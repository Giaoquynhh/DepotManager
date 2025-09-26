const axios = require('axios');

async function testAPIDetailed() {
  try {
    console.log('🔍 Testing API call with detailed params...');
    
    // Đăng nhập để lấy token
    const loginResponse = await axios.post('http://localhost:1000/auth/login', {
      username: 'admin@smartlog.local',
      password: 'Admin@1234'
    });
    
    const token = loginResponse.data.access_token;
    console.log('✅ Login successful, token:', token.substring(0, 20) + '...');
    
    // Test API với params giống như frontend
    const params = {
      service_status: 'SYSTEM_ADMIN_ADDED',
      page: 1,
      pageSize: 200
    };
    
    console.log('📋 Testing with params:', params);
    
    const apiResponse = await axios.get('http://localhost:1000/reports/containers', {
      params: params,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📦 API Response:');
    console.log('Total items:', apiResponse.data.total);
    console.log('Items found:', apiResponse.data.items.length);
    
    apiResponse.data.items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.container_no} - ${item.service_status} - ${item.data_source}`);
    });
    
  } catch (error) {
    console.error('❌ Error Details:');
    console.error('Message:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', error.response?.data);
    console.error('Request Config:', {
      url: error.config?.url,
      method: error.config?.method,
      params: error.config?.params,
      headers: error.config?.headers
    });
  }
}

testAPIDetailed();
