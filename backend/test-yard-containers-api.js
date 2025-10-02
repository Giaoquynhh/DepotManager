/**
 * Script test API mới: /containers/yard/by-shipping-line/:shipping_line_id
 * Test việc lấy containers trong yard theo shipping line với điều kiện:
 * - EMPTY_IN_YARD (SystemAdmin thêm)
 * - GATE_OUT với type IMPORT
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Thông tin test
const TEST_SHIPPING_LINE_ID = 'your-shipping-line-id'; // Thay bằng ID thực tế
const TEST_SEARCH_QUERY = 'CONT'; // Tìm kiếm container có chứa "CONT"

async function testYardContainersAPI() {
  try {
    console.log('🧪 Testing Yard Containers API...\n');

    // Test 1: Lấy tất cả containers trong yard theo shipping line
    console.log('📋 Test 1: Lấy tất cả containers trong yard theo shipping line');
    console.log(`GET /containers/yard/by-shipping-line/${TEST_SHIPPING_LINE_ID}`);
    
    const response1 = await axios.get(`${BASE_URL}/containers/yard/by-shipping-line/${TEST_SHIPPING_LINE_ID}`, {
      headers: {
        'Authorization': 'Bearer your-token-here' // Thay bằng token thực tế
      }
    });

    console.log('✅ Response:', {
      success: response1.data.success,
      total: response1.data.total,
      containers: response1.data.data?.length || 0
    });

    if (response1.data.data && response1.data.data.length > 0) {
      console.log('📦 Sample container:', {
        container_no: response1.data.data[0].container_no,
        service_status: response1.data.data[0].service_status,
        request_type: response1.data.data[0].request_type,
        yard_location: `${response1.data.data[0].yard_name} - ${response1.data.data[0].block_code}-${response1.data.data[0].slot_code}`
      });
    }

    console.log('\n');

    // Test 2: Tìm kiếm containers với query
    console.log('🔍 Test 2: Tìm kiếm containers với query');
    console.log(`GET /containers/yard/by-shipping-line/${TEST_SHIPPING_LINE_ID}?q=${TEST_SEARCH_QUERY}`);
    
    const response2 = await axios.get(`${BASE_URL}/containers/yard/by-shipping-line/${TEST_SHIPPING_LINE_ID}`, {
      params: { q: TEST_SEARCH_QUERY },
      headers: {
        'Authorization': 'Bearer your-token-here' // Thay bằng token thực tế
      }
    });

    console.log('✅ Search Response:', {
      success: response2.data.success,
      total: response2.data.total,
      containers: response2.data.data?.length || 0
    });

    console.log('\n');

    // Test 3: Kiểm tra điều kiện lọc
    console.log('🎯 Test 3: Kiểm tra điều kiện lọc');
    if (response1.data.data && response1.data.data.length > 0) {
      const containers = response1.data.data;
      
      const emptyInYard = containers.filter(c => c.service_status === 'EMPTY_IN_YARD');
      const gateOutImport = containers.filter(c => c.service_status === 'GATE_OUT' && c.request_type === 'IMPORT');
      
      console.log(`📊 Phân loại containers:`);
      console.log(`   - EMPTY_IN_YARD: ${emptyInYard.length} containers`);
      console.log(`   - GATE_OUT (IMPORT): ${gateOutImport.length} containers`);
      console.log(`   - Tổng cộng: ${containers.length} containers`);
      
      // Kiểm tra tất cả containers đều thuộc 2 loại này
      const validContainers = containers.filter(c => 
        (c.service_status === 'EMPTY_IN_YARD') || 
        (c.service_status === 'GATE_OUT' && c.request_type === 'IMPORT')
      );
      
      if (validContainers.length === containers.length) {
        console.log('✅ Tất cả containers đều thỏa mãn điều kiện lọc');
      } else {
        console.log('❌ Có containers không thỏa mãn điều kiện lọc');
      }
    }

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Chạy test
if (require.main === module) {
  console.log('⚠️  Lưu ý: Cần cập nhật TEST_SHIPPING_LINE_ID và Authorization token trước khi chạy test\n');
  
  // Uncomment dòng dưới để chạy test
  // testYardContainersAPI();
  
  console.log('Để chạy test, hãy:');
  console.log('1. Cập nhật TEST_SHIPPING_LINE_ID với ID shipping line thực tế');
  console.log('2. Cập nhật Authorization token');
  console.log('3. Uncomment dòng testYardContainersAPI()');
  console.log('4. Chạy: node test-yard-containers-api.js');
}

module.exports = { testYardContainersAPI };
