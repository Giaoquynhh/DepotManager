const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test thông tin khách hàng và tenant_id
async function testCustomerInfo() {
  console.log('🧪 Test thông tin khách hàng và tenant_id...');
  
  try {
    // 1. Kiểm tra hóa đơn hiện có
    console.log('\n📄 1. Kiểm tra hóa đơn hiện có:');
    const invoices = await prisma.invoice.findMany({
      select: {
        id: true,
        customer_id: true,
        source_module: true,
        source_id: true,
        total_amount: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('📋 Hóa đơn hiện có:', invoices.length);
    invoices.forEach(invoice => {
      console.log(`  - ID: ${invoice.id}, Customer: ${invoice.customer_id}, Source: ${invoice.source_module}/${invoice.source_id}, Amount: ${invoice.total_amount}`);
    });

    // 2. Kiểm tra thông tin ServiceRequest
    console.log('\n📦 2. Kiểm tra thông tin ServiceRequest:');
    const serviceRequests = await prisma.serviceRequest.findMany({
      where: {
        has_invoice: true
      },
      select: {
        id: true,
        container_no: true,
        type: true,
        tenant_id: true,
        has_invoice: true
      }
    });
    
    console.log('📦 ServiceRequest có hóa đơn:', serviceRequests.length);
    serviceRequests.forEach(sr => {
      console.log(`  - ${sr.container_no} (${sr.type}) - Tenant ID: ${sr.tenant_id}, has_invoice: ${sr.has_invoice}`);
    });

    // 3. Kiểm tra thông tin Customer
    console.log('\n👤 3. Kiểm tra thông tin Customer:');
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        tax_code: true
      }
    });
    
    console.log('👤 Customers:', customers.length);
    customers.forEach(customer => {
      console.log(`  - ID: ${customer.id}, Name: ${customer.name}, Tax Code: ${customer.tax_code}`);
    });

    // 4. Kiểm tra mối quan hệ giữa Invoice, ServiceRequest và Customer
    console.log('\n🔗 4. Kiểm tra mối quan hệ:');
    for (const invoice of invoices) {
      if (invoice.source_module === 'REQUESTS' && invoice.source_id) {
        const serviceRequest = await prisma.serviceRequest.findUnique({
          where: { id: invoice.source_id },
          select: {
            container_no: true,
            type: true,
            tenant_id: true
          }
        });
        
        const customer = await prisma.customer.findUnique({
          where: { id: invoice.customer_id },
          select: {
            name: true,
            tax_code: true
          }
        });
        
        console.log(`  📄 Invoice ${invoice.id}:`);
        console.log(`    - Container: ${serviceRequest?.container_no} (${serviceRequest?.type})`);
        console.log(`    - Tenant ID: ${serviceRequest?.tenant_id}`);
        console.log(`    - Customer: ${customer?.name} (${customer?.tax_code})`);
        console.log(`    - Amount: ${invoice.total_amount}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy test
testCustomerInfo();
