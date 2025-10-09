const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkIM9996Issue() {
  try {
    console.log('🔍 Kiểm tra vấn đề IM9996 không xuất hiện trong gợi ý...\n');

    const containers = ['IM9996', 'IM1235', 'IM1234'];
    const shippingLineId = 'KMTU_ID'; // Thay thế bằng ID thực tế của KMTU

    for (const containerNo of containers) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`📦 KIỂM TRA CONTAINER: ${containerNo}`);
      console.log(`${'='.repeat(50)}`);

      // 1. Kiểm tra YardPlacement
      console.log('\n📍 1. Kiểm tra YardPlacement:');
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
        console.log('✅ Container có trong yard:');
        console.log(`   - Vị trí: ${yardPlacement.slot?.block?.yard?.name} - ${yardPlacement.slot?.block?.code} - ${yardPlacement.slot?.code}`);
        console.log(`   - Tier: ${yardPlacement.tier}`);
        console.log(`   - Placed at: ${yardPlacement.placed_at}`);
      } else {
        console.log('❌ Container KHÔNG có trong yard');
        continue;
      }

      // 2. Kiểm tra Container table
      console.log('\n📦 2. Kiểm tra Container table:');
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
        console.log('✅ Container có trong bảng Container:');
        console.log(`   - Status: ${container.status}`);
        console.log(`   - Shipping Line: ${container.shipping_line?.name || 'NULL'} (ID: ${container.shipping_line_id || 'NULL'})`);
        console.log(`   - Customer: ${container.customer?.name || 'NULL'} (ID: ${container.customer_id || 'NULL'})`);
        console.log(`   - Container Type: ${container.container_type?.code || 'NULL'} (ID: ${container.container_type_id || 'NULL'})`);
      } else {
        console.log('❌ Container KHÔNG có trong bảng Container');
      }

      // 3. Kiểm tra ServiceRequest
      console.log('\n📋 3. Kiểm tra ServiceRequest:');
      const serviceRequests = await prisma.serviceRequest.findMany({
        where: { container_no: containerNo },
        include: {
          shipping_line: {
            select: { id: true, name: true, code: true }
          },
          customer: {
            select: { id: true, name: true, code: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (serviceRequests.length > 0) {
        console.log(`✅ Có ${serviceRequests.length} ServiceRequest(s):`);
        serviceRequests.forEach((req, index) => {
          console.log(`   ${index + 1}. ID: ${req.id}`);
          console.log(`      - Type: ${req.type}`);
          console.log(`      - Status: ${req.status}`);
          console.log(`      - Shipping Line: ${req.shipping_line?.name || 'NULL'} (ID: ${req.shipping_line_id || 'NULL'})`);
          console.log(`      - Customer: ${req.customer?.name || 'NULL'} (ID: ${req.customer_id || 'NULL'})`);
          console.log(`      - Created: ${req.createdAt}`);
          console.log(`      - Deleted: ${req.depot_deleted_at ? 'YES' : 'NO'}`);
        });
      } else {
        console.log('❌ Container KHÔNG có ServiceRequest nào');
      }

      // 4. Kiểm tra RepairTicket
      console.log('\n🔧 4. Kiểm tra RepairTicket:');
      const repairTickets = await prisma.repairTicket.findMany({
        where: { container_no: containerNo },
        orderBy: { updatedAt: 'desc' }
      });

      if (repairTickets.length > 0) {
        console.log(`✅ Có ${repairTickets.length} RepairTicket(s):`);
        repairTickets.forEach((ticket, index) => {
          console.log(`   ${index + 1}. ID: ${ticket.id}`);
          console.log(`      - Status: ${ticket.status}`);
          console.log(`      - Updated: ${ticket.updatedAt}`);
        });
      } else {
        console.log('❌ Container KHÔNG có RepairTicket nào');
      }

      // 5. Kiểm tra logic gợi ý container
      console.log('\n🎯 5. Kiểm tra logic gợi ý container:');
      
      // Tìm ServiceRequest mới nhất với shipping line
      const latestServiceRequest = await prisma.serviceRequest.findFirst({
        where: { 
          container_no: containerNo,
          shipping_line_id: shippingLineId,
          depot_deleted_at: null
        },
        orderBy: { createdAt: 'desc' }
      });

      if (latestServiceRequest) {
        console.log('✅ Có ServiceRequest với shipping line KMTU:');
        console.log(`   - Type: ${latestServiceRequest.type}`);
        console.log(`   - Status: ${latestServiceRequest.status}`);
        
        if (latestServiceRequest.type === 'IMPORT' && 
            (latestServiceRequest.status === 'IN_YARD' || latestServiceRequest.status === 'GATE_OUT')) {
          console.log('✅ Thỏa mãn điều kiện IMPORT (IN_YARD hoặc GATE_OUT)');
          
          // Kiểm tra RepairTicket
          const repairTicket = await prisma.repairTicket.findFirst({
            where: { 
              container_no: containerNo,
              status: 'COMPLETE'
            },
            orderBy: { updatedAt: 'desc' }
          });

          if (repairTicket) {
            console.log('✅ Có RepairTicket COMPLETE - Container sẽ xuất hiện trong gợi ý');
          } else {
            console.log('❌ KHÔNG có RepairTicket COMPLETE - Container sẽ KHÔNG xuất hiện trong gợi ý');
          }
        } else if (latestServiceRequest.type === 'EXPORT' && latestServiceRequest.status === 'REJECTED') {
          console.log('✅ Thỏa mãn điều kiện EXPORT REJECTED - Kiểm tra ServiceRequest IMPORT...');
          
          const importRequest = await prisma.serviceRequest.findFirst({
            where: { 
              container_no: containerNo,
              type: 'IMPORT',
              status: { in: ['IN_YARD', 'GATE_OUT'] },
              depot_deleted_at: null
            },
            orderBy: { createdAt: 'desc' }
          });

          if (importRequest) {
            console.log('✅ Có ServiceRequest IMPORT hợp lệ');
            
            const repairTicket = await prisma.repairTicket.findFirst({
              where: { 
                container_no: containerNo,
                status: 'COMPLETE'
              },
              orderBy: { updatedAt: 'desc' }
            });

            if (repairTicket) {
              console.log('✅ Có RepairTicket COMPLETE - Container sẽ xuất hiện trong gợi ý');
            } else {
              console.log('❌ KHÔNG có RepairTicket COMPLETE - Container sẽ KHÔNG xuất hiện trong gợi ý');
            }
          } else {
            console.log('❌ KHÔNG có ServiceRequest IMPORT hợp lệ');
          }
        } else {
          console.log('❌ KHÔNG thỏa mãn điều kiện ServiceRequest');
        }
      } else {
        console.log('❌ KHÔNG có ServiceRequest với shipping line KMTU');
        
        // Kiểm tra EMPTY_IN_YARD
        if (container && (container.shipping_line_id === shippingLineId || !container.shipping_line_id)) {
          console.log('✅ Thỏa mãn điều kiện EMPTY_IN_YARD - Container sẽ xuất hiện trong gợi ý');
        } else {
          console.log('❌ KHÔNG thỏa mãn điều kiện EMPTY_IN_YARD');
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎯 KẾT LUẬN:');
    console.log('Container nào KHÔNG có dòng "Container sẽ xuất hiện trong gợi ý"');
    console.log('thì sẽ KHÔNG xuất hiện trong modal tạo yêu cầu nâng.');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkIM9996Issue();

