const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugVR22() {
    try {
        console.log('🔍 Debugging container VR22...');
        
        // 1. Tìm tất cả ServiceRequest cho vr22
        const allRequests = await prisma.serviceRequest.findMany({
            where: { container_no: 'vr22' },
            orderBy: { createdAt: 'asc' }
        });
        
        console.log(`Found ${allRequests.length} requests for VR22:`);
        
        for (let i = 0; i < allRequests.length; i++) {
            const request = allRequests[i];
            console.log(`\n📋 Request ${i + 1}: ${request.id}`);
            console.log(`   Type: ${request.type}`);
            console.log(`   Status: ${request.status}`);
            console.log(`   Request No: ${request.request_no}`);
            console.log(`   Created: ${request.createdAt}`);
            console.log(`   Driver: ${request.driver_name}`);
            console.log(`   License: ${request.license_plate}`);
        }
        
        // 2. Tìm tất cả forklift tasks cho vr22
        const allTasks = await prisma.forkliftTask.findMany({
            where: { container_no: 'vr22' },
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
            orderBy: { createdAt: 'asc' }
        });
        
        console.log(`\nFound ${allTasks.length} forklift tasks for VR22:`);
        
        for (let i = 0; i < allTasks.length; i++) {
            const task = allTasks[i];
            console.log(`\n📦 Task ${i + 1}: ${task.id}`);
            console.log(`   Status: ${task.status}`);
            console.log(`   From slot: ${task.from_slot_id}`);
            console.log(`   To slot: ${task.to_slot_id}`);
            console.log(`   Fixed location: ${task.fixed_location_slot_id || 'Not set'}`);
            console.log(`   Created: ${task.createdAt}`);
            
            // Tìm ServiceRequest tương ứng dựa trên thời gian gần nhất
            let request = null;
            if (allRequests.length > 0) {
                const jobCreatedAt = task.createdAt;
                let closestRequest = allRequests[0];
                let minTimeDiff = Math.abs(jobCreatedAt.getTime() - allRequests[0].createdAt.getTime());

                for (const req of allRequests) {
                    const timeDiff = Math.abs(jobCreatedAt.getTime() - req.createdAt.getTime());
                    if (timeDiff < minTimeDiff) {
                        minTimeDiff = timeDiff;
                        closestRequest = req;
                    }
                }
                request = closestRequest;
            }
            
            if (request) {
                console.log(`   Request type: ${request.type}`);
                console.log(`   Request status: ${request.status}`);
                
                // Test logic hiển thị
                let displayLocation = null;
                
                if (request.type === 'IMPORT') {
                    // IMPORT task: ưu tiên vị trí cố định
                    if (task.fixed_location_slot) {
                        displayLocation = {
                            yard: task.fixed_location_slot.block.yard.name,
                            block: task.fixed_location_slot.block.code,
                            slot: task.fixed_location_slot.code
                        };
                    } else {
                        // Fallback: tìm vị trí từ IN_YARD request
                        const inYardRequest = await prisma.serviceRequest.findFirst({
                            where: { 
                                container_no: 'vr22',
                                status: 'IN_YARD',
                                type: 'IMPORT'
                            },
                            orderBy: { createdAt: 'desc' }
                        });
                        
                        if (inYardRequest) {
                            const actualLocation = await prisma.yardPlacement.findFirst({
                                where: { 
                                    container_no: 'vr22',
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
                            
                            if (actualLocation && actualLocation.slot) {
                                displayLocation = {
                                    yard: actualLocation.slot.block.yard.name,
                                    block: actualLocation.slot.block.code,
                                    slot: actualLocation.slot.code
                                };
                            }
                        }
                    }
                } else if (request.type === 'EXPORT') {
                    // EXPORT task: hiển thị vị trí thực tế
                    const actualLocation = await prisma.yardPlacement.findFirst({
                        where: { 
                            container_no: 'vr22',
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
                    
                    if (actualLocation && actualLocation.slot) {
                        displayLocation = {
                            yard: actualLocation.slot.block.yard.name,
                            block: actualLocation.slot.block.code,
                            slot: actualLocation.slot.code
                        };
                    }
                }
                
                if (displayLocation) {
                    console.log(`🎯 Display location: ${displayLocation.yard} / ${displayLocation.block} / ${displayLocation.slot}`);
                } else {
                    console.log('🎯 Display location: Bên ngoài');
                }
            } else {
                console.log('   Request: Not found');
            }
        }
        
        console.log('\n✅ Debug completed!');
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugVR22();
