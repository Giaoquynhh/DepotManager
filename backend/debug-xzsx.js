const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugXZSx() {
    try {
        console.log('🔍 Debugging container XZSx...');
        
        // 1. Tìm container XZSx
        const container = await prisma.serviceRequest.findFirst({
            where: { container_no: 'XZSx' },
            orderBy: { createdAt: 'desc' }
        });
        
        if (!container) {
            console.log('❌ Container XZSx not found');
            return;
        }
        
        console.log(`✅ Found container XZSx: ${container.type} request`);
        console.log(`   Status: ${container.status}`);
        console.log(`   Type: ${container.type}`);
        console.log(`   Created: ${container.createdAt}`);
        
        // 2. Tìm forklift task cho container XZSx
        const forkliftTask = await prisma.forkliftTask.findFirst({
            where: { container_no: 'XZSx' },
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
            },
            orderBy: { createdAt: 'desc' }
        });
        
        if (!forkliftTask) {
            console.log('❌ Forklift task for XZSx not found');
            return;
        }
        
        console.log(`✅ Found forklift task: ${forkliftTask.id}`);
        console.log(`   Status: ${forkliftTask.status}`);
        console.log(`   From slot: ${forkliftTask.from_slot_id}`);
        console.log(`   To slot: ${forkliftTask.to_slot_id}`);
        console.log(`   Fixed location slot: ${forkliftTask.fixed_location_slot_id}`);
        console.log(`   Created by: ${forkliftTask.created_by}`);
        console.log(`   Created at: ${forkliftTask.createdAt}`);
        
        if (forkliftTask.fixed_location_slot) {
            console.log(`   Fixed location: ${forkliftTask.fixed_location_slot.block.yard.name} / ${forkliftTask.fixed_location_slot.block.code} / ${forkliftTask.fixed_location_slot.code}`);
        } else {
            console.log('   Fixed location: Not set');
        }
        
        // 3. Kiểm tra actual location
        const actualLocation = await prisma.yardPlacement.findFirst({
            where: { 
                container_no: 'XZSx',
                status: { in: ['HOLD', 'OCCUPIED'] }
            },
            include: {
                slot: {
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
        
        if (actualLocation) {
            console.log(`   Actual location: ${actualLocation.slot.block.yard.name} / ${actualLocation.slot.block.code} / ${actualLocation.slot.code}`);
        } else {
            console.log('   Actual location: Not in yard (outside)');
        }
        
        // 4. Kiểm tra logic hiển thị
        let displayLocation = null;
        if (forkliftTask.fixed_location_slot) {
            displayLocation = {
                yard: forkliftTask.fixed_location_slot.block.yard.name,
                block: forkliftTask.fixed_location_slot.block.code,
                slot: forkliftTask.fixed_location_slot.code
            };
        } else if (actualLocation) {
            displayLocation = {
                yard: actualLocation.slot.block.yard.name,
                block: actualLocation.slot.block.code,
                slot: actualLocation.slot.code
            };
        }
        
        if (displayLocation) {
            console.log(`🎯 Display location: ${displayLocation.yard} / ${displayLocation.block} / ${displayLocation.slot}`);
        } else {
            console.log('🎯 Display location: Bên ngoài');
        }
        
        // 5. Kiểm tra xem có phải import request không
        if (container.type === 'IMPORT') {
            console.log('\n🔍 This is an IMPORT request - should have fixed location');
            if (!forkliftTask.fixed_location_slot_id) {
                console.log('❌ PROBLEM: Import request but no fixed location set!');
                console.log('   This means the completeJob() logic did not work properly');
            }
        } else {
            console.log('\n🔍 This is an EXPORT request - fixed location not expected');
        }
        
        console.log('\n✅ Debug completed!');
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugXZSx();
