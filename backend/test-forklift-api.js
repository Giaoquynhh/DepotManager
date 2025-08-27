const axios = require('axios');

const BASE_URL = 'http://localhost:5002';
const AUTH_TOKEN = 'your-auth-token-here'; // Thay thế bằng token thực

async function testForkliftAPI() {
  console.log('🧪 Testing Forklift API...\n');

  try {
    // Test 1: Lấy danh sách tasks
    console.log('1️⃣ Testing GET /forklift/tasks');
    const tasksResponse = await axios.get(`${BASE_URL}/forklift/tasks`, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
    });
    console.log('✅ Tasks loaded successfully');
    console.log(`📊 Found ${tasksResponse.data.length} tasks`);
    
    if (tasksResponse.data.length > 0) {
      const firstTask = tasksResponse.data[0];
      console.log('📋 Sample task structure:');
      console.log(`   - Container: ${firstTask.container_no}`);
      console.log(`   - Status: ${firstTask.status}`);
      console.log(`   - From slot: ${firstTask.from_slot?.code || 'N/A'}`);
      console.log(`   - To slot: ${firstTask.to_slot?.code || 'N/A'}`);
      
      if (firstTask.from_slot) {
        console.log('   - From slot details:');
        console.log(`     * Yard: ${firstTask.from_slot.block?.yard?.name}`);
        console.log(`     * Block: ${firstTask.from_slot.block?.code}`);
        console.log(`     * Slot: ${firstTask.from_slot.code}`);
        console.log(`     * Placements: ${firstTask.from_slot.placements?.length || 0}`);
      }
    }

    // Test 2: Lấy thông tin vị trí chi tiết (nếu có task)
    if (tasksResponse.data.length > 0) {
      const taskWithSlot = tasksResponse.data.find(t => t.from_slot_id || t.to_slot_id);
      if (taskWithSlot) {
        const slotId = taskWithSlot.from_slot_id || taskWithSlot.to_slot_id;
        console.log(`\n2️⃣ Testing GET /forklift/location/${slotId}`);
        
        try {
          const locationResponse = await axios.get(`${BASE_URL}/forklift/location/${slotId}`, {
            headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
          });
          console.log('✅ Location details loaded successfully');
          console.log('📍 Location structure:');
          console.log(`   - Slot code: ${locationResponse.data.code}`);
          console.log(`   - Block: ${locationResponse.data.block?.code}`);
          console.log(`   - Yard: ${locationResponse.data.block?.yard?.name}`);
          console.log(`   - Placements: ${locationResponse.data.placements?.length || 0}`);
        } catch (error) {
          console.log('❌ Location details failed:', error.response?.data?.message || error.message);
        }
      }
    }

    // Test 3: Test với status filter
    console.log('\n3️⃣ Testing GET /forklift/tasks?status=PENDING');
    try {
      const pendingResponse = await axios.get(`${BASE_URL}/forklift/tasks?status=PENDING`, {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
      });
      console.log(`✅ Pending tasks: ${pendingResponse.data.length}`);
    } catch (error) {
      console.log('❌ Status filter failed:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ API test failed:', error.response?.data?.message || error.message);
  }
}

// Chạy test nếu file được gọi trực tiếp
if (require.main === module) {
  testForkliftAPI();
}

module.exports = { testForkliftAPI };
