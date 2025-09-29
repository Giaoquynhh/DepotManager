const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkGateYardStatus() {
  try {
    console.log('🔍 Kiểm tra trạng thái và liên kết Gate-Yard cho các container');
    console.log('=' .repeat(80));

    // 1. Lấy tất cả ServiceRequest có container_no
    const allRequests = await prisma.serviceRequest.findMany({
      where: { 
        container_no: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        container_no: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log(`📋 Tổng cộng ${allRequests.length} ServiceRequest có container:`);

    // 2. Phân loại theo type và status
    const importRequests = allRequests.filter(r => r.type === 'IMPORT');
    const exportRequests = allRequests.filter(r => r.type === 'EXPORT');

    console.log(`\n🔄 IMPORT (HẠ): ${importRequests.length} container(s)`);
    console.log(`📤 EXPORT (NÂNG): ${exportRequests.length} container(s)`);

    // 3. Kiểm tra từng container chi tiết
    for (const request of allRequests) {
      const containerNo = request.container_no;
      
      console.log(`\n📦 Container ${containerNo}:`);
      console.log(`   - Loại: ${request.type} (${request.type === 'IMPORT' ? 'HẠ' : 'NÂNG'})`);
      console.log(`   - Trạng thái: ${request.status}`);
      console.log(`   - Ngày tạo: ${request.createdAt.toLocaleString('vi-VN')}`);
      console.log(`   - Ngày cập nhật: ${request.updatedAt.toLocaleString('vi-VN')}`);

      // Kiểm tra Container model
      const container = await prisma.container.findUnique({
        where: { container_no: containerNo }
      });

      if (container) {
        console.log(`   - Container model: ${container.status}`);
        console.log(`   - Yard: ${container.yard_name || 'N/A'}`);
        console.log(`   - Block: ${container.block_code || 'N/A'}`);
        console.log(`   - Slot: ${container.slot_code || 'N/A'}`);
      } else {
        console.log(`   - Container model: Không có`);
      }

      // Kiểm tra YardSlot
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
        console.log(`   - YardSlot: ${yardSlot.block?.yard?.name || 'N/A'} - ${yardSlot.block?.code || 'N/A'} - ${yardSlot.code || 'N/A'}`);
        console.log(`   - Slot trạng thái: ${yardSlot.status}`);
      } else {
        console.log(`   - YardSlot: Không có`);
      }

      // Kiểm tra YardPlacement
      const yardPlacements = await prisma.yardPlacement.findMany({
        where: { container_no: containerNo }
      });

      if (yardPlacements.length > 0) {
        console.log(`   - YardPlacement: ${yardPlacements.length} record(s)`);
        yardPlacements.forEach((placement, index) => {
          console.log(`     ${index + 1}. Trạng thái: ${placement.status}, Tier: ${placement.tier}`);
          if (placement.removed_at) {
            console.log(`        Đã xóa: ${placement.removed_at.toLocaleString('vi-VN')}`);
          }
        });
      } else {
        console.log(`   - YardPlacement: Không có`);
      }

      // Phân tích logic
      console.log(`   🔍 Phân tích:`);
      
      if (request.type === 'IMPORT') {
        if (request.status === 'GATE_OUT') {
          if (yardSlot && yardSlot.status === 'EMPTY') {
            console.log(`     ⚠️  VẤN ĐỀ: IMPORT GATE_OUT nhưng slot EMPTY (cần tự động chuyển IN_YARD)`);
          } else if (yardSlot && yardSlot.status === 'OCCUPIED') {
            console.log(`     ✅ Đúng: IMPORT GATE_OUT với slot OCCUPIED`);
          }
        } else if (request.status === 'IN_YARD') {
          if (yardSlot && yardSlot.status === 'OCCUPIED') {
            console.log(`     ✅ Đúng: IMPORT IN_YARD với slot OCCUPIED`);
          } else {
            console.log(`     ⚠️  VẤN ĐỀ: IMPORT IN_YARD nhưng slot không OCCUPIED`);
          }
        }
      } else if (request.type === 'EXPORT') {
        if (request.status === 'GATE_OUT') {
          if (yardSlot && yardSlot.status === 'EMPTY') {
            console.log(`     ✅ Đúng: EXPORT GATE_OUT với slot EMPTY (đã ra khỏi bãi)`);
          } else {
            console.log(`     ⚠️  VẤN ĐỀ: EXPORT GATE_OUT nhưng slot không EMPTY`);
          }
        } else if (request.status === 'IN_YARD') {
          if (yardSlot && yardSlot.status === 'OCCUPIED') {
            console.log(`     ✅ Đúng: EXPORT IN_YARD với slot OCCUPIED (chờ nâng)`);
          } else {
            console.log(`     ⚠️  VẤN ĐỀ: EXPORT IN_YARD nhưng slot không OCCUPIED`);
          }
        }
      }
    }

    // 4. Tóm tắt các vấn đề
    console.log('\n' + '=' .repeat(80));
    console.log('📊 TÓM TẮT CÁC VẤN ĐỀ:');
    
    const issues = [];
    
    for (const request of allRequests) {
      const containerNo = request.container_no;
      const yardSlot = await prisma.yardSlot.findFirst({
        where: { occupant_container_no: containerNo }
      });

      if (request.type === 'IMPORT' && request.status === 'GATE_OUT' && yardSlot && yardSlot.status === 'EMPTY') {
        issues.push(`${containerNo}: IMPORT GATE_OUT với slot EMPTY`);
      }
      
      if (request.type === 'EXPORT' && request.status === 'GATE_OUT' && yardSlot && yardSlot.status !== 'EMPTY') {
        issues.push(`${containerNo}: EXPORT GATE_OUT với slot không EMPTY`);
      }
    }

    if (issues.length > 0) {
      console.log('❌ Các vấn đề cần sửa:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('✅ Không có vấn đề nào!');
    }

  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy kiểm tra
checkGateYardStatus();

