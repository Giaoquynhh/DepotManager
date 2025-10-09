// Test đơn giản không cần dependencies
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

async function testST55() {
  console.log('🔍 Testing ST55 API responses...\n');
  
  // Test 1: /containers API
  console.log('📋 1. Testing /containers API:');
  makeRequest('/containers?q=ST55&page=1&pageSize=10', (error, data) => {
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
        const st55Item = data.items.find(item => item.container_no === 'ST55');
        if (st55Item) {
          console.log('   ST55 found:');
          console.log('   - Container No:', st55Item.container_no);
          console.log('   - Container Quality:', st55Item.container_quality || 'NULL');
          console.log('   - Service Status:', st55Item.service_status);
        } else {
          console.log('   ❌ ST55 not found in containers response');
        }
      }
    }
    
    console.log('\n');
    
    // Test 2: /reports/containers API
    console.log('📋 2. Testing /reports/containers API:');
    makeRequest('/reports/containers?q=ST55&page=1&pageSize=10', (error, data) => {
      if (error) {
        console.log('❌ Error:', error.message);
      } else {
        console.log('✅ Reports API Response:');
        console.log('   Total items:', data.total || 0);
        console.log('   Items found:', data.items?.length || 0);
        
        if (data.items?.length > 0) {
          const st55Item = data.items.find(item => item.container_no === 'ST55');
          if (st55Item) {
            console.log('   ST55 found:');
            console.log('   - Container No:', st55Item.container_no);
            console.log('   - Container Quality:', st55Item.container_quality || 'NULL');
            console.log('   - Service Status:', st55Item.service_status);
          } else {
            console.log('   ❌ ST55 not found in reports response');
          }
        }
      }
      
      console.log('\n📊 Test completed!');
    });
  });
}

// Chạy test
testST55();
