const axios = require('axios');

// Test API cập nhật trạng thái thanh toán
async function testPaymentStatusAPI() {
  try {
    console.log('🧪 Testing Payment Status API...');
    
    // Test 1: Cập nhật trạng thái thanh toán
    console.log('\n📝 Test 1: Cập nhật trạng thái thanh toán');
    
    const updateResponse = await axios.patch('http://localhost:5002/requests/test-request-id/payment-status', {
      is_paid: true
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('✅ Update Payment Status Response:', updateResponse.data);
    
    // Test 2: Lấy thông tin trạng thái request
    console.log('\n📊 Test 2: Lấy thông tin trạng thái request');
    
    const statusResponse = await axios.get('http://localhost:5002/requests/test-request-id/status', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('✅ Get Request Status Response:', statusResponse.data);
    
    // Test 3: Tìm kiếm requests theo trạng thái
    console.log('\n🔍 Test 3: Tìm kiếm requests theo trạng thái');
    
    const searchResponse = await axios.get('http://localhost:5002/requests/search/status?is_paid=true', {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('✅ Search Requests Response:', searchResponse.data);
    
  } catch (error) {
    console.error('❌ Error testing Payment Status API:', error.response?.data || error.message);
  }
}

// Test API cập nhật trạng thái hóa đơn
async function testInvoiceStatusAPI() {
  try {
    console.log('\n🧪 Testing Invoice Status API...');
    
    // Test 1: Cập nhật trạng thái hóa đơn
    console.log('\n📝 Test 1: Cập nhật trạng thái hóa đơn');
    
    const updateResponse = await axios.patch('http://localhost:5002/requests/test-request-id/invoice-status', {
      has_invoice: true
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('✅ Update Invoice Status Response:', updateResponse.data);
    
  } catch (error) {
    console.error('❌ Error testing Invoice Status API:', error.response?.data || error.message);
  }
}

// Test API cập nhật cả hai trạng thái
async function testBothStatusesAPI() {
  try {
    console.log('\n🧪 Testing Both Statuses API...');
    
    // Test: Cập nhật cả hai trạng thái cùng lúc
    console.log('\n📝 Test: Cập nhật cả hai trạng thái cùng lúc');
    
    const updateResponse = await axios.patch('http://localhost:5002/requests/test-request-id/both-statuses', {
      has_invoice: true,
      is_paid: false
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('✅ Update Both Statuses Response:', updateResponse.data);
    
  } catch (error) {
    console.error('❌ Error testing Both Statuses API:', error.response?.data || error.message);
  }
}

// Chạy tất cả tests
async function runAllTests() {
  console.log('🚀 Starting Payment Status API Tests...\n');
  
  await testPaymentStatusAPI();
  await testInvoiceStatusAPI();
  await testBothStatusesAPI();
  
  console.log('\n✨ All tests completed!');
}

// Chạy tests nếu file được execute trực tiếp
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testPaymentStatusAPI,
  testInvoiceStatusAPI,
  testBothStatusesAPI,
  runAllTests
};
