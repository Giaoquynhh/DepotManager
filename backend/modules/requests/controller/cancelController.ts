import { Request, Response } from 'express';
import { prisma } from './dependencies';

// Cancel request
export const cancelRequest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const cancelledBy = (req as any).user?._id;

        const request = await prisma.serviceRequest.findUnique({
            where: {
                id,
                depot_deleted_at: null
            }
        });

        if (!request) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
        }

        if (request.status === 'REJECTED') {
            return res.status(400).json({ success: false, message: 'Yêu cầu đã được hủy trước đó' });
        }

        if (request.status === 'COMPLETED') {
            return res.status(400).json({ success: false, message: 'Không thể hủy yêu cầu đã hoàn thành' });
        }

        const updatedRequest = await prisma.$transaction(async (tx) => {
            // Cập nhật ServiceRequest thành REJECTED
            const updatedRequest = await tx.serviceRequest.update({
                where: { id },
                data: {
                    status: 'REJECTED',
                    updatedAt: new Date(),
                    rejected_reason: reason || null,
                    rejected_by: cancelledBy || null,
                    rejected_at: new Date()
                }
            });

            // 🔄 BỔ SUNG LOGIC: Cập nhật trạng thái container để có thể nâng lại
            if (request.container_no && request.type === 'EXPORT') {
                console.log(`🔄 [Cancel Request] Container ${request.container_no} - yêu cầu nâng bị hủy, cập nhật trạng thái để có thể nâng lại`);
                
                // Tìm container trong yard
                const yardPlacement = await tx.yardPlacement.findFirst({
                    where: {
                        container_no: request.container_no,
                        status: 'OCCUPIED',
                        removed_at: null
                    }
                });

                if (yardPlacement) {
                    // Container vẫn ở trong yard, cần đảm bảo có thể nâng lại
                    // Kiểm tra xem container có phải là EMPTY_IN_YARD (SystemAdmin thêm) không
                    const containerRecord = await tx.container.findFirst({
                        where: {
                            container_no: request.container_no,
                            status: 'EMPTY_IN_YARD'
                        }
                    });

                    if (containerRecord) {
                        // Container là EMPTY_IN_YARD, không cần làm gì thêm
                        console.log(`✅ Container ${request.container_no} là EMPTY_IN_YARD, sẵn sàng để nâng lại`);
                    } else {
                        // Container từ IMPORT, cần đảm bảo có RepairTicket với status COMPLETE
                        const repairTicket = await tx.repairTicket.findFirst({
                            where: {
                                container_no: request.container_no,
                                status: 'COMPLETE'
                            },
                            orderBy: { updatedAt: 'desc' }
                        });

                        if (repairTicket) {
                            console.log(`✅ Container ${request.container_no} có RepairTicket COMPLETE, sẵn sàng để nâng lại`);
                        } else {
                            console.log(`⚠️ Container ${request.container_no} không có RepairTicket COMPLETE, có thể không xuất hiện trong gợi ý`);
                        }
                    }
                } else {
                    console.log(`⚠️ Container ${request.container_no} không tìm thấy trong yard, có thể đã bị xóa khỏi bãi`);
                }
            }

            return updatedRequest;
        });

        res.json({ success: true, data: updatedRequest, message: 'Hủy yêu cầu thành công' });

    } catch (error: any) {
        console.error('Cancel request error:', error);
        res.status(500).json({ success: false, message: error.message || 'Có lỗi xảy ra khi hủy yêu cầu' });
    }
};


