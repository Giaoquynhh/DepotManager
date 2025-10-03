const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listContainers() {
    try {
        console.log('🔍 Listing all containers...');
        
        // Tìm tất cả ServiceRequest
        const allRequests = await prisma.serviceRequest.findMany({
            select: {
                container_no: true,
                type: true,
                status: true,
                request_no: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        
        console.log(`Found ${allRequests.length} recent requests:`);
        
        const containerNos = [...new Set(allRequests.map(r => r.container_no))];
        
        for (const containerNo of containerNos) {
            if (containerNo) {
                const requests = allRequests.filter(r => r.container_no === containerNo);
                console.log(`\n📦 Container: ${containerNo}`);
                for (const request of requests) {
                    console.log(`   ${request.type} - ${request.status} (${request.request_no}) - ${request.createdAt.toISOString().split('T')[0]}`);
                }
            }
        }
        
        // Tìm forklift tasks
        const allTasks = await prisma.forkliftTask.findMany({
            select: {
                container_no: true,
                status: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        
        console.log(`\nFound ${allTasks.length} recent forklift tasks:`);
        
        const taskContainerNos = [...new Set(allTasks.map(t => t.container_no))];
        
        for (const containerNo of taskContainerNos) {
            if (containerNo) {
                const tasks = allTasks.filter(t => t.container_no === containerNo);
                console.log(`\n🚛 Forklift tasks for ${containerNo}:`);
                for (const task of tasks) {
                    console.log(`   ${task.status} - ${task.createdAt.toISOString().split('T')[0]}`);
                }
            }
        }
        
        console.log('\n✅ List completed!');
        
    } catch (error) {
        console.error('❌ List failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listContainers();
