const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAPIDirect() {
  console.log('🧪 Test API Direct - Kiểm tra API endpoint trực tiếp\n');

  try {
    // 1. Tìm ServiceRequest của IM1235
    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: { 
        container_no: 'IM1235',
        type: 'IMPORT'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!serviceRequest) {
      console.log('❌ Không tìm thấy ServiceRequest cho IM1235');
      return;
    }

    console.log(`✅ Tìm thấy ServiceRequest: ${serviceRequest.id}`);

    // 2. Test logic getAllFiles() giống như trong FileUploadService
    console.log('\n2. Test logic getAllFiles() giống FileUploadService:');
    
    const files = await prisma.requestAttachment.findMany({
      where: {
        request_id: serviceRequest.id
        // Không filter deleted_at để lấy tất cả files
      },
      orderBy: {
        uploaded_at: 'desc'
      }
    });

    const result = {
      success: true,
      data: files
    };

    console.log('Result structure:', JSON.stringify({
      success: result.success,
      dataCount: result.data.length,
      data: result.data.map(f => ({ 
        file_name: f.file_name, 
        deleted_at: f.deleted_at 
      }))
    }, null, 2));

    // 3. So sánh với logic cũ
    console.log('\n3. So sánh với logic cũ:');
    const oldFiles = await prisma.requestAttachment.findMany({
      where: {
        request_id: serviceRequest.id,
        deleted_at: null
      },
      orderBy: {
        uploaded_at: 'desc'
      }
    });

    console.log(`Logic mới (tất cả): ${files.length} files`);
    console.log(`Logic cũ (active): ${oldFiles.length} files`);

    // 4. Kết luận
    console.log('\n4. Kết luận:');
    if (files.length === 2) {
      console.log('✅ API endpoint sẽ trả về đúng 2 attachments');
      console.log('✅ Frontend sẽ hiển thị đúng 2 chứng từ');
    } else {
      console.log(`⚠️ API endpoint sẽ trả về ${files.length} attachments`);
    }

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPIDirect();
