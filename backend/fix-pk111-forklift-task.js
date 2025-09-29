const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createForkliftTaskForPK111() {
  try {
    console.log('🔧 Tạo ForkliftTask cho PK111');
    console.log('=' .repeat(50));

    const containerNo = 'PK111';

    // Kiểm tra container đã có ForkliftTask chưa
    const existingTask = await prisma.forkliftTask.findFirst({
      where: { container_no: containerNo }
    });

    if (existingTask) {
      console.log('✅ PK111 đã có ForkliftTask:');
      console.log(`   - ID: ${existingTask.id}`);
      console.log(`   - Status: ${existingTask.status}`);
      console.log(`   - To Slot: ${existingTask.to_slot_id}`);
      return;
    }

    // Lấy thông tin YardPlacement để tìm slot_id
    const placement = await prisma.yardPlacement.findFirst({
      where: { 
        container_no: containerNo,
        status: 'OCCUPIED',
        removed_at: null
      },
      include: {
        slot: {
          include: {
            block: {
              include: { yard: true }
            }
          }
        }
      }
    });

    if (!placement) {
      console.log('❌ Không tìm thấy YardPlacement của PK111');
      return;
    }

    console.log(`📍 PK111 đang ở: ${placement.slot?.block?.yard?.name || 'N/A'} - ${placement.slot?.block?.code || 'N/A'} - ${placement.slot?.code || 'N/A'}`);

    // Tạo ForkliftTask
    const forkliftTask = await prisma.forkliftTask.create({
      data: {
        container_no: containerNo,
        to_slot_id: placement.slot_id,
        status: 'PENDING',
        created_by: 'cmg47v7j50000t3r8gy0vybr2', // SystemAdmin ID
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ Đã tạo ForkliftTask cho PK111:');
    console.log(`   - ID: ${forkliftTask.id}`);
    console.log(`   - Container: ${forkliftTask.container_no}`);
    console.log(`   - To Slot: ${forkliftTask.to_slot_id}`);
    console.log(`   - Status: ${forkliftTask.status}`);
    console.log(`   - Created by: ${forkliftTask.created_by}`);

    // Cập nhật ServiceRequest status nếu cần
    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: { container_no: containerNo },
      orderBy: { createdAt: 'desc' }
    });

    if (serviceRequest && serviceRequest.status === 'CHECKED') {
      await prisma.serviceRequest.update({
        where: { id: serviceRequest.id },
        data: {
          status: 'FORKLIFTING',
          updatedAt: new Date()
        }
      });
      console.log('✅ Đã cập nhật ServiceRequest status từ CHECKED → FORKLIFTING');
    }

  } catch (error) {
    console.log('❌ Lỗi:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
createForkliftTaskForPK111();
