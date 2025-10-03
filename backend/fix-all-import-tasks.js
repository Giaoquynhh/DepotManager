const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAllImportTasks() {
    try {
        console.log('🔧 Fixing all IMPORT tasks without fixed location...');
        
        // 1. Tìm tất cả task IMPORT đã completed nhưng chưa có fixed_location_slot_id
        const tasksToFix = await prisma.forkliftTask.findMany({
            where: {
                status: 'COMPLETED',
                fixed_location_slot_id: null,
                to_slot_id: { not: null }
            },
            include: {
                to_slot: {
                    include: {
                        block: {
                            include: {
                                yard: true
                            }
                        }
                    }
                }
            }
        });
        
        console.log(`📋 Found ${tasksToFix.length} tasks to check...`);
        
        let fixedCount = 0;
        let skippedCount = 0;
        
        for (const task of tasksToFix) {
            console.log(`\n🔍 Checking task ${task.id} (${task.container_no})...`);
            
            // 2. Tìm ServiceRequest tương ứng để kiểm tra type
            const requests = await prisma.serviceRequest.findMany({
                where: { container_no: task.container_no },
                orderBy: { createdAt: 'desc' }
            });
            
            if (requests.length === 0) {
                console.log(`   ⚠️  No service request found for ${task.container_no}`);
                skippedCount++;
                continue;
            }
            
            // 3. Tìm request gần nhất với task
            const taskCreatedAt = task.createdAt;
            let closestRequest = requests[0];
            let minTimeDiff = Math.abs(taskCreatedAt.getTime() - requests[0].createdAt.getTime());
            
            for (const request of requests) {
                const timeDiff = Math.abs(taskCreatedAt.getTime() - request.createdAt.getTime());
                if (timeDiff < minTimeDiff) {
                    minTimeDiff = timeDiff;
                    closestRequest = request;
                }
            }
            
            console.log(`   📋 Matched request: ${closestRequest.type} (${closestRequest.status})`);
            
            // 4. Chỉ fix cho IMPORT request
            if (closestRequest.type === 'IMPORT') {
                console.log(`   ✅ IMPORT request - should fix fixed location`);
                console.log(`   📍 To slot: ${task.to_slot_id}`);
                console.log(`   📍 Location: ${task.to_slot.block.yard.name} / ${task.to_slot.block.code} / ${task.to_slot.code}`);
                
                // Cập nhật fixed_location_slot_id
                await prisma.forkliftTask.update({
                    where: { id: task.id },
                    data: { 
                        fixed_location_slot_id: task.to_slot_id
                    }
                });
                
                console.log(`   ✅ Fixed!`);
                fixedCount++;
            } else {
                console.log(`   ⏭️  EXPORT request - skip (no fixed location needed)`);
                skippedCount++;
            }
        }
        
        console.log(`\n📊 Summary:`);
        console.log(`   ✅ Fixed: ${fixedCount} IMPORT tasks`);
        console.log(`   ⏭️  Skipped: ${skippedCount} tasks (EXPORT or no request)`);
        console.log(`   📋 Total checked: ${tasksToFix.length} tasks`);
        
        // 5. Verify fixes
        console.log(`\n🔍 Verifying fixes...`);
        const fixedTasks = await prisma.forkliftTask.findMany({
            where: {
                status: 'COMPLETED',
                fixed_location_slot_id: { not: null }
            },
            include: {
                fixed_location_slot: {
                    include: {
                        block: {
                            include: {
                                yard: true
                            }
                        }
                    }
                }
            }
        });
        
        console.log(`✅ Total tasks with fixed location: ${fixedTasks.length}`);
        
        // Hiển thị một vài ví dụ
        console.log(`\n📋 Examples of fixed tasks:`);
        fixedTasks.slice(0, 5).forEach((task, index) => {
            console.log(`   ${index + 1}. ${task.container_no}: ${task.fixed_location_slot.block.yard.name} / ${task.fixed_location_slot.block.code} / ${task.fixed_location_slot.code}`);
        });
        
        console.log(`\n✅ All IMPORT tasks fixed successfully!`);
        
    } catch (error) {
        console.error('❌ Fix failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixAllImportTasks();
