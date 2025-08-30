/**
 * Test script cho Request Status API
 * Kiểm tra các endpoints quản lý trạng thái hóa đơn và thanh toán
 */

const BASE_URL = 'http://localhost:3000';
const TEST_REQUEST_ID = 'test-request-id'; // Thay thế bằng ID thực tế

// Test data
const testData = {
  invoiceStatus: {
    has_invoice: true
  },
  paymentStatus: {
    is_paid: false
  },
  bothStatuses: {
    has_invoice: true,
    is_paid: true
  }
};

// Helper function để tạo headers
function createHeaders(token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// Test functions
async function testUpdateInvoiceStatus() {
  console.log('\n🧾 Testing Update Invoice Status...');
  
  try {
    const response = await fetch(`${BASE_URL}/requests/${TEST_REQUEST_ID}/invoice-status`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify(testData.invoiceStatus)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Update Invoice Status - SUCCESS');
      console.log('Response:', result);
    } else {
      console.log('❌ Update Invoice Status - FAILED');
      console.log('Error:', result);
    }
  } catch (error) {
    console.log('❌ Update Invoice Status - ERROR');
    console.log('Error:', error.message);
  }
}

async function testUpdatePaymentStatus() {
  console.log('\n💰 Testing Update Payment Status...');
  
  try {
    const response = await fetch(`${BASE_URL}/requests/${TEST_REQUEST_ID}/payment-status`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify(testData.paymentStatus)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Update Payment Status - SUCCESS');
      console.log('Response:', result);
    } else {
      console.log('❌ Update Payment Status - FAILED');
      console.log('Error:', result);
    }
  } catch (error) {
    console.log('❌ Update Payment Status - ERROR');
    console.log('Error:', error.message);
  }
}

async function testUpdateBothStatuses() {
  console.log('\n🔄 Testing Update Both Statuses...');
  
  try {
    const response = await fetch(`${BASE_URL}/requests/${TEST_REQUEST_ID}/both-statuses`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify(testData.bothStatuses)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Update Both Statuses - SUCCESS');
      console.log('Response:', result);
    } else {
      console.log('❌ Update Both Statuses - FAILED');
      console.log('Error:', result);
    }
  } catch (error) {
    console.log('❌ Update Both Statuses - ERROR');
    console.log('Error:', error.message);
  }
}

async function testSearchRequestsByStatus() {
  console.log('\n🔍 Testing Search Requests by Status...');
  
  try {
    const queryParams = new URLSearchParams({
      hasInvoice: 'true',
      isPaid: 'false',
      limit: '10',
      offset: '0'
    });
    
    const response = await fetch(`${BASE_URL}/requests/search/status?${queryParams}`, {
      method: 'GET',
      headers: createHeaders()
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Search Requests by Status - SUCCESS');
      console.log('Total requests:', result.data.total);
      console.log('Requests found:', result.data.requests.length);
    } else {
      console.log('❌ Search Requests by Status - FAILED');
      console.log('Error:', result);
    }
  } catch (error) {
    console.log('❌ Search Requests by Status - ERROR');
    console.log('Error:', error.message);
  }
}

async function testGetStatusStatistics() {
  console.log('\n📊 Testing Get Status Statistics...');
  
  try {
    const response = await fetch(`${BASE_URL}/requests/statistics/status`, {
      method: 'GET',
      headers: createHeaders()
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Get Status Statistics - SUCCESS');
      console.log('Total requests:', result.data.total);
      console.log('With invoice:', result.data.invoice_status.with_invoice);
      console.log('Without invoice:', result.data.invoice_status.without_invoice);
      console.log('Paid:', result.data.payment_status.paid);
      console.log('Unpaid:', result.data.payment_status.unpaid);
    } else {
      console.log('❌ Get Status Statistics - FAILED');
      console.log('Error:', result);
    }
  } catch (error) {
    console.log('❌ Get Status Statistics - ERROR');
    console.log('Error:', error.message);
  }
}

async function testAutoUpdateInvoiceStatus() {
  console.log('\n🤖 Testing Auto Update Invoice Status...');
  
  try {
    const response = await fetch(`${BASE_URL}/requests/${TEST_REQUEST_ID}/auto-update-invoice`, {
      method: 'POST',
      headers: createHeaders()
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Auto Update Invoice Status - SUCCESS');
      console.log('Response:', result);
    } else {
      console.log('❌ Auto Update Invoice Status - FAILED');
      console.log('Error:', result);
    }
  } catch (error) {
    console.log('❌ Auto Update Invoice Status - ERROR');
    console.log('Error:', error.message);
  }
}

async function testAutoUpdatePaymentStatus() {
  console.log('\n🤖 Testing Auto Update Payment Status...');
  
  try {
    const response = await fetch(`${BASE_URL}/requests/${TEST_REQUEST_ID}/auto-update-payment`, {
      method: 'POST',
      headers: createHeaders()
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Auto Update Payment Status - SUCCESS');
      console.log('Response:', result);
    } else {
      console.log('❌ Auto Update Payment Status - FAILED');
      console.log('Error:', result);
    }
  } catch (error) {
    console.log('❌ Auto Update Payment Status - ERROR');
    console.log('Error:', error.message);
  }
}

async function testGetRequestStatus() {
  console.log('\n📋 Testing Get Request Status...');
  
  try {
    const response = await fetch(`${BASE_URL}/requests/${TEST_REQUEST_ID}/status`, {
      method: 'GET',
      headers: createHeaders()
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Get Request Status - SUCCESS');
      console.log('Request ID:', result.data.id);
      console.log('Has Invoice:', result.data.has_invoice);
      console.log('Is Paid:', result.data.is_paid);
      console.log('Status:', result.data.status);
      console.log('Type:', result.data.type);
    } else {
      console.log('❌ Get Request Status - FAILED');
      console.log('Error:', result);
    }
  } catch (error) {
    console.log('❌ Get Request Status - ERROR');
    console.log('Error:', error.message);
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting Request Status API Tests...');
  console.log('=====================================');
  
  // Test các endpoints cập nhật
  await testUpdateInvoiceStatus();
  await testUpdatePaymentStatus();
  await testUpdateBothStatuses();
  
  // Test các endpoints tìm kiếm và thống kê
  await testSearchRequestsByStatus();
  await testGetStatusStatistics();
  
  // Test các endpoints tự động cập nhật
  await testAutoUpdateInvoiceStatus();
  await testAutoUpdatePaymentStatus();
  
  // Test endpoint lấy thông tin trạng thái
  await testGetRequestStatus();
  
  console.log('\n=====================================');
  console.log('✨ All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testUpdateInvoiceStatus,
  testUpdatePaymentStatus,
  testUpdateBothStatuses,
  testSearchRequestsByStatus,
  testGetStatusStatistics,
  testAutoUpdateInvoiceStatus,
  testAutoUpdatePaymentStatus,
  testGetRequestStatus
};
