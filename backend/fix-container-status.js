const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixContainerStatus(containerNo) {
  try {
    console.log(`🔧 Đang sửa trạng thái container: ${containerNo}`);
    console.log('=' .repeat(60));

    // 1. Kiểm tra ServiceRequest hiện tại
    const currentRequest = await prisma.serviceRequest.findFirst({
      where: { container_no: containerNo },
      orderBy: { createdAt: 'desc' }
    });

    if (!currentRequest) {
      console.log('❌ Không tìm thấy ServiceRequest cho container này');
      return;
    }

    console.log(`📋 Trạng thái hiện tại: ${currentRequest.status}`);
    console.log(`📋 Loại dịch vụ: ${currentRequest.type}`);

    // 2. Kiểm tra vị trí trong YardSlot
    const yardSlot = await prisma.yardSlot.findFirst({
      where: { occupant_container_no: containerNo },
      include: { 
        block: { 
          include: { 
            yard: true 
          } 
        } 
      }
    });

    if (!yardSlot) {
      console.log('❌ Container không có vị trí trong YardSlot');
      return;
    }

    console.log(`📍 Vị trí hiện tại: ${yardSlot.block?.yard?.name || 'N/A'} - ${yardSlot.block?.code || 'N/A'} - ${yardSlot.code || 'N/A'}`);

    // 3. Nếu container có vị trí trong yard nhưng status là GATE_OUT, cần chuyển về IN_YARD
    if (currentRequest.status === 'GATE_OUT' && yardSlot) {
      console.log('\n🔄 Container đã được hạ xuống bãi nhưng trạng thái vẫn là GATE_OUT');
      console.log('   → Cần chuyển trạng thái về IN_YARD');

      const currentTime = new Date();
      
      // Cập nhật ServiceRequest
      const updatedRequest = await prisma.serviceRequest.update({
        where: { id: currentRequest.id },
        data: {
          status: 'IN_YARD',
          history: {
            ...(currentRequest.history || {}),
            container_placed: {
              previous_status: currentRequest.status,
              placed_at: currentTime.toISOString(),
              placed_by: 'SYSTEM_FIX',
              yard: yardSlot.block?.yard?.name || 'N/A',
              block: yardSlot.block?.code || 'N/A',
              slot: yardSlot.code || 'N/A',
              reason: 'Container đã được hạ xuống bãi, cập nhật trạng thái từ GATE_OUT về IN_YARD'
            }
          }
        }
      });

      console.log('✅ Đã cập nhật ServiceRequest:');
      console.log(`   - Trạng thái mới: ${updatedRequest.status}`);
      console.log(`   - Ngày cập nhật: ${updatedRequest.updatedAt}`);

      // 4. Cập nhật YardSlot để đảm bảo trạng thái đúng
      const updatedSlot = await prisma.yardSlot.update({
        where: { id: yardSlot.id },
        data: {
          status: 'OCCUPIED',
          occupant_container_no: containerNo
        }
      });

      console.log('✅ Đã cập nhật YardSlot:');
      console.log(`   - Trạng thái slot: ${updatedSlot.status}`);
      console.log(`   - Container: ${updatedSlot.occupant_container_no}`);

      console.log('\n🎉 HOÀN THÀNH: Container đã được chuyển về trạng thái IN_YARD');
      
    } else if (currentRequest.status === 'IN_YARD') {
      console.log('✅ Container đã ở trạng thái IN_YARD, không cần sửa');
    } else {
      console.log(`ℹ️  Container có trạng thái ${currentRequest.status}, không cần sửa`);
    }

  } catch (error) {
    console.error('❌ Lỗi khi sửa trạng thái container:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Sửa trạng thái container VF4444
fixContainerStatus('VF4444');
