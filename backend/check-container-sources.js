const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkContainerSources() {
  try {
    const containers = ['Fill123', 'SO111', 'SS111'];
    
    for (const containerNo of containers) {
      console.log(`\n🔍 Checking container: ${containerNo}`);
      
      // Kiểm tra ServiceRequest
      const serviceRequest = await prisma.serviceRequest.findFirst({
        where: { container_no: containerNo },
        orderBy: { createdAt: 'desc' }
      });
      
      // Kiểm tra RepairTicket
      const repairTicket = await prisma.repairTicket.findFirst({
        where: { container_no: containerNo },
        orderBy: { updatedAt: 'desc' }
      });
      
      // Kiểm tra YardPlacement
      const yardPlacement = await prisma.yardPlacement.findFirst({
        where: { 
          container_no: containerNo,
          status: 'OCCUPIED',
          removed_at: null
        }
      });
      
      console.log(`  ServiceRequest: ${serviceRequest ? `Yes (${serviceRequest.status})` : 'No'}`);
      console.log(`  RepairTicket: ${repairTicket ? `Yes (${repairTicket.status})` : 'No'}`);
      console.log(`  YardPlacement: ${yardPlacement ? 'Yes' : 'No'}`);
      
      if (serviceRequest) {
        console.log(`    ServiceRequest details:`, {
          id: serviceRequest.id,
          status: serviceRequest.status,
          createdAt: serviceRequest.createdAt
        });
      }
      
      if (yardPlacement) {
        console.log(`    YardPlacement details:`, {
          id: yardPlacement.id,
          status: yardPlacement.status,
          placed_at: yardPlacement.placed_at
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkContainerSources();

