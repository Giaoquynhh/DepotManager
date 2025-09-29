const { PrismaClient } = require('@prisma/client');

async function checkIsPaid() {
  const prisma = new PrismaClient();
  
  try {
    const request = await prisma.serviceRequest.findFirst({
      where: { container_no: 'THEAN01' },
      select: {
        container_no: true,
        status: true,
        is_paid: true,
        repair_cost: true,
        invoice_number: true
      }
    });

    console.log('🔍 Kiểm tra THEAN01 payment:');
    console.log(`Container: ${request?.container_no}`);
    console.log(`Status: ${request?.status}`);
    console.log(`is_paid: ${request?.is_paid}`);
    console.log(`repair_cost: ${request?.repair_cost || 'NULL'}`);
    console.log(`invoice_number: ${request?.invoice_number || 'NULL'}`);
    
    console.log('\n📊 PHÂN TÍCH:');
    if (request?.is_paid) {
      console.log('✅ is_paid = TRUE → Frontend sẽ hiển thị "Đã thanh toán"');
      console.log('✅ Thanh toán đã được thực hiện thành công!');
    } else {
      console.log('❌ is_paid = FALSE → Frontend sẽ hiển thị "Chưa thanh toán"');
      console.log('❌ Có vấn đề với quá trình thanh toán');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkIsPaid();
