/**
 * Script debug container SA011 - Tại sao không hiển thị trong ManagerCont?
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugSA011Container() {
  try {
    console.log('🔍 Debug Container SA011 - Tại sao không hiển thị trong ManagerCont?');
    console.log('=' .repeat(70));

    const containerNo = 'SA011';

    // 1. Kiểm tra YardSlot
    console.log('📍 1. Kiểm tra YardSlot:');
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
      console.log(`   - Slot ID: ${yardSlot.id}`);
      console.log(`   - Yard: ${yardSlot.block?.yard?.name || 'N/A'}`);
      console.log(`   - Block: ${yardSlot.block?.code || 'N/A'}`);
      console.log(`   - Slot: ${yardSlot.code || 'N/A'}`);
      console.log(`   - Trạng thái: ${yardSlot.status}`);
      console.log(`   - Container: ${yardSlot.occupant_container_no}`);
    } else {
      console.log('❌ Không tìm thấy trong YardSlot');
    }

    // 2. Kiểm tra YardPlacement (stacking system)
    console.log('\n📦 2. Kiểm tra YardPlacement:');
    const yardPlacements = await prisma.yardPlacement.findMany({
      where: { container_no: containerNo },
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

    if (yardPlacements.length > 0) {
      console.log('✅ Tìm thấy trong YardPlacement:');
      yardPlacements.forEach((placement, index) => {
        console.log(`   Placement ${index + 1}:`);
        console.log(`   - ID: ${placement.id}`);
        console.log(`   - Yard: ${placement.slot?.block?.yard?.name || 'N/A'}`);
        console.log(`   - Block: ${placement.slot?.block?.code || 'N/A'}`);
        console.log(`   - Slot: ${placement.slot?.code || 'N/A'}`);
        console.log(`   - Tier: ${placement.tier}`);
        console.log(`   - Status: ${placement.status}`);
        console.log(`   - Placed at: ${placement.placed_at}`);
        console.log(`   - Removed at: ${placement.removed_at || 'N/A'}`);
      });
    } else {
      console.log('❌ Không tìm thấy trong YardPlacement');
    }

    // 3. Kiểm tra ServiceRequest
    console.log('\n📋 3. Kiểm tra ServiceRequest:');
    const serviceRequests = await prisma.serviceRequest.findMany({
      where: { container_no: containerNo },
      orderBy: { createdAt: 'desc' }
    });

    if (serviceRequests.length > 0) {
      console.log('✅ Tìm thấy ServiceRequest:');
      serviceRequests.forEach((req, index) => {
        console.log(`   Request ${index + 1}:`);
        console.log(`   - ID: ${req.id}`);
        console.log(`   - Type: ${req.type}`);
        console.log(`   - Status: ${req.status}`);
        console.log(`   - Created: ${req.createdAt}`);
        console.log(`   - Updated: ${req.updatedAt}`);
      });
    } else {
      console.log('❌ Không tìm thấy ServiceRequest');
    }

    // 4. Kiểm tra Container model
    console.log('\n📦 4. Kiểm tra Container model:');
    const container = await prisma.container.findUnique({
      where: { container_no: containerNo }
    });

    if (container) {
      console.log('✅ Tìm thấy trong Container model:');
      console.log(`   - ID: ${container.id}`);
      console.log(`   - Status: ${container.status}`);
      console.log(`   - Created: ${container.createdAt}`);
      console.log(`   - Updated: ${container.updatedAt}`);
    } else {
      console.log('❌ Không tìm thấy trong Container model');
    }

    // 5. Kiểm tra logic ManagerCont
    console.log('\n🔍 5. Phân tích logic ManagerCont:');
    
    // Kiểm tra ServiceRequest với trạng thái được lấy
    const activeServiceRequests = await prisma.serviceRequest.findMany({
      where: { 
        container_no: containerNo,
        status: {
          in: ['PENDING', 'NEW_REQUEST', 'FORWARDED', 'GATE_IN', 'IN_YARD', 'IN_CAR', 'FORKLIFTING', 'CHECKED']
        }
      }
    });

    console.log(`   - ServiceRequest với trạng thái active: ${activeServiceRequests.length}`);
    if (activeServiceRequests.length > 0) {
      activeServiceRequests.forEach(req => {
        console.log(`     * ${req.status} (${req.type}) - ${req.createdAt}`);
      });
    }

    // Kiểm tra container trong yard (không filter service_status)
    const containersInYard = await prisma.$queryRaw`
      SELECT DISTINCT yp.container_no, yp.status as placement_status, yp.placed_at,
             y.name as yard_name, yb.code as block_code, ys.code as slot_code
      FROM "YardPlacement" yp
      LEFT JOIN "YardSlot" ys ON ys.id = yp.slot_id
      LEFT JOIN "YardBlock" yb ON yb.id = ys.block_id
      LEFT JOIN "Yard" y ON y.id = yb.yard_id
      WHERE yp.container_no = ${containerNo}
        AND yp.status = 'OCCUPIED' 
        AND yp.removed_at IS NULL
    `;

    console.log(`   - Container trong yard (YardPlacement): ${containersInYard.length}`);
    if (containersInYard.length > 0) {
      containersInYard.forEach((container) => {
        console.log(`     * Yard: ${container.yard_name || 'N/A'}`);
        console.log(`     * Block: ${container.block_code || 'N/A'}`);
        console.log(`     * Slot: ${container.slot_code || 'N/A'}`);
        console.log(`     * Placed: ${container.placed_at}`);
      });
    }

    // 6. Kết luận
    console.log('\n🎯 6. Kết luận:');
    const hasYardPosition = yardSlot || yardPlacements.length > 0;
    const hasActiveServiceRequest = activeServiceRequests.length > 0;
    
    console.log(`   - Có vị trí trong yard: ${hasYardPosition ? '✅' : '❌'}`);
    console.log(`   - Có ServiceRequest active: ${hasActiveServiceRequest ? '✅' : '❌'}`);
    
    if (hasYardPosition && !hasActiveServiceRequest) {
      console.log('   🔍 Container SA011 có vị trí trong yard nhưng không có ServiceRequest active');
      console.log('   💡 Lý do: Logic ManagerCont chỉ lấy container có ServiceRequest hoặc container trong yard');
      console.log('   💡 Giải pháp: Container sẽ hiển thị qua logic EMPTY_IN_YARD (nếu có vị trí)');
    } else if (!hasYardPosition) {
      console.log('   ❌ Container SA011 không có vị trí trong yard');
    } else {
      console.log('   ✅ Container SA011 có cả vị trí và ServiceRequest - sẽ hiển thị bình thường');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSA011Container();
