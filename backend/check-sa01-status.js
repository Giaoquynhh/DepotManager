/**
 * Kiểm tra status của SA01
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSA01Status() {
  try {
    console.log('🔍 Kiểm tra status của SA01...');
    
    const sa01Requests = await prisma.serviceRequest.findMany({
      where: { container_no: 'SA01' },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('SA01 ServiceRequests:');
    sa01Requests.forEach((sr, index) => {
      console.log(`${index + 1}. ${sr.type} - ${sr.status} (${sr.createdAt})`);
    });
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy kiểm tra
if (require.main === module) {
  checkSA01Status();
}
