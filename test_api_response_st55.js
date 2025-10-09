const axios = require('axios');

async function testAPIResponseST55() {
  try {
    console.log('🔍 Testing API response for ST55...\n');
    
    // Test 1: Kiểm tra API containers
    console.log('📋 1. Testing /containers API:');
    const containersResponse = await axios.get('http://localhost:1000/containers', {
      params: {
        q: 'ST55',
        page: 1,
        pageSize: 10
      }
    });
    
    console.log('✅ Containers API Response:');
    console.log('   Total items:', containersResponse.data.total);
    console.log('   Items found:', containersResponse.data.items?.length || 0);
    
    if (containersResponse.data.items?.length > 0) {
      const st55Item = containersResponse.data.items.find(item => item.container_no === 'ST55');
      if (st55Item) {
        console.log('   ST55 found in response:');
        console.log('   - Container No:', st55Item.container_no);
        console.log('   - Container Quality:', st55Item.container_quality || 'NULL');
        console.log('   - Service Status:', st55Item.service_status);
        console.log('   - Data Source:', st55Item.data_source);
      } else {
        console.log('   ❌ ST55 not found in containers response');
      }
    }
    
    console.log('\n');
    
    // Test 2: Kiểm tra API reports/containers
    console.log('📋 2. Testing /reports/containers API:');
    const reportsResponse = await axios.get('http://localhost:1000/reports/containers', {
      params: {
        q: 'ST55',
        page: 1,
        pageSize: 10
      }
    });
    
    console.log('✅ Reports API Response:');
    console.log('   Total items:', reportsResponse.data.total);
    console.log('   Items found:', reportsResponse.data.items?.length || 0);
    
    if (reportsResponse.data.items?.length > 0) {
      const st55Item = reportsResponse.data.items.find(item => item.container_no === 'ST55');
      if (st55Item) {
        console.log('   ST55 found in reports response:');
        console.log('   - Container No:', st55Item.container_no);
        console.log('   - Container Quality:', st55Item.container_quality || 'NULL');
        console.log('   - Service Status:', st55Item.service_status);
        console.log('   - Data Source:', st55Item.data_source);
      } else {
        console.log('   ❌ ST55 not found in reports response');
      }
    }
    
    console.log('\n');
    
    // Test 3: So sánh 2 API responses
    console.log('📋 3. Comparing API responses:');
    const containersST55 = containersResponse.data.items?.find(item => item.container_no === 'ST55');
    const reportsST55 = reportsResponse.data.items?.find(item => item.container_no === 'ST55');
    
    if (containersST55 && reportsST55) {
      console.log('   Both APIs found ST55:');
      console.log('   - Containers API quality:', containersST55.container_quality || 'NULL');
      console.log('   - Reports API quality:', reportsST55.container_quality || 'NULL');
      console.log('   - Match:', containersST55.container_quality === reportsST55.container_quality ? '✅' : '❌');
    } else {
      console.log('   ❌ ST55 not found in one or both APIs');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Server không chạy. Hãy:');
      console.log('1. Khởi động backend server: npm run dev');
      console.log('2. Chạy lại test này');
    }
  }
}

// Chạy test
testAPIResponseST55();
