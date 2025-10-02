/**
 * Script test đơn giản để kiểm tra API containers
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSimpleContainerQuery() {
  try {
    console.log('🧪 Testing simple container queries...\n');

    // Test 1: Kiểm tra bảng YardPlacement
    console.log('📋 Test 1: Kiểm tra YardPlacement');
    const yardPlacements = await prisma.yardPlacement.findMany({
      where: {
        status: 'OCCUPIED',
        removed_at: null,
        container_no: { not: null }
      },
      take: 5,
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
    
    console.log(`Found ${yardPlacements.length} containers in yard`);
    if (yardPlacements.length > 0) {
      console.log('Sample:', {
        container_no: yardPlacements[0].container_no,
        yard: yardPlacements[0].slot?.block?.yard?.name,
        block: yardPlacements[0].slot?.block?.code,
        slot: yardPlacements[0].slot?.code
      });
    }

    // Test 2: Kiểm tra bảng Container
    console.log('\n📋 Test 2: Kiểm tra Container table');
    const containers = await prisma.container.findMany({
      take: 5,
      include: {
        shipping_line: true,
        container_type: true,
        customer: true
      }
    });
    
    console.log(`Found ${containers.length} containers in Container table`);
    if (containers.length > 0) {
      console.log('Sample:', {
        container_no: containers[0].container_no,
        shipping_line: containers[0].shipping_line?.name,
        container_type: containers[0].container_type?.code
      });
    }

    // Test 3: Kiểm tra ServiceRequest
    console.log('\n📋 Test 3: Kiểm tra ServiceRequest');
    const serviceRequests = await prisma.serviceRequest.findMany({
      where: {
        container_no: { not: null }
      },
      take: 5,
      include: {
        shipping_line: true,
        container_type: true,
        customer: true
      }
    });
    
    console.log(`Found ${serviceRequests.length} service requests with containers`);
    if (serviceRequests.length > 0) {
      console.log('Sample:', {
        container_no: serviceRequests[0].container_no,
        type: serviceRequests[0].type,
        status: serviceRequests[0].status,
        shipping_line: serviceRequests[0].shipping_line?.name
      });
    }

    // Test 4: Kiểm tra ShippingLine
    console.log('\n📋 Test 4: Kiểm tra ShippingLine');
    const shippingLines = await prisma.shippingLine.findMany({
      take: 5
    });
    
    console.log(`Found ${shippingLines.length} shipping lines`);
    if (shippingLines.length > 0) {
      console.log('Sample shipping line ID for testing:', shippingLines[0].id);
      console.log('Sample shipping line:', {
        id: shippingLines[0].id,
        code: shippingLines[0].code,
        name: shippingLines[0].name
      });
    }

    console.log('\n🎉 Simple tests completed!');
    
    return shippingLines[0]?.id; // Return first shipping line ID for testing

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy test
if (require.main === module) {
  testSimpleContainerQuery();
}

module.exports = { testSimpleContainerQuery };
