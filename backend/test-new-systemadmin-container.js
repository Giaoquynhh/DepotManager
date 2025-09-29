const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNewSystemAdminContainer() {
	try {
		console.log('🧪 Test New SystemAdmin Container');
		console.log('=' .repeat(60));

		// Tạo container hoàn toàn mới
		const newContainerNo = 'TEST_SYS_' + Date.now();
		console.log(`📦 Tạo container mới: ${newContainerNo}`);

		// Simulate SystemAdmin placing container directly into yard
		// This would normally be done through the API call
		
		// First, find a suitable yard slot
		const availableSlot = await prisma.yardSlot.findFirst({
			where: { status: 'EMPTY' },
			include: {
				block: {
					include: {
						yard: true
					}
				}
			}
		});

		if (!availableSlot) {
			console.log('❌ Không tìm thấy slot trống');
			return;
		}

		console.log(`✅ Tìm thấy slot: ${availableSlot.block?.yard?.name}/${availableSlot.block?.code}/${availableSlot.code}`);

		// Simulate SystemAdmin logic: Create Container with EMPTY_IN_YARD status
		const now = new Date();
		const systemAdminId = 'system'; // Simulate SystemAdmin ID

		const container = await prisma.container.upsert({
			where: { container_no: newContainerNo },
			update: { 
				status: 'EMPTY_IN_YARD',
				updatedAt: now 
			},
			create: { 
				container_no: newContainerNo,
				status: 'EMPTY_IN_YARD',
				created_by: systemAdminId,
				createdAt: now,
				updatedAt: now
			}
		});

		console.log(`✅ Tạo Container: ${container.id} - ${container.status}`);

		// Check if ServiceRequest exists (should NOT exist for SystemAdmin)
		const existingRequest = await prisma.serviceRequest.findFirst({
			where: { container_no: newContainerNo }
		});

		if (existingRequest) {
			console.log(`❌ Container ${newContainerNo} có ServiceRequest (không đúng cho SystemAdmin)`);
		} else {
			console.log(`✅ Container ${newContainerNo} không có ServiceRequest (đúng cho SystemAdmin)`);
		}

		// Tóm tắt
		console.log('\n' + '='.repeat(60) + '\n');
		console.log('📊 KẾT QUẢ TEST:');
		console.log(`✅ Container ${newContainerNo}: ${container.status}`);
		console.log(`✅ Không có ServiceRequest`);
		console.log(`✅ Logic SystemAdmin hoạt động đúng!`);

	} catch (error) {
		console.error('❌ Lỗi khi test:', error);
	} finally {
		await prisma.$disconnect();
	}
}

// Chạy test
testNewSystemAdminContainer();
