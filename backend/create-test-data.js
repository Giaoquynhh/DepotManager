const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('=== Tạo dữ liệu test cho Gate hạ container ===');
    
    // Lấy admin user
    const admin = await prisma.user.findFirst({
      where: { role: 'SystemAdmin' }
    });
    
    if (!admin) {
      console.log('Không tìm thấy admin user');
      return;
    }
    
    console.log('Admin user:', admin.email);
    
    // Tạo các test requests với các status khác nhau
    const testRequests = [
      {
        container_no: 'TEST001',
        status: 'PENDING',
        request_no: 'HA25092500001'
      },
      {
        container_no: 'TEST002', 
        status: 'PENDING',
        request_no: 'HA25092500002'
      },
      {
        container_no: 'TEST003',
        status: 'GATE_IN',
        request_no: 'HA25092500003'
      },
      {
        container_no: 'TEST004',
        status: 'GATE_OUT',
        request_no: 'HA25092500004'
      },
      {
        container_no: 'TEST005',
        status: 'IN_YARD',
        request_no: 'HA25092500005'
      },
      {
        container_no: 'TEST006',
        status: 'FORWARDED',
        request_no: 'HA25092500006'
      },
      {
        container_no: 'TEST007',
        status: 'PENDING',
        request_no: 'HA25092500007'
      },
      {
        container_no: 'TEST008',
        status: 'GATE_IN',
        request_no: 'HA25092500008'
      }
    ];
    
    for (const req of testRequests) {
      const existing = await prisma.serviceRequest.findFirst({
        where: { container_no: req.container_no }
      });
      
      if (!existing) {
        await prisma.serviceRequest.create({
          data: {
            created_by: admin.id,
            type: 'IMPORT',
            container_no: req.container_no,
            status: req.status,
            request_no: req.request_no,
            driver_name: 'Tài xế Test',
            driver_phone: '0123456789',
            license_plate: '51H-123.45'
          }
        });
        console.log(`Tạo request: ${req.container_no} - ${req.status}`);
      } else {
        console.log(`Request đã tồn tại: ${req.container_no}`);
      }
    }
    
    // Kiểm tra kết quả
    const totalImport = await prisma.serviceRequest.count({
      where: { type: 'IMPORT' }
    });
    console.log(`Tổng số IMPORT requests: ${totalImport}`);
    
    const byStatus = await prisma.serviceRequest.groupBy({
      by: ['status'],
      where: { type: 'IMPORT' },
      _count: { status: true }
    });
    console.log('IMPORT requests theo status:', byStatus);
    
  } catch (error) {
    console.error('Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
