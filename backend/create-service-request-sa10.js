const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createServiceRequestForSA10() {
  try {
    console.log('🔧 Tạo ServiceRequest cho Container SA10...');
    console.log('=' .repeat(50));

    // 1. Kiểm tra thông tin container từ YardPlacement
    const yardPlacement = await prisma.yardPlacement.findFirst({
      where: { container_no: 'SA10' },
      include: {
        slot: {
          include: {
            block: {
              include: {
                yard: true
              }
            }
          }
        }
      }
    });

    if (!yardPlacement) {
      console.log('❌ Không tìm thấy YardPlacement cho SA10');
      return;
    }

    console.log('📋 Thông tin từ YardPlacement:');
    console.log(`   - Slot: ${yardPlacement.slot?.block?.yard?.name || 'N/A'} - ${yardPlacement.slot?.block?.code || 'N/A'} - ${yardPlacement.slot?.code || 'N/A'}`);
    console.log(`   - Tier: ${yardPlacement.tier}`);
    console.log(`   - Trạng thái: ${yardPlacement.status}`);

    // 2. Tạo ServiceRequest
    const currentTime = new Date();
    
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        container_no: 'SA10',
        type: 'IMPORT', // Giả sử là IMPORT (HẠ)
        status: 'IN_YARD',
        created_by: 'SYSTEM_FIX', // System user
        createdAt: currentTime,
        updatedAt: currentTime,
        history: {
          created_by_system: {
            reason: 'Tạo ServiceRequest cho container đã có trong yard',
            created_at: currentTime.toISOString(),
            yard: yardPlacement.slot?.block?.yard?.name || 'N/A',
            block: yardPlacement.slot?.block?.code || 'N/A',
            slot: yardPlacement.slot?.code || 'N/A',
            tier: yardPlacement.tier
          }
        }
      }
    });

    console.log('✅ Đã tạo ServiceRequest:');
    console.log(`   - ID: ${serviceRequest.id}`);
    console.log(`   - Container: ${serviceRequest.container_no}`);
    console.log(`   - Loại: ${serviceRequest.type}`);
    console.log(`   - Trạng thái: ${serviceRequest.status}`);
    console.log(`   - Ngày tạo: ${serviceRequest.createdAt}`);

    // 3. Cập nhật YardSlot để đồng bộ
    const updatedSlot = await prisma.yardSlot.update({
      where: { id: yardPlacement.slot_id },
      data: {
        status: 'OCCUPIED',
        occupant_container_no: 'SA10'
      }
    });

    console.log('✅ Đã cập nhật YardSlot:');
    console.log(`   - Slot: ${updatedSlot.code}`);
    console.log(`   - Trạng thái: ${updatedSlot.status}`);
    console.log(`   - Container: ${updatedSlot.occupant_container_no}`);

    console.log('\n🎉 HOÀN THÀNH: Container SA10 bây giờ sẽ hiển thị trong ManagerCont!');

  } catch (error) {
    console.error('❌ Lỗi khi tạo ServiceRequest:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Tạo ServiceRequest cho SA10
createServiceRequestForSA10();

