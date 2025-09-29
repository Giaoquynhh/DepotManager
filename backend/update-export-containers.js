const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateExportContainers() {
	try {
		console.log('🔄 Cập nhật containers EXPORT từ IN_YARD sang DONE_LIFTING');
		console.log('=' .repeat(60));

		// Tìm tất cả EXPORT requests với status IN_YARD
		const exportInYardRequests = await prisma.serviceRequest.findMany({
			where: { 
				type: 'EXPORT',
				status: 'IN_YARD'
			},
			orderBy: { createdAt: 'desc' }
		});

		console.log(`📋 Tìm thấy ${exportInYardRequests.length} EXPORT requests với IN_YARD:`);
		exportInYardRequests.forEach((req, index) => {
			console.log(`   ${index + 1}. Container: ${req.container_no} (ID: ${req.id})`);
		});

		if (exportInYardRequests.length === 0) {
			console.log('✅ Không có EXPORT requests nào cần cập nhật');
			return;
		}

		console.log('\n' + '-'.repeat(40) + '\n');
		console.log('🔄 Bắt đầu cập nhật...');

		// Cập nhật từng request từ IN_YARD sang DONE_LIFTING
		let successCount = 0;
		for (const request of exportInYardRequests) {
			try {
				const updatedRequest = await prisma.serviceRequest.update({
					where: { id: request.id },
					data: {
						status: 'DONE_LIFTING',
						updatedAt: new Date(),
						history: {
							...(request.history || {}),
							status_update: {
								previous_status: 'IN_YARD',
								new_status: 'DONE_LIFTING',
								updated_at: new Date().toISOString(),
								reason: 'Chuyển trạng thái cho quy trình EXPORT: loại bỏ IN_YARD'
							}
						}
					}
				});

				console.log(`✅ ${request.container_no}: IN_YARD → DONE_LIFTING`);
				successCount++;
			} catch (error) {
				console.log(`❌ ${request.container_no}: Lỗi khi cập nhật -`, error.message);
			}
		}

		console.log('\n' + '='.repeat(60) + '\n');
		console.log('📊 KẾT QUẢ CẬP NHẬT:');
		console.log(`✅ Cập nhật thành công: ${successCount}/${exportInYardRequests.length}`);

		// Kiểm tra kết quả
		console.log('\n🔍 Kiểm tra sau khi cập nhật:');
		const remainingInYard = await prisma.serviceRequest.findMany({
			where: { 
				type: 'EXPORT',
				status: 'IN_YARD'
			}
		});

		const doneLifting = await prisma.serviceRequest.findMany({
			where: { 
				type: 'EXPORT',
				status: 'DONE_LIFTING'
			}
		});

		console.log(`📋 EXPORT requests còn IN_YARD: ${remainingInYard.length}`);
		console.log(`📋 EXPORT requests với DONE_LIFTING: ${doneLifting.length}`);

		if (remainingInYard.length === 0) {
			console.log('✅ Tất cả EXPORT requests đã được cập nhật thành DONE_LIFTING!');
		}

	} catch (error) {
		console.error('❌ Lỗi khi cập nhật:', error);
	} finally {
		await prisma.$disconnect();
	}
}

// Chạy cập nhật
updateExportContainers();
