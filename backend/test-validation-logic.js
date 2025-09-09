const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Simulate RequestBaseService validation logic
async function validateContainerNotExists(container_no) {
    console.log(`🔍 Kiểm tra container ${container_no}...`);
    
    const containerExists = await prisma.$queryRaw`
        WITH latest_sr AS (
            SELECT DISTINCT ON (sr.container_no)
                sr.container_no,
                sr.status as service_status,
                sr.gate_checked_at as gate_checked_at,
                sr.type as request_type,
                sr.id as request_id
            FROM "ServiceRequest" sr
            WHERE sr.container_no IS NOT NULL
            ORDER BY sr.container_no, sr."createdAt" DESC
        ),
        rt_checked AS (
            SELECT DISTINCT ON (rt.container_no)
                rt.container_no,
                TRUE as repair_checked,
                rt."updatedAt" as updated_at
            FROM "RepairTicket" rt
            WHERE rt.status::text = 'CHECKED' AND rt.container_no IS NOT NULL
            ORDER BY rt.container_no, rt."updatedAt" DESC
        ),
        yard_placement AS (
            SELECT DISTINCT ON (yp.container_no)
                yp.container_no,
                yp.status as placement_status,
                yp.placed_at
            FROM "YardPlacement" yp 
            WHERE yp.status = 'OCCUPIED' 
                AND yp.removed_at IS NULL
                AND yp.container_no IS NOT NULL
            ORDER BY yp.container_no, yp.placed_at DESC
        )
        SELECT 
            COALESCE(sr.container_no, rt.container_no, yp.container_no) as container_no,
            sr.service_status,
            sr.gate_checked_at,
            sr.request_type,
            sr.request_id,
            COALESCE(rt.repair_checked, FALSE) as repair_checked,
            yp.placement_status,
            yp.placed_at,
            CASE 
                WHEN sr.container_no IS NOT NULL THEN 'SERVICE_REQUEST'
                WHEN rt.container_no IS NOT NULL THEN 'REPAIR_TICKET'
                WHEN yp.container_no IS NOT NULL THEN 'YARD_PLACEMENT'
            END as source
        FROM latest_sr sr
        FULL OUTER JOIN rt_checked rt ON rt.container_no = sr.container_no
        FULL OUTER JOIN yard_placement yp ON yp.container_no = COALESCE(sr.container_no, rt.container_no)
        WHERE sr.container_no = ${container_no} 
            OR rt.container_no = ${container_no} 
            OR yp.container_no = ${container_no}
    `;

    if (containerExists.length === 0) {
        console.log(`✅ Container ${container_no} không tồn tại - cho phép tạo request`);
        return true;
    }

    const container = containerExists[0];
    console.log(`📋 Container ${container_no} tồn tại:`);
    console.log(`   - Source: ${container.source}`);
    console.log(`   - Status: ${container.service_status}`);
    console.log(`   - Request ID: ${container.request_id}`);

    if (container.source === 'SERVICE_REQUEST') {
        const isCompleted = ['COMPLETED', 'REJECTED', 'GATE_REJECTED'].includes(container.service_status);
        if (!isCompleted) {
            console.log(`❌ Container ${container_no} đang active với status ${container.service_status} - KHÔNG cho phép tạo request mới`);
            return false;
        }
        
        if (['REJECTED', 'GATE_REJECTED'].includes(container.service_status)) {
            console.log(`✅ Container ${container_no} đã bị ${container.service_status} - CHO PHÉP tạo request mới`);
            return true;
        }
    }

    return false;
}

async function testValidationLogic() {
    console.log('🧪 Bắt đầu test Validation Logic...\n');
    
    try {
        // 1. Tạo request đầu tiên
        console.log('1️⃣ Tạo request đầu tiên cho container 5678...');
        const firstRequest = await prisma.serviceRequest.create({
            data: {
                created_by: 'test-user-id',
                type: 'IMPORT',
                container_no: '5678',
                eta: new Date(),
                status: 'PENDING',
                history: [{ at: new Date().toISOString(), by: 'test-user-id', action: 'CREATE' }]
            }
        });
        console.log(`✅ Request đầu tiên: ${firstRequest.id} (Status: ${firstRequest.status})\n`);

        // 2. Test validation khi container đang PENDING
        console.log('2️⃣ Test validation khi container đang PENDING...');
        const canCreateWhenPending = await validateContainerNotExists('5678');
        console.log(`Kết quả: ${canCreateWhenPending ? '✅ Cho phép' : '❌ Từ chối'}\n`);

        // 3. Reject request
        console.log('3️⃣ Reject request...');
        await prisma.serviceRequest.update({
            where: { id: firstRequest.id },
            data: {
                status: 'REJECTED',
                rejected_reason: 'Test rejection',
                rejected_by: 'test-admin-id',
                rejected_at: new Date()
            }
        });
        console.log(`✅ Request đã bị reject\n`);

        // 4. Test validation khi container đã REJECTED
        console.log('4️⃣ Test validation khi container đã REJECTED...');
        const canCreateWhenRejected = await validateContainerNotExists('5678');
        console.log(`Kết quả: ${canCreateWhenRejected ? '✅ Cho phép' : '❌ Từ chối'}\n`);

        // 5. Tạo request mới nếu được phép
        if (canCreateWhenRejected) {
            console.log('5️⃣ Tạo request mới...');
            const secondRequest = await prisma.serviceRequest.create({
                data: {
                    created_by: 'test-user-id',
                    type: 'IMPORT',
                    container_no: '5678',
                    eta: new Date(),
                    status: 'PENDING',
                    history: [{ at: new Date().toISOString(), by: 'test-user-id', action: 'CREATE' }]
                }
            });
            console.log(`✅ Request mới: ${secondRequest.id}`);
            console.log(`   ID khác nhau: ${firstRequest.id !== secondRequest.id ? '✅ CÓ' : '❌ KHÔNG'}\n`);
        }

        // 6. Test với container không tồn tại
        console.log('6️⃣ Test với container không tồn tại (9999)...');
        const canCreateNewContainer = await validateContainerNotExists('9999');
        console.log(`Kết quả: ${canCreateNewContainer ? '✅ Cho phép' : '❌ Từ chối'}\n`);

        console.log('🎉 Test validation logic hoàn thành!');

    } catch (error) {
        console.error('❌ Lỗi trong quá trình test:', error.message);
    } finally {
        // Cleanup
        console.log('🧹 Dọn dẹp test data...');
        try {
            await prisma.serviceRequest.deleteMany({
                where: { 
                    container_no: '5678',
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
testValidationLogic();
