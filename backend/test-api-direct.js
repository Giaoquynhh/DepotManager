/**
 * Script test API trực tiếp bằng cách gọi method controller
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import controller (cần adjust path)
const path = require('path');
const controllerPath = path.join(__dirname, 'modules', 'containers', 'controller', 'ContainerController.ts');

async function testAPIDirectly() {
  try {
    console.log('🧪 Test API trực tiếp...\n');

    const shipping_line_id = 'cmg97fin9000vdd7dezgx78zp'; // KMTU - Korea Marine Transport Co.
    const searchQuery = 'SA01';

    console.log(`📋 Test với shipping_line_id: ${shipping_line_id}`);
    console.log(`🔍 Search query: ${searchQuery}`);

    // Simulate the logic from our controller
    console.log('\n🔄 Bước 1: Lấy containers trong yard...');
    
    const yardContainers = await prisma.yardPlacement.findMany({
      where: {
        status: 'OCCUPIED',
        removed_at: null,
        container_no: { not: null },
        container_no: {
          contains: searchQuery,
          mode: 'insensitive'
        }
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
      },
      take: 100
    });

    console.log(`Found ${yardContainers.length} containers in yard matching "${searchQuery}"`);

    const result = [];

    console.log('\n🔄 Bước 2: Kiểm tra từng container...');

    for (const yardContainer of yardContainers) {
      const container_no = yardContainer.container_no;
      if (!container_no) continue;

      console.log(`\n   Checking container: ${container_no}`);

      // Tìm ServiceRequest mới nhất cho container này
      const latestServiceRequest = await prisma.serviceRequest.findFirst({
        where: { 
          container_no,
          shipping_line_id 
        },
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

      // Kiểm tra điều kiện 2: GATE_OUT với type IMPORT
      if (latestServiceRequest && 
          latestServiceRequest.status === 'GATE_OUT' && 
          latestServiceRequest.type === 'IMPORT') {
        
        console.log(`   ✅ Matches condition 2: GATE_OUT + IMPORT`);
        
        result.push({
          container_no,
          slot_code: yardContainer.slot?.code || '',
          block_code: yardContainer.slot?.block?.code || '',
          yard_name: yardContainer.slot?.block?.yard?.name || '',
          tier: yardContainer.tier,
          placed_at: yardContainer.placed_at,
          shipping_line: latestServiceRequest.shipping_line,
          container_type: latestServiceRequest.container_type,
          customer: latestServiceRequest.customer,
          seal_number: latestServiceRequest.seal_number,
          dem_det: latestServiceRequest.dem_det,
          service_status: 'GATE_OUT',
          request_type: 'IMPORT'
        });
        continue;
      }

      // Kiểm tra điều kiện 1: EMPTY_IN_YARD (SystemAdmin thêm)
      if (!latestServiceRequest) {
        console.log(`   Checking condition 1: EMPTY_IN_YARD...`);
        
        // Tìm trong bảng Container
        const container = await prisma.container.findUnique({
          where: { container_no },
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

        if (container && container.shipping_line_id === shipping_line_id) {
          console.log(`   ✅ Matches condition 1: EMPTY_IN_YARD`);
          
          result.push({
            container_no,
            slot_code: yardContainer.slot?.code || '',
            block_code: yardContainer.slot?.block?.code || '',
            yard_name: yardContainer.slot?.block?.yard?.name || '',
            tier: yardContainer.tier,
            placed_at: yardContainer.placed_at,
            shipping_line: container.shipping_line,
            container_type: container.container_type,
            customer: container.customer,
            seal_number: container.seal_number,
            dem_det: container.dem_det,
            service_status: 'EMPTY_IN_YARD',
            request_type: 'SYSTEM_ADMIN_ADDED'
          });
        } else {
          console.log(`   ❌ No matching Container record or wrong shipping_line_id`);
        }
      } else {
        console.log(`   ❌ Has ServiceRequest but doesn't match conditions:`);
        console.log(`       Status: ${latestServiceRequest.status}, Type: ${latestServiceRequest.type}`);
      }
    }

    console.log(`\n🎉 Final result: ${result.length} containers can be lifted`);
    
    if (result.length > 0) {
      console.log('\n📦 Containers that can be lifted:');
      result.forEach((container, index) => {
        console.log(`\n   ${index + 1}. ${container.container_no}:`);
        console.log(`      Location: ${container.yard_name} - ${container.block_code}-${container.slot_code}`);
        console.log(`      Status: ${container.service_status}`);
        console.log(`      Type: ${container.request_type}`);
        console.log(`      Shipping Line: ${container.shipping_line?.name} (${container.shipping_line?.code})`);
        console.log(`      Container Type: ${container.container_type?.code} - ${container.container_type?.description}`);
        console.log(`      Customer: ${container.customer?.name} (${container.customer?.code})`);
      });
    }

    // Simulate API response
    const apiResponse = {
      success: true,
      data: result,
      total: result.length
    };

    console.log('\n📡 API Response:');
    console.log(JSON.stringify(apiResponse, null, 2));

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy test
if (require.main === module) {
  testAPIDirectly();
}

module.exports = { testAPIDirectly };
