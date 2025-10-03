const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixVR22Import() {
    try {
        console.log('🔧 Fixing vr22 IMPORT task...');
        
        // 1. Tìm IMPORT task cho vr22
        const importTask = await prisma.forkliftTask.findFirst({
            where: { 
                container_no: 'vr22',
                to_slot_id: { not: null }
            },
            orderBy: { createdAt: 'asc' }
        });
        
        if (!importTask) {
            console.log('❌ IMPORT task for vr22 not found');
            return;
        }
        
        console.log(`✅ Found IMPORT task: ${importTask.id}`);
        console.log(`   Status: ${importTask.status}`);
        console.log(`   To slot: ${importTask.to_slot_id}`);
        console.log(`   Current fixed location: ${importTask.fixed_location_slot_id || 'Not set'}`);
        
        // 2. Cập nhật fixed_location_slot_id
        if (importTask.to_slot_id) {
            const updatedTask = await prisma.forkliftTask.update({
                where: { id: importTask.id },
                data: { 
                    fixed_location_slot_id: importTask.to_slot_id
                }
            });
            
            console.log(`✅ Updated fixed location slot: ${updatedTask.fixed_location_slot_id}`);
            
            // 3. Kiểm tra slot details
            const slot = await prisma.yardSlot.findUnique({
                where: { id: importTask.to_slot_id },
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
                where: { id: importTask.id },
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
        
        console.log('\n✅ vr22 IMPORT task fixed!');
        
    } catch (error) {
        console.error('❌ Fix failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixVR22Import();
