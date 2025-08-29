/**
 * Script reset trạng thái forklift jobs về PENDING để test logic mới
 * 
 * Chạy: node reset-forklift-status.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetForkliftStatus() {
  console.log('🔄 Bắt đầu reset trạng thái forklift jobs...\n');

  try {
    // 1. Kiểm tra jobs hiện tại
    console.log('1️⃣ Kiểm tra jobs hiện tại:');
    const currentJobs = await prisma.forkliftTask.findMany({
      select: {
        id: true,
        container_no: true,
        status: true,
        assigned_driver_id: true
      }
    });

    currentJobs.forEach((job, index) => {
      console.log(`${index + 1}. Container: ${job.container_no} - Status: ${job.status} - Driver: ${job.assigned_driver_id || 'N/A'}`);
    });

    // 2. Reset tất cả jobs về PENDING (giữ nguyên assigned_driver_id)
    console.log('\n2️⃣ Reset tất cả jobs về PENDING...');
    const updatedJobs = await prisma.forkliftTask.updateMany({
      where: {
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
      },
      data: {
        status: 'PENDING'
      }
    });

    console.log(`✅ Đã reset ${updatedJobs.count} jobs về PENDING`);

    // 3. Kiểm tra jobs sau khi reset
    console.log('\n3️⃣ Kiểm tra jobs sau khi reset:');
    const updatedJobsList = await prisma.forkliftTask.findMany({
      select: {
        id: true,
        container_no: true,
        status: true,
        assigned_driver_id: true
      }
    });

    updatedJobsList.forEach((job, index) => {
      console.log(`${index + 1}. Container: ${job.container_no} - Status: ${job.status} - Driver: ${job.assigned_driver_id || 'N/A'}`);
    });

    console.log('\n🎉 Reset hoàn thành thành công!');
    console.log('📋 Bây giờ bạn có thể test workflow mới:');
    console.log('   1. Job có trạng thái PENDING');
    console.log('   2. Có thể gán tài xế (vẫn PENDING)');
    console.log('   3. Tài xế bấm "Bắt đầu" → chuyển sang ASSIGNED');
    console.log('   4. Tài xế bấm "Bắt đầu làm việc" → chuyển sang IN_PROGRESS');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình reset:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy reset
if (require.main === module) {
  resetForkliftStatus()
    .then(() => {
      console.log('\n✅ Reset completed successfully!');
    })
    .catch(console.error);
}

module.exports = { resetForkliftStatus };
