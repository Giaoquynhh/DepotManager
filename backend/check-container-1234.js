const { PrismaClient } = require('@prisma/client');

// Kiểm tra container ISO 1234 trong database
async function checkContainer1234() {
  console.log('🔍 Kiểm tra container ISO 1234 trong database...\n');
  
  try {
    const prisma = new PrismaClient();
    
    // Tìm tất cả requests với container_no = "ISO 1234"
    console.log('📦 Tìm requests với container_no = "ISO 1234"...');
    const requests = await prisma.serviceRequest.findMany({
      where: { container_no: 'ISO 1234' },
      select: { 
        id: true, 
        container_no: true, 
        type: true, 
        status: true, 
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log(`✅ Tìm thấy ${requests.length} requests với container_no = "ISO 1234":`);
    requests.forEach((req, index) => {
      console.log(`  ${index + 1}. ID: ${req.id}`);
      console.log(`     Container: ${req.container_no}`);
      console.log(`     Type: ${req.type}`);
      console.log(`     Status: ${req.status}`);
      console.log(`     Created: ${req.createdAt}`);
      console.log(`     Updated: ${req.updatedAt}`);
      console.log('');
    });
    
    // Kiểm tra EIR documents
    console.log('\n📁 Kiểm tra EIR documents...');
    const eirDocs = await prisma.documentFile.findMany({
      where: { type: 'EIR' },
      include: {
        request: {
          select: { container_no: true, type: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ Tìm thấy ${eirDocs.length} EIR documents:`);
    eirDocs.forEach((doc, index) => {
      console.log(`  ${index + 1}. ID: ${doc.id}`);
      console.log(`     Name: ${doc.name}`);
      console.log(`     Storage Key: ${doc.storage_key}`);
      console.log(`     Container: ${doc.request?.container_no || 'N/A'}`);
      console.log(`     Request Type: ${doc.request?.type || 'N/A'}`);
      console.log(`     Request Status: ${doc.request?.status || 'N/A'}`);
      console.log(`     Created: ${doc.createdAt}`);
      console.log('');
    });
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Chạy kiểm tra
checkContainer1234();
