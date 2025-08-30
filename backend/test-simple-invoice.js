const axios = require('axios');

// Test API tạo hóa đơn và cập nhật has_invoice
async function testInvoiceCreation() {
  console.log('🧪 Test API tạo hóa đơn và cập nhật has_invoice...');
  
  try {
    // 1. Test tạo hóa đơn
    console.log('\n📋 1. Test tạo hóa đơn...');
    
    const invoiceData = {
      customer_id: 'default_customer',
      currency: 'VND',
      issue_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Test hóa đơn',
      items: [
        {
          service_code: 'REPAIR',
          description: 'Chi phí sửa chữa container',
          qty: 1,
          unit_price: 1000000,
          tax_rate: 10
        }
      ]
    };
    
    console.log('📤 Invoice data:', JSON.stringify(invoiceData, null, 2));
    
    const invoiceResponse = await axios.post(
      'http://localhost:5002/finance/invoices',
      invoiceData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_JWT_TOKEN' // Thay thế bằng token thực
        }
      }
    );
    
    console.log('✅ Invoice created successfully!');
    console.log('✅ Response status:', invoiceResponse.status);
    console.log('✅ Invoice ID:', invoiceResponse.data.id);
    
    // 2. Test cập nhật has_invoice
    console.log('\n🔄 2. Test cập nhật has_invoice...');
    
    // Lấy một ServiceRequest ID thực tế từ database
    const requestId = 'test_request_id'; // Thay thế bằng ID thực
    
    const updateData = {
      has_invoice: true
    };
    
    console.log('📤 Update data:', updateData);
    console.log('🔗 URL:', `http://localhost:5002/finance/requests/${requestId}/invoice-status`);
    
    const updateResponse = await axios.patch(
      `http://localhost:5002/finance/requests/${requestId}/invoice-status`,
      updateData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_JWT_TOKEN' // Thay thế bằng token thực
        }
      }
    );
    
    console.log('✅ has_invoice updated successfully!');
    console.log('✅ Response status:', updateResponse.status);
    console.log('✅ Response data:', updateResponse.data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
  }
}

// Chạy test
testInvoiceCreation();
