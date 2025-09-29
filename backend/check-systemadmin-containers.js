const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSystemAdminContainers() {
  try {
    console.log('🔍 Kiểm tra các container được SystemAdmin đặt trực tiếp vào bãi');
    console.log('=' .repeat(80));

    // 1. Kiểm tra YardPlacement được tạo bởi SystemAdmin
    const systemAdminPlacements = await prisma.yardPlacement.findMany({
      where: { 
        created_by: 'SYSTEM_FIX' // Hoặc user ID của SystemAdmin
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

    console.log(`📦 YardPlacement được tạo bởi SystemAdmin: ${systemAdminPlacements.length} record(s)`);

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

    // 2. Kiểm tra ServiceRequest được tạo bởi SystemAdmin
    const systemAdminRequests = await prisma.serviceRequest.findMany({
      where: { 
        created_by: 'SYSTEM_FIX' // Hoặc user ID của SystemAdmin
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

    // 3. Kiểm tra Container model được tạo bởi SystemAdmin
    const systemAdminContainers = await prisma.container.findMany({
      where: { 
        created_by: 'SYSTEM_FIX' // Hoặc user ID của SystemAdmin
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

    // 4. Kiểm tra YardSlot có container được đặt bởi SystemAdmin
    const systemAdminSlots = await prisma.yardSlot.findMany({
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

    console.log(`\n📍 YardSlot có container: ${systemAdminSlots.length} slot(s)`);

    for (const slot of systemAdminSlots) {
      const containerNo = slot.occupant_container_no;
      
      // Kiểm tra xem container này có được tạo bởi SystemAdmin không
      const placement = await prisma.yardPlacement.findFirst({
        where: { 
          container_no: containerNo,
          created_by: 'SYSTEM_FIX'
        }
      });

      const request = await prisma.serviceRequest.findFirst({
        where: { 
          container_no: containerNo,
          created_by: 'SYSTEM_FIX'
        }
      });

      if (placement || request) {
        console.log(`\n📦 Container ${containerNo} (SystemAdmin):`);
        console.log(`   - Slot: ${slot.block?.yard?.name || 'N/A'} - ${slot.block?.code || 'N/A'} - ${slot.code || 'N/A'}`);
        console.log(`   - Slot trạng thái: ${slot.status}`);
        
        if (request) {
          console.log(`   - ServiceRequest: ${request.type} - ${request.status}`);
        }
        
        if (placement) {
          console.log(`   - YardPlacement: ${placement.status}, Tier ${placement.tier}`);
        }
      }
    }

    // 5. Phân tích logic SystemAdmin
    console.log('\n' + '=' .repeat(80));
    console.log('🎯 PHÂN TÍCH LOGIC SYSTEMADMIN:');
    
    console.log('\n📋 Logic hiện tại:');
    console.log('   - SystemAdmin có thể đặt container trực tiếp vào bãi');
    console.log('   - Container được đặt sẽ có loại EXPORT (NÂNG)');
    console.log('   - Container sẽ có trạng thái IN_YARD (chờ nâng)');
    console.log('   - YardSlot sẽ có trạng thái OCCUPIED');
    console.log('   - YardPlacement sẽ có trạng thái OCCUPIED');

    console.log('\n✅ Ưu điểm:');
    console.log('   - SystemAdmin có thể quản lý container linh hoạt');
    console.log('   - Container được đặt đúng vị trí trong bãi');
    console.log('   - Logic nhất quán với quy trình EXPORT');

    console.log('\n⚠️  Cần lưu ý:');
    console.log('   - Container được đặt sẽ hiển thị trong LiftContainer (EXPORT)');
    console.log('   - Không hiển thị trong LowerContainer (IMPORT)');
    console.log('   - Cần đảm bảo thông tin container đầy đủ (khách hàng, hãng tàu, etc.)');

  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy kiểm tra
checkSystemAdminContainers();

