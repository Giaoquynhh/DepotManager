const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTC222() {
    try {
        console.log('🔧 Fixing TC222 fixed location...');
        
        // 1. Tìm task của TC222
        const task = await prisma.forkliftTask.findFirst({
            where: { 
                container_no: 'TC222',
                status: 'COMPLETED'
            }
        });
        
        if (!task) {
            console.log('❌ No completed task found for TC222');
            return;
        }
        
        console.log(`✅ Found task: ${task.id}`);
        console.log(`   Status: ${task.status}`);
        console.log(`   To slot: ${task.to_slot_id}`);
        console.log(`   Current fixed location: ${task.fixed_location_slot_id || 'Not set'}`);
        
        // 2. Tìm ServiceRequest để xác định type
        const request = await prisma.serviceRequest.findFirst({
            where: { container_no: 'TC222' },
            orderBy: { createdAt: 'desc' }
        });
        
        if (!request) {
            console.log('❌ No service request found for TC222');
            return;
        }
        
        console.log(`✅ Found request: ${request.id}`);
        console.log(`   Type: ${request.type}`);
        console.log(`   Status: ${request.status}`);
        
        // 3. Áp dụng logic completeJob
        if (request.type === 'IMPORT' && task.to_slot_id) {
            console.log(`\n🔧 Applying completeJob logic...`);
            console.log(`   Request type: ${request.type} (should save fixed location)`);
            console.log(`   To slot: ${task.to_slot_id}`);
            
            // Cập nhật fixed_location_slot_id
            const updatedTask = await prisma.forkliftTask.update({
                where: { id: task.id },
                data: { 
                    fixed_location_slot_id: task.to_slot_id
                }
            });
            
            console.log(`✅ Updated fixed location slot: ${updatedTask.fixed_location_slot_id}`);
            
            // 4. Lấy thông tin slot để hiển thị
            const slotInfo = await prisma.yardSlot.findUnique({
                where: { id: task.to_slot_id },
                include: {
                    block: {
                        include: {
                            yard: true
                        }
                    }
                }
            });
            
            if (slotInfo) {
                console.log(`🎯 Fixed location: ${slotInfo.block.yard.name} / ${slotInfo.block.code} / ${slotInfo.code}`);
            }
            
            // 5. Test display logic
            const taskWithFixedLocation = await prisma.forkliftTask.findUnique({
                where: { id: task.id },
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
            
            if (taskWithFixedLocation.fixed_location_slot) {
                const displayLocation = {
                    yard: taskWithFixedLocation.fixed_location_slot.block.yard.name,
                    block: taskWithFixedLocation.fixed_location_slot.block.code,
                    slot: taskWithFixedLocation.fixed_location_slot.code
                };
                console.log(`\n🎯 Display location should now be: ${displayLocation.yard} / ${displayLocation.block} / ${displayLocation.slot}`);
            }
            
        } else {
            console.log(`❌ Should not save fixed location (type: ${request.type}, to_slot: ${task.to_slot_id})`);
        }
        
        console.log(`\n✅ Fix completed!`);
        
    } catch (error) {
        console.error('❌ Fix failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixTC222();
