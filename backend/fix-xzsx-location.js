const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixXZSxLocation() {
    try {
        console.log('🔧 Fixing XZSx location...');
        
        // 1. Tìm forklift task cho XZSx
        const forkliftTask = await prisma.forkliftTask.findFirst({
            where: { container_no: 'XZSx' },
            orderBy: { createdAt: 'desc' }
        });
        
        if (!forkliftTask) {
            console.log('❌ Forklift task for XZSx not found');
            return;
        }
        
        console.log(`✅ Found forklift task: ${forkliftTask.id}`);
        console.log(`   Status: ${forkliftTask.status}`);
        console.log(`   To slot: ${forkliftTask.to_slot_id}`);
        console.log(`   Current fixed location: ${forkliftTask.fixed_location_slot_id || 'Not set'}`);
        
        // 2. Cập nhật fixed_location_slot_id
        if (forkliftTask.to_slot_id) {
            const updatedTask = await prisma.forkliftTask.update({
                where: { id: forkliftTask.id },
                data: { 
                    fixed_location_slot_id: forkliftTask.to_slot_id
                }
            });
            
            console.log(`✅ Updated fixed location slot: ${updatedTask.fixed_location_slot_id}`);
            
            // 3. Kiểm tra slot details
            const slot = await prisma.yardSlot.findUnique({
                where: { id: forkliftTask.to_slot_id },
                include: {
                    block: {
                        include: {
                            yard: true
                        }
                    }
                }
            });
            
            if (slot) {
                console.log(`✅ Slot details: ${slot.block.yard.name} / ${slot.block.code} / ${slot.code}`);
            }
            
            // 4. Test display logic
            const taskWithFixedLocation = await prisma.forkliftTask.findUnique({
                where: { id: forkliftTask.id },
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
                console.log(`🎯 Display location: ${displayLocation.yard} / ${displayLocation.block} / ${displayLocation.slot}`);
            }
            
        } else {
            console.log('❌ No to_slot_id found for this task');
        }
        
        console.log('\n✅ XZSx location fixed!');
        
    } catch (error) {
        console.error('❌ Fix failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixXZSxLocation();
