const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test toàn bộ workflow
async function testFullWorkflow() {
  console.log('🧪 Test toàn bộ workflow tạo hóa đơn...');
  
  try {
    // 1. Kiểm tra danh sách container cần tạo hóa đơn
    console.log('\n📋 1. Kiểm tra danh sách container cần tạo hóa đơn:');
    const containersNeedInvoice = await prisma.serviceRequest.findMany({
      where: {
        status: {
          in: ['IN_YARD', 'IN_CAR', 'GATE_OUT']
        }
      },
      select: {
        id: true,
        container_no: true,
        type: true,
        status: true,
        has_invoice: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('📦 Containers cần tạo hóa đơn:', containersNeedInvoice.length);
    containersNeedInvoice.forEach(container => {
      console.log(`  - ${container.container_no} (${container.type}) - has_invoice: ${container.has_invoice}`);
    });

    // 2. Kiểm tra hóa đơn hiện có
    console.log('\n📄 2. Kiểm tra hóa đơn hiện có:');
    const invoices = await prisma.invoice.findMany({
      select: {
        id: true,
        customer_id: true,
        source_module: true,
        source_id: true,
        status: true,
        total_amount: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('📋 Hóa đơn hiện có:', invoices.length);
    invoices.forEach(invoice => {
      console.log(`  - ID: ${invoice.id}, Source: ${invoice.source_module}/${invoice.source_id}, Amount: ${invoice.total_amount}`);
    });

    // 3. Kiểm tra ServiceRequest có hóa đơn
    console.log('\n🔗 3. Kiểm tra ServiceRequest có hóa đơn:');
    const serviceRequestsWithInvoice = await prisma.serviceRequest.findMany({
      where: {
        has_invoice: true
      },
      select: {
        id: true,
        container_no: true,
        type: true,
        has_invoice: true,
        updatedAt: true
      }
    });
    
    console.log('📦 ServiceRequest có hóa đơn:', serviceRequestsWithInvoice.length);
    serviceRequestsWithInvoice.forEach(sr => {
      console.log(`  - ${sr.container_no} (${sr.type}) - has_invoice: ${sr.has_invoice}`);
    });

    // 4. Kiểm tra thư mục upload
    console.log('\n📁 4. Kiểm tra thư mục upload:');
    const fs = require('fs');
    const uploadDir = 'D:\\container21\\manageContainer\\backend\\uploads';
    
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      console.log('📁 Files trong thư mục upload:', files.length);
      files.forEach(file => {
        console.log(`  - ${file}`);
      });
    } else {
      console.log('❌ Thư mục upload không tồn tại:', uploadDir);
    }

    console.log('\n🎯 Để test thực tế:');
    console.log('1. Mở frontend: http://localhost:5002/finance/invoices');
    console.log('2. Click "Danh sách container cần tạo hóa đơn"');
    console.log('3. Click "Tạo hóa đơn" cho container ISO 1234');
    console.log('4. Chọn file EIR (nếu muốn)');
    console.log('5. Click "Hoàn tất"');
    console.log('6. Kiểm tra:');
    console.log('   - Hóa đơn được tạo với đầy đủ thông tin');
    console.log('   - has_invoice được cập nhật thành true');
    console.log('   - Container bị xóa khỏi danh sách cần tạo hóa đơn');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy test
testFullWorkflow();
