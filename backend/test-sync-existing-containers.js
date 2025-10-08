/**
 * Test script để đồng bộ booking cho các container hiện tại
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function syncExistingContainers() {
    console.log('🔄 Đồng bộ booking cho các container hiện tại\n');

    try {
        // Tìm tất cả ServiceRequest có booking nhưng SealUsageHistory chưa có
        const serviceRequestsWithBooking = await prisma.serviceRequest.findMany({
            where: {
                booking_bill: { not: null },
                container_no: { not: null },
                depot_deleted_at: null
            },
            select: {
                id: true,
                container_no: true,
                booking_bill: true
            }
        });

        console.log(`📊 Tìm thấy ${serviceRequestsWithBooking.length} ServiceRequest có booking`);

        let totalUpdated = 0;
        const results = [];

        for (const request of serviceRequestsWithBooking) {
            console.log(`\n📦 Xử lý container: ${request.container_no}`);
            console.log(`   Booking: ${request.booking_bill}`);

            try {
                // Cập nhật SealUsageHistory cho container này
                const updateResult = await prisma.sealUsageHistory.updateMany({
                    where: {
                        container_number: request.container_no,
                        booking_number: null
                    },
                    data: {
                        booking_number: request.booking_bill
                    }
                });

                if (updateResult.count > 0) {
                    totalUpdated += updateResult.count;
                    console.log(`   ✅ Đã cập nhật ${updateResult.count} record`);
                    results.push({
                        containerNo: request.container_no,
                        bookingBill: request.booking_bill,
                        updatedCount: updateResult.count
                    });
                } else {
                    console.log(`   ℹ️  Không có record nào cần cập nhật`);
                }
            } catch (error) {
                console.error(`   ❌ Lỗi khi cập nhật container ${request.container_no}:`, error.message);
                results.push({
                    containerNo: request.container_no,
                    bookingBill: request.booking_bill,
                    error: error.message
                });
            }
        }

        console.log(`\n🎉 Hoàn thành! Đã cập nhật ${totalUpdated} record từ ${serviceRequestsWithBooking.length} ServiceRequest`);

        // Kiểm tra kết quả
        console.log('\n🔍 Kiểm tra kết quả:');
        const containersToCheck = ['SV44', 'SA999', 'SA888'];
        
        for (const containerNo of containersToCheck) {
            const sealHistory = await prisma.sealUsageHistory.findMany({
                where: {
                    container_number: containerNo
                },
                select: {
                    seal_number: true,
                    container_number: true,
                    booking_number: true
                }
            });

            console.log(`\n📦 Container ${containerNo}:`);
            sealHistory.forEach((history, index) => {
                console.log(`  ${index + 1}. Seal: ${history.seal_number}, Booking: ${history.booking_number || 'null'}`);
            });
        }

    } catch (error) {
        console.error('❌ Lỗi:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Chạy sync
if (require.main === module) {
    syncExistingContainers();
}

module.exports = { syncExistingContainers };
