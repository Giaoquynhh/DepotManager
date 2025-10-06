const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function syncAttachmentsCount() {
    console.log('🔄 Bắt đầu đồng bộ attachments_count...');
    
    try {
        // Lấy tất cả requests
        const requests = await prisma.serviceRequest.findMany({
            select: { id: true, attachments_count: true }
        });
        
        console.log(`📊 Tìm thấy ${requests.length} requests`);
        
        let updatedCount = 0;
        
        for (const request of requests) {
            // Đếm số attachments thực tế (chưa bị xóa)
            const actualCount = await prisma.requestAttachment.count({
                where: {
                    request_id: request.id,
                    deleted_at: null
                }
            });
            
            // So sánh với attachments_count trong database
            if (actualCount !== request.attachments_count) {
                console.log(`🔧 Request ${request.id}: ${request.attachments_count} → ${actualCount}`);
                
                // Cập nhật attachments_count
                await prisma.serviceRequest.update({
                    where: { id: request.id },
                    data: { attachments_count: actualCount }
                });
                
                updatedCount++;
            }
        }
        
        console.log(`✅ Hoàn thành! Đã cập nhật ${updatedCount} requests`);
        
    } catch (error) {
        console.error('❌ Lỗi:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Chạy script
syncAttachmentsCount();
