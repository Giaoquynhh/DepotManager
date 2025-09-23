import { Request, Response } from 'express';
import { prisma } from './dependencies';

// Delete request (soft delete)
export const deleteRequest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        (req as any).user?._id; // deletedBy captured but not used in original update

        const request = await prisma.serviceRequest.findUnique({
            where: {
                id,
                depot_deleted_at: null
            }
        });

        if (!request) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
        }

        const deletedRequest = await prisma.serviceRequest.update({
            where: { id },
            data: { depot_deleted_at: new Date(), updatedAt: new Date() }
        });

        res.json({ success: true, data: deletedRequest, message: 'Xóa yêu cầu thành công' });

    } catch (error: any) {
        console.error('Delete request error:', error);
        res.status(500).json({ success: false, message: error.message || 'Có lỗi xảy ra khi xóa yêu cầu' });
    }
};


