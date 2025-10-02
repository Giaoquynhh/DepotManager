/**
 * Script kiểm tra container SA01
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkContainerSA01() {
  try {
    console.log('🔍 Kiểm tra container SA01...\n');

    const containerNo = 'SA01';

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
      console.log('✅ Container SA01 đang trong yard:');
      console.log({
        container_no: yardPlacement.container_no,
        yard: yardPlacement.slot?.block?.yard?.name,
        block: yardPlacement.slot?.block?.code,
        slot: yardPlacement.slot?.code,
        tier: yardPlacement.tier,
        placed_at: yardPlacement.placed_at,
        status: yardPlacement.status
      });
    } else {
      console.log('❌ Container SA01 không có trong yard hoặc không ở trạng thái OCCUPIED');
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
      console.log('✅ Container SA01 có trong Container table:');
      console.log({
        container_no: container.container_no,
        shipping_line_id: container.shipping_line_id,
        shipping_line: container.shipping_line,
        container_type_id: container.container_type_id,
        container_type: container.container_type,
        customer_id: container.customer_id,
        customer: container.customer,
        seal_number: container.seal_number,
        dem_det: container.dem_det
      });
    } else {
      console.log('❌ Container SA01 không có trong Container table');
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
      console.log(`✅ Tìm thấy ${serviceRequests.length} ServiceRequest cho SA01:`);
      serviceRequests.forEach((sr, index) => {
        console.log(`\n   Request ${index + 1}:`);
        console.log({
          id: sr.id,
          type: sr.type,
          status: sr.status,
          shipping_line_id: sr.shipping_line_id,
          shipping_line: sr.shipping_line,
          container_type: sr.container_type,
          customer: sr.customer,
          created_at: sr.createdAt,
          updated_at: sr.updatedAt
        });
      });
    } else {
      console.log('❌ Không có ServiceRequest nào cho container SA01');
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
      console.log(`✅ Container SA01 CÓ THỂ NÂNG: ${reason}`);
    } else {
      console.log('❌ Container SA01 KHÔNG THỂ NÂNG');
      if (!yardPlacement) {
        console.log('   - Lý do: Container không có trong yard');
      } else if (serviceRequests.length === 0 && (!container || !container.shipping_line_id)) {
        console.log('   - Lý do: Container không có shipping_line_id trong Container table');
      } else if (serviceRequests.length > 0) {
        const latestSR = serviceRequests[0];
        console.log(`   - Lý do: ServiceRequest có status "${latestSR.status}" và type "${latestSR.type}" (cần GATE_OUT + IMPORT)`);
      }
    }

    // 5. Test API mới với shipping line của container
    if (container && container.shipping_line_id) {
      console.log('\n🧪 5. Test API mới:');
      console.log(`Shipping line ID: ${container.shipping_line_id}`);
      console.log('Để test API, gọi:');
      console.log(`GET /containers/yard/by-shipping-line/${container.shipping_line_id}?q=SA01`);
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
  checkContainerSA01();
}

module.exports = { checkContainerSA01 };
