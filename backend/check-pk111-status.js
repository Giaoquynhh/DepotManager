const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPK111Status() {
  try {
    console.log('🔍 Kiểm tra trạng thái container PK111');
    console.log('=' .repeat(60));

    const containerNo = 'PK111';

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

    // 4. Kiểm tra YardPlacement
    console.log('📦 4. Kiểm tra YardPlacement:');
    const placements = await prisma.yardPlacement.findMany({
      where: { container_no: containerNo },
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

    console.log('\n' + '-'.repeat(40) + '\n');

    // 5. Kiểm tra ForkliftTask
    console.log('🚛 5. Kiểm tra ForkliftTask:');
    const forkliftTasks = await prisma.forkliftTask.findMany({
      where: { container_no: containerNo },
      orderBy: { createdAt: 'asc' }
    });

    if (forkliftTasks.length > 0) {
      console.log(`✅ Tìm thấy ${forkliftTasks.length} ForkliftTask(s):`);
      forkliftTasks.forEach((task, index) => {
        console.log(`   Task ${index + 1}:`);
        console.log(`   - ID: ${task.id}`);
        console.log(`   - Status: ${task.status}`);
        console.log(`   - From Slot: ${task.from_slot_id || 'N/A'}`);
        console.log(`   - To Slot: ${task.to_slot_id || 'N/A'}`);
        console.log(`   - Created by: ${task.created_by}`);
        console.log(`   - Assigned to: ${task.assigned_driver_id || 'N/A'}`);
        console.log(`   - Created At: ${task.createdAt}`);
        console.log(`   - Updated At: ${task.updatedAt}`);
        console.log('');
      });
    } else {
      console.log('❌ Không có ForkliftTask nào');
    }

    console.log('\n' + '='.repeat(60) + '\n');
    console.log('📊 TÓM TẮT TRẠNG THÁI PK111:');
    
    if (requests.length === 0) {
      console.log('❌ Không có ServiceRequest nào');
      
      if (container) {
        console.log(`✅ Có Container model: ${container.status}`);
        console.log('💡 Đây có thể là container được SystemAdmin đặt trực tiếp vào bãi');
      } else {
        console.log('❌ Container không tồn tại trong hệ thống');
      }
    } else if (requests.length === 1) {
      console.log('✅ Có duy nhất 1 ServiceRequest (BÌNH THƯỜNG)');
      const activeRequest = requests[0];
      console.log(`📋 ${activeRequest.type} - ${activeRequest.status}`);
      
      // Phân tích workflow
      if (activeRequest.type === 'IMPORT') {
        console.log('🎯 Đây là IMPORT (yêu cầu hạ)');
        if (activeRequest.status === 'PENDING') console.log('📋 Cần chấp nhận');
        else if (activeRequest.status === 'CHECKED') console.log('📋 Đã chấp nhận, chờ vào cổng');
        else if (activeRequest.status === 'GATE_IN') console.log('📋 Đã vào cổng, chờ forklift');
        else if (activeRequest.status === 'FORKLIFTING') console.log('📋 Đang hạ container');
        else if (activeRequest.status === 'IN_YARD') console.log('📋 Đã hạ thành công');
        else if (activeRequest.status === 'EMPTY_IN_YARD') console.log('📋 Container rỗng trong bãi');
        else if (activeRequest.status === 'GATE_OUT') console.log('📋 Xe đã rời khỏi bãi');
      }
    } else {
      console.log('❌ Có NHIỀU ServiceRequest (CONFLICT)');
      console.log(`📊 Tổng ${requests.length} requests:`);
      requests.forEach((req, index) => {
        console.log(`   ${index + 1}. ${req.type} - ${req.status} (${req.createdAt.toLocaleString()})`);
      });
    }

    // Hiển thị vị trí hiện tại
    if (yardSlot) {
      console.log(`📍 Vị trí hiện tại: ${yardSlot.block?.yard?.name || 'N/A'} - ${yardSlot.block?.code || 'N/A'} - ${yardSlot.code || 'N/A'}`);
    } else {
      console.log(`📍 Không có thông tin vị trí`);
    }

    // Kiểm tra ForkliftTask
    if (forkliftTasks.length === 0) {
      console.log('❌ Không có ForkliftTask - Đây có thể là nguyên nhân không hiển thị trong LowerContainer/Forklift');
    } else {
      const pendingTasks = forkliftTasks.filter(task => task.status === 'PENDING');
      const completedTasks = forkliftTasks.filter(task => task.status === 'COMPLETED');
      console.log(`📊 ForkliftTask: ${pendingTasks.length} pending, ${completedTasks.length} completed`);
    }

  } catch (error) {
    console.log('❌ Lỗi khi kiểm tra:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy kiểm tra
checkPK111Status();
