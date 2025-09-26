const axios = require('axios');

const API_BASE = 'http://localhost:1000';

async function testUpdateStatus() {
  try {
    // 1. Login để lấy token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin@smartlog.local',
      password: 'Admin@1234'
    });
    
    const token = loginResponse.data.access_token;
    console.log('✅ Login successful');
    
    // 2. Kiểm tra trạng thái hiện tại
    console.log('🔍 Checking current status...');
    const containersResponse = await axios.get(`${API_BASE}/reports/containers?q=ISO 2345&pageSize=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const container = containersResponse.data.items[0];
    console.log('📦 Current container status:', {
      container_no: container.container_no,
      repair_checked: container.repair_checked,
      repair_ticket_status: container.repair_ticket?.status
    });
    
    // 3. Cập nhật container_quality thành GOOD
    console.log('🔄 Updating container_quality to GOOD...');
    const updateResponse = await axios.put(`${API_BASE}/containers/ISO 2345`, {
      container_quality: 'GOOD'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Update response:', updateResponse.data);
    
    // 4. Kiểm tra trạng thái sau khi cập nhật
    console.log('🔍 Checking status after update...');
    const containersResponse2 = await axios.get(`${API_BASE}/reports/containers?q=ISO 2345&pageSize=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const container2 = containersResponse2.data.items[0];
    console.log('📦 Container status after update:', {
      container_no: container2.container_no,
      repair_checked: container2.repair_checked,
      repair_ticket_status: container2.repair_ticket?.status
    });
    
  } catch (error) {
    console.error('❌ Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testUpdateStatus();
