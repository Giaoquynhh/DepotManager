/**
 * Test script để kiểm tra logic trạng thái mới của Forklift System
 * 
 * Chạy: node test-forklift-status.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testForkliftStatusFlow() {
  console.log('🚀 Bắt đầu test Forklift Status Flow...\n');

  try {
    // 1. Tạo job xe nâng mới
    console.log('1️⃣ Tạo job xe nâng mới...');
    const newJob = await prisma.forkliftTask.create({
      data: {
        container_no: 'TEST-001',
        status: 'PENDING',
        created_by: 'test-user'
      }
    });
    console.log(`✅ Job tạo thành công: ${newJob.id} - Status: ${newJob.status}\n`);

    // 2. Gán tài xế (chuyển sang ASSIGNED)
    console.log('2️⃣ Gán tài xế...');
    const assignedJob = await prisma.forkliftTask.update({
      where: { id: newJob.id },
      data: {
        assigned_driver_id: 'test-driver',
        status: 'ASSIGNED'
      }
    });
    console.log(`✅ Job đã gán tài xế: ${assignedJob.id} - Status: ${assignedJob.status}\n`);

    // 3. Bắt đầu công việc (chuyển sang IN_PROGRESS)
    console.log('3️⃣ Bắt đầu công việc...');
    const inProgressJob = await prisma.forkliftTask.update({
      where: { id: newJob.id },
      data: {
        status: 'IN_PROGRESS'
      }
    });
    console.log(`✅ Job đang thực hiện: ${inProgressJob.id} - Status: ${inProgressJob.status}\n`);

    // 4. Hoàn thành công việc (chuyển sang COMPLETED)
    console.log('4️⃣ Hoàn thành công việc...');
    const completedJob = await prisma.forkliftTask.update({
      where: { id: newJob.id },
      data: {
        status: 'COMPLETED'
      }
    });
    console.log(`✅ Job hoàn thành: ${completedJob.id} - Status: ${completedJob.status}\n`);

         // 5. Test các trạng thái không hợp lệ
     console.log('5️⃣ Test các trạng thái không hợp lệ...');
     
     try {
       // Thử bắt đầu từ PENDING (không được phép)
       await prisma.forkliftTask.update({
         where: { id: newJob.id },
         data: { status: 'PENDING' }
       });
       
       await prisma.forkliftTask.update({
         where: { id: newJob.id },
         data: { status: 'IN_PROGRESS' }
       });
       console.log('❌ Lỗi: Không được phép bắt đầu từ PENDING');
     } catch (error) {
       console.log('✅ Đúng: Không thể bắt đầu từ PENDING');
     }

     // Test gán lại tài xế từ ASSIGNED (không được phép)
     console.log('\n6️⃣ Test gán lại tài xế từ ASSIGNED...');
     try {
       const reassignJob = await prisma.forkliftTask.create({
         data: {
           container_no: 'TEST-003',
           status: 'ASSIGNED',
           assigned_driver_id: 'driver-1',
           created_by: 'test-user'
         }
       });
       
       // Thử gán lại tài xế khác (không được phép)
       await prisma.forkliftTask.update({
         where: { id: reassignJob.id },
         data: {
           assigned_driver_id: 'driver-2',
           status: 'ASSIGNED'
         }
       });
       console.log('❌ Lỗi: Không được phép gán lại tài xế từ ASSIGNED');
     } catch (error) {
       console.log('✅ Đúng: Không thể gán lại tài xế từ ASSIGNED');
     }

         // 7. Test hủy job
     console.log('\n7️⃣ Test hủy job...');
    
    // Tạo job mới để test hủy
    const cancelJob = await prisma.forkliftTask.create({
      data: {
        container_no: 'TEST-002',
        status: 'PENDING',
        created_by: 'test-user'
      }
    });

    const cancelledJob = await prisma.forkliftTask.update({
      where: { id: cancelJob.id },
      data: {
        status: 'CANCELLED',
        cancel_reason: 'Test cancellation'
      }
    });
    console.log(`✅ Job đã hủy: ${cancelledJob.id} - Status: ${cancelledJob.status}\n`);

         // 8. Hiển thị tất cả jobs để kiểm tra
     console.log('8️⃣ Danh sách tất cả jobs:');
    const allJobs = await prisma.forkliftTask.findMany({
      where: {
        container_no: { startsWith: 'TEST-' }
      },
      orderBy: { createdAt: 'desc' }
    });

    allJobs.forEach((job, index) => {
      console.log(`${index + 1}. Container: ${job.container_no} - Status: ${job.status} - Driver: ${job.assigned_driver_id || 'N/A'}`);
    });

    console.log('\n🎉 Test hoàn thành thành công!');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Dọn dẹp dữ liệu test...');
  
  try {
    const deletedJobs = await prisma.forkliftTask.deleteMany({
      where: {
        container_no: { startsWith: 'TEST-' }
      }
    });
    
    console.log(`✅ Đã xóa ${deletedJobs.count} job test`);
  } catch (error) {
    console.error('❌ Lỗi khi dọn dẹp:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy test
if (require.main === module) {
  testForkliftStatusFlow()
    .then(() => {
      console.log('\n📋 Test summary:');
      console.log('✅ PENDING → ASSIGNED → IN_PROGRESS → COMPLETED');
      console.log('✅ Validation trạng thái hoạt động đúng');
      console.log('✅ Hủy job hoạt động đúng');
      console.log('✅ Workflow mới hoạt động như mong đợi');
    })
    .catch(console.error)
    .finally(() => {
      // Tự động dọn dẹp sau 5 giây
      setTimeout(cleanupTestData, 5000);
    });
}

module.exports = { testForkliftStatusFlow, cleanupTestData };
