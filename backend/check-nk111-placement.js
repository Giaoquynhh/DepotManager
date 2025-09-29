const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkNK111Placement() {
  try {
    console.log('🔍 Kiểm tra YardPlacement của NK111');
    console.log('=' .repeat(50));
    
    const placements = await prisma.yardPlacement.findMany({
      where: { container_no: 'NK111' },
      include: {
        slot: {
          include: {
            block: {
              include: { yard: true }
            }
          }
        }
      },
      orderBy: { placed_at: 'desc' }
    });
    
    if (placements.length > 0) {
      console.log(`✅ Tìm thấy ${placements.length} YardPlacement(s):`);
      placements.forEach((p, index) => {
        console.log(`   Placement ${index + 1}:`);
        console.log(`   - ID: ${p.id}`);
        console.log(`   - Container: ${p.container_no}`);
        console.log(`   - Status: ${p.status}`);
        console.log(`   - Tier: ${p.tier}`);
        console.log(`   - Slot: ${p.slot?.block?.yard?.name || 'N/A'} - ${p.slot?.block?.code || 'N/A'} - ${p.slot?.code || 'N/A'}`);
        console.log(`   - Placed: ${p.placed_at || 'N/A'}`);
        console.log(`   - Removed: ${p.removed_at || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ Không tìm thấy YardPlacement nào');
    }
    
    // Kiểm tra YardSlot
    const slot = await prisma.yardSlot.findFirst({
      where: { occupant_container_no: 'NK111' },
      include: {
        block: { include: { yard: true } }
      }
    });
    
    if (slot) {
      console.log('✅ YardSlot có occupant_container_no = NK111:');
      console.log(`   - Slot: ${slot.block?.yard?.name || 'N/A'} - ${slot.block?.code || 'N/A'} - ${slot.code || 'N/A'}`);
      console.log(`   - Status: ${slot.status}`);
    } else {
      console.log('❌ Không tìm thấy YardSlot có occupant_container_no = NK111');
    }
    
    // Kiểm tra logic lọc trong getStackMap
    console.log('\n' + '-'.repeat(40) + '\n');
    console.log('🔍 Kiểm tra logic lọc trong getStackMap:');
    
    const removedContainers = await prisma.serviceRequest.findMany({
      where: { 
        status: { in: ['IN_CAR', 'DONE_LIFTING', 'GATE_OUT'] },
        container_no: { not: null }
      },
      select: { container_no: true }
    });
    
    const removedContainerNos = new Set(removedContainers.map(c => c.container_no));
    console.log(`📊 Containers bị lọc bỏ: ${removedContainerNos.size} containers`);
    console.log(`📋 Danh sách: ${Array.from(removedContainerNos).join(', ')}`);
    
    if (removedContainerNos.has('NK111')) {
      console.log('❌ NK111 bị lọc bỏ vì có status GATE_OUT');
    } else {
      console.log('✅ NK111 không bị lọc bỏ');
    }
    
  } catch (error) {
    console.log('❌ Lỗi:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkNK111Placement();
