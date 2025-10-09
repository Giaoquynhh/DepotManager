// Kiểm tra trực tiếp database để tìm ST44
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseDirect() {
  try {
    console.log('🔍 Checking database directly for ST44...\n');
    
    // 1. Kiểm tra Container table
    console.log('📋 1. Container table:');
    const container = await prisma.container.findFirst({
      where: { container_no: 'ST44' },
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
      console.log('✅ ST44 found in Container table:');
      console.log(`   - ID: ${container.id}`);
      console.log(`   - Container No: ${container.container_no}`);
      console.log(`   - Container Quality: ${container.container_quality || 'NULL'}`);
      console.log(`   - Status: ${container.status}`);
      console.log(`   - Created: ${container.createdAt}`);
      console.log(`   - Updated: ${container.updatedAt}`);
    } else {
      console.log('❌ ST44 NOT found in Container table');
    }
    
    console.log('\n');
    
    // 2. Kiểm tra YardPlacement table
    console.log('📋 2. YardPlacement table:');
    const yardPlacements = await prisma.yardPlacement.findMany({
      where: { container_no: 'ST44' },
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
      console.log(`✅ Found ${yardPlacements.length} YardPlacement(s) for ST44:`);
      yardPlacements.forEach((placement, index) => {
        console.log(`   ${index + 1}. ID: ${placement.id}`);
        console.log(`      - Status: ${placement.status}`);
        console.log(`      - Placed: ${placement.placed_at}`);
        console.log(`      - Removed: ${placement.removed_at || 'NULL'}`);
        console.log(`      - Created: ${placement.createdAt}`);
        console.log(`      - Updated: ${placement.updatedAt}`);
      });
    } else {
      console.log('❌ No YardPlacement found for ST44');
    }
    
    console.log('\n');
    
    // 3. Kiểm tra ServiceRequest table
    console.log('📋 3. ServiceRequest table:');
    const serviceRequests = await prisma.serviceRequest.findMany({
      where: { container_no: 'ST44' },
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
      console.log(`✅ Found ${serviceRequests.length} ServiceRequest(s) for ST44:`);
      serviceRequests.forEach((req, index) => {
        console.log(`   ${index + 1}. ID: ${req.id}`);
        console.log(`      - Type: ${req.type}`);
        console.log(`      - Status: ${req.status}`);
        console.log(`      - Created: ${req.createdAt}`);
        console.log(`      - Updated: ${req.updatedAt}`);
      });
    } else {
      console.log('❌ No ServiceRequest found for ST44');
    }
    
    console.log('\n');
    
    // 4. Kiểm tra RepairTicket table
    console.log('📋 4. RepairTicket table:');
    const repairTickets = await prisma.repairTicket.findMany({
      where: { container_no: 'ST44' },
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
      console.log(`✅ Found ${repairTickets.length} RepairTicket(s) for ST44:`);
      repairTickets.forEach((ticket, index) => {
        console.log(`   ${index + 1}. ID: ${ticket.id}`);
        console.log(`      - Code: ${ticket.code}`);
        console.log(`      - Status: ${ticket.status}`);
        console.log(`      - Created: ${ticket.createdAt}`);
        console.log(`      - Updated: ${ticket.updatedAt}`);
      });
    } else {
      console.log('❌ No RepairTicket found for ST44');
    }
    
    console.log('\n');
    
    // 5. Kiểm tra tổng số records trong các bảng
    console.log('📋 5. Total records in tables:');
    const containerCount = await prisma.container.count();
    const yardPlacementCount = await prisma.yardPlacement.count();
    const serviceRequestCount = await prisma.serviceRequest.count();
    const repairTicketCount = await prisma.repairTicket.count();
    
    console.log(`   - Container: ${containerCount} records`);
    console.log(`   - YardPlacement: ${yardPlacementCount} records`);
    console.log(`   - ServiceRequest: ${serviceRequestCount} records`);
    console.log(`   - RepairTicket: ${repairTicketCount} records`);
    
    // 6. Lấy một vài records mẫu
    console.log('\n📋 6. Sample records:');
    
    const sampleContainers = await prisma.container.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: { container_no: true, container_quality: true, status: true }
    });
    console.log('   Sample containers:', sampleContainers);
    
    const sampleYardPlacements = await prisma.yardPlacement.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: { container_no: true, status: true, removed_at: true }
    });
    console.log('   Sample yard placements:', sampleYardPlacements);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy function
checkDatabaseDirect();
