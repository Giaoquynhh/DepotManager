const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLiftVsLowerLogic() {
  try {
    console.log('🧪 Test Logic NÂNG vs HẠ Container');
    console.log('=' .repeat(60));

    // 1. Kiểm tra tất cả container có trạng thái GATE_OUT
    const allGateOutRequests = await prisma.serviceRequest.findMany({
      where: { 
        status: 'GATE_OUT',
        container_no: { not: null }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📋 Tìm thấy ${allGateOutRequests.length} container có trạng thái GATE_OUT:`);
    
    let importCount = 0;
    let exportCount = 0;
    let importWithSlot = 0;
    let exportWithSlot = 0;

    for (const request of allGateOutRequests) {
      const containerNo = request.container_no;
      const type = request.type;
      
      // Kiểm tra có vị trí trong YardSlot không
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

      const hasSlot = !!yardSlot;
      const slotInfo = hasSlot ? `${yardSlot.block?.yard?.name || 'N/A'} - ${yardSlot.block?.code || 'N/A'} - ${yardSlot.code || 'N/A'}` : 'Không có vị trí';

      console.log(`\n📦 Container ${containerNo}:`);
      console.log(`   - Loại: ${type} (${type === 'IMPORT' ? 'HẠ' : 'NÂNG'})`);
      console.log(`   - Trạng thái: ${request.status}`);
      console.log(`   - Vị trí: ${slotInfo}`);
      
      if (type === 'IMPORT') {
        importCount++;
        if (hasSlot) importWithSlot++;
        console.log(`   - Logic: ${hasSlot ? '✅ Cần sửa (HẠ xuống bãi)' : '⏭️ Bỏ qua (đã ra khỏi bãi)'}`);
      } else {
        exportCount++;
        if (hasSlot) exportWithSlot++;
        console.log(`   - Logic: ${hasSlot ? '⚠️ Có vấn đề (NÂNG nhưng vẫn có vị trí)' : '✅ Đúng (NÂNG ra khỏi bãi)'}`);
      }
    }

    console.log('\n' + '=' .repeat(60));
    console.log('📊 TÓM TẮT LOGIC:');
    console.log(`\n🔄 IMPORT (HẠ) - ${importCount} container:`);
    console.log(`   - Có vị trí: ${importWithSlot} → Cần chuyển GATE_OUT → IN_YARD`);
    console.log(`   - Không có vị trí: ${importCount - importWithSlot} → Đã ra khỏi bãi, bỏ qua`);
    
    console.log(`\n📤 EXPORT (NÂNG) - ${exportCount} container:`);
    console.log(`   - Có vị trí: ${exportWithSlot} → Có vấn đề! (NÂNG nhưng vẫn có vị trí)`);
    console.log(`   - Không có vị trí: ${exportCount - exportWithSlot} → Đúng (NÂNG ra khỏi bãi)`);

    console.log('\n🎯 LOGIC MỚI:');
    console.log('✅ IMPORT (HẠ) + GATE_OUT + có vị trí → Tự động chuyển IN_YARD');
    console.log('✅ EXPORT (NÂNG) + GATE_OUT + không vị trí → Đúng (ra khỏi bãi)');
    console.log('⚠️ EXPORT (NÂNG) + GATE_OUT + có vị trí → Có vấn đề (cần kiểm tra)');

    if (exportWithSlot > 0) {
      console.log('\n🚨 CẢNH BÁO: Có EXPORT container vẫn có vị trí trong YardSlot!');
      console.log('   Điều này có thể là lỗi trong logic NÂNG container.');
    }

  } catch (error) {
    console.error('❌ Lỗi khi test logic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy test
testLiftVsLowerLogic();

