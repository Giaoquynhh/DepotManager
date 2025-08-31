const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateSamplePaymentStatus() {
  try {
    console.log('🔄 Updating sample payment status data...');
    
    // Lấy tất cả requests hiện có
    const requests = await prisma.serviceRequest.findMany({
      take: 10, // Chỉ lấy 10 requests đầu tiên để test
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 Found ${requests.length} requests to update`);
    
    // Cập nhật trạng thái thanh toán cho từng request
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      
      // Tạo dữ liệu mẫu ngẫu nhiên
      const hasInvoice = Math.random() > 0.3; // 70% có hóa đơn
      const isPaid = hasInvoice && Math.random() > 0.4; // 60% đã thanh toán nếu có hóa đơn
      
      console.log(`\n📝 Updating request ${request.id} (${request.container_no || 'No container'})`);
      console.log(`   - has_invoice: ${hasInvoice}`);
      console.log(`   - is_paid: ${isPaid}`);
      
      // Cập nhật request
      const updatedRequest = await prisma.serviceRequest.update({
        where: { id: request.id },
        data: {
          has_invoice: hasInvoice,
          is_paid: isPaid,
          updatedAt: new Date()
        }
      });
      
      console.log(`   ✅ Updated successfully`);
    }
    
    console.log('\n✨ All sample data updated successfully!');
    
    // Hiển thị thống kê
    const stats = await prisma.serviceRequest.groupBy({
      by: ['has_invoice', 'is_paid'],
      _count: true
    });
    
    console.log('\n📊 Payment Status Statistics:');
    stats.forEach(stat => {
      const invoiceStatus = stat.has_invoice ? 'Có hóa đơn' : 'Chưa có hóa đơn';
      const paymentStatus = stat.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán';
      console.log(`   - ${invoiceStatus} + ${paymentStatus}: ${stat._count} requests`);
    });
    
  } catch (error) {
    console.error('❌ Error updating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy function nếu file được execute trực tiếp
if (require.main === module) {
  updateSamplePaymentStatus();
}

module.exports = { updateSamplePaymentStatus };
