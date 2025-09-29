const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findAndFixAllGATE_OUTContainers() {
  try {
    console.log('🔍 Đang tìm tất cả container có trạng thái GATE_OUT nhưng đã có vị trí trong YardSlot...');
    console.log('=' .repeat(80));

    // 1. Tìm tất cả ServiceRequest có trạng thái GATE_OUT và type IMPORT (HẠ)
    const gateOutRequests = await prisma.serviceRequest.findMany({
      where: { 
        status: 'GATE_OUT',
        type: 'IMPORT', // Chỉ sửa IMPORT (HẠ), không sửa EXPORT (NÂNG)
        container_no: { not: null }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📋 Tìm thấy ${gateOutRequests.length} ServiceRequest IMPORT có trạng thái GATE_OUT`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const request of gateOutRequests) {
      const containerNo = request.container_no;
      
      // 2. Kiểm tra container có vị trí trong YardSlot không
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

      if (yardSlot) {
        console.log(`\n🔄 Container ${containerNo}:`);
        console.log(`   - Trạng thái: ${request.status}`);
        console.log(`   - Vị trí: ${yardSlot.block?.yard?.name || 'N/A'} - ${yardSlot.block?.code || 'N/A'} - ${yardSlot.code || 'N/A'}`);
        console.log(`   - Slot trạng thái: ${yardSlot.status}`);
        
        // 3. Sửa container này
        const currentTime = new Date();
        
        const updatedRequest = await prisma.serviceRequest.update({
          where: { id: request.id },
          data: {
            status: 'IN_YARD',
            history: {
              ...(request.history || {}),
              container_placed: {
                previous_status: 'GATE_OUT',
                placed_at: currentTime.toISOString(),
                placed_by: 'SYSTEM_FIX_ALL',
                yard: yardSlot.block?.yard?.name || 'N/A',
                block: yardSlot.block?.code || 'N/A',
                slot: yardSlot.code || 'N/A',
                reason: 'Container đã được hạ xuống bãi, tự động chuyển từ GATE_OUT về IN_YARD (batch fix)'
              }
            }
          }
        });

        // Cập nhật YardSlot
        const updatedSlot = await prisma.yardSlot.update({
          where: { id: yardSlot.id },
          data: {
            status: 'OCCUPIED',
            occupant_container_no: containerNo
          }
        });

        console.log(`   ✅ Đã sửa: GATE_OUT → IN_YARD (IMPORT - HẠ)`);
        console.log(`   ✅ Slot: ${yardSlot.status} → ${updatedSlot.status}`);
        fixedCount++;
        
      } else {
        console.log(`\n⏭️  Container ${containerNo}: Không có vị trí trong YardSlot, bỏ qua`);
        skippedCount++;
      }
    }

    console.log('\n' + '=' .repeat(80));
    console.log('📊 KẾT QUẢ TỔNG KẾT:');
    console.log(`✅ Đã sửa: ${fixedCount} container`);
    console.log(`⏭️  Bỏ qua: ${skippedCount} container`);
    console.log(`📋 Tổng cộng: ${gateOutRequests.length} container IMPORT có trạng thái GATE_OUT`);

    if (fixedCount > 0) {
      console.log('\n🎉 HOÀN THÀNH: Tất cả container có vấn đề đã được sửa!');
      console.log('   Bây giờ các container này sẽ hiển thị đúng trong Yard interface.');
    } else {
      console.log('\n✅ Không có container nào cần sửa.');
    }

  } catch (error) {
    console.error('❌ Lỗi khi sửa container:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script sửa tất cả container
findAndFixAllGATE_OUTContainers();
