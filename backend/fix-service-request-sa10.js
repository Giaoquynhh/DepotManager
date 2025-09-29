const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixServiceRequestSA10() {
  try {
    console.log('🔧 Sửa ServiceRequest cho Container SA10 - Chuyển từ IMPORT sang EXPORT...');
    console.log('=' .repeat(60));

    // 1. Tìm ServiceRequest hiện tại
    const currentRequest = await prisma.serviceRequest.findFirst({
      where: { container_no: 'SA10' },
      orderBy: { createdAt: 'desc' }
    });

    if (!currentRequest) {
      console.log('❌ Không tìm thấy ServiceRequest cho SA10');
      return;
    }

    console.log('📋 ServiceRequest hiện tại:');
    console.log(`   - ID: ${currentRequest.id}`);
    console.log(`   - Loại: ${currentRequest.type} (SAI - cần chuyển sang EXPORT)`);
    console.log(`   - Trạng thái: ${currentRequest.status}`);

    // 2. Cập nhật ServiceRequest từ IMPORT sang EXPORT
    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: currentRequest.id },
      data: {
        type: 'EXPORT', // Chuyển từ IMPORT sang EXPORT
        history: {
          ...(currentRequest.history || {}),
          corrected_by_system: {
            previous_type: 'IMPORT',
            new_type: 'EXPORT',
            reason: 'Container được thêm trực tiếp vào bãi từ SystemAdmin là EXPORT (NÂNG)',
            corrected_at: new Date().toISOString(),
            corrected_by: 'SYSTEM_FIX'
          }
        }
      }
    });

    console.log('✅ Đã cập nhật ServiceRequest:');
    console.log(`   - ID: ${updatedRequest.id}`);
    console.log(`   - Loại: ${updatedRequest.type} (EXPORT - NÂNG)`);
    console.log(`   - Trạng thái: ${updatedRequest.status}`);
    console.log(`   - Ngày cập nhật: ${updatedRequest.updatedAt}`);

    console.log('\n🎉 HOÀN THÀNH: Container SA10 bây giờ có đúng loại dịch vụ EXPORT (NÂNG)!');

  } catch (error) {
    console.error('❌ Lỗi khi sửa ServiceRequest:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Sửa ServiceRequest cho SA10
fixServiceRequestSA10();

