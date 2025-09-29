const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeSA111Issue() {
  try {
    console.log('🔍 Phân tích vấn đề Container SA111 - EXPORT nhưng có EMPTY_IN_YARD');
    console.log('=' .repeat(80));

    // 1. Kiểm tra ServiceRequest
    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: { container_no: 'SA111' },
      orderBy: { createdAt: 'desc' }
    });

    console.log('📋 ServiceRequest:');
    if (serviceRequest) {
      console.log(`   - ID: ${serviceRequest.id}`);
      console.log(`   - Loại: ${serviceRequest.type}`);
      console.log(`   - Trạng thái: ${serviceRequest.status}`);
      console.log(`   - Container: ${serviceRequest.container_no}`);
      console.log(`   - Ngày tạo: ${serviceRequest.createdAt}`);
      console.log(`   - Ngày cập nhật: ${serviceRequest.updatedAt}`);
    }

    // 2. Kiểm tra Container model
    const container = await prisma.container.findUnique({
      where: { container_no: 'SA111' }
    });

    console.log('\n📦 Container model:');
    if (container) {
      console.log(`   - ID: ${container.id}`);
      console.log(`   - Trạng thái: ${container.status}`);
      console.log(`   - Container: ${container.container_no}`);
      console.log(`   - Ngày tạo: ${container.createdAt}`);
      console.log(`   - Ngày cập nhật: ${container.updatedAt}`);
    }

    // 3. Kiểm tra YardSlot
    const yardSlot = await prisma.yardSlot.findFirst({
      where: { occupant_container_no: 'SA111' },
      include: { 
        block: { 
          include: { 
            yard: true 
          } 
        } 
      }
    });

    console.log('\n📍 YardSlot:');
    if (yardSlot) {
      console.log(`   - Slot ID: ${yardSlot.id}`);
      console.log(`   - Yard: ${yardSlot.block?.yard?.name || 'N/A'}`);
      console.log(`   - Block: ${yardSlot.block?.code || 'N/A'}`);
      console.log(`   - Slot: ${yardSlot.code || 'N/A'}`);
      console.log(`   - Trạng thái: ${yardSlot.status}`);
      console.log(`   - Container: ${yardSlot.occupant_container_no}`);
    }

    // 4. Kiểm tra YardPlacement
    const yardPlacements = await prisma.yardPlacement.findMany({
      where: { container_no: 'SA111' },
      orderBy: { updatedAt: 'desc' }
    });

    console.log('\n📦 YardPlacement:');
    if (yardPlacements.length > 0) {
      yardPlacements.forEach((placement, index) => {
        console.log(`   Placement ${index + 1}:`);
        console.log(`   - ID: ${placement.id}`);
        console.log(`   - Trạng thái: ${placement.status}`);
        console.log(`   - Container: ${placement.container_no}`);
        console.log(`   - Ngày đặt: ${placement.placed_at || 'N/A'}`);
        console.log(`   - Ngày xóa: ${placement.removed_at || 'N/A'}`);
      });
    } else {
      console.log('   ❌ Không có YardPlacement');
    }

    // 5. Phân tích vấn đề
    console.log('\n🚨 PHÂN TÍCH VẤN ĐỀ:');
    
    if (serviceRequest && container) {
      console.log(`   ServiceRequest: ${serviceRequest.type} - ${serviceRequest.status}`);
      console.log(`   Container: ${container.status}`);
      
      if (serviceRequest.type === 'EXPORT' && serviceRequest.status === 'GATE_OUT') {
        console.log('   ✅ ServiceRequest đúng: EXPORT đã ra khỏi bãi (GATE_OUT)');
      }
      
      if (container.status === 'EMPTY_IN_YARD') {
        console.log('   ❌ Container model SAI: EXPORT đã ra khỏi bãi không nên có EMPTY_IN_YARD');
        console.log('   💡 Container model này có thể là dữ liệu cũ hoặc lỗi logic');
      }
      
      if (yardSlot && yardSlot.status === 'EMPTY') {
        console.log('   ✅ YardSlot đúng: Slot đã trống (EMPTY)');
      }
    }

    console.log('\n🎯 KẾT LUẬN:');
    console.log('   - SA111 là EXPORT đã ra khỏi bãi (GATE_OUT)');
    console.log('   - Container model có EMPTY_IN_YARD là không hợp lý');
    console.log('   - Có thể cần xóa hoặc cập nhật Container model này');

  } catch (error) {
    console.error('❌ Lỗi khi phân tích:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Phân tích vấn đề SA111
analyzeSA111Issue();
