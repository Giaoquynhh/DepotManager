/**
 * Script cập nhật container SA01 để test API
 * Thay đổi status từ IN_YARD thành GATE_OUT để có thể nâng
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateSA01ForTest() {
  try {
    console.log('🔧 Cập nhật container SA01 để test...\n');

    const containerNo = 'SA01';

    // 1. Tìm ServiceRequest mới nhất của SA01
    const latestSR = await prisma.serviceRequest.findFirst({
      where: { container_no: containerNo },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestSR) {
      console.log('❌ Không tìm thấy ServiceRequest cho SA01');
      return;
    }

    console.log('📋 ServiceRequest hiện tại:');
    console.log({
      id: latestSR.id,
      container_no: latestSR.container_no,
      type: latestSR.type,
      status: latestSR.status,
      shipping_line_id: latestSR.shipping_line_id
    });

    // 2. Cập nhật status thành GATE_OUT để có thể nâng
    console.log('\n🔄 Cập nhật status thành GATE_OUT...');
    
    const updatedSR = await prisma.serviceRequest.update({
      where: { id: latestSR.id },
      data: {
        status: 'GATE_OUT',
        updatedAt: new Date()
      }
    });

    console.log('✅ Đã cập nhật thành công:');
    console.log({
      id: updatedSR.id,
      container_no: updatedSR.container_no,
      type: updatedSR.type,
      status: updatedSR.status,
      shipping_line_id: updatedSR.shipping_line_id
    });

    // 3. Kiểm tra lại điều kiện
    console.log('\n🏗️ Kiểm tra lại điều kiện có thể nâng:');
    
    if (updatedSR.status === 'GATE_OUT' && updatedSR.type === 'IMPORT') {
      console.log('✅ Container SA01 BÂY GIỜ CÓ THỂ NÂNG!');
      console.log('   - Điều kiện: GATE_OUT + IMPORT ✓');
      console.log(`   - Shipping line ID: ${updatedSR.shipping_line_id}`);
      
      console.log('\n🧪 Test API bằng cách gọi:');
      console.log(`GET /containers/yard/by-shipping-line/${updatedSR.shipping_line_id}`);
      console.log(`GET /containers/yard/by-shipping-line/${updatedSR.shipping_line_id}?q=SA01`);
    }

    console.log('\n🎉 Cập nhật hoàn tất!');

  } catch (error) {
    console.error('❌ Lỗi khi cập nhật:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy cập nhật
if (require.main === module) {
  updateSA01ForTest();
}

module.exports = { updateSA01ForTest };
