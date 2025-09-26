const axios = require('axios');

const API_BASE = 'http://localhost:1000';

async function testUpdateContainer() {
  try {
    // 1. Login để lấy token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin@smartlog.local',
      password: 'Admin@1234'
    });
    
    console.log('🔍 Login response:', loginResponse.data);
    const token = loginResponse.data.token || loginResponse.data.access_token;
    console.log('✅ Login successful, token:', token ? token.substring(0, 20) + '...' : 'No token');
    
    // 2. Test update container
    console.log('🔄 Testing update container...');
    const updateResponse = await axios.put(`${API_BASE}/containers/ISO 2345`, {
      seal_number: 'TEST456',
      dem_det: '26/01/2025',
      container_quality: 'NEED_REPAIR'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Update response:', updateResponse.data);
    
  } catch (error) {
    console.error('❌ Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      stack: error.stack
    });
  }
}

testUpdateContainer();
