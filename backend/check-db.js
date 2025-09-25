const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('=== Kiểm tra ServiceRequest trong database ===');
    
    // Đếm tổng số record
    const totalCount = await prisma.serviceRequest.count();
    console.log(`Tổng số ServiceRequest: ${totalCount}`);
    
    // Đếm theo type
    const byType = await prisma.serviceRequest.groupBy({
      by: ['type'],
      _count: { type: true }
    });
    console.log('Theo type:', byType);
    
    // Đếm theo status
    const byStatus = await prisma.serviceRequest.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    console.log('Theo status:', byStatus);
    
    // Đếm IMPORT requests
    const importCount = await prisma.serviceRequest.count({
      where: { type: 'IMPORT' }
    });
    console.log(`Số IMPORT requests: ${importCount}`);
    
    // Đếm IMPORT requests theo status
    const importByStatus = await prisma.serviceRequest.groupBy({
      by: ['status'],
      where: { type: 'IMPORT' },
      _count: { status: true }
    });
    console.log('IMPORT requests theo status:', importByStatus);
    
    // Lấy 10 record gần nhất
    const recentRequests = await prisma.serviceRequest.findMany({
      where: { type: 'IMPORT' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        request_no: true,
        container_no: true,
        status: true,
        type: true,
        createdAt: true
      }
    });
    console.log('10 IMPORT requests gần nhất:', recentRequests);
    
  } catch (error) {
    console.error('Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
