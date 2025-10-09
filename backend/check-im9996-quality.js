const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkIM9996Quality() {
  try {
    console.log('🔍 Kiểm tra container_quality của IM9996...\n');

    const containerNo = 'IM9996';

    // Kiểm tra Container table
    const container = await prisma.container.findUnique({
      where: { container_no: containerNo },
      select: { 
        container_no: true,
        container_quality: true,
        status: true
      }
    });

    if (container) {
      console.log('✅ Container IM9996:');
      console.log(`   - container_no: ${container.container_no}`);
      console.log(`   - container_quality: ${container.container_quality || 'NULL'}`);
      console.log(`   - status: ${container.status}`);
      
      if (container.container_quality === 'GOOD') {
        console.log('✅ Container có quality GOOD - sẽ xuất hiện trong gợi ý');
      } else if (container.container_quality === 'NEED_REPAIR') {
        console.log('❌ Container có quality NEED_REPAIR - sẽ KHÔNG xuất hiện trong gợi ý');
      } else {
        console.log('⚠️ Container không có container_quality - sẽ fallback về RepairTicket');
      }
    } else {
      console.log('❌ Container IM9996 không tìm thấy trong bảng Container');
    }

    // Kiểm tra RepairTicket
    const repairTicket = await prisma.repairTicket.findFirst({
      where: { container_no: containerNo },
      orderBy: { updatedAt: 'desc' }
    });

    if (repairTicket) {
      console.log('\n🔧 RepairTicket:');
      console.log(`   - status: ${repairTicket.status}`);
      console.log(`   - updatedAt: ${repairTicket.updatedAt}`);
    } else {
      console.log('\n❌ Không có RepairTicket');
    }

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkIM9996Quality();

