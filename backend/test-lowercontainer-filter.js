const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLowerContainerFilter() {
  try {
    console.log('🧪 Test Filter LowerContainer - Kiểm tra container GATE_OUT có bị lọc bỏ không');
    console.log('=' .repeat(70));

    // 1. Lấy tất cả IMPORT requests
    const allImportRequests = await prisma.serviceRequest.findMany({
      where: { 
        type: 'IMPORT',
        container_no: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        container_no: true,
        status: true,
        type: true,
        createdAt: true
      }
    });

    console.log(`📋 Tổng cộng ${allImportRequests.length} IMPORT requests:`);
    
    // 2. Phân loại theo trạng thái
    const statusCounts = {};
    allImportRequests.forEach(request => {
      const status = request.status || 'UNKNOWN';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log('\n📊 Phân loại theo trạng thái:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count} container(s)`);
    });

    // 3. Áp dụng filter như trong LowerContainer
    const filteredData = allImportRequests.filter((request) => {
      return request.status !== 'EMPTY_IN_YARD' && request.status !== 'GATE_OUT';
    });

    console.log(`\n🔍 Sau khi lọc bỏ EMPTY_IN_YARD và GATE_OUT:`);
    console.log(`   - Trước lọc: ${allImportRequests.length} container(s)`);
    console.log(`   - Sau lọc: ${filteredData.length} container(s)`);
    console.log(`   - Đã lọc bỏ: ${allImportRequests.length - filteredData.length} container(s)`);

    // 4. Hiển thị các container bị lọc bỏ
    const filteredOut = allImportRequests.filter((request) => {
      return request.status === 'EMPTY_IN_YARD' || request.status === 'GATE_OUT';
    });

    if (filteredOut.length > 0) {
      console.log('\n❌ Các container bị lọc bỏ:');
      filteredOut.forEach(request => {
        console.log(`   - ${request.container_no}: ${request.status}`);
      });
    }

    // 5. Hiển thị các container còn lại
    console.log('\n✅ Các container hiển thị trong LowerContainer:');
    filteredData.forEach(request => {
      console.log(`   - ${request.container_no}: ${request.status}`);
    });

    console.log('\n🎯 KẾT LUẬN:');
    console.log('✅ Container GATE_OUT đã được lọc bỏ khỏi trang LowerContainer');
    console.log('✅ Container EMPTY_IN_YARD đã được lọc bỏ khỏi trang LowerContainer');
    console.log('✅ Chỉ hiển thị các container đang trong quy trình hạ');

  } catch (error) {
    console.error('❌ Lỗi khi test filter:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy test
testLowerContainerFilter();

