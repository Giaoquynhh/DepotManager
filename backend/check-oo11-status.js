const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkOO11Status() {
  try {
    console.log('🔍 Kiểm tra trạng thái container OO11');
    console.log('=' .repeat(60));

    const containerNo = 'OO11';

    // 1. Kiểm tra ServiceRequest
    console.log('📋 1. Kiểm tra ServiceRequest:');
    const requests = await prisma.serviceRequest.findMany({
      where: { container_no: containerNo },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true, code: true }
        },
        shipping_line: {
          select: { id: true, name: true, code: true }
        },
        container_type: {
          select: { id: true, code: true, description: true }
        }
      }
    });

    if (requests.length > 0) {
      console.log(`✅ Tìm thấy ${requests.length} ServiceRequest(s):`);
      requests.forEach((req, index) => {
        console.log(`   Request ${index + 1}:`);
        console.log(`   - ID: ${req.id}`);
        console.log(`   - Type: ${req.type}`);
        console.log(`   - Status: ${req.status}`);
        console.log(`   - Khách hàng: ${req.customer?.name || 'N/A'} (${req.customer?.code || 'N/A'})`);
        console.log(`   - Hãng tàu: ${req.shipping_line?.name || 'N/A'} (${req.shipping_line?.code || 'N/A'})`);
        console.log(`   - Loại container: ${req.container_type?.description || 'N/A'} (${req.container_type?.code || 'N/A'})`);
        console.log(`   - Seal số: ${req.seal_number || 'N/A'}`);
        console.log(`   - DEM/DET: ${req.dem_det || 'N/A'}`);
        console.log(`   - License plate: ${req.license_plate || 'N/A'}`);
        console.log(`   - Driver name: ${req.driver_name || 'N/A'}`);
        console.log(`   - Driver phone: ${req.driver_phone || 'N/A'}`);
        console.log(`   - Created by: ${req.created_by}`);
        console.log(`   - Ngày tạo: ${req.createdAt}`);
        console.log(`   - Ngày cập nhật: ${req.updatedAt}`);
        console.log('');
      });
    } else {
      console.log('❌ Không tìm thấy ServiceRequest');
    }

    console.log('\n' + '-'.repeat(40) + '\n');

    // 2. Kiểm tra Container model
    console.log('📦 2. Kiểm tra Container model:');
    const container = await prisma.container.findUnique({
      where: { container_no: containerNo },
      include: {
        customer: {
          select: { id: true, name: true, code: true }
        },
        shipping_line: {
          select: { id: true, name: true, code: true }
        },
        container_type: {
          select: { id: true, code: true, description: true }
        }
      }
    });

    if (container) {
      console.log('✅ Tìm thấy trong Container:');
      console.log(`   - ID: ${container.id}`);
      console.log(`   - Status: ${container.status}`);
      console.log(`   - Khách hàng: ${container.customer?.name || 'N/A'} (${container.customer?.code || 'N/A'})`);
      console.log(`   - Hãng tàu: ${container.shipping_line?.name || 'N/A'} (${container.shipping_line?.code || 'N/A'})`);
      console.log(`   - Loại container: ${container.container_type?.description || 'N/A'} (${container.container_type?.code || 'N/A'})`);
      console.log(`   - Seal số: ${container.seal_number || 'N/A'}`);
      console.log(`   - DEM/DET: ${container.dem_det || 'N/A'}`);
      console.log(`   - Yard: ${container.yard_name || 'N/A'}`);
      console.log(`   - Block: ${container.block_code || 'N/A'}`);
      console.log(`   - Slot: ${container.slot_code || 'N/A'}`);
      console.log(`   - Created by: ${container.created_by}`);
      console.log(`   - Ngày tạo: ${container.createdAt}`);
      console.log(`   - Ngày cập nhật: ${container.updatedAt}`);
    } else {
      console.log('❌ Không tìm thấy trong Container');
    }

    console.log('\n' + '-'.repeat(40) + '\n');

    // 3. Kiểm tra YardSlot
    console.log('📍 3. Kiểm tra YardSlot:');
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
      console.log('✅ Tìm thấy trong YardSlot:');
      console.log(`   - Slot ID: ${yardSlot.id}`);
      console.log(`   - Yard: ${yardSlot.block?.yard?.name || 'N/A'}`);
      console.log(`   - Block: ${yardSlot.block?.code || 'N/A'}`);
      console.log(`   - Slot: ${yardSlot.code || 'N/A'}`);
      console.log(`   - Status: ${yardSlot.status || 'N/A'}`);
    } else {
      console.log('❌ Không tìm thấy trong YardSlot');
    }

    console.log('\n' + '-'.repeat(40) + '\n');

    // 4. Kiểm tra ForkliftTask
    console.log('🚛 4. Kiểm tra ForkliftTask:');
    const forkliftTasks = await prisma.forkliftTask.findMany({
      where: { container_no: containerNo },
      orderBy: { createdAt: 'desc' },
      include: {
        from_slot: {
          include: {
            block: {
              include: {
                yard: true
              }
            }
          }
        },
        to_slot: {
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

    if (forkliftTasks.length > 0) {
      console.log(`✅ Tìm thấy ${forkliftTasks.length} ForkliftTask(s):`);
      forkliftTasks.forEach((task, index) => {
        console.log(`   Task ${index + 1}:`);
        console.log(`   - ID: ${task.id}`);
        console.log(`   - Status: ${task.status}`);
        console.log(`   - From: ${task.from_slot?.block?.yard?.name || 'N/A'} - ${task.from_slot?.block?.code || 'N/A'} - ${task.from_slot?.code || 'N/A'}`);
        console.log(`   - To: ${task.to_slot?.block?.yard?.name || 'N/A'} - ${task.to_slot?.block?.code || 'N/A'} - ${task.to_slot?.code || 'N/A'}`);
        console.log(`   - Cost: ${task.cost || 'N/A'}`);
        console.log(`   - Created by: ${task.created_by}`);
        console.log(`   - Ngày tạo: ${task.createdAt}`);
        console.log(`   - Ngày cập nhật: ${task.updatedAt}`);
        console.log('');
      });
    } else {
      console.log('❌ Không tìm thấy ForkliftTask');
    }

    console.log('\n' + '-'.repeat(40) + '\n');

    // 5. Kiểm tra YardPlacement
    console.log('🏗️ 5. Kiểm tra YardPlacement:');
    const yardPlacements = await prisma.yardPlacement.findMany({
      where: { container_no: containerNo },
      orderBy: { placed_at: 'desc' },
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

    if (yardPlacements.length > 0) {
      console.log(`✅ Tìm thấy ${yardPlacements.length} YardPlacement(s):`);
      yardPlacements.forEach((placement, index) => {
        console.log(`   Placement ${index + 1}:`);
        console.log(`   - ID: ${placement.id}`);
        console.log(`   - Status: ${placement.status}`);
        console.log(`   - Tier: ${placement.tier}`);
        console.log(`   - Yard: ${placement.slot?.block?.yard?.name || 'N/A'}`);
        console.log(`   - Block: ${placement.slot?.block?.code || 'N/A'}`);
        console.log(`   - Slot: ${placement.slot?.code || 'N/A'}`);
        console.log(`   - Placed at: ${placement.placed_at}`);
        console.log(`   - Removed at: ${placement.removed_at || 'N/A'}`);
        console.log(`   - Created at: ${placement.createdAt}`);
        console.log('');
      });
    } else {
      console.log('❌ Không tìm thấy YardPlacement');
    }

  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra container OO11:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOO11Status();
