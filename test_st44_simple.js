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

async function testST44() {
  console.log('🔍 Testing ST44 API responses...\n');
  
  // Test 1: /containers API
  console.log('📋 1. Testing /containers API:');
  makeRequest('/containers?q=ST44&page=1&pageSize=10', (error, data) => {
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
        const st44Item = data.items.find(item => item.container_no === 'ST44');
        if (st44Item) {
          console.log('   ST44 found:');
          console.log('   - Container No:', st44Item.container_no);
          console.log('   - Container Quality:', st44Item.container_quality || 'NULL');
          console.log('   - Service Status:', st44Item.service_status);
          console.log('   - Data Source:', st44Item.data_source);
          console.log('   - Yard Name:', st44Item.yard_name);
          console.log('   - Block Code:', st44Item.block_code);
          console.log('   - Slot Code:', st44Item.slot_code);
        } else {
          console.log('   ❌ ST44 not found in containers response');
          console.log('   Available containers:', data.items.map(item => item.container_no));
        }
      }
    }
    
    console.log('\n');
    
    // Test 2: /reports/containers API
    console.log('📋 2. Testing /reports/containers API:');
    makeRequest('/reports/containers?q=ST44&page=1&pageSize=10', (error, data) => {
      if (error) {
        console.log('❌ Error:', error.message);
      } else {
        console.log('✅ Reports API Response:');
        console.log('   Total items:', data.total || 0);
        console.log('   Items found:', data.items?.length || 0);
        
        if (data.items?.length > 0) {
          const st44Item = data.items.find(item => item.container_no === 'ST44');
          if (st44Item) {
            console.log('   ST44 found:');
            console.log('   - Container No:', st44Item.container_no);
            console.log('   - Container Quality:', st44Item.container_quality || 'NULL');
            console.log('   - Service Status:', st44Item.service_status);
            console.log('   - Data Source:', st44Item.data_source);
            console.log('   - Yard Name:', st44Item.yard_name);
            console.log('   - Block Code:', st44Item.block_code);
            console.log('   - Slot Code:', st44Item.slot_code);
          } else {
            console.log('   ❌ ST44 not found in reports response');
            console.log('   Available containers:', data.items.map(item => item.container_no));
          }
        }
      }
      
      console.log('\n');
      
      // Test 3: Test với query rộng hơn
      console.log('📋 3. Testing with broader query (ST):');
      makeRequest('/containers?q=ST&page=1&pageSize=20', (error, data) => {
        if (error) {
          console.log('❌ Error:', error.message);
        } else {
          console.log('✅ Broader query response:');
          console.log('   Total items:', data.total || 0);
          console.log('   Items found:', data.items?.length || 0);
          
          if (data.items?.length > 0) {
            const stContainers = data.items.filter(item => item.container_no.startsWith('ST'));
            console.log('   ST containers found:', stContainers.length);
            console.log('   ST container numbers:', stContainers.map(item => item.container_no));
            
            const st44Item = stContainers.find(item => item.container_no === 'ST44');
            if (st44Item) {
              console.log('   ✅ ST44 found in broader query:');
              console.log('   - Container Quality:', st44Item.container_quality || 'NULL');
              console.log('   - Service Status:', st44Item.service_status);
            }
          }
        }
        
        console.log('\n📊 Test completed!');
      });
    });
  });
}

// Chạy test
testST44();
