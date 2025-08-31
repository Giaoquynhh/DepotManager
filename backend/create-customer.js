const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Tạo customer thực tế
async function createCustomer() {
  console.log('🧪 Tạo customer thực tế...');
  
  try {
    // Tạo customer mới
    const customer = await prisma.customer.create({
      data: {
        name: 'Smartlog Container Company',
        tax_code: '0123456789',
        address: '123 Container Street, Ho Chi Minh City',
        contact_email: 'info@smartlog.com',
        status: 'ACTIVE'
      }
    });
    
    console.log('✅ Customer đã được tạo:', customer);
    
    // Cập nhật hóa đơn hiện có để sử dụng customer mới
    const updatedInvoice = await prisma.invoice.update({
      where: { id: 'cmeykxwn0000582al1o37iqrl' },
      data: {
        customer_id: customer.id
      }
    });
    
    console.log('✅ Hóa đơn đã được cập nhật:', updatedInvoice.id);
    
    // Kiểm tra kết quả
    const finalInvoice = await prisma.invoice.findUnique({
      where: { id: 'cmeykxwn0000582al1o37iqrl' },
      include: {
        serviceRequest: {
          select: {
            container_no: true,
            type: true,
            tenant_id: true
          }
        }
      }
    });
    
    console.log('\n🎯 Kết quả cuối cùng:');
    console.log(`  - Invoice ID: ${finalInvoice.id}`);
    console.log(`  - Customer ID: ${finalInvoice.customer_id}`);
    console.log(`  - Container: ${finalInvoice.serviceRequest?.container_no}`);
    console.log(`  - Tenant ID: ${finalInvoice.serviceRequest?.tenant_id}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
createCustomer();
