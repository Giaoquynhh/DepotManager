const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkContainerST55() {
  try {
    console.log('🔍 Kiểm tra container ST55...\n');
    
    // 1. Kiểm tra Container table
    console.log('📋 1. Kiểm tra Container table:');
    const container = await prisma.container.findFirst({
      where: { container_no: 'ST55' },
      select: {
        id: true,
        container_no: true,
        container_quality: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (container) {
      console.log('✅ Container ST55 found in Container table:');
      console.log(`   - ID: ${container.id}`);
      console.log(`   - Container No: ${container.container_no}`);
      console.log(`   - Container Quality: ${container.container_quality || 'NULL'}`);
      console.log(`   - Status: ${container.status}`);
      console.log(`   - Created: ${container.createdAt}`);
      console.log(`   - Updated: ${container.updatedAt}`);
    } else {
      console.log('❌ Container ST55 NOT found in Container table');
    }
    
    console.log('\n');
    
    // 2. Kiểm tra ServiceRequest table
    console.log('📋 2. Kiểm tra ServiceRequest table:');
    const serviceRequests = await prisma.serviceRequest.findMany({
      where: { container_no: 'ST55' },
      select: {
        id: true,
        container_no: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (serviceRequests.length > 0) {
      console.log(`✅ Found ${serviceRequests.length} ServiceRequest(s) for ST55:`);
      serviceRequests.forEach((req, index) => {
        console.log(`   ${index + 1}. ID: ${req.id}`);
        console.log(`      - Type: ${req.type}`);
        console.log(`      - Status: ${req.status}`);
        console.log(`      - Created: ${req.createdAt}`);
        console.log(`      - Updated: ${req.updatedAt}`);
      });
    } else {
      console.log('❌ No ServiceRequest found for ST55');
    }
    
    console.log('\n');
    
    // 3. Kiểm tra RepairTicket table
    console.log('📋 3. Kiểm tra RepairTicket table:');
    const repairTickets = await prisma.repairTicket.findMany({
      where: { container_no: 'ST55' },
      select: {
        id: true,
        code: true,
        container_no: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (repairTickets.length > 0) {
      console.log(`✅ Found ${repairTickets.length} RepairTicket(s) for ST55:`);
      repairTickets.forEach((ticket, index) => {
        console.log(`   ${index + 1}. ID: ${ticket.id}`);
        console.log(`      - Code: ${ticket.code}`);
        console.log(`      - Status: ${ticket.status}`);
        console.log(`      - Created: ${ticket.createdAt}`);
        console.log(`      - Updated: ${ticket.updatedAt}`);
      });
    } else {
      console.log('❌ No RepairTicket found for ST55');
    }
    
    console.log('\n');
    
    // 4. Kiểm tra YardPlacement table
    console.log('📋 4. Kiểm tra YardPlacement table:');
    const yardPlacements = await prisma.yardPlacement.findMany({
      where: { container_no: 'ST55' },
      select: {
        id: true,
        container_no: true,
        status: true,
        placed_at: true,
        removed_at: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (yardPlacements.length > 0) {
      console.log(`✅ Found ${yardPlacements.length} YardPlacement(s) for ST55:`);
      yardPlacements.forEach((placement, index) => {
        console.log(`   ${index + 1}. ID: ${placement.id}`);
        console.log(`      - Status: ${placement.status}`);
        console.log(`      - Placed: ${placement.placed_at}`);
        console.log(`      - Removed: ${placement.removed_at || 'NULL'}`);
        console.log(`      - Created: ${placement.createdAt}`);
        console.log(`      - Updated: ${placement.updatedAt}`);
      });
    } else {
      console.log('❌ No YardPlacement found for ST55');
    }
    
    console.log('\n');
    
    // 5. Tổng kết
    console.log('📊 TỔNG KẾT:');
    console.log(`   - Container Quality: ${container?.container_quality || 'NULL'}`);
    console.log(`   - Latest ServiceRequest Status: ${serviceRequests[0]?.status || 'NONE'}`);
    console.log(`   - Latest RepairTicket Status: ${repairTickets[0]?.status || 'NONE'}`);
    console.log(`   - Latest YardPlacement Status: ${yardPlacements[0]?.status || 'NONE'}`);
    
    if (container?.container_quality === 'NEED_REPAIR') {
      console.log('✅ Container quality đã được lưu đúng: NEED_REPAIR');
    } else if (container?.container_quality === 'GOOD') {
      console.log('⚠️ Container quality hiển thị: GOOD (có thể chưa được cập nhật)');
    } else {
      console.log('❌ Container quality: NULL (chưa được set)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy function
checkContainerST55();
