const fs = require('fs');
const path = require('path');

// Test script để kiểm tra tính năng tạo hóa đơn
console.log('=== Test Create Invoice Feature ===');

// Kiểm tra cấu trúc thư mục
const projectRoot = __dirname;
const uploadsDir = path.join(projectRoot, 'uploads');

console.log('📁 Project root:', projectRoot);
console.log('📁 Uploads directory:', uploadsDir);

// Kiểm tra thư mục uploads
if (fs.existsSync(uploadsDir)) {
  console.log('✅ Uploads directory exists');
  const files = fs.readdirSync(uploadsDir);
  console.log('📁 Files in uploads:', files);
} else {
  console.log('❌ Uploads directory does not exist');
}

// Test data cho hóa đơn
const testInvoiceData = {
  customer_id: 'test_customer_123',
  currency: 'VND',
  issue_date: new Date().toISOString(),
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  notes: 'Test invoice for container ISO 9999',
  items: [
    {
      service_code: 'REPAIR',
      description: 'Chi phí sửa chữa container',
      qty: 1,
      unit_price: 500000,
      tax_rate: 10
    },
    {
      service_code: 'LOLO',
      description: 'Chi phí xe nâng (LOLO)',
      qty: 1,
      unit_price: 300000,
      tax_rate: 10
    }
  ]
};

console.log('\n📋 Test Invoice Data:');
console.log(JSON.stringify(testInvoiceData, null, 2));

// Test API endpoints
console.log('\n🌐 Test API Endpoints:');
console.log('1. POST /finance/invoices - Tạo hóa đơn');
console.log('2. PATCH /finance/requests/:id/invoice-status - Cập nhật has_invoice');
console.log('3. POST /finance/upload/eir - Upload EIR file');

// Test curl commands
console.log('\n📝 Test with curl:');
console.log('# 1. Tạo hóa đơn:');
console.log(`curl -X POST http://localhost:5002/finance/invoices \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <JWT_TOKEN>" \\
  -d '${JSON.stringify(testInvoiceData)}'`);

console.log('\n# 2. Cập nhật has_invoice:');
console.log(`curl -X PATCH http://localhost:5002/finance/requests/<request_id>/invoice-status \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <JWT_TOKEN>" \\
  -d '{"has_invoice": true}'`);

console.log('\n# 3. Upload EIR file:');
console.log(`curl -X POST http://localhost:5002/finance/upload/eir \\
  -F "file=@test-eir.pdf" \\
  -F "container_no=ISO9999" \\
  -H "Authorization: Bearer <JWT_TOKEN>"`);

console.log('\n✅ Test script completed!');
console.log('💡 Hãy chạy các lệnh curl trên để test tính năng');
