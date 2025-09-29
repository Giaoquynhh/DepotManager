const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSystemAdminContainersReal() {
  try {
    console.log('🔍 Kiểm tra các container được SystemAdmin đặt trực tiếp vào bãi');
    console.log('=' .repeat(80));

    // 1. Tìm user SystemAdmin
    const systemAdmin = await prisma.user.findFirst({
      where: { role: 'SystemAdmin' },
      select: { id: true, username: true, role: true }
    });

    if (!systemAdmin) {
      console.log('❌ Không tìm thấy SystemAdmin user');
      return;
    }

    console.log(`👤 SystemAdmin: ${systemAdmin.username} (${systemAdmin.id})`);

    // 2. Kiểm tra YardPlacement được tạo bởi SystemAdmin
    const systemAdminPlacements = await prisma.yardPlacement.findMany({
      where: { 
        created_by: systemAdmin.id
      },
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
      },
      orderBy: { updatedAt: 'desc' }
    });

    console.log(`\n📦 YardPlacement được tạo bởi SystemAdmin: ${systemAdminPlacements.length} record(s)`);

    systemAdminPlacements.forEach((placement, index) => {
      console.log(`\n${index + 1}. Container ${placement.container_no}:`);
      console.log(`   - Slot: ${placement.slot?.block?.yard?.name || 'N/A'} - ${placement.slot?.block?.code || 'N/A'} - ${placement.slot?.code || 'N/A'}`);
      console.log(`   - Tier: ${placement.tier}`);
      console.log(`   - Trạng thái: ${placement.status}`);
      console.log(`   - Ngày tạo: ${placement.updatedAt.toLocaleString('vi-VN')}`);
      if (placement.removed_at) {
        console.log(`   - Ngày xóa: ${placement.removed_at.toLocaleString('vi-VN')}`);
      }
    });

    // 3. Kiểm tra ServiceRequest được tạo bởi SystemAdmin
    const systemAdminRequests = await prisma.serviceRequest.findMany({
      where: { 
        created_by: systemAdmin.id
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n📋 ServiceRequest được tạo bởi SystemAdmin: ${systemAdminRequests.length} record(s)`);

    systemAdminRequests.forEach((request, index) => {
      console.log(`\n${index + 1}. Container ${request.container_no}:`);
      console.log(`   - Loại: ${request.type} (${request.type === 'IMPORT' ? 'HẠ' : 'NÂNG'})`);
      console.log(`   - Trạng thái: ${request.status}`);
      console.log(`   - Ngày tạo: ${request.createdAt.toLocaleString('vi-VN')}`);
      console.log(`   - Ngày cập nhật: ${request.updatedAt.toLocaleString('vi-VN')}`);
    });

    // 4. Kiểm tra Container model được tạo bởi SystemAdmin
    const systemAdminContainers = await prisma.container.findMany({
      where: { 
        created_by: systemAdmin.id
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n📦 Container model được tạo bởi SystemAdmin: ${systemAdminContainers.length} record(s)`);

    systemAdminContainers.forEach((container, index) => {
      console.log(`\n${index + 1}. Container ${container.container_no}:`);
      console.log(`   - Trạng thái: ${container.status}`);
      console.log(`   - Yard: ${container.yard_name || 'N/A'}`);
      console.log(`   - Block: ${container.block_code || 'N/A'}`);
      console.log(`   - Slot: ${container.slot_code || 'N/A'}`);
      console.log(`   - Ngày tạo: ${container.createdAt.toLocaleString('vi-VN')}`);
    });

    // 5. Kiểm tra tất cả YardSlot có container
    const allSlots = await prisma.yardSlot.findMany({
      where: { 
        occupant_container_no: { not: null }
      },
      include: { 
        block: { 
          include: { 
            yard: true 
          } 
        } 
      }
    });

    console.log(`\n📍 Tất cả YardSlot có container: ${allSlots.length} slot(s)`);

    for (const slot of allSlots) {
      const containerNo = slot.occupant_container_no;
      
      // Kiểm tra xem container này có được tạo bởi SystemAdmin không
      const placement = await prisma.yardPlacement.findFirst({
        where: { 
          container_no: containerNo,
          created_by: systemAdmin.id
        }
      });

      const request = await prisma.serviceRequest.findFirst({
        where: { 
          container_no: containerNo,
          created_by: systemAdmin.id
        }
      });

      console.log(`\n📦 Container ${containerNo}:`);
      console.log(`   - Slot: ${slot.block?.yard?.name || 'N/A'} - ${slot.block?.code || 'N/A'} - ${slot.code || 'N/A'}`);
      console.log(`   - Slot trạng thái: ${slot.status}`);
      
      if (request) {
        console.log(`   - ServiceRequest: ${request.type} - ${request.status} (SystemAdmin)`);
      } else {
        console.log(`   - ServiceRequest: Không có hoặc không phải SystemAdmin`);
      }
      
      if (placement) {
        console.log(`   - YardPlacement: ${placement.status}, Tier ${placement.tier} (SystemAdmin)`);
      } else {
        console.log(`   - YardPlacement: Không có hoặc không phải SystemAdmin`);
      }
    }

    // 6. Phân tích logic SystemAdmin
    console.log('\n' + '=' .repeat(80));
    console.log('🎯 LOGIC SYSTEMADMIN ĐẶT CONTAINER VÀO BÃI:');
    
    console.log('\n📋 Khi SystemAdmin đặt container trực tiếp vào bãi:');
    console.log('   1. Container sẽ có loại EXPORT (NÂNG)');
    console.log('   2. Container sẽ có trạng thái IN_YARD (chờ nâng)');
    console.log('   3. YardSlot sẽ có trạng thái OCCUPIED');
    console.log('   4. YardPlacement sẽ có trạng thái OCCUPIED');
    console.log('   5. Container sẽ hiển thị trong LiftContainer (EXPORT)');
    console.log('   6. Container KHÔNG hiển thị trong LowerContainer (IMPORT)');

    console.log('\n✅ Ưu điểm:');
    console.log('   - SystemAdmin có thể quản lý container linh hoạt');
    console.log('   - Container được đặt đúng vị trí trong bãi');
    console.log('   - Logic nhất quán với quy trình EXPORT');
    console.log('   - Không gây nhầm lẫn với quy trình IMPORT');

    console.log('\n⚠️  Cần lưu ý:');
    console.log('   - Container được đặt sẽ hiển thị trong LiftContainer');
    console.log('   - Cần đảm bảo thông tin container đầy đủ');
    console.log('   - Cần có thông tin khách hàng, hãng tàu, loại container');

  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy kiểm tra
checkSystemAdminContainersReal();

