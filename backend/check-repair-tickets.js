const axios = require('axios');

const API_BASE = 'http://localhost:1000';

async function checkRepairTickets() {
  try {
    // 1. Login để lấy token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin@smartlog.local',
      password: 'Admin@1234'
    });
    
    const token = loginResponse.data.access_token;
    console.log('✅ Login successful');
    
    // 2. Kiểm tra RepairTicket cho container ISO 2345
    console.log('🔍 Checking RepairTickets for ISO 2345...');
    
    // Gọi API để lấy danh sách containers
    const containersResponse = await axios.get(`${API_BASE}/reports/containers?q=ISO 2345&pageSize=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📦 Container data:', JSON.stringify(containersResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

checkRepairTickets();
