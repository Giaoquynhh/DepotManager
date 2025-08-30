const axios = require('axios');

// Test API cập nhật has_invoice
async function testInvoiceStatusUpdate() {
  console.log('🧪 Test API cập nhật has_invoice...');
  
  try {
    // Test data
    const testData = {
      has_invoice: true
    };
    
    // Test với một request ID thực tế (thay thế bằng ID thực)
    const requestId = 'test_request_id'; // Thay thế bằng ID thực
    
    console.log('📤 Request data:', testData);
    console.log('🔗 URL:', `http://localhost:5002/finance/requests/${requestId}/invoice-status`);
    
    // Gọi API
    const response = await axios.patch(
      `http://localhost:5002/finance/requests/${requestId}/invoice-status`,
      testData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_JWT_TOKEN' // Thay thế bằng token thực
        }
      }
    );
    
    console.log('✅ Response status:', response.status);
    console.log('✅ Response data:', response.data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
  }
}

// Chạy test
testInvoiceStatusUpdate();
