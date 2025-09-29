const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugContainerSA10() {
  try {
    console.log('🔍 Debug Container SA10 - Tại sao không hiển thị trong ManagerCont?');
    console.log('=' .repeat(70));

    // 1. Kiểm tra YardSlot chi tiết
    console.log('📍 1. Kiểm tra YardSlot chi tiết:');
    const yardSlot = await prisma.yardSlot.findFirst({
      where: { occupant_container_no: 'SA10' },
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
      console.log(`   - Trạng thái: ${yardSlot.status}`);
      console.log(`   - Container: ${yardSlot.occupant_container_no}`);
    } else {
      console.log('❌ Không tìm thấy trong YardSlot');
    }

    // 2. Kiểm tra YardPlacement (stacking system)
    console.log('\n📦 2. Kiểm tra YardPlacement (stacking system):');
    const yardPlacements = await prisma.yardPlacement.findMany({
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

    if (yardPlacements.length > 0) {
      console.log(`✅ Tìm thấy ${yardPlacements.length} YardPlacement:`);
      yardPlacements.forEach((placement, index) => {
        console.log(`   Placement ${index + 1}:`);
        console.log(`   - ID: ${placement.id}`);
        console.log(`   - Slot: ${placement.slot?.block?.yard?.name || 'N/A'} - ${placement.slot?.block?.code || 'N/A'} - ${placement.slot?.code || 'N/A'}`);
        console.log(`   - Tier: ${placement.tier}`);
        console.log(`   - Trạng thái: ${placement.status}`);
        console.log(`   - Container: ${placement.container_no}`);
        console.log(`   - Ngày đặt: ${placement.placed_at || 'N/A'}`);
        console.log(`   - Ngày xóa: ${placement.removed_at || 'N/A'}`);
      });
    } else {
      console.log('❌ Không tìm thấy trong YardPlacement');
    }

    // 3. Kiểm tra ServiceRequest
    console.log('\n📋 3. Kiểm tra ServiceRequest:');
    const serviceRequests = await prisma.serviceRequest.findMany({
      where: { container_no: 'SA10' },
      orderBy: { createdAt: 'desc' }
    });

    if (serviceRequests.length > 0) {
      console.log(`✅ Tìm thấy ${serviceRequests.length} ServiceRequest:`);
      serviceRequests.forEach((request, index) => {
        console.log(`   Request ${index + 1}:`);
        console.log(`   - ID: ${request.id}`);
        console.log(`   - Loại: ${request.type}`);
        console.log(`   - Trạng thái: ${request.status}`);
        console.log(`   - Container: ${request.container_no}`);
        console.log(`   - Ngày tạo: ${request.createdAt}`);
        console.log(`   - Ngày cập nhật: ${request.updatedAt}`);
      });
    } else {
      console.log('❌ Không tìm thấy trong ServiceRequest');
    }

    // 4. Kiểm tra Container model
    console.log('\n📦 4. Kiểm tra Container model:');
    const containers = await prisma.container.findMany({
      where: { container_no: 'SA10' }
    });

    if (containers.length > 0) {
      console.log(`✅ Tìm thấy ${containers.length} Container:`);
      containers.forEach((container, index) => {
        console.log(`   Container ${index + 1}:`);
        console.log(`   - ID: ${container.id}`);
        console.log(`   - Trạng thái: ${container.status}`);
        console.log(`   - Container: ${container.container_no}`);
        console.log(`   - Yard: ${container.yard_name || 'N/A'}`);
        console.log(`   - Block: ${container.block_code || 'N/A'}`);
        console.log(`   - Slot: ${container.slot_code || 'N/A'}`);
        console.log(`   - Ngày tạo: ${container.createdAt}`);
        console.log(`   - Ngày cập nhật: ${container.updatedAt}`);
      });
    } else {
      console.log('❌ Không tìm thấy trong Container model');
    }

    // 5. Phân tích vấn đề
    console.log('\n🔍 5. PHÂN TÍCH VẤN ĐỀ:');
    
    const hasServiceRequest = serviceRequests.length > 0;
    const hasYardPlacement = yardPlacements.length > 0;
    const hasYardSlot = !!yardSlot;
    const hasContainer = containers.length > 0;

    console.log(`   - ServiceRequest: ${hasServiceRequest ? '✅' : '❌'}`);
    console.log(`   - YardPlacement: ${hasYardPlacement ? '✅' : '❌'}`);
    console.log(`   - YardSlot: ${hasYardSlot ? '✅' : '❌'}`);
    console.log(`   - Container: ${hasContainer ? '✅' : '❌'}`);

    if (!hasServiceRequest) {
      console.log('\n🚨 VẤN ĐỀ CHÍNH: Container SA10 không có ServiceRequest!');
      console.log('   → ManagerCont hiển thị container từ ServiceRequest');
      console.log('   → Cần tạo ServiceRequest cho container này');
    } else if (!hasYardPlacement) {
      console.log('\n🚨 VẤN ĐỀ: Container có ServiceRequest nhưng không có YardPlacement!');
      console.log('   → Container có thể bị ẩn trong yard interface');
    } else if (hasYardPlacement && yardPlacements.some(p => p.removed_at)) {
      console.log('\n🚨 VẤN ĐỀ: Container có YardPlacement nhưng đã bị removed_at!');
      console.log('   → Container bị ẩn do đã được xóa khỏi yard');
    }

  } catch (error) {
    console.error('❌ Lỗi khi debug container:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Debug container SA10
debugContainerSA10();

