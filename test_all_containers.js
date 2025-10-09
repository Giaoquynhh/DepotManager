// Test tất cả containers trong hệ thống
const http = require('http');

function makeRequest(path, callback) {
  const options = {
    hostname: 'localhost',
    port: 1000,
    path: path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        callback(null, jsonData);
      } catch (error) {
        callback(error, data);
      }
    });
  });

  req.on('error', (error) => {
    callback(error, null);
  });

  req.end();
}

async function testAllContainers() {
  console.log('🔍 Testing all containers in system...\n');
  
  // Test 1: Lấy tất cả containers
  console.log('📋 1. Testing /containers API (no filter):');
  makeRequest('/containers?page=1&pageSize=50', (error, data) => {
    if (error) {
      console.log('❌ Error:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.log('💡 Server không chạy trên port 1000');
      }
    } else {
      console.log('✅ Containers API Response:');
      console.log('   Total items:', data.total || 0);
      console.log('   Items found:', data.items?.length || 0);
      
      if (data.items?.length > 0) {
        console.log('   First 10 containers:');
        data.items.slice(0, 10).forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.container_no} - ${item.service_status} - Quality: ${item.container_quality || 'NULL'}`);
        });
        
        // Tìm containers có chứa "ST"
        const stContainers = data.items.filter(item => item.container_no.includes('ST'));
        console.log(`\n   ST containers found: ${stContainers.length}`);
        if (stContainers.length > 0) {
          stContainers.forEach(item => {
            console.log(`   - ${item.container_no}: ${item.service_status} - Quality: ${item.container_quality || 'NULL'}`);
          });
        }
      }
    }
    
    console.log('\n');
    
    // Test 2: Lấy tất cả containers từ reports API
    console.log('📋 2. Testing /reports/containers API (no filter):');
    makeRequest('/reports/containers?page=1&pageSize=50', (error, data) => {
      if (error) {
        console.log('❌ Error:', error.message);
      } else {
        console.log('✅ Reports API Response:');
        console.log('   Total items:', data.total || 0);
        console.log('   Items found:', data.items?.length || 0);
        
        if (data.items?.length > 0) {
          console.log('   First 10 containers:');
          data.items.slice(0, 10).forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.container_no} - ${item.service_status} - Quality: ${item.container_quality || 'NULL'}`);
          });
          
          // Tìm containers có chứa "ST"
          const stContainers = data.items.filter(item => item.container_no.includes('ST'));
          console.log(`\n   ST containers found: ${stContainers.length}`);
          if (stContainers.length > 0) {
            stContainers.forEach(item => {
              console.log(`   - ${item.container_no}: ${item.service_status} - Quality: ${item.container_quality || 'NULL'}`);
            });
          }
        }
      }
      
      console.log('\n📊 Test completed!');
    });
  });
}

// Chạy test
testAllContainers();
