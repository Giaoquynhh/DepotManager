const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSystemAdminEmptyLogic() {
	try {
		console.log('🧪 Test SystemAdmin Empty Container Logic');
		console.log('=' .repeat(60));

		// Tìm containers có status EMPTY_IN_YARD
		const emptyContainers = await prisma.container.findMany({
			where: { status: 'EMPTY_IN_YARD' },
			include: {
				customer: {
					select: { id: true, name: true, code: true }
				},
				shipping_line: {
					select: { id: true, name: true, code: true }
				},
				container_type: {
					select: { id: true, code: true, description: true }
				}
			},
			orderBy: { createdAt: 'desc' }
		});

		console.log(`📦 Tìm thấy ${emptyContainers.length} containers EMPTY_IN_YARD:`);
		console.log('\n' + '-'.repeat(40) + '\n');

		emptyContainers.forEach((container, index) => {
			console.log(`Container ${index + 1}:`);
			console.log(`   - Container No: ${container.container_no}`);
			console.log(`   - Status: ${container.status}`);
			console.log(`   - Khách hàng: ${container.customer?.name || 'N/A'} (${container.customer?.code || 'N/A'})`);
			console.log(`   - Hãng tàu: ${container.shipping_line?.name || 'N/A'} (${container.shipping_line?.code || 'N/A'})`);
			console.log(`   - Loại container: ${container.container_type?.description || 'N/A'} (${container.container_type?.code || 'N/A'})`);
			console.log(`   - Seal số: ${container.seal_number || 'N/A'}`);
			console.log(`   - DEM/DET: ${container.dem_det || 'N/A'}`);
			console.log(`   - Yard: ${container.yard_name || 'N/A'}`);
			console.log(`   - Block: ${container.block_code || 'N/A'}`);
			console.log(`   - Slot: ${container.slot_code || 'N/A'}`);
			console.log(`   - Created by: ${container.created_by}`);
			console.log(`   - Created At: ${container.createdAt}`);
			console.log(`   - Updated At: ${container.updatedAt}`);
			console.log('');
		});

		// Kiểm tra xem có ServiceRequest nào cho các containers này không
		console.log('\n' + '='.repeat(60) + '\n');
		console.log('🔍 Kiểm tra ServiceRequest cho EMPTY_IN_YARD containers:');
		console.log('\n' + '-'.repeat(40) + '\n');

		for (const container of emptyContainers) {
			const requests = await prisma.serviceRequest.findMany({
				where: { container_no: container.container_no },
				orderBy: { createdAt: 'desc' }
			});

			if (requests.length > 0) {
				console.log(`❌ Container ${container.container_no} có ${requests.length} ServiceRequest:`);
				requests.forEach((req, reqIndex) => {
					console.log(`   Request ${reqIndex + 1}: ${req.type} - ${req.status} (${req.createdAt})`);
				});
			} else {
				console.log(`✅ Container ${container.container_no} không có ServiceRequest (đúng cho SystemAdmin)`);
			}
			console.log('');
		}

		// Tóm tắt
		console.log('\n' + '='.repeat(60) + '\n');
		console.log('📊 TÓM TẮT:');
		console.log(`✅ Có ${emptyContainers.length} containers EMPTY_IN_YARD`);
		
		const withRequests = await Promise.all(emptyContainers.map(async (container) => {
			const count = await prisma.serviceRequest.count({
				where: { container_no: container.container_no }
			});
			return count > 0;
		}));

		const systemAdminContainers = withRequests.filter(hasRequest => !hasRequest).length;
		console.log(`✅ ${systemAdminContainers} containers không có ServiceRequest (SystemAdmin)`);
		
		if (systemAdminContainers > 0) {
			console.log(`✅ Logic SystemAdmin đặt container vào bãi hoạt động đúng`);
		}

	} catch (error) {
		console.error('❌ Lỗi khi test:', error);
	} finally {
		await prisma.$disconnect();
	}
}

// Chạy test
testSystemAdminEmptyLogic();
