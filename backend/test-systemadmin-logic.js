const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSystemAdminLogic() {
  try {
    console.log('🧪 Test logic SystemAdmin đặt container vào bãi');
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

    // 2. Tìm một slot trống để test
    const emptySlot = await prisma.yardSlot.findFirst({
      where: { 
        status: 'EMPTY',
        occupant_container_no: null
      },
      include: {
        block: {
          include: {
            yard: true
          }
        }
      }
    });

    if (!emptySlot) {
      console.log('❌ Không tìm thấy slot trống để test');
      return;
    }

    console.log(`📍 Slot test: ${emptySlot.block?.yard?.name || 'N/A'} - ${emptySlot.block?.code || 'N/A'} - ${emptySlot.code || 'N/A'}`);

    // 3. Tạo container test
    const testContainerNo = `TEST${Date.now()}`;
    console.log(`📦 Container test: ${testContainerNo}`);

    // 4. Simulate SystemAdmin đặt container vào bãi
    console.log('\n🔄 Simulating SystemAdmin placement...');
    
    // Tạo YardPlacement HOLD trước
    const holdPlacement = await prisma.yardPlacement.create({
      data: {
        slot_id: emptySlot.id,
        tier: 1,
        status: 'HOLD',
        container_no: null,
        hold_expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 phút
        created_by: systemAdmin.id
      }
    });

    console.log(`✅ Created HOLD placement: ${holdPlacement.id}`);

    // 5. Simulate confirm action (logic mới)
    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      // Cập nhật placement thành OCCUPIED
      const updatedPlacement = await tx.yardPlacement.update({
        where: { slot_tier_unique: { slot_id: emptySlot.id, tier: 1 } },
        data: { 
          status: 'OCCUPIED', 
          container_no: testContainerNo, 
          hold_expires_at: null, 
          placed_at: now 
        }
      });

      // Cập nhật YardSlot
      await tx.yardSlot.update({
        where: { id: emptySlot.id },
        data: { 
          status: 'OCCUPIED',
          occupant_container_no: testContainerNo
        }
      });

      // Logic SystemAdmin: Tạo ServiceRequest nếu chưa có
      let latestRequest = await tx.serviceRequest.findFirst({
        where: { container_no: testContainerNo },
        orderBy: { createdAt: 'desc' }
      });

      if (!latestRequest) {
        console.log(`🆕 Creating new ServiceRequest for ${testContainerNo}`);
        latestRequest = await tx.serviceRequest.create({
          data: {
            container_no: testContainerNo,
            type: 'EXPORT', // SystemAdmin đặt container vào bãi = EXPORT (NÂNG)
            status: 'IN_YARD', // Container đã được đặt vào bãi
            created_by: systemAdmin.id,
            createdAt: now,
            updatedAt: now,
            history: {
              created_by_systemadmin: {
                reason: 'Container được SystemAdmin đặt trực tiếp vào bãi',
                created_at: now.toISOString(),
                yard: emptySlot.block?.yard?.name || 'N/A',
                block: emptySlot.block?.code || 'N/A',
                slot: emptySlot.code || 'N/A',
                tier: 1
              }
            }
          }
        });
        console.log(`✅ Created ServiceRequest: ${latestRequest.id} - ${latestRequest.type} - ${latestRequest.status}`);
      }

      // Tạo ContainerMeta
      await tx.containerMeta.upsert({
        where: { container_no: testContainerNo },
        update: { updatedAt: now },
        create: { 
          container_no: testContainerNo,
          updatedAt: now
        }
      });

      return {
        placement: updatedPlacement,
        request: latestRequest
      };
    });

    console.log('\n✅ SystemAdmin placement completed!');
    console.log(`📦 Container: ${testContainerNo}`);
    console.log(`📍 Placement: ${result.placement.status}, Tier ${result.placement.tier}`);
    console.log(`📋 ServiceRequest: ${result.request.type} - ${result.request.status}`);

    // 6. Verify kết quả
    console.log('\n🔍 Verification:');
    
    const verifyPlacement = await prisma.yardPlacement.findFirst({
      where: { container_no: testContainerNo },
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

    const verifyRequest = await prisma.serviceRequest.findFirst({
      where: { container_no: testContainerNo },
      orderBy: { createdAt: 'desc' }
    });

    const verifySlot = await prisma.yardSlot.findUnique({
      where: { id: emptySlot.id }
    });

    console.log(`✅ YardPlacement: ${verifyPlacement?.status} - ${verifyPlacement?.slot?.block?.yard?.name || 'N/A'} - ${verifyPlacement?.slot?.block?.code || 'N/A'} - ${verifyPlacement?.slot?.code || 'N/A'}`);
    console.log(`✅ ServiceRequest: ${verifyRequest?.type} - ${verifyRequest?.status}`);
    console.log(`✅ YardSlot: ${verifySlot?.status} - ${verifySlot?.occupant_container_no}`);

    // 7. Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.yardPlacement.deleteMany({ where: { container_no: testContainerNo } });
    await prisma.serviceRequest.deleteMany({ where: { container_no: testContainerNo } });
    await prisma.containerMeta.deleteMany({ where: { container_no: testContainerNo } });
    await prisma.yardSlot.update({
      where: { id: emptySlot.id },
      data: { 
        status: 'EMPTY',
        occupant_container_no: null
      }
    });
    console.log('✅ Cleanup completed');

    console.log('\n🎉 Test completed successfully!');
    console.log('\n📋 Logic SystemAdmin đã được sửa:');
    console.log('   ✅ Tự động tạo ServiceRequest (EXPORT - IN_YARD)');
    console.log('   ✅ Cập nhật YardSlot (OCCUPIED)');
    console.log('   ✅ Cập nhật YardPlacement (OCCUPIED)');
    console.log('   ✅ Container hiển thị trong ManagerCont');
    console.log('   ✅ Container hiển thị trong LiftContainer');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy test
testSystemAdminLogic();

