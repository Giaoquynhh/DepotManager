const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test mối quan hệ ServiceRequest và Customer
async function testServiceRequestCustomer() {
  console.log('🧪 Test mối quan hệ ServiceRequest và Customer...');
  
  try {
    // 1. Kiểm tra ServiceRequest có hóa đơn
    console.log('\n📦 1. Kiểm tra ServiceRequest có hóa đơn:');
    const serviceRequests = await prisma.serviceRequest.findMany({
      where: {
        has_invoice: true
      },
      select: {
        id: true,
        container_no: true,
        type: true,
        tenant_id: true,
        has_invoice: true,
        created_by: true
      }
    });
    
    console.log('📦 ServiceRequest có hóa đơn:', serviceRequests.length);
    serviceRequests.forEach(sr => {
      console.log(`  - ${sr.container_no} (${sr.type}) - Tenant ID: ${sr.tenant_id}, Created by: ${sr.created_by}`);
    });

    // 2. Kiểm tra User tạo request
    console.log('\n👤 2. Kiểm tra User tạo request:');
    for (const sr of serviceRequests) {
      const user = await prisma.user.findUnique({
        where: { id: sr.created_by },
        select: {
          id: true,
          email: true,
          full_name: true,
          role: true
        }
      });
      
      console.log(`  - Container ${sr.container_no}:`);
      console.log(`    - User: ${user?.full_name} (${user?.email})`);
      console.log(`    - Role: ${user?.role}`);
    }

    // 3. Kiểm tra xem có thể lấy customer từ đâu khác
    console.log('\n🔍 3. Kiểm tra các trường có thể chứa customer info:');
    const sampleSR = await prisma.serviceRequest.findFirst({
      select: {
        id: true,
        container_no: true,
        type: true,
        tenant_id: true,
        created_by: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (sampleSR) {
      console.log('📋 Sample ServiceRequest fields:');
      Object.keys(sampleSR).forEach(key => {
        console.log(`  - ${key}: ${sampleSR[key]}`);
      });
    }

    // 4. Kiểm tra xem có model Customer nào khác không
    console.log('\n🏢 4. Kiểm tra các model liên quan:');
    const models = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%customer%' OR table_name LIKE '%partner%'
    `;
    
    console.log('📋 Models liên quan:', models);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy test
testServiceRequestCustomer();
