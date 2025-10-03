const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTC222() {
    try {
        console.log('🔍 Checking container TC222...');
        
        // 1. Tìm ServiceRequest cho TC222
        const requests = await prisma.serviceRequest.findMany({
            where: { container_no: 'TC222' },
            orderBy: { createdAt: 'desc' }
        });
        
        console.log(`📋 Found ${requests.length} service request(s):`);
        requests.forEach((req, index) => {
            console.log(`   ${index + 1}. ID: ${req.id}`);
            console.log(`      Type: ${req.type}`);
            console.log(`      Status: ${req.status}`);
            console.log(`      Created: ${req.createdAt.toISOString()}`);
            console.log(`      Request No: ${req.request_no}`);
        });
        
        // 2. Tìm ForkliftTask cho TC222
        const tasks = await prisma.forkliftTask.findMany({
            where: { container_no: 'TC222' },
            include: {
                fixed_location_slot: {
                    include: {
                        block: {
                            include: {
                                yard: true
                            }
                        }
                    }
                },
                from_slot: {
                    include: {
                        block: {
                            include: {
                                yard: true
                            }
                        }
                    }
                },
                to_slot: {
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
        
        console.log(`\n🚛 Found ${tasks.length} forklift task(s):`);
        tasks.forEach((task, index) => {
            console.log(`   ${index + 1}. Task ID: ${task.id}`);
            console.log(`      Status: ${task.status}`);
            console.log(`      Created: ${task.createdAt.toISOString()}`);
            console.log(`      From slot: ${task.from_slot_id || 'null'}`);
            console.log(`      To slot: ${task.to_slot_id || 'null'}`);
            console.log(`      Fixed location slot: ${task.fixed_location_slot_id || 'Not set'}`);
            
            if (task.fixed_location_slot) {
                console.log(`      Fixed location: ${task.fixed_location_slot.block.yard.name} / ${task.fixed_location_slot.block.code} / ${task.fixed_location_slot.code}`);
            }
            
            if (task.from_slot) {
                console.log(`      From location: ${task.from_slot.block.yard.name} / ${task.from_slot.block.code} / ${task.from_slot.code}`);
            }
            
            if (task.to_slot) {
                console.log(`      To location: ${task.to_slot.block.yard.name} / ${task.to_slot.block.code} / ${task.to_slot.code}`);
            }
        });
        
        // 3. Kiểm tra YardPlacement
        const placements = await prisma.yardPlacement.findMany({
            where: { container_no: 'TC222' },
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
            },
            orderBy: { placed_at: 'desc' }
        });
        
        console.log(`\n📍 Found ${placements.length} yard placement(s):`);
        placements.forEach((placement, index) => {
            console.log(`   ${index + 1}. Status: ${placement.status}`);
            console.log(`      Placed at: ${placement.placed_at.toISOString()}`);
            console.log(`      Location: ${placement.slot.block.yard.name} / ${placement.slot.block.code} / ${placement.slot.code}`);
        });
        
        // 4. Test display logic
        console.log(`\n🎯 Testing display logic for each task:`);
        for (const task of tasks) {
            console.log(`\n   Task ${task.id}:`);
            
            // Tìm ServiceRequest tương ứng với task
            const taskCreatedAt = task.createdAt;
            let closestRequest = null;
            let minTimeDiff = Infinity;
            
            for (const request of requests) {
                const timeDiff = Math.abs(taskCreatedAt.getTime() - request.createdAt.getTime());
                if (timeDiff < minTimeDiff) {
                    minTimeDiff = timeDiff;
                    closestRequest = request;
                }
            }
            
            if (closestRequest) {
                console.log(`      Matched request: ${closestRequest.type} (${closestRequest.status})`);
                
                let displayLocation = null;
                
                if (closestRequest.type === 'IMPORT') {
                    if (task.fixed_location_slot) {
                        displayLocation = {
                            yard: task.fixed_location_slot.block.yard.name,
                            block: task.fixed_location_slot.block.code,
                            slot: task.fixed_location_slot.code
                        };
                        console.log(`      Display location (IMPORT fixed): ${displayLocation.yard} / ${displayLocation.block} / ${displayLocation.slot}`);
                    } else {
                        console.log(`      Display location (IMPORT): Bên ngoài (no fixed location)`);
                    }
                } else if (closestRequest.type === 'EXPORT') {
                    // Tìm vị trí thực tế từ YardPlacement
                    const currentPlacement = placements.find(p => p.status === 'OCCUPIED' || p.status === 'HOLD');
                    if (currentPlacement) {
                        displayLocation = {
                            yard: currentPlacement.slot.block.yard.name,
                            block: currentPlacement.slot.block.code,
                            slot: currentPlacement.slot.code
                        };
                        console.log(`      Display location (EXPORT actual): ${displayLocation.yard} / ${displayLocation.block} / ${displayLocation.slot}`);
                    } else {
                        console.log(`      Display location (EXPORT): Bên ngoài`);
                    }
                }
            } else {
                console.log(`      No matching request found`);
            }
        }
        
        console.log(`\n✅ Check completed!`);
        
    } catch (error) {
        console.error('❌ Check failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTC222();
