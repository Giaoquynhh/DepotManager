const fs = require('fs');
const path = require('path');

// Test script để kiểm tra workflow tạo hóa đơn mới
console.log('=== Test Invoice Creation Workflow ===');

// Test data cho container ISO 1234
const testContainerData = {
  id: 'container_123',
  container_no: 'ISO 1234',
  customer_id: 'customer_123',
  type: 'IMPORT',
  status: 'CHECKED',
  estimated_cost: 1100000,
  has_invoice: false
};

// Test data cho hóa đơn
const testInvoiceData = {
  customer_id: 'customer_123',
  currency: 'VND',
  issue_date: new Date().toISOString(),
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  notes: 'Hóa đơn cho container ISO 1234',
  items: [
    {
      service_code: 'REPAIR',
      description: 'Chi phí sửa chữa container',
      qty: 1,
      unit_price: 1100000,
      tax_rate: 10
    },
    {
      service_code: 'LOLO',
      description: 'Chi phí xe nâng (LOLO)',
      qty: 1,
      unit_price: 1000000,
      tax_rate: 10
    }
  ]
};

console.log('\n📊 Test Container Data:');
console.log('Container No:', testContainerData.container_no);
console.log('Customer ID:', testContainerData.customer_id);
console.log('Estimated Cost:', testContainerData.estimated_cost.toLocaleString('vi-VN'), 'VND');
console.log('Has Invoice:', testContainerData.has_invoice);

console.log('\n📋 Test Invoice Data:');
console.log('Customer ID:', testInvoiceData.customer_id);
console.log('Currency:', testInvoiceData.currency);
console.log('Items count:', testInvoiceData.items.length);

// Tính toán chi phí
const subtotal = testInvoiceData.items.reduce((sum, item) => {
  return sum + (item.unit_price * item.qty);
}, 0);

const taxAmount = testInvoiceData.items.reduce((sum, item) => {
  return sum + ((item.unit_price * item.qty * item.tax_rate) / 100);
}, 0);

const totalAmount = subtotal + taxAmount;

console.log('\n💰 Cost Calculation:');
console.log('Subtotal:', subtotal.toLocaleString('vi-VN'), 'VND');
console.log('Tax Amount (10%):', taxAmount.toLocaleString('vi-VN'), 'VND');
console.log('Total Amount:', totalAmount.toLocaleString('vi-VN'), 'VND');

// Test workflow
console.log('\n🔄 Test Workflow:');
console.log('1. Click "Hoàn tất" trong modal');
console.log('2. Gọi API POST /finance/invoices');
console.log('3. Nếu thành công → Cập nhật has_invoice = true');
console.log('4. Hiển thị thông báo "Tạo hóa đơn thành công!"');
console.log('5. Đóng modal và refresh trang');
console.log('6. Container bị xóa khỏi danh sách (has_invoice = true)');

// Test API endpoints
console.log('\n🌐 Test API Endpoints:');
console.log('1. POST /finance/invoices - Tạo hóa đơn');
console.log('2. PATCH /finance/requests/:id/invoice-status - Cập nhật has_invoice');

// Test curl commands
console.log('\n📝 Test with curl:');
console.log('# 1. Tạo hóa đơn:');
console.log(`curl -X POST http://localhost:5002/finance/invoices \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <JWT_TOKEN>" \\
  -d '${JSON.stringify(testInvoiceData)}'`);

console.log('\n# 2. Cập nhật has_invoice:');
console.log(`curl -X PATCH http://localhost:5002/finance/requests/${testContainerData.id}/invoice-status \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <JWT_TOKEN>" \\
  -d '{"has_invoice": true}'`);

// Test error scenarios
console.log('\n❌ Test Error Scenarios:');
console.log('1. 400 - Dữ liệu hóa đơn không hợp lệ');
console.log('2. 401 - Không có quyền tạo hóa đơn');
console.log('3. 500 - Lỗi server');

console.log('\n✅ Test script completed!');
console.log('💡 Hãy chạy các lệnh curl trên để test tính năng tạo hóa đơn');
console.log('🔍 Kiểm tra console để xem debug logs từ handleCreateInvoice');
console.log('🎯 Container sẽ bị xóa khỏi danh sách sau khi tạo hóa đơn thành công');
