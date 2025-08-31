const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Script để reset dữ liệu test - xóa hóa đơn và chuyển has_invoice = false
async function resetInvoiceTest() {
  console.log('=== Reset Invoice Test Data ===');
  
  try {
    // 1. Xóa tất cả hóa đơn
    console.log('🗑️ Xóa tất cả hóa đơn...');
    const deleteInvoices = await prisma.invoice.deleteMany({});
    console.log(`✅ Đã xóa ${deleteInvoices.count} hóa đơn`);
    
    // 2. Xóa tất cả invoice line items
    console.log('🗑️ Xóa tất cả invoice line items...');
    const deleteLineItems = await prisma.invoiceLineItem.deleteMany({});
    console.log(`✅ Đã xóa ${deleteLineItems.count} invoice line items`);
    
    // 3. Reset has_invoice = false cho tất cả ServiceRequest
    console.log('🔄 Reset has_invoice = false cho tất cả ServiceRequest...');
    const updateRequests = await prisma.serviceRequest.updateMany({
      where: {
        has_invoice: true
      },
      data: {
        has_invoice: false,
        updatedAt: new Date()
      }
    });
    console.log(`✅ Đã reset ${updateRequests.count} ServiceRequest về has_invoice = false`);
    
    // 4. Kiểm tra trạng thái hiện tại
    console.log('\n📊 Trạng thái hiện tại:');
    
    const invoiceCount = await prisma.invoice.count();
    console.log(`- Số lượng hóa đơn: ${invoiceCount}`);
    
    const lineItemCount = await prisma.invoiceLineItem.count();
    console.log(`- Số lượng invoice line items: ${lineItemCount}`);
    
    const requestsWithInvoice = await prisma.serviceRequest.count({
      where: { has_invoice: true }
    });
    console.log(`- ServiceRequest có has_invoice = true: ${requestsWithInvoice}`);
    
    const requestsWithoutInvoice = await prisma.serviceRequest.count({
      where: { has_invoice: false }
    });
    console.log(`- ServiceRequest có has_invoice = false: ${requestsWithoutInvoice}`);
    
    // 5. Hiển thị danh sách container có thể test
    console.log('\n📋 Danh sách container có thể test:');
    const containers = await prisma.serviceRequest.findMany({
      where: {
        container_no: { not: null },
        has_invoice: false
      },
      select: {
        id: true,
        container_no: true,
        type: true,
        status: true,
        has_invoice: true
      },
      take: 10
    });
    
    if (containers.length > 0) {
      containers.forEach((container, index) => {
        console.log(`${index + 1}. ${container.container_no} (${container.type}) - ${container.status}`);
      });
    } else {
      console.log('❌ Không có container nào để test');
    }
    
    console.log('\n✅ Reset hoàn tất! Bây giờ bạn có thể test lại tính năng tạo hóa đơn.');
    console.log('💡 Container sẽ xuất hiện lại trong danh sách "Danh sách container cần tạo hóa đơn"');
    
  } catch (error) {
    console.error('❌ Lỗi khi reset dữ liệu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
resetInvoiceTest();
