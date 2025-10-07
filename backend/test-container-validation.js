const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testContainerValidation() {
    try {
        console.log('🧪 TEST CONTAINER VALIDATION LOGIC MỚI');
        console.log('=' .repeat(60));

        const testContainerNo = 'TEST123';

        // Test Case 1: Container không tồn tại - nên cho phép tạo IMPORT request
        console.log('\n1. Test Case: Container không tồn tại');
        const nonExistentCheck = await checkContainerForImport(testContainerNo);
        console.log(`   Container ${testContainerNo}: ${nonExistentCheck.allowed ? '✅ Cho phép' : '❌ Không cho phép'}`);
        if (!nonExistentCheck.allowed) {
            console.log(`   Lý do: ${nonExistentCheck.reason}`);
        }

        // Test Case 2: Container có EXPORT request với status IN_CAR - không cho phép tạo IMPORT
        console.log('\n2. Test Case: Container có EXPORT request với status IN_CAR');
        
        // Tạo EXPORT request với status IN_CAR
        const exportRequest = await prisma.serviceRequest.create({
            data: {
                type: 'EXPORT',
                container_no: testContainerNo,
                status: 'IN_CAR',
                request_no: 'EXPORT_TEST_001',
                created_by: 'test_user',
                history: [{ at: new Date().toISOString(), by: 'test_user', action: 'CREATE' }]
            }
        });
        console.log(`   Đã tạo EXPORT request: ${exportRequest.id} với status IN_CAR`);

        const inCarCheck = await checkContainerForImport(testContainerNo);
        console.log(`   Container ${testContainerNo}: ${inCarCheck.allowed ? '✅ Cho phép' : '❌ Không cho phép'}`);
        if (!inCarCheck.allowed) {
            console.log(`   Lý do: ${inCarCheck.reason}`);
        }

        // Test Case 3: Cập nhật EXPORT request thành GATE_OUT - nên cho phép tạo IMPORT
        console.log('\n3. Test Case: Cập nhật EXPORT request thành GATE_OUT');
        await prisma.serviceRequest.update({
            where: { id: exportRequest.id },
            data: { 
                status: 'GATE_OUT',
                history: [{ at: new Date().toISOString(), by: 'test_user', action: 'UPDATE_STATUS' }]
            }
        });
        console.log(`   Đã cập nhật EXPORT request thành GATE_OUT`);

        const gateOutCheck = await checkContainerForImport(testContainerNo);
        console.log(`   Container ${testContainerNo}: ${gateOutCheck.allowed ? '✅ Cho phép' : '❌ Không cho phép'}`);
        if (!gateOutCheck.allowed) {
            console.log(`   Lý do: ${gateOutCheck.reason}`);
        }

        // Test Case 4: Tạo IMPORT request - nên thành công
        console.log('\n4. Test Case: Tạo IMPORT request');
        try {
            const importRequest = await prisma.serviceRequest.create({
                data: {
                    type: 'IMPORT',
                    container_no: testContainerNo,
                    status: 'PENDING',
                    request_no: 'IMPORT_TEST_001',
                    created_by: 'test_user',
                    history: [{ at: new Date().toISOString(), by: 'test_user', action: 'CREATE' }]
                }
            });
            console.log(`   ✅ Đã tạo thành công IMPORT request: ${importRequest.id}`);
        } catch (error) {
            console.log(`   ❌ Lỗi khi tạo IMPORT request: ${error.message}`);
        }

        // Test Case 5: Thử tạo IMPORT request thứ 2 - nên bị từ chối
        console.log('\n5. Test Case: Thử tạo IMPORT request thứ 2');
        const secondImportCheck = await checkContainerForImport(testContainerNo);
        console.log(`   Container ${testContainerNo}: ${secondImportCheck.allowed ? '✅ Cho phép' : '❌ Không cho phép'}`);
        if (!secondImportCheck.allowed) {
            console.log(`   Lý do: ${secondImportCheck.reason}`);
        }
        
        try {
            const importRequest2 = await prisma.serviceRequest.create({
                data: {
                    type: 'IMPORT',
                    container_no: testContainerNo,
                    status: 'PENDING',
                    request_no: 'IMPORT_TEST_002',
                    created_by: 'test_user',
                    history: [{ at: new Date().toISOString(), by: 'test_user', action: 'CREATE' }]
                }
            });
            console.log(`   ❌ Không nên tạo được IMPORT request thứ 2: ${importRequest2.id}`);
        } catch (error) {
            console.log(`   ✅ Đúng rồi, bị từ chối: ${error.message}`);
        }

        // Cleanup
        console.log('\n🧹 Cleanup test data...');
        await prisma.serviceRequest.deleteMany({
            where: { container_no: testContainerNo }
        });
        console.log('   ✅ Đã xóa test data');

        console.log('\n✅ Test hoàn thành!');

    } catch (error) {
        console.error('❌ Test error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Function để kiểm tra container có thể tạo IMPORT request không
async function checkContainerForImport(containerNo) {
    // BỔ SUNG: Kiểm tra container có EXPORT request với trạng thái khác GATE_OUT không
    const activeExportRequest = await prisma.serviceRequest.findFirst({
        where: {
            container_no: containerNo,
            type: 'EXPORT',
            status: {
                notIn: ['COMPLETED', 'REJECTED', 'GATE_REJECTED', 'GATE_OUT']
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Nếu có EXPORT request với trạng thái khác GATE_OUT, không cho phép tạo IMPORT request
    if (activeExportRequest) {
        return {
            allowed: false,
            reason: `Container ${containerNo} đang có EXPORT request với trạng thái ${activeExportRequest.status} (khác GATE_OUT). Không thể tạo IMPORT request mới.`
        };
    }

    // Kiểm tra container có IMPORT request đang active không
    const activeImportRequest = await prisma.serviceRequest.findFirst({
        where: {
            container_no: containerNo,
            type: 'IMPORT',
            status: {
                notIn: ['COMPLETED', 'REJECTED', 'GATE_REJECTED']
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Nếu có container IMPORT đang active, không cho phép tạo IMPORT request mới
    if (activeImportRequest) {
        return {
            allowed: false,
            reason: `Container ${containerNo} đã tồn tại trong hệ thống với trạng thái ${activeImportRequest.status} (IMPORT). Chỉ có thể tạo request mới khi container không còn trong hệ thống.`
        };
    }

    // Container không tồn tại - có thể tạo request mới
    return {
        allowed: true,
        reason: `Container ${containerNo} có thể tạo request mới`
    };
}

// Chạy test
testContainerValidation();
