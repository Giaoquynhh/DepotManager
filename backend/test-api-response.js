const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test API response của getContainersNeedInvoice
async function testAPIResponse() {
  console.log('🧪 Test API response của getContainersNeedInvoice...');
  
  try {
    // 1. Kiểm tra ServiceRequest với status IN_YARD, IN_CAR, GATE_OUT
    console.log('\n📋 1. Kiểm tra ServiceRequest với status IN_YARD, IN_CAR, GATE_OUT:');
    const allContainers = await prisma.serviceRequest.findMany({
      where: {
        status: {
          in: ['IN_YARD', 'IN_CAR', 'GATE_OUT']
        }
      },
      select: {
        id: true,
        container_no: true,
        type: true,
        status: true,
        has_invoice: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('📦 Tất cả containers với status phù hợp:', allContainers.length);
    allContainers.forEach(container => {
      console.log(`  - ${container.container_no} (${container.type}) - Status: ${container.status}, has_invoice: ${container.has_invoice}`);
    });

    // 2. Kiểm tra filter has_invoice = false
    console.log('\n🔍 2. Kiểm tra filter has_invoice = false:');
    const filteredContainers = allContainers.filter(container => !container.has_invoice);
    
    console.log('📦 Containers sau khi filter has_invoice = false:', filteredContainers.length);
    filteredContainers.forEach(container => {
      console.log(`  - ${container.container_no} (${container.type}) - Status: ${container.status}, has_invoice: ${container.has_invoice}`);
    });

    // 3. Kiểm tra ServiceRequest có has_invoice = true
    console.log('\n✅ 3. Kiểm tra ServiceRequest có has_invoice = true:');
    const containersWithInvoice = await prisma.serviceRequest.findMany({
      where: {
        has_invoice: true
      },
      select: {
        id: true,
        container_no: true,
        type: true,
        status: true,
        has_invoice: true
      }
    });
    
    console.log('📦 Containers có hóa đơn:', containersWithInvoice.length);
    containersWithInvoice.forEach(container => {
      console.log(`  - ${container.container_no} (${container.type}) - Status: ${container.status}, has_invoice: ${container.has_invoice}`);
    });

    // 4. So sánh kết quả
    console.log('\n📊 4. So sánh kết quả:');
    console.log(`  - Tổng containers với status phù hợp: ${allContainers.length}`);
    console.log(`  - Containers có has_invoice = true: ${containersWithInvoice.length}`);
    console.log(`  - Containers cần tạo hóa đơn (sau filter): ${filteredContainers.length}`);
    
    // 5. Kiểm tra xem có container nào bị duplicate không
    const containerNos = allContainers.map(c => c.container_no).filter(Boolean);
    const uniqueContainerNos = [...new Set(containerNos)];
    
    console.log(`  - Unique container numbers: ${uniqueContainerNos.length}`);
    if (containerNos.length !== uniqueContainerNos.length) {
      console.log('⚠️  Có container bị duplicate!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy test
testAPIResponse();
