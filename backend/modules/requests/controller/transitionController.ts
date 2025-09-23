import { Request, Response } from 'express';
import { prisma } from './dependencies';

// Move from PENDING to GATE_IN
export const moveToGate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({ success: false, message: 'Người dùng chưa đăng nhập' });
        }

        const request = await prisma.serviceRequest.findUnique({ where: { id } });

        if (!request) {
            return res.status(404).json({ success: false, message: 'Yêu cầu không tồn tại' });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({ success: false, message: 'Chỉ có thể chuyển yêu cầu từ trạng thái PENDING sang GATE_IN' });
        }

        const updatedRequest = await prisma.serviceRequest.update({
            where: { id },
            data: {
                status: 'GATE_IN',
                gate_checked_at: new Date(),
                gate_checked_by: user._id,
                updatedAt: new Date(),
                history: {
                    ...(request.history as any || {}),
                    [new Date().toISOString()]: {
                        by: user._id,
                        action: 'MOVE_TO_GATE',
                        from_status: 'PENDING',
                        to_status: 'GATE_IN',
                        note: 'Chuyển trực tiếp từ PENDING sang GATE_IN'
                    }
                }
            }
        });

        res.json({ success: true, data: updatedRequest, message: 'Yêu cầu đã được chuyển đến cổng thành công' });

    } catch (error: any) {
        console.error('Move to gate error:', error);
        res.status(500).json({ success: false, message: error.message || 'Có lỗi xảy ra khi chuyển yêu cầu đến cổng' });
    }
};


