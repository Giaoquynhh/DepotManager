import { Request, Response } from 'express';
import { prisma } from './dependencies';

/**
 * Đồng bộ booking_number giữa ServiceRequest và SealUsageHistory
 * Endpoint này có thể được gọi để đồng bộ thủ công khi cần thiết
 */
export const syncSealBooking = async (req: Request, res: Response) => {
    try {
        const { requestId } = req.params;
        const { forceUpdate = false } = req.body; // Có thể force update cả những record đã có booking_number

        console.log(`🔄 Bắt đầu đồng bộ booking cho ServiceRequest: ${requestId}`);

        // Lấy thông tin ServiceRequest
        const serviceRequest = await prisma.serviceRequest.findUnique({
            where: { 
                id: requestId,
                depot_deleted_at: null
            },
            select: {
                id: true,
                container_no: true,
                booking_bill: true,
                type: true
            }
        });

        if (!serviceRequest) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy ServiceRequest'
            });
        }

        if (!serviceRequest.booking_bill) {
            return res.status(400).json({
                success: false,
                message: 'ServiceRequest chưa có booking_bill'
            });
        }

        if (!serviceRequest.container_no) {
            return res.status(400).json({
                success: false,
                message: 'ServiceRequest chưa có container_no'
            });
        }

        // Tìm tất cả SealUsageHistory có container_number tương ứng
        const whereCondition: any = {
            container_number: serviceRequest.container_no
        };

        // Nếu không force update, chỉ cập nhật những record chưa có booking_number
        if (!forceUpdate) {
            whereCondition.booking_number = null;
        }

        const sealHistoryRecords = await prisma.sealUsageHistory.findMany({
            where: whereCondition,
            include: {
                seal: {
                    select: {
                        shipping_company: true
                    }
                },
                creator: {
                    select: {
                        full_name: true,
                        username: true,
                        email: true
                    }
                }
            }
        });

        if (sealHistoryRecords.length === 0) {
            return res.json({
                success: true,
                message: 'Không tìm thấy SealUsageHistory nào để cập nhật',
                data: {
                    requestId: serviceRequest.id,
                    containerNo: serviceRequest.container_no,
                    bookingBill: serviceRequest.booking_bill,
                    updatedCount: 0
                }
            });
        }

        // Cập nhật booking_number cho tất cả record tìm được
        const updateResult = await prisma.sealUsageHistory.updateMany({
            where: whereCondition,
            data: {
                booking_number: serviceRequest.booking_bill
            }
        });

        console.log(`✅ Đã cập nhật ${updateResult.count} record trong SealUsageHistory`);

        // Lấy thông tin chi tiết các record đã cập nhật
        const updatedRecords = await prisma.sealUsageHistory.findMany({
            where: {
                container_number: serviceRequest.container_no,
                booking_number: serviceRequest.booking_bill
            },
            include: {
                seal: {
                    select: {
                        shipping_company: true
                    }
                },
                creator: {
                    select: {
                        full_name: true,
                        username: true,
                        email: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        return res.json({
            success: true,
            message: `Đã đồng bộ thành công ${updateResult.count} record`,
            data: {
                requestId: serviceRequest.id,
                containerNo: serviceRequest.container_no,
                bookingBill: serviceRequest.booking_bill,
                updatedCount: updateResult.count,
                updatedRecords: updatedRecords.map(record => ({
                    id: record.id,
                    sealNumber: record.seal_number,
                    containerNumber: record.container_number,
                    bookingNumber: record.booking_number,
                    shippingCompany: record.seal.shipping_company,
                    exportDate: record.export_date,
                    createdAt: record.created_at,
                    creator: record.creator ? {
                        fullName: record.creator.full_name,
                        username: record.creator.username,
                        email: record.creator.email
                    } : null
                }))
            }
        });

    } catch (error: any) {
        console.error('❌ Lỗi khi đồng bộ booking:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Có lỗi xảy ra khi đồng bộ booking'
        });
    }
};

/**
 * Đồng bộ booking cho tất cả ServiceRequest có container_no nhưng chưa có booking trong SealUsageHistory
 */
export const syncAllSealBookings = async (req: Request, res: Response) => {
    try {
        console.log('🔄 Bắt đầu đồng bộ booking cho tất cả ServiceRequest');

        // Tìm tất cả ServiceRequest có booking_bill và container_no
        const serviceRequests = await prisma.serviceRequest.findMany({
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

        let totalUpdated = 0;
        const results = [];

        for (const request of serviceRequests) {
            try {
                // Cập nhật SealUsageHistory cho từng request
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
                    results.push({
                        requestId: request.id,
                        containerNo: request.container_no,
                        bookingBill: request.booking_bill,
                        updatedCount: updateResult.count
                    });
                }
            } catch (error: any) {
                console.error(`❌ Lỗi khi cập nhật request ${request.id}:`, error);
                results.push({
                    requestId: request.id,
                    containerNo: request.container_no,
                    bookingBill: request.booking_bill,
                    error: error.message || 'Unknown error'
                });
            }
        }

        console.log(`✅ Hoàn thành đồng bộ: ${totalUpdated} record được cập nhật`);

        return res.json({
            success: true,
            message: `Đã đồng bộ thành công ${totalUpdated} record từ ${serviceRequests.length} ServiceRequest`,
            data: {
                totalRequests: serviceRequests.length,
                totalUpdated,
                results
            }
        });

    } catch (error: any) {
        console.error('❌ Lỗi khi đồng bộ tất cả booking:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Có lỗi xảy ra khi đồng bộ tất cả booking'
        });
    }
};
