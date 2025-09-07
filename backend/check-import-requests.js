const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkImportRequests() {
  try {
    const requests = await prisma.serviceRequest.findMany({
      where: { 
        type: 'IMPORT'
      },
      select: { container_no: true, status: true, type: true }
    });
    
    console.log('Import requests:');
    console.log(requests);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImportRequests();

