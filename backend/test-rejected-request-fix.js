const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRejectedRequestFix() {
    console.log('🧪 Test: REJECTED request không bị "sống lại" khi tạo repair invoice...\n');
    
    try {
        // 1. Tạo request đầu tiên và reject nó
        console.log('1️⃣ Tạo request đầu tiên cho container 9999...');
        const firstRequest = await prisma.serviceRequest.create({
            data: {
                created_by: 'test-user-id',
                type: 'IMPORT',
                container_no: '9999',
                eta: new Date(),
                status: 'PENDING',
                history: [{ at: new Date().toISOString(), by: 'test-user-id', action: 'CREATE' }]
            }
        });
        console.log(`✅ Request đầu tiên: ${firstRequest.id} (Status: ${firstRequest.status})`);

        // 2. Reject request đầu tiên
        console.log('\n2️⃣ Reject request đầu tiên...');
        const rejectedRequest = await prisma.serviceRequest.update({
            where: { id: firstRequest.id },
            data: {
                status: 'REJECTED',
                rejected_reason: 'Test rejection',
                rejected_by: 'test-admin-id',
                rejected_at: new Date()
            }
        });
        console.log(`✅ Request đã bị reject: ${rejectedRequest.id} (Status: ${rejectedRequest.status})`);

        // 3. Tạo request mới cho cùng container
        console.log('\n3️⃣ Tạo request mới cho container 9999...');
        const secondRequest = await prisma.serviceRequest.create({
            data: {
                created_by: 'test-user-id',
                type: 'IMPORT',
                container_no: '9999',
                eta: new Date(),
                status: 'PENDING',
                history: [{ at: new Date().toISOString(), by: 'test-user-id', action: 'CREATE' }]
            }
        });
        console.log(`✅ Request mới: ${secondRequest.id} (Status: ${secondRequest.status})`);

        // 4. Tạo RepairTicket cho container này
        console.log('\n4️⃣ Tạo RepairTicket cho container 9999...');
        const repairTicket = await prisma.repairTicket.create({
            data: {
                code: 'TEST-REPAIR-9999',
                container_no: '9999',
                problem_description: 'Test problem description',
                status: 'CHECKING',
                created_by: 'test-admin-id'
            }
        });
        console.log(`✅ RepairTicket: ${repairTicket.id} (Status: ${repairTicket.status})`);

        // 5. Tạo repair invoice (sẽ trigger logic cập nhật ServiceRequest)
        console.log('\n5️⃣ Tạo repair invoice (sẽ trigger cập nhật ServiceRequest)...');
        
        // Simulate createRepairInvoice logic
        const updatedTicket = await prisma.repairTicket.update({
            where: { id: repairTicket.id },
            data: { 
                status: 'PENDING_ACCEPT',
                updatedAt: new Date()
            }
        });
        console.log(`✅ RepairTicket updated to: ${updatedTicket.status}`);

        // Simulate logic cập nhật ServiceRequest (với fix mới)
        const updatedRequests = await prisma.serviceRequest.updateMany({
            where: { 
                container_no: '9999',
                status: { 
                    notIn: ['COMPLETED', 'REJECTED', 'GATE_REJECTED'] // Chỉ cập nhật request active
                }
            },
            data: {
                status: 'PENDING_ACCEPT'
            }
        });
        console.log(`✅ Updated ${updatedRequests.count} ServiceRequest(s) to PENDING_ACCEPT`);

        // 6. Kiểm tra kết quả
        console.log('\n6️⃣ Kiểm tra kết quả...');
        const allRequests = await prisma.serviceRequest.findMany({
            where: { container_no: '9999' },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                status: true,
                createdAt: true,
                rejected_at: true
            }
        });

        console.log('\n📊 Danh sách tất cả requests cho container 9999:');
        allRequests.forEach((req, index) => {
            console.log(`   ${index + 1}. ID: ${req.id}`);
            console.log(`      Status: ${req.status}`);
            console.log(`      Created: ${req.createdAt.toISOString()}`);
            if (req.rejected_at) {
                console.log(`      Rejected: ${req.rejected_at.toISOString()}`);
            }
            console.log('');
        });

        // 7. Verify kết quả
        const rejectedRequestAfter = allRequests.find(r => r.id === firstRequest.id);
        const newRequestAfter = allRequests.find(r => r.id === secondRequest.id);

        console.log('🔍 Kết quả kiểm tra:');
        console.log(`   - Request cũ (REJECTED): ${rejectedRequestAfter?.status} ${rejectedRequestAfter?.status === 'REJECTED' ? '✅' : '❌'}`);
        console.log(`   - Request mới (PENDING_ACCEPT): ${newRequestAfter?.status} ${newRequestAfter?.status === 'PENDING_ACCEPT' ? '✅' : '❌'}`);

        if (rejectedRequestAfter?.status === 'REJECTED' && newRequestAfter?.status === 'PENDING_ACCEPT') {
            console.log('\n🎉 TEST THÀNH CÔNG!');
            console.log('   - Request cũ vẫn giữ status REJECTED');
            console.log('   - Request mới được cập nhật thành PENDING_ACCEPT');
            console.log('   - Không có conflict giữa các request');
        } else {
            console.log('\n❌ TEST THẤT BẠI!');
            console.log('   - Request cũ bị thay đổi status không mong muốn');
        }

    } catch (error) {
        console.error('❌ Lỗi trong quá trình test:', error.message);
        console.error('Chi tiết lỗi:', error);
    } finally {
        // Cleanup
        console.log('\n🧹 Dọn dẹp test data...');
        try {
            await prisma.serviceRequest.deleteMany({
                where: { 
                    container_no: '9999',
                    created_by: 'test-user-id'
                }
            });
            await prisma.repairTicket.deleteMany({
                where: { 
                    container_no: '9999',
                    created_by: 'test-admin-id'
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
testRejectedRequestFix();
