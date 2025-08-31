const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test kiểm tra database trực tiếp
async function testDatabaseDirect() {
  console.log('🧪 Test database trực tiếp...');
  
  try {
    // 1. Kiểm tra ServiceRequest có has_invoice field
    console.log('\n📋 1. Kiểm tra ServiceRequest schema...');
    
    const serviceRequest = await prisma.serviceRequest.findFirst({
      select: {
        id: true,
        container_no: true,
        has_invoice: true,
        is_paid: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log('✅ ServiceRequest sample:', serviceRequest);
    
    // 2. Kiểm tra Invoice
    console.log('\n📋 2. Kiểm tra Invoice...');
    
    const invoices = await prisma.invoice.findMany({
      take: 5,
      select: {
        id: true,
        customer_id: true,
        total_amount: true,
        status: true,
        source_id: true,
        createdAt: true
      }
    });
    
    console.log('✅ Invoices:', invoices);
    
    // 3. Test update has_invoice trực tiếp
    console.log('\n🔄 3. Test update has_invoice trực tiếp...');
    
    if (serviceRequest) {
      const updatedRequest = await prisma.serviceRequest.update({
        where: { id: serviceRequest.id },
        data: {
          has_invoice: true,
          updatedAt: new Date()
        }
      });
      
      console.log('✅ Updated ServiceRequest:', updatedRequest);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('❌ Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy test
testDatabaseDirect();
