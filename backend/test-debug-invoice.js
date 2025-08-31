// Test debug API cập nhật has_invoice sử dụng fetch
async function testDebugInvoiceStatus() {
  console.log('🧪 Debug API cập nhật has_invoice...');
  
  try {
    // Test data
    const testData = {
      has_invoice: true
    };
    
    // Sử dụng request ID thực tế từ log
    const requestId = 'cmeyehmvv000tl402gqz077d7';
    
    console.log('📤 Request data:', testData);
    console.log('🔗 URL:', `http://localhost:1000/finance/requests/${requestId}/invoice-status`);
    
    // Gọi API sử dụng fetch - sửa port từ 5002 thành 1000
    const response = await fetch(
      `http://localhost:1000/finance/requests/${requestId}/invoice-status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJjbWV5ZWZoN3gwMDA0bDQwMmV0ZG00azhxIiwiZW1haWwiOiJzYUBnbWFpbC5jb20iLCJyb2xlIjoiU2FsZUFkbWluIiwic3RhdHVzIjoiQUNUSVZFIiwiaWF0IjoxNzU2NTc0Njc3LCJleHAiOjE3NTY2NjEwNzd9.jbPxi6-0LARzG9iFtEyU1qkWBvd57AsvmpvEc45RRrk'
        },
        body: JSON.stringify(testData)
      }
    );
    
    console.log('✅ Response status:', response.status);
    console.log('✅ Response headers:', response.headers);
    
    const responseData = await response.text();
    console.log('✅ Response data:', responseData);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Chạy test
testDebugInvoiceStatus();
