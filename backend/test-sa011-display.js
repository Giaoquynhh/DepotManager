/**
 * Script test container SA011 sẽ hiển thị trong ManagerCont sau khi sửa
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSA011Display() {
  try {
    console.log('🧪 Test Container SA011 Display Logic');
    console.log('=' .repeat(50));

    const containerNo = 'SA011';

    // 1. Kiểm tra ServiceRequest với trạng thái GATE_IN
    console.log('📋 1. Kiểm tra ServiceRequest GATE_IN:');
    const gateInRequest = await prisma.serviceRequest.findFirst({
      where: { 
        container_no: containerNo,
        status: 'GATE_IN'
      }
    });

    if (gateInRequest) {
      console.log('✅ Tìm thấy ServiceRequest GATE_IN:');
      console.log(`   - ID: ${gateInRequest.id}`);
      console.log(`   - Type: ${gateInRequest.type}`);
      console.log(`   - Status: ${gateInRequest.status}`);
      console.log(`   - Created: ${gateInRequest.createdAt}`);
    } else {
      console.log('❌ Không tìm thấy ServiceRequest GATE_IN');
    }

    // 2. Kiểm tra vị trí trong yard
    console.log('\n📍 2. Kiểm tra vị trí trong yard:');
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
      console.log('✅ Container có vị trí trong yard:');
      console.log(`   - Yard: ${yardPlacement.slot?.block?.yard?.name || 'N/A'}`);
      console.log(`   - Block: ${yardPlacement.slot?.block?.code || 'N/A'}`);
      console.log(`   - Slot: ${yardPlacement.slot?.code || 'N/A'}`);
      console.log(`   - Tier: ${yardPlacement.tier}`);
    } else {
      console.log('❌ Container không có vị trí trong yard');
    }

    // 3. Mô phỏng logic ManagerCont
    console.log('\n🔍 3. Mô phỏng logic ManagerCont:');
    
    // Kiểm tra ServiceRequest với trạng thái được lấy
    const activeRequests = await prisma.serviceRequest.findMany({
      where: { 
        container_no: containerNo,
        status: {
          in: ['PENDING', 'NEW_REQUEST', 'FORWARDED', 'GATE_IN', 'IN_YARD', 'IN_CAR', 'FORKLIFTING', 'CHECKED']
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`   - ServiceRequest active: ${activeRequests.length}`);
    activeRequests.forEach(req => {
      console.log(`     * ${req.status} (${req.type}) - ${req.createdAt}`);
    });

    // Kiểm tra logic filter mới
    console.log('\n🎯 4. Logic filter mới:');
    const hasPosition = yardPlacement && (yardPlacement.slot?.block?.yard?.name || yardPlacement.slot?.block?.code || yardPlacement.slot?.code);
    
    if (activeRequests.length > 0) {
      const latestRequest = activeRequests[0];
      const requestStatus = latestRequest.status;
      
      console.log(`   - Latest request status: ${requestStatus}`);
      console.log(`   - Has position: ${hasPosition ? '✅' : '❌'}`);
      
      // Logic filter mới: chỉ ẩn PENDING và REJECTED
      const shouldHide = ['PENDING', 'REJECTED'].includes(requestStatus);
      
      console.log(`   - Should hide: ${shouldHide ? '❌' : '✅'}`);
      
      if (requestStatus === 'GATE_IN' && hasPosition) {
        console.log('   ✅ Container SA011 SẼ HIỂN THỊ trong ManagerCont');
        console.log('   💡 Lý do: GATE_IN + có vị trí trong yard');
      } else if (shouldHide) {
        console.log('   ❌ Container SA011 sẽ bị ẩn');
        console.log('   💡 Lý do: Trạng thái bị ẩn');
      } else {
        console.log('   ✅ Container SA011 SẼ HIỂN THỊ trong ManagerCont');
        console.log('   💡 Lý do: Trạng thái được phép hiển thị');
      }
    } else {
      console.log('   ❌ Không có ServiceRequest active');
    }

    // 5. Kết luận
    console.log('\n🎉 5. Kết luận:');
    if (activeRequests.length > 0 && hasPosition) {
      const latestRequest = activeRequests[0];
      const shouldHide = ['PENDING', 'REJECTED'].includes(latestRequest.status);
      
      if (!shouldHide) {
        console.log('   ✅ Container SA011 sẽ hiển thị trong ManagerCont');
        console.log('   📍 Vị trí: Yard B, Block B1, Slot B1-5');
        console.log('   📋 Trạng thái: GATE_IN (EXPORT)');
      } else {
        console.log('   ❌ Container SA011 vẫn bị ẩn');
      }
    } else {
      console.log('   ❌ Container SA011 không đủ điều kiện hiển thị');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSA011Display();
