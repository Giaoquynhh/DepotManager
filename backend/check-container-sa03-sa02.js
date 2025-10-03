/**
 * Script kiểm tra trạng thái container SA03 và SA02
 * So sánh sự khác nhau giữa hai container
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkContainerStatus(containerNo) {
  console.log(`\n🔍 Kiểm tra container ${containerNo}...`);
  console.log('='.repeat(50));

  const result = {
    containerNo,
    yardPlacement: null,
    container: null,
    serviceRequests: [],
    canLift: false,
    reason: ''
  };

  // 1. Kiểm tra trong YardPlacement
  console.log('📍 1. Kiểm tra vị trí trong yard:');
  const yardPlacement = await prisma.yardPlacement.findFirst({
    where: {
      container_no: containerNo,
      status: 'OCCUPIED',
      removed_at: null
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

  if (yardPlacement) {
    console.log(`✅ Container ${containerNo} đang trong yard:`);
    const placementInfo = {
      container_no: yardPlacement.container_no,
      yard: yardPlacement.slot?.block?.yard?.name,
      block: yardPlacement.slot?.block?.code,
      slot: yardPlacement.slot?.code,
      tier: yardPlacement.tier,
      placed_at: yardPlacement.placed_at,
      status: yardPlacement.status
    };
    console.log(placementInfo);
    result.yardPlacement = placementInfo;
  } else {
    console.log(`❌ Container ${containerNo} không có trong yard hoặc không ở trạng thái OCCUPIED`);
  }

  // 2. Kiểm tra trong Container table
  console.log('\n📦 2. Kiểm tra trong Container table:');
  const container = await prisma.container.findUnique({
    where: { container_no: containerNo },
    include: {
      shipping_line: {
        select: { id: true, name: true, code: true }
      },
      container_type: {
        select: { id: true, code: true, description: true }
      },
      customer: {
        select: { id: true, name: true, code: true }
      }
    }
  });

  if (container) {
    console.log(`✅ Container ${containerNo} có trong Container table:`);
    const containerInfo = {
      container_no: container.container_no,
      shipping_line_id: container.shipping_line_id,
      shipping_line: container.shipping_line,
      container_type_id: container.container_type_id,
      container_type: container.container_type,
      customer_id: container.customer_id,
      customer: container.customer,
      seal_number: container.seal_number,
      dem_det: container.dem_det
    };
    console.log(containerInfo);
    result.container = containerInfo;
  } else {
    console.log(`❌ Container ${containerNo} không có trong Container table`);
  }

  // 3. Kiểm tra ServiceRequest
  console.log('\n📋 3. Kiểm tra ServiceRequest:');
  const serviceRequests = await prisma.serviceRequest.findMany({
    where: { container_no: containerNo },
    orderBy: { createdAt: 'desc' },
    include: {
      shipping_line: {
        select: { id: true, name: true, code: true }
      },
      container_type: {
        select: { id: true, code: true, description: true }
      },
      customer: {
        select: { id: true, name: true, code: true }
      }
    }
  });

  if (serviceRequests.length > 0) {
    console.log(`✅ Tìm thấy ${serviceRequests.length} ServiceRequest cho ${containerNo}:`);
    serviceRequests.forEach((sr, index) => {
      console.log(`\n   Request ${index + 1}:`);
      const srInfo = {
        id: sr.id,
        type: sr.type,
        status: sr.status,
        shipping_line_id: sr.shipping_line_id,
        shipping_line: sr.shipping_line,
        container_type: sr.container_type,
        customer: sr.customer,
        created_at: sr.createdAt,
        updated_at: sr.updatedAt
      };
      console.log(srInfo);
      result.serviceRequests.push(srInfo);
    });
  } else {
    console.log(`❌ Không có ServiceRequest nào cho ${containerNo}`);
  }

  // 4. Kiểm tra điều kiện có thể nâng
  console.log('\n🏗️ 4. Kiểm tra điều kiện có thể nâng:');
  
  let canLift = false;
  let reason = '';

  if (yardPlacement) {
    // Kiểm tra điều kiện 1: EMPTY_IN_YARD (SystemAdmin thêm)
    if (!serviceRequests.length && container && container.shipping_line_id) {
      canLift = true;
      reason = 'EMPTY_IN_YARD - Container được SystemAdmin thêm';
    }
    
    // Kiểm tra điều kiện 2: GATE_OUT với type IMPORT
    const latestSR = serviceRequests[0];
    if (latestSR && latestSR.status === 'GATE_OUT' && latestSR.type === 'IMPORT') {
      canLift = true;
      reason = 'GATE_OUT (IMPORT) - Container đã hoàn thành quy trình import';
    }
  }

  if (canLift) {
    console.log(`✅ Container ${containerNo} CÓ THỂ NÂNG: ${reason}`);
  } else {
    console.log(`❌ Container ${containerNo} KHÔNG THỂ NÂNG`);
    if (!yardPlacement) {
      console.log('   - Lý do: Container không có trong yard');
      reason = 'Không có trong yard';
    } else if (serviceRequests.length === 0 && (!container || !container.shipping_line_id)) {
      console.log('   - Lý do: Container không có shipping_line_id trong Container table');
      reason = 'Không có shipping_line_id';
    } else if (serviceRequests.length > 0) {
      const latestSR = serviceRequests[0];
      console.log(`   - Lý do: ServiceRequest có status "${latestSR.status}" và type "${latestSR.type}" (cần GATE_OUT + IMPORT)`);
      reason = `ServiceRequest: ${latestSR.status} (${latestSR.type})`;
    }
  }

  result.canLift = canLift;
  result.reason = reason;

  return result;
}

async function compareContainers() {
  try {
    console.log('🔍 KIỂM TRA TRẠNG THÁI CONTAINER SA03 VÀ SA02');
    console.log('='.repeat(60));

    // Kiểm tra SA03
    const sa03Result = await checkContainerStatus('SA03');
    
    // Kiểm tra SA02
    const sa02Result = await checkContainerStatus('SA02');

    // So sánh kết quả
    console.log('\n📊 SO SÁNH KẾT QUẢ:');
    console.log('='.repeat(60));

    console.log('\n🏗️ Điều kiện có thể nâng:');
    console.log(`SA03: ${sa03Result.canLift ? '✅ CÓ THỂ NÂNG' : '❌ KHÔNG THỂ NÂNG'} - ${sa03Result.reason}`);
    console.log(`SA02: ${sa02Result.canLift ? '✅ CÓ THỂ NÂNG' : '❌ KHÔNG THỂ NÂNG'} - ${sa02Result.reason}`);

    console.log('\n📍 Vị trí trong yard:');
    console.log(`SA03: ${sa03Result.yardPlacement ? '✅ Có trong yard' : '❌ Không có trong yard'}`);
    console.log(`SA02: ${sa02Result.yardPlacement ? '✅ Có trong yard' : '❌ Không có trong yard'}`);

    console.log('\n📦 Container table:');
    console.log(`SA03: ${sa03Result.container ? '✅ Có trong Container table' : '❌ Không có trong Container table'}`);
    console.log(`SA02: ${sa02Result.container ? '✅ Có trong Container table' : '❌ Không có trong Container table'}`);

    console.log('\n📋 ServiceRequest:');
    console.log(`SA03: ${sa03Result.serviceRequests.length} request(s)`);
    console.log(`SA02: ${sa02Result.serviceRequests.length} request(s)`);

    if (sa03Result.serviceRequests.length > 0) {
      console.log('SA03 ServiceRequests:');
      sa03Result.serviceRequests.forEach((sr, index) => {
        console.log(`  ${index + 1}. ${sr.type} - ${sr.status} (${sr.created_at})`);
      });
    }

    if (sa02Result.serviceRequests.length > 0) {
      console.log('SA02 ServiceRequests:');
      sa02Result.serviceRequests.forEach((sr, index) => {
        console.log(`  ${index + 1}. ${sr.type} - ${sr.status} (${sr.created_at})`);
      });
    }

    // Phân tích sự khác nhau
    console.log('\n🔍 PHÂN TÍCH SỰ KHÁC NHAU:');
    console.log('='.repeat(60));

    if (sa03Result.canLift !== sa02Result.canLift) {
      console.log(`⚠️ Khác nhau về khả năng nâng: SA03 ${sa03Result.canLift ? 'có thể' : 'không thể'} nâng, SA02 ${sa02Result.canLift ? 'có thể' : 'không thể'} nâng`);
    } else {
      console.log(`✅ Cùng khả năng nâng: ${sa03Result.canLift ? 'Cả hai đều có thể nâng' : 'Cả hai đều không thể nâng'}`);
    }

    if (sa03Result.yardPlacement && sa02Result.yardPlacement) {
      if (sa03Result.yardPlacement.yard !== sa02Result.yardPlacement.yard) {
        console.log(`⚠️ Khác nhau về bãi: SA03 ở ${sa03Result.yardPlacement.yard}, SA02 ở ${sa02Result.yardPlacement.yard}`);
      } else {
        console.log(`✅ Cùng bãi: ${sa03Result.yardPlacement.yard}`);
      }
    }

    if (sa03Result.serviceRequests.length !== sa02Result.serviceRequests.length) {
      console.log(`⚠️ Khác nhau về số lượng ServiceRequest: SA03 có ${sa03Result.serviceRequests.length}, SA02 có ${sa02Result.serviceRequests.length}`);
    } else {
      console.log(`✅ Cùng số lượng ServiceRequest: ${sa03Result.serviceRequests.length}`);
    }

    console.log('\n🎉 Kiểm tra hoàn tất!');

  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy kiểm tra
if (require.main === module) {
  compareContainers();
}
