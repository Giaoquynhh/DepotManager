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

        const updatedRequest = await prisma.serviceRequest.update({
            where: { id },
            data: {
                status: 'REJECTED',
                updatedAt: new Date(),
                rejected_reason: reason || null,
                rejected_by: cancelledBy || null,
                rejected_at: new Date()
            }
        });

        res.json({ success: true, data: updatedRequest, message: 'Hủy yêu cầu thành công' });

    } catch (error: any) {
        console.error('Cancel request error:', error);
        res.status(500).json({ success: false, message: error.message || 'Có lỗi xảy ra khi hủy yêu cầu' });
    }
};


