const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script để đọc thông tin forklift và cập nhật trạng thái về "chờ xử lý"
 * 
 * Chức năng:
 * 1. Hiển thị danh sách forklift tasks hiện tại
 * 2. Cập nhật trạng thái của các forklift task về PENDING (chờ xử lý)
 */

async function main() {
    try {
        console.log('🚀 Bắt đầu cập nhật trạng thái forklift tasks...\n');

        // 1. Hiển thị danh sách forklift tasks hiện tại
        console.log('📋 DANH SÁCH FORKLIFT TASKS HIỆN TẠI:');
        console.log('=====================================');
        
        const forkliftTasks = await prisma.forkliftTask.findMany({
            include: {
                from_slot: {
                    include: {
                        block: {
                            include: { yard: true }
                        }
                    }
                },
                to_slot: {
                    include: {
                        block: {
                            include: { yard: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (forkliftTasks.length === 0) {
            console.log('❌ Không có forklift task nào trong hệ thống');
        } else {
            forkliftTasks.forEach((task, index) => {
                console.log(`${index + 1}. Container: ${task.container_no}`);
                console.log(`   Trạng thái: ${task.status}`);
                console.log(`   Từ vị trí: ${task.from_slot ? `${task.from_slot.block.yard.name} - ${task.from_slot.block.name} - ${task.from_slot.name}` : 'Không xác định'}`);
                console.log(`   Đến vị trí: ${task.to_slot ? `${task.to_slot.block.yard.name} - ${task.to_slot.block.name} - ${task.to_slot.name}` : 'Không xác định'}`);
                console.log(`   Tài xế: ${task.assigned_driver_id || 'Chưa phân công'}`);
                console.log(`   Ngày tạo: ${task.createdAt.toLocaleString('vi-VN')}`);
                console.log('   ---');
            });
        }

        // 2. Cập nhật trạng thái của các forklift task về PENDING
        console.log('\n🔄 CẬP NHẬT TRẠNG THÁI FORKLIFT TASKS VỀ "CHỜ XỬ LÝ"...');
        console.log('==========================================================');
        
        const forkliftTasksToUpdate = await prisma.forkliftTask.findMany({
            where: {
                status: {
                    not: 'PENDING'
                }
            }
        });

        if (forkliftTasksToUpdate.length === 0) {
            console.log('✅ Tất cả forklift tasks đã ở trạng thái PENDING');
        } else {
            console.log(`📝 Tìm thấy ${forkliftTasksToUpdate.length} forklift tasks cần cập nhật về PENDING`);
            
            for (const task of forkliftTasksToUpdate) {
                try {
                    const updatedTask = await prisma.forkliftTask.update({
                        where: { id: task.id },
                        data: {
                            status: 'PENDING',
                            assigned_driver_id: null, // Reset driver assignment
                            cancel_reason: null // Reset cancel reason
                        }
                    });
                    
                    console.log(`✅ Đã cập nhật forklift task ${task.id} (${task.container_no}) từ ${task.status} → PENDING`);
                } catch (error) {
                    console.error(`❌ Lỗi khi cập nhật forklift task ${task.id}:`, error.message);
                }
            }
        }

        // 3. Hiển thị kết quả cuối cùng
        console.log('\n📊 KẾT QUẢ CUỐI CÙNG:');
        console.log('======================');
        
        const finalForkliftCount = await prisma.forkliftTask.count({
            where: { status: 'PENDING' }
        });
        
        console.log(`🚛 Forklift tasks đang chờ xử lý: ${finalForkliftCount}`);
        
        console.log('\n🎉 Hoàn thành cập nhật trạng thái forklift tasks!');

    } catch (error) {
        console.error('❌ Lỗi trong quá trình thực thi:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Chạy script
main()
    .then(() => {
        console.log('\n✅ Script đã hoàn thành thành công!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script thất bại:', error);
        process.exit(1);
    });
