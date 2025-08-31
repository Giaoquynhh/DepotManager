const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDriverExportStatus() {
  try {
    console.log('🔍 Kiểm tra logic Driver Dashboard cho Export requests...');
    
    // Kiểm tra tất cả requests có status GATE_IN
    const gateInRequests = await prisma.serviceRequest.findMany({
      where: {
        status: 'GATE_IN'
      },
      select: {
        id: true,
        container_no: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log(`\n📊 Tổng số requests có status GATE_IN: ${gateInRequests.length}`);
    
    if (gateInRequests.length > 0) {
      console.log('\n📋 Chi tiết các requests GATE_IN:');
      gateInRequests.forEach((req, index) => {
        console.log(`${index + 1}. ID: ${req.id}`);
        console.log(`   Container: ${req.container_no || 'N/A'}`);
        console.log(`   Type: ${req.type || 'N/A'}`);
        console.log(`   Status: ${req.status}`);
        console.log(`   Created: ${req.createdAt}`);
        console.log(`   Updated: ${req.updatedAt}`);
        console.log('---');
      });
    }
    
    // Kiểm tra EXPORT requests có status GATE_IN
    const exportGateInRequests = await prisma.serviceRequest.findMany({
      where: {
        type: 'EXPORT',
        status: 'GATE_IN'
      },
      select: {
        id: true,
        container_no: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log(`\n📦 Tổng số EXPORT requests có status GATE_IN: ${exportGateInRequests.length}`);
    
    if (exportGateInRequests.length > 0) {
      console.log('\n📋 Chi tiết các EXPORT requests GATE_IN:');
      exportGateInRequests.forEach((req, index) => {
        console.log(`${index + 1}. ID: ${req.id}`);
        console.log(`   Container: ${req.container_no || 'N/A'}`);
        console.log(`   Type: ${req.type || 'N/A'}`);
        console.log(`   Status: ${req.status}`);
        console.log(`   Created: ${req.createdAt}`);
        console.log(`   Updated: ${req.updatedAt}`);
        console.log('---');
      });
      
      // Kiểm tra ForkliftTask tương ứng
      for (const req of exportGateInRequests) {
        if (req.container_no) {
          const forkliftTasks = await prisma.forkliftTask.findMany({
            where: {
              container_no: req.container_no
            },
            select: {
              id: true,
              container_no: true,
              status: true,
              assigned_driver_id: true,
              createdAt: true,
              updatedAt: true
            }
          });
          
          console.log(`\n🚛 ForkliftTask cho container ${req.container_no}:`);
          if (forkliftTasks.length > 0) {
            forkliftTasks.forEach((task, index) => {
              console.log(`  ${index + 1}. ID: ${task.id}`);
              console.log(`     Status: ${task.status}`);
              console.log(`     Driver ID: ${task.assigned_driver_id || 'Chưa gán'}`);
              console.log(`     Created: ${task.createdAt}`);
              console.log(`     Updated: ${task.updatedAt}`);
            });
          } else {
            console.log('  ❌ Không có ForkliftTask nào');
          }
        }
      }
    }
    
    // Kiểm tra ForkliftTask có status PENDING
    const pendingForkliftTasks = await prisma.forkliftTask.findMany({
      where: {
        status: 'PENDING'
      },
      select: {
        id: true,
        container_no: true,
        status: true,
        assigned_driver_id: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log(`\n🚛 Tổng số ForkliftTask có status PENDING: ${pendingForkliftTasks.length}`);
    
    if (pendingForkliftTasks.length > 0) {
      console.log('\n📋 Chi tiết các ForkliftTask PENDING:');
      pendingForkliftTasks.forEach((task, index) => {
        console.log(`${index + 1}. ID: ${task.id}`);
        console.log(`   Container: ${task.container_no || 'N/A'}`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Driver ID: ${task.assigned_driver_id || 'Chưa gán'}`);
        console.log(`   Created: ${task.createdAt}`);
        console.log(`   Updated: ${task.updatedAt}`);
        console.log('---');
      });
    }
    
    // Kiểm tra logic transition GATE_IN → FORKLIFTING
    console.log('\n🔄 Kiểm tra logic transition GATE_IN → FORKLIFTING:');
    console.log('1. Export request có status GATE_IN');
    console.log('2. Tài xế click "Bắt đầu" trên DriverDashboard');
    console.log('3. ForkliftTask status: PENDING → IN_PROGRESS');
    console.log('4. ServiceRequest status: GATE_IN → FORKLIFTING');
    console.log('5. System message: "🚛 Tài xế đang nâng/hạ container"');
    
    // Kiểm tra các trạng thái có thể transition từ GATE_IN
    console.log('\n📋 Các trạng thái có thể transition từ GATE_IN:');
    console.log('- GATE_IN → CHECKING (SaleAdmin/SystemAdmin)');
    console.log('- GATE_IN → FORKLIFTING (Driver/SaleAdmin/SystemAdmin) - MỚI cho Export requests');
    
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy test
testDriverExportStatus();
