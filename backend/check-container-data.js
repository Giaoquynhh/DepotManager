const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkContainerData() {
  try {
    console.log('=== Kiểm tra dữ liệu Container ===');
    
    // Lấy tất cả containers
    const containers = await prisma.container.findMany({
      include: {
        customer: {
          select: { name: true, code: true }
        },
        shipping_line: {
          select: { name: true, code: true }
        },
        container_type: {
          select: { code: true, description: true }
        }
      }
    });
    
    console.log(`Tổng số containers: ${containers.length}`);
    
    containers.forEach(container => {
      console.log(`\nContainer: ${container.container_no}`);
      console.log(`  - Customer: ${container.customer?.name || 'NULL'}`);
      console.log(`  - Shipping Line: ${container.shipping_line?.name || 'NULL'}`);
      console.log(`  - Container Type: ${container.container_type?.code || 'NULL'}`);
      console.log(`  - Seal Number: ${container.seal_number || 'NULL'}`);
      console.log(`  - DEM/DET: ${container.dem_det || 'NULL'}`);
    });
    
    // Kiểm tra ServiceRequests
    console.log('\n=== Kiểm tra ServiceRequests ===');
    const requests = await prisma.serviceRequest.findMany({
      where: {
        container_no: { not: null }
      },
      include: {
        customer: {
          select: { name: true, code: true }
        },
        shipping_line: {
          select: { name: true, code: true }
        },
        container_type: {
          select: { code: true, description: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`Tổng số ServiceRequests: ${requests.length}`);
    
    requests.forEach(request => {
      console.log(`\nRequest: ${request.container_no}`);
      console.log(`  - Customer: ${request.customer?.name || 'NULL'}`);
      console.log(`  - Shipping Line: ${request.shipping_line?.name || 'NULL'}`);
      console.log(`  - Container Type: ${request.container_type?.code || 'NULL'}`);
      console.log(`  - Status: ${request.status}`);
    });
    
  } catch (error) {
    console.error('Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkContainerData();

