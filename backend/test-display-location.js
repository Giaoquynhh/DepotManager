const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDisplayLocation() {
    try {
        console.log('🧪 Testing Display Location Logic');
        console.log('=' .repeat(60));

        // 1. Lấy tất cả ForkliftTask
        const allTasks = await prisma.forkliftTask.findMany({
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        console.log('\n📋 Testing Display Location for Each Task:');
        
        for (const task of allTasks) {
            console.log(`\n   Container: ${task.container_no}`);
            console.log(`   Task ID: ${task.id}`);
            console.log(`   Status: ${task.status}`);
            console.log(`   From Slot: ${task.from_slot_id || 'N/A'}`);
            console.log(`   To Slot: ${task.to_slot_id || 'N/A'}`);
            
            // Lấy ServiceRequest phù hợp
            const allRequests = await prisma.serviceRequest.findMany({
                where: { container_no: task.container_no },
                orderBy: { createdAt: 'desc' },
                select: {
                    type: true,
                    status: true,
                    createdAt: true,
                    request_no: true
                }
            });

            if (allRequests.length === 0) {
                console.log(`   ❌ No ServiceRequest found`);
                continue;
            }

            // Tìm ServiceRequest phù hợp theo thời gian
            let closestRequest = allRequests[0];
            let minTimeDiff = Math.abs(task.createdAt.getTime() - allRequests[0].createdAt.getTime());
            
            for (const request of allRequests) {
                const timeDiff = Math.abs(task.createdAt.getTime() - request.createdAt.getTime());
                if (timeDiff < minTimeDiff) {
                    minTimeDiff = timeDiff;
                    closestRequest = request;
                }
            }

            console.log(`   ServiceRequest: ${closestRequest.type} (${closestRequest.request_no})`);
            
            // Lấy thông tin vị trí
            let fromLocation = null;
            let toLocation = null;
            
            if (task.from_slot_id) {
                fromLocation = await prisma.yardSlot.findUnique({
                    where: { id: task.from_slot_id },
                    include: {
                        block: {
                            include: { yard: true }
                        }
                    }
                });
            }
            
            if (task.to_slot_id) {
                toLocation = await prisma.yardSlot.findUnique({
                    where: { id: task.to_slot_id },
                    include: {
                        block: {
                            include: { yard: true }
                        }
                    }
                });
            }

            // Logic hiển thị vị trí mới
            let display_location = null;
            if (closestRequest.type === 'IMPORT') {
                display_location = toLocation;
                console.log(`   📍 IMPORT: Display TO location (destination in yard)`);
            } else if (closestRequest.type === 'EXPORT') {
                display_location = fromLocation;
                console.log(`   📍 EXPORT: Display FROM location (source in yard)`);
            }

            if (display_location) {
                console.log(`   ✅ Display Location: ${display_location.block?.yard?.name || 'N/A'} / ${display_location.block?.code || 'N/A'} / ${display_location.code || 'N/A'}`);
            } else {
                console.log(`   ❌ No display location found`);
            }

            // Kiểm tra actual location
            const actualLocation = await prisma.yardPlacement.findFirst({
                where: { 
                    container_no: task.container_no, 
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
                console.log(`   🏗️ Actual Location: ${actualLocation.slot?.block?.yard?.name || 'N/A'} / ${actualLocation.slot?.block?.code || 'N/A'} / ${actualLocation.slot?.code || 'N/A'}`);
            } else {
                console.log(`   🏗️ Actual Location: Not in yard`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ Test completed successfully');
        console.log('\n📊 Summary:');
        console.log('   IMPORT tasks: Display TO location (destination in yard)');
        console.log('   EXPORT tasks: Display FROM location (source in yard)');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testDisplayLocation();
