/**
 * Script debug để kiểm tra tại sao booking chưa được đồng bộ
 * Kiểm tra dữ liệu ServiceRequest và SealUsageHistory cho các container cụ thể
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugSealBookingSync() {
    console.log('🔍 Debug: Kiểm tra dữ liệu ServiceRequest và SealUsageHistory\n');

    try {
        // Các container cần kiểm tra từ hình ảnh
        const containersToCheck = ['SV44', 'SA999', 'SA888'];
        
        for (const containerNo of containersToCheck) {
            console.log(`📦 === Kiểm tra container: ${containerNo} ===`);
            
            // 1. Kiểm tra ServiceRequest
            console.log('\n1️⃣ ServiceRequest:');
            const serviceRequests = await prisma.serviceRequest.findMany({
                where: {
                    container_no: containerNo,
                    depot_deleted_at: null
                },
                select: {
                    id: true,
                    container_no: true,
                    booking_bill: true,
                    type: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            if (serviceRequests.length === 0) {
                console.log(`❌ Không tìm thấy ServiceRequest nào cho container ${containerNo}`);
            } else {
                serviceRequests.forEach((req, index) => {
                    console.log(`  ${index + 1}. ID: ${req.id}`);
                    console.log(`     Container: ${req.container_no}`);
                    console.log(`     Booking: ${req.booking_bill || 'null'}`);
                    console.log(`     Type: ${req.type}`);
                    console.log(`     Status: ${req.status}`);
                    console.log(`     Created: ${req.createdAt}`);
                    console.log(`     Updated: ${req.updatedAt}`);
                });
            }

            // 2. Kiểm tra SealUsageHistory
            console.log('\n2️⃣ SealUsageHistory:');
            const sealHistory = await prisma.sealUsageHistory.findMany({
                where: {
                    container_number: containerNo
                },
                include: {
                    seal: {
                        select: {
                            shipping_company: true
                        }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                }
            });

            if (sealHistory.length === 0) {
                console.log(`❌ Không tìm thấy SealUsageHistory nào cho container ${containerNo}`);
            } else {
                sealHistory.forEach((history, index) => {
                    console.log(`  ${index + 1}. Seal: ${history.seal_number}`);
                    console.log(`     Container: ${history.container_number}`);
                    console.log(`     Booking: ${history.booking_number || 'null'}`);
                    console.log(`     Shipping Company: ${history.seal.shipping_company}`);
                    console.log(`     Export Date: ${history.export_date}`);
                    console.log(`     Created: ${history.created_at}`);
                });
            }

            // 3. Phân tích vấn đề
            console.log('\n3️⃣ Phân tích:');
            const hasServiceRequest = serviceRequests.length > 0;
            const hasSealHistory = sealHistory.length > 0;
            const hasBookingInServiceRequest = serviceRequests.some(req => req.booking_bill);
            const hasBookingInSealHistory = sealHistory.some(history => history.booking_number);

            console.log(`  - Có ServiceRequest: ${hasServiceRequest ? '✅' : '❌'}`);
            console.log(`  - Có SealUsageHistory: ${hasSealHistory ? '✅' : '❌'}`);
            console.log(`  - ServiceRequest có booking: ${hasBookingInServiceRequest ? '✅' : '❌'}`);
            console.log(`  - SealUsageHistory có booking: ${hasBookingInSealHistory ? '✅' : '❌'}`);

            if (hasServiceRequest && hasSealHistory && hasBookingInServiceRequest && !hasBookingInSealHistory) {
                console.log(`  🚨 VẤN ĐỀ: ServiceRequest có booking nhưng SealUsageHistory chưa có!`);
                console.log(`  💡 Cần đồng bộ booking từ ServiceRequest sang SealUsageHistory`);
            } else if (hasServiceRequest && hasSealHistory && !hasBookingInServiceRequest) {
                console.log(`  ⚠️  ServiceRequest chưa có booking - cần cập nhật booking vào ServiceRequest trước`);
            } else if (!hasServiceRequest) {
                console.log(`  ❌ Không có ServiceRequest - seal được gán mà không có request tương ứng`);
            }

            console.log('\n' + '='.repeat(60) + '\n');
        }

        // 4. Kiểm tra tổng quan
        console.log('📊 Tổng quan:');
        
        const totalSealHistory = await prisma.sealUsageHistory.count();
        const sealHistoryWithoutBooking = await prisma.sealUsageHistory.count({
            where: {
                booking_number: null
            }
        });
        const sealHistoryWithBooking = totalSealHistory - sealHistoryWithoutBooking;

        console.log(`  - Tổng số SealUsageHistory: ${totalSealHistory}`);
        console.log(`  - Có booking: ${sealHistoryWithBooking}`);
        console.log(`  - Chưa có booking: ${sealHistoryWithoutBooking}`);

        // 5. Kiểm tra ServiceRequest có booking nhưng SealUsageHistory chưa có
        console.log('\n🔍 Tìm ServiceRequest có booking nhưng SealUsageHistory chưa có:');
        
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

        let mismatchCount = 0;
        for (const req of serviceRequestsWithBooking) {
            const sealHistoryForContainer = await prisma.sealUsageHistory.findFirst({
                where: {
                    container_number: req.container_no,
                    booking_number: null
                }
            });

            if (sealHistoryForContainer) {
                console.log(`  🚨 Container ${req.container_no}: ServiceRequest có booking "${req.booking_bill}" nhưng SealUsageHistory chưa có`);
                mismatchCount++;
            }
        }

        if (mismatchCount === 0) {
            console.log(`  ✅ Không có mismatch nào`);
        } else {
            console.log(`  📊 Tổng cộng ${mismatchCount} container cần đồng bộ`);
        }

    } catch (error) {
        console.error('❌ Lỗi:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Chạy debug
if (require.main === module) {
    debugSealBookingSync();
}

module.exports = { debugSealBookingSync };
