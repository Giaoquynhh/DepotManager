// Test chi tiết cho ST44 - SystemAdmin added container
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

async function testST44Detailed() {
  console.log('🔍 Testing ST44 (SystemAdmin added, EMPTY_IN_YARD)...\n');
  
  // Test 1: Kiểm tra với filter service_status = SYSTEM_ADMIN_ADDED
  console.log('📋 1. Testing /containers API with SYSTEM_ADMIN_ADDED filter:');
  makeRequest('/containers?service_status=SYSTEM_ADMIN_ADDED&page=1&pageSize=50', (error, data) => {
    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ SYSTEM_ADMIN_ADDED containers:');
      console.log('   Total items:', data.total || 0);
      console.log('   Items found:', data.items?.length || 0);
      
      if (data.items?.length > 0) {
        const st44Item = data.items.find(item => item.container_no === 'ST44');
        if (st44Item) {
          console.log('   ✅ ST44 found in SYSTEM_ADMIN_ADDED:');
          console.log('   - Container No:', st44Item.container_no);
          console.log('   - Container Quality:', st44Item.container_quality || 'NULL');
          console.log('   - Service Status:', st44Item.service_status);
          console.log('   - Data Source:', st44Item.data_source);
          console.log('   - Yard Name:', st44Item.yard_name);
          console.log('   - Block Code:', st44Item.block_code);
          console.log('   - Slot Code:', st44Item.slot_code);
        } else {
          console.log('   ❌ ST44 not found in SYSTEM_ADMIN_ADDED');
          console.log('   Available SYSTEM_ADMIN_ADDED containers:', data.items.map(item => item.container_no));
        }
      }
    }
    
    console.log('\n');
    
    // Test 2: Kiểm tra với filter status = EMPTY_IN_YARD
    console.log('📋 2. Testing /containers API with EMPTY_IN_YARD filter:');
    makeRequest('/containers?status=EMPTY_IN_YARD&page=1&pageSize=50', (error, data) => {
      if (error) {
        console.log('❌ Error:', error.message);
      } else {
        console.log('✅ EMPTY_IN_YARD containers:');
        console.log('   Total items:', data.total || 0);
        console.log('   Items found:', data.items?.length || 0);
        
        if (data.items?.length > 0) {
          const st44Item = data.items.find(item => item.container_no === 'ST44');
          if (st44Item) {
            console.log('   ✅ ST44 found in EMPTY_IN_YARD:');
            console.log('   - Container No:', st44Item.container_no);
            console.log('   - Container Quality:', st44Item.container_quality || 'NULL');
            console.log('   - Service Status:', st44Item.service_status);
            console.log('   - Data Source:', st44Item.data_source);
          } else {
            console.log('   ❌ ST44 not found in EMPTY_IN_YARD');
            console.log('   Available EMPTY_IN_YARD containers:', data.items.map(item => item.container_no));
          }
        }
      }
      
      console.log('\n');
      
      // Test 3: Kiểm tra reports API với filter tương tự
      console.log('📋 3. Testing /reports/containers API with SYSTEM_ADMIN_ADDED filter:');
      makeRequest('/reports/containers?service_status=SYSTEM_ADMIN_ADDED&page=1&pageSize=50', (error, data) => {
        if (error) {
          console.log('❌ Error:', error.message);
        } else {
          console.log('✅ Reports API - SYSTEM_ADMIN_ADDED containers:');
          console.log('   Total items:', data.total || 0);
          console.log('   Items found:', data.items?.length || 0);
          
          if (data.items?.length > 0) {
            const st44Item = data.items.find(item => item.container_no === 'ST44');
            if (st44Item) {
              console.log('   ✅ ST44 found in reports SYSTEM_ADMIN_ADDED:');
              console.log('   - Container No:', st44Item.container_no);
              console.log('   - Container Quality:', st44Item.container_quality || 'NULL');
              console.log('   - Service Status:', st44Item.service_status);
              console.log('   - Data Source:', st44Item.data_source);
            } else {
              console.log('   ❌ ST44 not found in reports SYSTEM_ADMIN_ADDED');
              console.log('   Available containers:', data.items.map(item => item.container_no));
            }
          }
        }
        
        console.log('\n');
        
        // Test 4: Kiểm tra với query rộng hơn
        console.log('📋 4. Testing with broader query (all containers):');
        makeRequest('/containers?page=1&pageSize=100', (error, data) => {
          if (error) {
            console.log('❌ Error:', error.message);
          } else {
            console.log('✅ All containers:');
            console.log('   Total items:', data.total || 0);
            console.log('   Items found:', data.items?.length || 0);
            
            if (data.items?.length > 0) {
              // Tìm containers có chứa "ST"
              const stContainers = data.items.filter(item => item.container_no.includes('ST'));
              console.log(`\n   ST containers found: ${stContainers.length}`);
              if (stContainers.length > 0) {
                stContainers.forEach(item => {
                  console.log(`   - ${item.container_no}: ${item.service_status} - Quality: ${item.container_quality || 'NULL'} - Source: ${item.data_source}`);
                });
              }
              
              // Tìm ST44 cụ thể
              const st44Item = data.items.find(item => item.container_no === 'ST44');
              if (st44Item) {
                console.log('\n   ✅ ST44 found in all containers:');
                console.log('   - Container Quality:', st44Item.container_quality || 'NULL');
                console.log('   - Service Status:', st44Item.service_status);
                console.log('   - Data Source:', st44Item.data_source);
              } else {
                console.log('\n   ❌ ST44 not found in all containers');
              }
            }
          }
          
          console.log('\n📊 Test completed!');
        });
      });
    });
  });
}

// Chạy test
testST44Detailed();
