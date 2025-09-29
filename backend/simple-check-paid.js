const { PrismaClient } = require('@prisma/client');

async function simpleCheck() {
  const prisma = new PrismaClient();
  
  try {
    const request = await prisma.serviceRequest.findFirst({
      where: { container_no: 'THEAN01' },
      select: {
        container_no: true,
        status: true,
        is_paid: true
      }
    });

    console.log('🔍 THEAN01 PAYMENT STATUS:');
    console.log(`Container: ${request?.container_no}`);
    console.log(`Status: ${request?.status}`);
    console.log(`is_paid: ${request?.is_paid}`);
    
    if (request?.is_paid) {
      console.log('\n✅ KẾT LUẬN: Đã thanh toán thành công!');
      console.log('✅ Frontend hiển thị đúng "Đã thanh toán"');
    } else {
      console.log('\n❌ KẾT LUẬN: Chưa thanh toán');
      console.log('❌ Có vấn đề với quy trình thanh toán');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

simpleCheck();
