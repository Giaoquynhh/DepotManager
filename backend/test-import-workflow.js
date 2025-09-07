const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testImportWorkflow() {
  console.log('🧪 Testing Import Workflow: IN_PROGRESS → COMPLETED → IN_YARD');
  console.log('='.repeat(60));

  try {
    // 1. Tìm một import request đang ở trạng thái FORKLIFTING
    const importRequest = await prisma.serviceRequest.findFirst({
      where: {
        type: 'IMPORT',
        status: 'FORKLIFTING',
        container_no: { not: null }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!importRequest) {
      console.log('❌ Không tìm thấy import request ở trạng thái FORKLIFTING');
      return;
    }

    console.log(`📦 Found import request: ${importRequest.container_no}`);
    console.log(`   Status: ${importRequest.status}`);
    console.log(`   Type: ${importRequest.type}`);

    // 2. Tạo forklift task mới ở trạng thái IN_PROGRESS
    const newForkliftTask = await prisma.forkliftTask.create({
      data: {
        container_no: importRequest.container_no,
        status: 'IN_PROGRESS',
        from_slot_id: null,
        to_slot_id: null,
        assigned_driver_id: null,
        cost: 0,
        report_status: 'PENDING',
        created_by: 'test-user'
      }
    });

    console.log(`🚛 Created forklift task: ${newForkliftTask.id}`);
    console.log(`   Status: ${newForkliftTask.status}`);

    // 3. Kiểm tra YardPlacement hiện tại
    const yardPlacement = await prisma.yardPlacement.findFirst({
      where: {
        container_no: importRequest.container_no,
        status: { in: ['OCCUPIED', 'HOLD'] }
      },
      include: {
        slot: {
          include: {
            block: {
              include: { yard: true }
            }
          }
        }
      }
    });

    if (yardPlacement) {
      console.log(`🏗️ Container hiện tại trong yard:`);
      console.log(`   Yard: ${yardPlacement.slot.block.yard.name}`);
      console.log(`   Block: ${yardPlacement.slot.block.code}`);
      console.log(`   Slot: ${yardPlacement.slot.code}`);
      console.log(`   Tier: ${yardPlacement.tier}`);
    } else {
      console.log(`🏗️ Container chưa có YardPlacement`);
    }

    // 4. Simulate forklift task completion (using new logic)
    console.log('\n🔄 Simulating forklift task completion with new logic...');
    
    const updatedJob = await prisma.$transaction(async (tx) => {
      // Cập nhật trạng thái forklift task sang COMPLETED
      const updatedForkliftTask = await tx.forkliftTask.update({
        where: { id: newForkliftTask.id },
        data: { 
          status: 'COMPLETED',
          updatedAt: new Date()
        }
      });

      // Cập nhật ServiceRequest từ FORKLIFTING sang trạng thái mới
      if (importRequest.container_no) {
        const latestRequest = await tx.serviceRequest.findFirst({
          where: { container_no: importRequest.container_no },
          orderBy: { createdAt: 'desc' }
        });

        if (latestRequest && latestRequest.status === 'FORKLIFTING') {
          // Logic mới: Phân biệt giữa IMPORT và EXPORT
          let newStatus;
          if (latestRequest.type === 'EXPORT') {
            // Export request: FORKLIFTING → IN_CAR
            newStatus = 'IN_CAR';
            
            // Cập nhật YardPlacement để đánh dấu container đã rời khỏi bãi
            await tx.yardPlacement.updateMany({
              where: { 
                container_no: importRequest.container_no,
                status: { in: ['OCCUPIED', 'HOLD'] }
              },
              data: { 
                status: 'REMOVED',
                removed_at: new Date(),
                updatedAt: new Date()
              }
            });
          } else {
            // Import request: FORKLIFTING → IN_YARD (giữ nguyên logic cũ)
            newStatus = 'IN_YARD';
          }

          await tx.serviceRequest.update({
            where: { id: latestRequest.id },
            data: { 
              status: newStatus,
              updatedAt: new Date()
            }
          });
        }
      }

      return { updatedForkliftTask };
    });

    console.log('✅ Forklift task completed successfully with new logic');

    // 5. Kiểm tra kết quả
    console.log('\n📊 Checking results...');

    // Kiểm tra ServiceRequest
    const updatedRequest = await prisma.serviceRequest.findUnique({
      where: { id: importRequest.id }
    });
    console.log(`📋 ServiceRequest status: ${updatedRequest.status}`);

    // Kiểm tra YardPlacement
    const updatedYardPlacement = await prisma.yardPlacement.findFirst({
      where: {
        container_no: importRequest.container_no,
        status: { in: ['OCCUPIED', 'HOLD', 'REMOVED'] }
      }
    });
    console.log(`🏗️ YardPlacement status: ${updatedYardPlacement ? updatedYardPlacement.status : 'Not found'}`);

    // 6. Test container filtering for ContainersPage
    console.log('\n🔍 Testing ContainersPage filtering...');

    // Test simplified query
    const containersInPage = await prisma.$queryRaw`
      WITH latest_sr AS (
        SELECT DISTINCT ON (sr.container_no)
          sr.container_no,
          sr.status as service_status
        FROM "ServiceRequest" sr
        WHERE sr.container_no IS NOT NULL
        ORDER BY sr.container_no, sr."createdAt" DESC
      )
      SELECT bc.container_no, ls.service_status
      FROM (
        SELECT DISTINCT ON (container_no)
          container_no,
          source,
          priority
        FROM (
          SELECT container_no, 'SERVICE_REQUEST' as source, 1 as priority FROM latest_sr
          WHERE service_status::text <> 'IN_CAR'
          UNION ALL
          SELECT yp.container_no, 'YARD_PLACEMENT' as source, 3 as priority
          FROM "YardPlacement" yp 
          WHERE yp.status = 'OCCUPIED' 
            AND yp.removed_at IS NULL
            AND yp.container_no IS NOT NULL
            AND yp.container_no NOT IN (
              SELECT container_no FROM latest_sr WHERE service_status::text <> 'IN_CAR'
            )
        ) all_sources
        ORDER BY container_no, priority
      ) bc
      LEFT JOIN latest_sr ls ON ls.container_no = bc.container_no
      WHERE bc.container_no = ${importRequest.container_no}
    `;

    console.log(`📦 Container ${importRequest.container_no} in ContainersPage: ${containersInPage.length > 0 ? 'YES' : 'NO'}`);
    if (containersInPage.length > 0) {
      console.log(`   Service status: ${containersInPage[0].service_status}`);
    }

    // 7. Test Yard filtering
    console.log('\n🏗️ Testing Yard filtering...');
    
    const inCarContainers = await prisma.serviceRequest.findMany({
      where: { 
        status: 'IN_CAR',
        container_no: { not: null }
      },
      select: { container_no: true }
    });
    const inCarContainerNos = new Set(inCarContainers.map(c => c.container_no));

    const yardOccupiedCount = await prisma.yardPlacement.groupBy({
      by: ['slot_id'],
      where: { 
        status: 'OCCUPIED', 
        removed_at: null,
        container_no: { notIn: Array.from(inCarContainerNos) }
      },
      _count: { _all: true }
    });

    console.log(`🏗️ Container ${importRequest.container_no} in Yard occupied count: ${yardOccupiedCount.some(c => c.slot_id === yardPlacement?.slot_id) ? 'YES' : 'NO'}`);

    console.log('\n✅ Test completed successfully!');
    console.log('📝 Summary:');
    console.log(`   - ForkliftTask: IN_PROGRESS → COMPLETED`);
    console.log(`   - ServiceRequest: FORKLIFTING → ${updatedRequest.status}`);
    console.log(`   - YardPlacement: ${yardPlacement ? 'OCCUPIED' : 'N/A'} → ${updatedYardPlacement ? updatedYardPlacement.status : 'N/A'}`);
    console.log(`   - Container visible in ContainersPage: ${containersInPage.length > 0 ? 'YES' : 'NO'}`);
    console.log(`   - Container visible in Yard: ${yardOccupiedCount.some(c => c.slot_id === yardPlacement?.slot_id) ? 'YES' : 'NO'}`);

    // Cleanup - xóa forklift task test
    await prisma.forkliftTask.delete({
      where: { id: newForkliftTask.id }
    });
    console.log('🧹 Cleaned up test forklift task');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testImportWorkflow();

