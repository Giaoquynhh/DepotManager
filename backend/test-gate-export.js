const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testGateExport() {
  try {
    console.log('🔍 Kiểm tra database cho GATE_IN requests...');
    
    // Kiểm tra tất cả requests có status GATE_IN
    const gateInRequests = await prisma.serviceRequest.findMany({
      where: {
        status: 'GATE_IN'
      },
      select: {
        id: true,
        container_no: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log(`\n📊 Tổng số requests có status GATE_IN: ${gateInRequests.length}`);
    
    if (gateInRequests.length > 0) {
      console.log('\n📋 Chi tiết các requests GATE_IN:');
      gateInRequests.forEach((req, index) => {
        console.log(`${index + 1}. ID: ${req.id}`);
        console.log(`   Container: ${req.container_no || 'N/A'}`);
        console.log(`   Type: ${req.type || 'N/A'}`);
        console.log(`   Status: ${req.status}`);
        console.log(`   Created: ${req.createdAt}`);
        console.log(`   Updated: ${req.updatedAt}`);
        console.log('---');
      });
    }
    
    // Kiểm tra theo type
    const exportRequests = await prisma.serviceRequest.findMany({
      where: {
        type: 'EXPORT'
      },
      select: {
        id: true,
        container_no: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log(`\n📦 Tổng số EXPORT requests: ${exportRequests.length}`);
    
    if (exportRequests.length > 0) {
      console.log('\n📋 Chi tiết các EXPORT requests:');
      exportRequests.forEach((req, index) => {
        console.log(`${index + 1}. ID: ${req.id}`);
        console.log(`   Container: ${req.container_no || 'N/A'}`);
        console.log(`   Type: ${req.type}`);
        console.log(`   Status: ${req.status}`);
        console.log(`   Created: ${req.createdAt}`);
        console.log(`   Updated: ${req.updatedAt}`);
        console.log('---');
      });
    }
    
    // Kiểm tra IMPORT requests
    const importRequests = await prisma.serviceRequest.findMany({
      where: {
        type: 'IMPORT'
      },
      select: {
        id: true,
        container_no: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log(`\n📥 Tổng số IMPORT requests: ${importRequests.length}`);
    
    // Kiểm tra cụ thể EXPORT requests có status GATE_IN
    const exportGateInRequests = await prisma.serviceRequest.findMany({
      where: {
        type: 'EXPORT',
        status: 'GATE_IN'
      },
      select: {
        id: true,
        container_no: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log(`\n🎯 EXPORT requests có status GATE_IN: ${exportGateInRequests.length}`);
    
    if (exportGateInRequests.length > 0) {
      console.log('\n📋 Chi tiết EXPORT requests GATE_IN:');
      exportGateInRequests.forEach((req, index) => {
        console.log(`${index + 1}. ID: ${req.id}`);
        console.log(`   Container: ${req.container_no || 'N/A'}`);
        console.log(`   Type: ${req.type}`);
        console.log(`   Status: ${req.status}`);
        console.log(`   Created: ${req.createdAt}`);
        console.log(`   Updated: ${req.updatedAt}`);
        console.log('---');
      });
    }
    
    // Kiểm tra tất cả status có trong database
    const allStatuses = await prisma.serviceRequest.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });
    
    console.log('\n📊 Thống kê theo status:');
    allStatuses.forEach((status) => {
      console.log(`   ${status.status}: ${status._count.status}`);
    });
    
    // Kiểm tra tất cả types có trong database
    const allTypes = await prisma.serviceRequest.groupBy({
      by: ['type'],
      _count: {
        type: true
      }
    });
    
    console.log('\n📊 Thống kê theo type:');
    allTypes.forEach((type) => {
      console.log(`   ${type.type || 'NULL'}: ${type._count.type}`);
    });
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testGateExport();
