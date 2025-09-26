import { Request, Response } from 'express';
import { prisma } from './dependencies';

// Delete request (soft delete)
export const deleteRequest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?._id;

        const request = await prisma.serviceRequest.findUnique({
            where: {
                id,
                depot_deleted_at: null
            }
        });

        if (!request) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1) Soft-delete yêu cầu ở Depot
            const deletedRequest = await tx.serviceRequest.update({
                where: { id },
                data: { depot_deleted_at: new Date(), updatedAt: new Date() }
            });

            // 2) Xóa các công việc Forklift liên quan (nếu có) để không còn hiển thị ở Forklift
            if (request.container_no) {
                await tx.forkliftTask.deleteMany({
                    where: {
                        container_no: request.container_no,
                        // Xóa các task chưa hoàn tất; có thể điều chỉnh theo nghiệp vụ
                        status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] }
                    }
                });
            }

            // 3) (Tuỳ chọn) Có thể reset một số cờ Gate nếu cần trong tương lai
            // Hiện Gate dựa trên ServiceRequest; soft-delete đã loại khỏi danh sách Gate.

            return deletedRequest;
        });

        return res.json({ success: true, data: result, message: 'Xóa yêu cầu thành công và đã gỡ các công việc nâng liên quan' });

    } catch (error: any) {
        console.error('Delete request error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Có lỗi xảy ra khi xóa yêu cầu' });
    }
};


