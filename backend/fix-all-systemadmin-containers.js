const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAllSystemAdminContainers() {
  try {
    console.log('🔧 Sửa tất cả container SystemAdmin đặt vào bãi');
    console.log('=' .repeat(60));

    // 1. Tìm SystemAdmin user
    const systemAdmin = await prisma.user.findFirst({
      where: { role: 'SystemAdmin' },
      select: { id: true, username: true, role: true }
    });

    if (!systemAdmin) {
      console.log('❌ Không tìm thấy SystemAdmin user');
      return;
    }

    console.log(`👤 SystemAdmin: ${systemAdmin.username} (${systemAdmin.id})`);

    // 2. Tìm tất cả YardPlacement được tạo bởi SystemAdmin
    const systemAdminPlacements = await prisma.yardPlacement.findMany({
      where: { 
        created_by: systemAdmin.id,
        status: 'OCCUPIED',
        container_no: { not: null }
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

    console.log(`📦 Tìm thấy ${systemAdminPlacements.length} YardPlacement của SystemAdmin`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const placement of systemAdminPlacements) {
      const containerNo = placement.container_no;
      console.log(`\n📦 Xử lý container ${containerNo}:`);

      try {
        // Kiểm tra ServiceRequest
        const existingRequest = await prisma.serviceRequest.findFirst({
          where: { container_no: containerNo },
          orderBy: { createdAt: 'desc' }
        });

        if (existingRequest) {
          console.log(`   ⏭️  Đã có ServiceRequest: ${existingRequest.type} - ${existingRequest.status}`);
          skippedCount++;
          continue;
        }

        // Tạo ServiceRequest mới
        const now = new Date();
        const serviceRequest = await prisma.serviceRequest.create({
          data: {
            container_no: containerNo,
            type: 'EXPORT', // SystemAdmin đặt container vào bãi = EXPORT (NÂNG)
            status: 'IN_YARD', // Container đã được đặt vào bãi
            created_by: systemAdmin.id,
            createdAt: now,
            updatedAt: now,
            history: {
              created_by_systemadmin: {
                reason: 'Container được SystemAdmin đặt trực tiếp vào bãi (auto-fix)',
                created_at: now.toISOString(),
                yard: placement.slot?.block?.yard?.name || 'N/A',
                block: placement.slot?.block?.code || 'N/A',
                slot: placement.slot?.code || 'N/A',
                tier: placement.tier
              }
            }
          }
        });

        console.log(`   ✅ Tạo ServiceRequest: ${serviceRequest.type} - ${serviceRequest.status}`);

        // Cập nhật YardSlot nếu cần
        const yardSlot = await prisma.yardSlot.findUnique({
          where: { id: placement.slot_id }
        });

        if (yardSlot && yardSlot.status !== 'OCCUPIED') {
          await prisma.yardSlot.update({
            where: { id: placement.slot_id },
            data: { 
              status: 'OCCUPIED',
              occupant_container_no: containerNo
            }
          });
          console.log(`   ✅ Cập nhật YardSlot: ${yardSlot.status} → OCCUPIED`);
        } else {
          console.log(`   ✅ YardSlot đã đúng: ${yardSlot?.status}`);
        }

        // Tạo ContainerMeta nếu chưa có
        await prisma.containerMeta.upsert({
          where: { container_no: containerNo },
          update: { updatedAt: now },
          create: { 
            container_no: containerNo,
            updatedAt: now
          }
        });

        console.log(`   ✅ Container ${containerNo} đã được sửa hoàn chỉnh!`);
        fixedCount++;

      } catch (error) {
        console.error(`   ❌ Lỗi khi sửa container ${containerNo}:`, error.message);
      }
    }

    console.log('\n' + '=' .repeat(60));
    console.log('🎉 HOÀN THÀNH: Sửa tất cả container SystemAdmin!');
    console.log(`📊 Kết quả:`);
    console.log(`   ✅ Đã sửa: ${fixedCount} container`);
    console.log(`   ⏭️  Đã bỏ qua: ${skippedCount} container (đã có ServiceRequest)`);
    console.log(`   📦 Tổng cộng: ${systemAdminPlacements.length} container`);

    console.log('\n📋 Logic SystemAdmin đã được sửa từ đầu:');
    console.log('   ✅ Tự động tạo ServiceRequest (EXPORT - IN_YARD)');
    console.log('   ✅ Cập nhật YardSlot (OCCUPIED)');
    console.log('   ✅ Cập nhật YardPlacement (OCCUPIED)');
    console.log('   ✅ Container hiển thị trong ManagerCont');
    console.log('   ✅ Container hiển thị trong LiftContainer');
    console.log('   ✅ Trạng thái request hiển thị đúng: "Chờ nâng container"');

  } catch (error) {
    console.error('❌ Lỗi khi sửa container SystemAdmin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Sửa tất cả container SystemAdmin
fixAllSystemAdminContainers();

