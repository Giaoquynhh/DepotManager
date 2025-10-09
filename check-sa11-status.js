/**
 * Script kiểm tra trạng thái container SA11
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSA11Status() {
  try {
    console.log('🔍 KIỂM TRA TRẠNG THÁI CONTAINER SA11');
    console.log('='.repeat(60));

    const containerNo = 'SA11';

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
      console.log(`   - Bãi: ${yardPlacement.slot?.block?.yard?.name || 'N/A'}`);
      console.log(`   - Block: ${yardPlacement.slot?.block?.code || 'N/A'}`);
      console.log(`   - Slot: ${yardPlacement.slot?.code || 'N/A'}`);
      console.log(`   - Tầng: ${yardPlacement.tier || 'N/A'}`);
      console.log(`   - Ngày đặt: ${yardPlacement.placed_at || 'N/A'}`);
      console.log(`   - Trạng thái: ${yardPlacement.status}`);
    } else {
      console.log(`❌ Container ${containerNo} không có trong yard hoặc không ở trạng thái OCCUPIED`);
    }

    console.log('\n' + '-'.repeat(40) + '\n');

    // 2. Kiểm tra Container model
    console.log('📦 2. Kiểm tra Container model:');
    const container = await prisma.container.findUnique({
      where: { container_no: containerNo },
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

    if (container) {
      console.log('✅ Tìm thấy trong Container:');
      console.log(`   - ID: ${container.id}`);
      console.log(`   - Status: ${container.status}`);
      console.log(`   - Khách hàng: ${container.customer?.name || 'N/A'} (${container.customer?.code || 'N/A'})`);
      console.log(`   - Hãng tàu: ${container.shipping_line?.name || 'N/A'} (${container.shipping_line?.code || 'N/A'})`);
      console.log(`   - Loại container: ${container.container_type?.description || 'N/A'} (${container.container_type?.code || 'N/A'})`);
      console.log(`   - Seal số: ${container.seal_number || 'N/A'}`);
      console.log(`   - DEM/DET: ${container.dem_det || 'N/A'}`);
      console.log(`   - Yard: ${container.yard_name || 'N/A'}`);
      console.log(`   - Block: ${container.block_code || 'N/A'}`);
      console.log(`   - Slot: ${container.slot_code || 'N/A'}`);
      console.log(`   - Created by: ${container.created_by}`);
      console.log(`   - Ngày tạo: ${container.createdAt}`);
      console.log(`   - Ngày cập nhật: ${container.updatedAt}`);
    } else {
      console.log('❌ Không tìm thấy trong Container');
    }

    console.log('\n' + '-'.repeat(40) + '\n');

    // 3. Kiểm tra YardSlot
    console.log('📍 3. Kiểm tra YardSlot:');
    const yardSlot = await prisma.yardSlot.findFirst({
      where: { occupant_container_no: containerNo },
      include: {
        block: {
          include: {
            yard: true
          }
        }
      }
    });

    if (yardSlot) {
      console.log('✅ Tìm thấy trong YardSlot:');
      console.log(`   - Yard: ${yardSlot.block?.yard?.name || 'N/A'}`);
      console.log(`   - Block: ${yardSlot.block?.code || 'N/A'}`);
      console.log(`   - Slot: ${yardSlot.code || 'N/A'}`);
      console.log(`   - Trạng thái: ${yardSlot.status || 'N/A'}`);
    } else {
      console.log('❌ Không tìm thấy trong YardSlot');
    }

    console.log('\n' + '-'.repeat(40) + '\n');

    // 4. Kiểm tra ServiceRequest
    console.log('📋 4. Kiểm tra ServiceRequest:');
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
        console.log(`   - ID: ${sr.id}`);
        console.log(`   - Type: ${sr.type}`);
        console.log(`   - Status: ${sr.status}`);
        console.log(`   - Khách hàng: ${sr.customer?.name || 'N/A'}`);
        console.log(`   - Hãng tàu: ${sr.shipping_line?.name || 'N/A'}`);
        console.log(`   - Loại container: ${sr.container_type?.description || 'N/A'}`);
        console.log(`   - Ngày tạo: ${sr.createdAt}`);
        console.log(`   - Ngày cập nhật: ${sr.updatedAt}`);
      });
    } else {
      console.log(`❌ Không có ServiceRequest nào cho ${containerNo}`);
    }

    console.log('\n' + '-'.repeat(40) + '\n');

    // 5. Kiểm tra điều kiện có thể nâng
    console.log('🏗️ 5. Kiểm tra điều kiện có thể nâng:');
    
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

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Kiểm tra hoàn tất!');

  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy kiểm tra
if (require.main === module) {
  checkSA11Status();
}

module.exports = { checkSA11Status };
