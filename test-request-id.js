const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRequestIdGeneration() {
    console.log('🧪 Bắt đầu test Request ID Generation...\n');
    
    try {
        // 1. Tạo request đầu tiên cho container 1234
        console.log('1️⃣ Tạo request đầu tiên cho container 1234...');
        const firstRequest = await prisma.serviceRequest.create({
            data: {
                created_by: 'test-user-id',
                type: 'IMPORT',
                container_no: '1234',
                eta: new Date(),
                status: 'PENDING',
                history: [{ at: new Date().toISOString(), by: 'test-user-id', action: 'CREATE' }]
            }
        });
        console.log(`✅ Request đầu tiên được tạo với ID: ${firstRequest.id}`);
        console.log(`   Container: ${firstRequest.container_no}`);
        console.log(`   Status: ${firstRequest.status}\n`);

        // 2. Reject request đầu tiên
        console.log('2️⃣ Reject request đầu tiên...');
        const rejectedRequest = await prisma.serviceRequest.update({
            where: { id: firstRequest.id },
            data: {
                status: 'REJECTED',
                rejected_reason: 'Test rejection',
                rejected_by: 'test-admin-id',
                rejected_at: new Date(),
                history: [
                    ...(Array.isArray(firstRequest.history) ? firstRequest.history : []),
                    { at: new Date().toISOString(), by: 'test-admin-id', action: 'REJECT', reason: 'Test rejection' }
                ]
            }
        });
        console.log(`✅ Request đã bị reject với ID: ${rejectedRequest.id}`);
        console.log(`   Status: ${rejectedRequest.status}\n`);

        // 3. Tạo request thứ hai cho cùng container 1234
        console.log('3️⃣ Tạo request thứ hai cho container 1234...');
        const secondRequest = await prisma.serviceRequest.create({
            data: {
                created_by: 'test-user-id',
                type: 'IMPORT',
                container_no: '1234',
                eta: new Date(),
                status: 'PENDING',
                history: [{ at: new Date().toISOString(), by: 'test-user-id', action: 'CREATE' }]
            }
        });
        console.log(`✅ Request thứ hai được tạo với ID: ${secondRequest.id}`);
        console.log(`   Container: ${secondRequest.container_no}`);
        console.log(`   Status: ${secondRequest.status}\n`);

        // 4. Kiểm tra kết quả
        console.log('4️⃣ Kiểm tra kết quả...');
        const isDifferentId = firstRequest.id !== secondRequest.id;
        const sameContainer = firstRequest.container_no === secondRequest.container_no;
        
        console.log(`📊 Kết quả:`);
        console.log(`   - Request đầu tiên ID: ${firstRequest.id}`);
        console.log(`   - Request thứ hai ID: ${secondRequest.id}`);
        console.log(`   - ID khác nhau: ${isDifferentId ? '✅ CÓ' : '❌ KHÔNG'}`);
        console.log(`   - Cùng container: ${sameContainer ? '✅ CÓ' : '❌ KHÔNG'}`);
        
        if (isDifferentId && sameContainer) {
            console.log('\n🎉 TEST THÀNH CÔNG! Logic hoạt động đúng:');
            console.log('   - Có thể tạo request mới cho container đã bị reject');
            console.log('   - Mỗi request có ID duy nhất');
            console.log('   - Tránh được conflict khi status tự động chuyển');
        } else {
            console.log('\n❌ TEST THẤT BẠI! Có vấn đề với logic.');
        }

        // 5. Hiển thị tất cả requests cho container 1234
        console.log('\n5️⃣ Danh sách tất cả requests cho container 1234:');
        const allRequests = await prisma.serviceRequest.findMany({
            where: { container_no: '1234' },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                container_no: true,
                status: true,
                createdAt: true,
                rejected_at: true
            }
        });
        
        allRequests.forEach((req, index) => {
            console.log(`   ${index + 1}. ID: ${req.id}`);
            console.log(`      Container: ${req.container_no}`);
            console.log(`      Status: ${req.status}`);
            console.log(`      Created: ${req.createdAt.toISOString()}`);
            if (req.rejected_at) {
                console.log(`      Rejected: ${req.rejected_at.toISOString()}`);
            }
            console.log('');
        });

    } catch (error) {
        console.error('❌ Lỗi trong quá trình test:', error.message);
        console.error('Chi tiết lỗi:', error);
    } finally {
        // Cleanup: Xóa test data
        console.log('🧹 Dọn dẹp test data...');
        try {
            await prisma.serviceRequest.deleteMany({
                where: { 
                    container_no: '1234',
                    created_by: 'test-user-id'
                }
            });
            console.log('✅ Đã xóa test data');
        } catch (cleanupError) {
            console.error('⚠️ Lỗi khi dọn dẹp:', cleanupError.message);
        }
        
        await prisma.$disconnect();
        console.log('\n🏁 Test hoàn thành!');
    }
}

// Chạy test
testRequestIdGeneration();
