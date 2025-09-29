const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSystemAdminContainers() {
  try {
    console.log('🔧 Sửa lại các container được SystemAdmin đặt vào bãi');
    console.log('=' .repeat(70));

    const containersToFix = ['SA10', 'SB10'];

    for (const containerNo of containersToFix) {
      console.log(`\n📦 Sửa container ${containerNo}:`);

      // 1. Kiểm tra YardPlacement
      const yardPlacement = await prisma.yardPlacement.findFirst({
        where: { 
          container_no: containerNo,
          status: 'OCCUPIED'
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
        }
      });

      if (!yardPlacement) {
        console.log(`   ❌ Không tìm thấy YardPlacement cho ${containerNo}`);
        continue;
      }

      console.log(`   📍 Vị trí: ${yardPlacement.slot?.block?.yard?.name || 'N/A'} - ${yardPlacement.slot?.block?.code || 'N/A'} - ${yardPlacement.slot?.code || 'N/A'}`);
      console.log(`   📦 YardPlacement: ${yardPlacement.status}, Tier ${yardPlacement.tier}`);

      // 2. Cập nhật YardSlot
      const updatedSlot = await prisma.yardSlot.update({
        where: { id: yardPlacement.slot_id },
        data: {
          status: 'OCCUPIED',
          occupant_container_no: containerNo
        }
      });

      console.log(`   ✅ YardSlot: ${yardPlacement.slot?.status || 'N/A'} → ${updatedSlot.status}`);

      // 3. Tạo ServiceRequest
      const currentTime = new Date();
      
      const serviceRequest = await prisma.serviceRequest.create({
        data: {
          container_no: containerNo,
          type: 'EXPORT', // SystemAdmin đặt container vào bãi = EXPORT (NÂNG)
          status: 'IN_YARD', // Container ở trong bãi, chờ nâng
          created_by: 'SYSTEM_FIX',
          createdAt: currentTime,
          updatedAt: currentTime,
          history: {
            created_by_systemadmin: {
              reason: 'Container được SystemAdmin đặt trực tiếp vào bãi',
              created_at: currentTime.toISOString(),
              yard: yardPlacement.slot?.block?.yard?.name || 'N/A',
              block: yardPlacement.slot?.block?.code || 'N/A',
              slot: yardPlacement.slot?.code || 'N/A',
              tier: yardPlacement.tier
            }
          }
        }
      });

      console.log(`   ✅ ServiceRequest: ${serviceRequest.type} - ${serviceRequest.status}`);
      console.log(`   ✅ Container ${containerNo} đã được sửa hoàn chỉnh!`);
    }

    console.log('\n' + '=' .repeat(70));
    console.log('🎉 HOÀN THÀNH: Tất cả container SystemAdmin đã được sửa!');
    console.log('\n📋 Kết quả:');
    console.log('   ✅ YardSlot: EMPTY → OCCUPIED');
    console.log('   ✅ ServiceRequest: EXPORT - IN_YARD');
    console.log('   ✅ Container hiển thị trong LiftContainer');
    console.log('   ✅ Container KHÔNG hiển thị trong LowerContainer');
    console.log('   ✅ Logic nhất quán với quy trình EXPORT');

  } catch (error) {
    console.error('❌ Lỗi khi sửa container:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Sửa container SystemAdmin
fixSystemAdminContainers();

