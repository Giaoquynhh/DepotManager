const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeOO11Completion() {
  try {
    console.log('📊 PHÂN TÍCH CHI TIẾT CONTAINER OO11 - ĐÃ GEN ĐƯỢC BAO NHIÊU %');
    console.log('=' .repeat(80));

    const containerNo = 'OO11';

    // Lấy thông tin ServiceRequest mới nhất (EXPORT với status GATE_OUT)
    const latestRequest = await prisma.serviceRequest.findFirst({
      where: { 
        container_no: containerNo,
        type: 'EXPORT',
        status: 'GATE_OUT'
      },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true, code: true }
        },
        shipping_line: {
          select: { id: true, name: true, code: true }
        },
        container_type: {
          select: { id: true, code: true, description: true }
        }
      }
    });

    if (!latestRequest) {
      console.log('❌ Không tìm thấy ServiceRequest EXPORT với status GATE_OUT cho container OO11');
      return;
    }

    console.log('📋 THÔNG TIN CONTAINER OO11 ĐẦY ĐỦ:');
    console.log('=' .repeat(50));

    // Thông tin cơ bản
    console.log('\n🏷️  THÔNG TIN CƠ BẢN:');
    console.log(`   - Container: ${latestRequest.container_no}`);
    console.log(`   - Type: ${latestRequest.type}`);
    console.log(`   - Status: ${latestRequest.status}`);
    console.log(`   - Request ID: ${latestRequest.id}`);

    // Thông tin khách hàng
    console.log('\n👤 THÔNG TIN KHÁCH HÀNG:');
    console.log(`   - Tên: ${latestRequest.customer?.name || 'N/A'}`);
    console.log(`   - Mã: ${latestRequest.customer?.code || 'N/A'}`);
    console.log(`   - ID: ${latestRequest.customer?.id || 'N/A'}`);

    // Thông tin hãng tàu
    console.log('\n🚢 THÔNG TIN HÃNG TÀU:');
    console.log(`   - Tên: ${latestRequest.shipping_line?.name || 'N/A'}`);
    console.log(`   - Mã: ${latestRequest.shipping_line?.code || 'N/A'}`);
    console.log(`   - ID: ${latestRequest.shipping_line?.id || 'N/A'}`);

    // Thông tin container
    console.log('\n📦 THÔNG TIN CONTAINER:');
    console.log(`   - Loại: ${latestRequest.container_type?.description || 'N/A'}`);
    console.log(`   - Mã loại: ${latestRequest.container_type?.code || 'N/A'}`);
    console.log(`   - ID loại: ${latestRequest.container_type?.id || 'N/A'}`);

    // Thông tin vận chuyển
    console.log('\n🚛 THÔNG TIN VẬN CHUYỂN:');
    console.log(`   - Seal số: ${latestRequest.seal_number || 'N/A'}`);
    console.log(`   - DEM/DET: ${latestRequest.dem_det || 'N/A'}`);
    console.log(`   - Biển số xe: ${latestRequest.license_plate || 'N/A'}`);
    console.log(`   - Tên tài xế: ${latestRequest.driver_name || 'N/A'}`);
    console.log(`   - SĐT tài xế: ${latestRequest.driver_phone || 'N/A'}`);

    // Thông tin thời gian
    console.log('\n⏰ THÔNG TIN THỜI GIAN:');
    console.log(`   - Ngày tạo: ${latestRequest.createdAt}`);
    console.log(`   - Ngày cập nhật: ${latestRequest.updatedAt}`);
    console.log(`   - Người tạo: ${latestRequest.created_by}`);

    // Phân tích % hoàn thành
    console.log('\n📊 PHÂN TÍCH % HOÀN THÀNH:');
    console.log('=' .repeat(50));

    const requiredFields = [
      { name: 'Container Number', value: latestRequest.container_no, required: true },
      { name: 'Customer Name', value: latestRequest.customer?.name, required: true },
      { name: 'Shipping Line', value: latestRequest.shipping_line?.name, required: true },
      { name: 'Container Type', value: latestRequest.container_type?.description, required: true },
      { name: 'Seal Number', value: latestRequest.seal_number, required: true },
      { name: 'License Plate', value: latestRequest.license_plate, required: true },
      { name: 'Driver Name', value: latestRequest.driver_name, required: true },
      { name: 'Driver Phone', value: latestRequest.driver_phone, required: true },
      { name: 'Request Type', value: latestRequest.type, required: true },
      { name: 'Request Status', value: latestRequest.status, required: true }
    ];

    const optionalFields = [
      { name: 'Customer Code', value: latestRequest.customer?.code, required: false },
      { name: 'Shipping Line Code', value: latestRequest.shipping_line?.code, required: false },
      { name: 'Container Type Code', value: latestRequest.container_type?.code, required: false },
      { name: 'DEM/DET', value: latestRequest.dem_det, required: false },
      { name: 'Request ID', value: latestRequest.id, required: false },
      { name: 'Created By', value: latestRequest.created_by, required: false }
    ];

    let completedRequired = 0;
    let completedOptional = 0;

    console.log('\n✅ THÔNG TIN BẮT BUỘC:');
    requiredFields.forEach(field => {
      const hasValue = field.value && field.value !== 'N/A';
      if (hasValue) completedRequired++;
      console.log(`   ${hasValue ? '✅' : '❌'} ${field.name}: ${field.value || 'N/A'}`);
    });

    console.log('\n📝 THÔNG TIN TÙY CHỌN:');
    optionalFields.forEach(field => {
      const hasValue = field.value && field.value !== 'N/A';
      if (hasValue) completedOptional++;
      console.log(`   ${hasValue ? '✅' : '⚠️ '} ${field.name}: ${field.value || 'N/A'}`);
    });

    const totalRequired = requiredFields.length;
    const totalOptional = optionalFields.length;
    const totalFields = totalRequired + totalOptional;

    const requiredPercentage = (completedRequired / totalRequired) * 100;
    const optionalPercentage = (completedOptional / totalOptional) * 100;
    const overallPercentage = ((completedRequired + completedOptional) / totalFields) * 100;

    console.log('\n📈 KẾT QUẢ PHÂN TÍCH:');
    console.log('=' .repeat(50));
    console.log(`📊 Thông tin bắt buộc: ${completedRequired}/${totalRequired} (${requiredPercentage.toFixed(1)}%)`);
    console.log(`📝 Thông tin tùy chọn: ${completedOptional}/${totalOptional} (${optionalPercentage.toFixed(1)}%)`);
    console.log(`🎯 Tổng cộng: ${completedRequired + completedOptional}/${totalFields} (${overallPercentage.toFixed(1)}%)`);

    console.log('\n🎯 ĐÁNH GIÁ:');
    if (overallPercentage >= 90) {
      console.log('   🏆 XUẤT SẮC - Đủ thông tin để tạo phiếu EIR hoàn chỉnh');
    } else if (overallPercentage >= 80) {
      console.log('   ✅ TỐT - Đủ thông tin cơ bản để tạo phiếu EIR');
    } else if (overallPercentage >= 70) {
      console.log('   ⚠️  KHÁ - Cần bổ sung thêm thông tin');
    } else {
      console.log('   ❌ CHƯA ĐỦ - Cần bổ sung nhiều thông tin');
    }

    console.log('\n📋 THÔNG TIN ĐÃ SỬ DỤNG TRONG PHIẾU EIR:');
    console.log('=' .repeat(50));
    console.log('✅ Đã sử dụng:');
    console.log(`   - Container: ${latestRequest.container_no}`);
    console.log(`   - Khách hàng: ${latestRequest.customer?.name || 'N/A'}`);
    console.log(`   - Hãng tàu: ${latestRequest.shipping_line?.code || 'N/A'}`);
    console.log(`   - Loại container: ${latestRequest.container_type?.description || 'N/A'}`);
    console.log(`   - Seal số: ${latestRequest.seal_number || 'N/A'}`);
    console.log(`   - Số xe: ${latestRequest.license_plate || 'N/A'}`);
    console.log(`   - Tài xế: ${latestRequest.driver_name || 'N/A'}`);
    console.log(`   - SĐT tài xế: ${latestRequest.driver_phone || 'N/A'}`);

    console.log('\n⚠️  THÔNG TIN CHƯA SỬ DỤNG:');
    console.log('   - DEM/DET: Có thể thêm vào phiếu EIR');
    console.log('   - Request ID: Thông tin nội bộ');
    console.log('   - Created By: Thông tin nội bộ');
    console.log('   - Timestamps: Thông tin nội bộ');

  } catch (error) {
    console.error('❌ Lỗi khi phân tích container OO11:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeOO11Completion();
