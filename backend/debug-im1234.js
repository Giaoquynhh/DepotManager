const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugIM1234() {
    try {
        console.log('🔍 Debugging Container IM 1234 Location Issue');
        console.log('=' .repeat(60));

        // 1. Find ForkliftTasks for IM 1234
        console.log('\n📋 ForkliftTasks for IM 1234:');
        const im1234Tasks = await prisma.forkliftTask.findMany({
            where: { container_no: 'IM 1234' },
            include: {
                from_slot: { include: { block: { include: { yard: true } } } },
                to_slot: { include: { block: { include: { yard: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (im1234Tasks.length === 0) {
            console.log('   No ForkliftTasks found for IM 1234.');
            return;
        }

        for (const task of im1234Tasks) {
            console.log(`   - Task ID: ${task.id}`);
            console.log(`     Status: ${task.status}`);
            console.log(`     Created At: ${task.createdAt.toISOString()}`);
            console.log(`     From Slot ID: ${task.from_slot_id || 'N/A'}`);
            console.log(`     To Slot ID: ${task.to_slot_id || 'N/A'}`);
            console.log(`     From Location: ${task.from_slot ? `${task.from_slot.block.yard.code} / ${task.from_slot.block.code} / ${task.from_slot.code}` : 'Bên ngoài'}`);
            console.log(`     To Location: ${task.to_slot ? `${task.to_slot.block.yard.code} / ${task.to_slot.block.code} / ${task.to_slot.code}` : 'Bên ngoài'}`);

            // 2. Find the associated ServiceRequest using the matching logic
            const allRequests = await prisma.serviceRequest.findMany({
                where: { container_no: task.container_no },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    request_no: true,
                    type: true,
                    status: true,
                    createdAt: true
                }
            });

            if (allRequests.length > 0) {
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

                console.log(`     Associated ServiceRequest (ID: ${closestRequest.id}):`);
                console.log(`       Request No: ${closestRequest.request_no}`);
                console.log(`       Type: ${closestRequest.type}`);
                console.log(`       Status: ${closestRequest.status}`);
                console.log(`       Created At: ${closestRequest.createdAt.toISOString()}`);
                console.log(`       Time Diff: ${minTimeDiff}ms`);

                // 3. Test display_location logic
                console.log(`\n     🎯 Testing Display Location Logic:`);
                let display_location = null;
                if (closestRequest.type === 'IMPORT') {
                    display_location = task.to_slot;
                    console.log(`       IMPORT: Display TO location (destination in yard)`);
                } else if (closestRequest.type === 'EXPORT') {
                    display_location = null; // Giữ nguyên logic cũ
                    console.log(`       EXPORT: Keep old logic (display "Bên ngoài")`);
                }

                if (display_location) {
                    console.log(`       ✅ Display Location: ${display_location.block?.yard?.code || 'N/A'} / ${display_location.block?.code || 'N/A'} / ${display_location.code || 'N/A'}`);
                } else {
                    console.log(`       ✅ Display Location: "Bên ngoài" (old logic)`);
                }
            } else {
                console.log('     No associated ServiceRequest found for this ForkliftTask.');
            }
            console.log('');
        }

        // 4. Check all ServiceRequests for IM 1234
        console.log('\n📦 All ServiceRequests for IM 1234:');
        const allRequests = await prisma.serviceRequest.findMany({
            where: { container_no: 'IM 1234' },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                request_no: true,
                type: true,
                status: true,
                createdAt: true
            }
        });

        allRequests.forEach((request, index) => {
            console.log(`   ${index + 1}. Request ID: ${request.id}`);
            console.log(`      Request No: ${request.request_no}`);
            console.log(`      Type: ${request.type}`);
            console.log(`      Status: ${request.status}`);
            console.log(`      Created: ${request.createdAt.toISOString()}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error during debugging:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugIM1234();
