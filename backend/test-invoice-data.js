const Joi = require('joi');

// Test dữ liệu hóa đơn với validation schema
function testInvoiceData() {
  console.log('🧪 Test dữ liệu hóa đơn với validation schema...');
  
  try {
    // Import schema
    const { createInvoiceSchema, invoiceItemSchema } = require('./modules/finance/dto/FinanceDtos.ts');
    
    // Dữ liệu test từ frontend
    const testInvoiceData = {
      customer_id: 'default_customer',
      currency: 'VND',
      issue_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Hóa đơn cho container ISO 1234',
      source_module: 'REQUESTS',
      source_id: 'cmeyehmvv000tl402gqz077d7',
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
    
    console.log('📋 Test invoice data:');
    console.log(JSON.stringify(testInvoiceData, null, 2));
    
    // Test validation
    console.log('\n🔍 Testing validation...');
    const { error, value } = createInvoiceSchema.validate(testInvoiceData);
    
    if (error) {
      console.log('❌ Validation failed:');
      console.log('  - Message:', error.message);
      console.log('  - Details:', error.details);
      
      // Hiển thị chi tiết lỗi
      error.details.forEach((detail, index) => {
        console.log(`  - Error ${index + 1}:`);
        console.log(`    Path: ${detail.path.join('.')}`);
        console.log(`    Message: ${detail.message}`);
        console.log(`    Type: ${detail.type}`);
      });
    } else {
      console.log('✅ Validation passed!');
      console.log('  - Validated data:', value);
    }
    
    // Test từng item riêng lẻ
    console.log('\n🔍 Testing individual items...');
    testInvoiceData.items.forEach((item, index) => {
      console.log(`\n📦 Item ${index + 1}:`);
      const { error: itemError } = invoiceItemSchema.validate(item);
      if (itemError) {
        console.log(`❌ Item ${index + 1} validation failed:`, itemError.message);
      } else {
        console.log(`✅ Item ${index + 1} validation passed`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Chạy test
testInvoiceData();
