const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEnhancedEIR() {
  try {
    console.log('🧪 TEST ENHANCED EIR SERVICE');
    console.log('=' .repeat(60));

    // Tìm request OO11
    const request = await prisma.serviceRequest.findFirst({
      where: { 
        container_no: 'OO11',
        type: 'EXPORT',
        status: 'GATE_OUT'
      },
      include: {
        customer: {
          select: { id: true, name: true, code: true }
        },
        shipping_line: {
          select: { id: true, name: true, code: true, template_eir: true }
        },
        container_type: {
          select: { id: true, code: true, description: true }
        }
      }
    });

    if (!request) {
      console.log('❌ Không tìm thấy request OO11');
      return;
    }

    console.log('✅ Tìm thấy request:');
    console.log(`   - Request ID: ${request.id}`);
    console.log(`   - Request No: ${request.request_no}`);
    console.log(`   - Container: ${request.container_no}`);
    console.log(`   - Template EIR: ${request.shipping_line?.template_eir}`);

    // Test EnhancedEIRService
    const { EnhancedEIRService } = require('./modules/gate/service/EnhancedEIRService.js');
    const enhancedEIRService = new EnhancedEIRService();

    console.log('\n🔧 Testing EnhancedEIRService...');
    const result = await enhancedEIRService.generateCompleteEIR(request.id);

    if (result.success) {
      console.log('✅ Enhanced EIR generated successfully!');
      console.log(`   - Filename: ${result.data.filename}`);
      console.log(`   - Buffer size: ${result.data.fileBuffer.length} bytes`);
    } else {
      console.log('❌ Enhanced EIR generation failed:');
      console.log(`   - Error: ${result.message}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEnhancedEIR();
