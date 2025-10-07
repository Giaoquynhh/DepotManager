import { Request, Response } from 'express';
import { prisma } from './dependencies';

// Helper function to create RepairTicket for IMPORT requests
async function createRepairTicketForImport(containerNo: string, actorId: string, requestId: string): Promise<void> {
    try {
        // Kiểm tra xem đã có RepairTicket cho request này chưa (thay vì chỉ theo container_no)
        const existingTicket = await prisma.repairTicket.findFirst({
            where: { 
                container_no: containerNo,
                // Thêm điều kiện để tránh tạo duplicate cho cùng request
                problem_description: {
                    contains: requestId
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (existingTicket) {
            console.log(`ℹ️ Request ${requestId} đã có RepairTicket: ${existingTicket.id}`);
            return;
        }

        // Tạo RepairTicket mới cho mỗi request
        const code = `RT-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}-${Math.floor(Math.random()*1000)}`;
        const repairTicket = await prisma.repairTicket.create({
            data: {
                code,
                container_no: containerNo,
                created_by: actorId,
                problem_description: `Auto-created from Move to Gate (GATE_IN) - Request: ${requestId}`,
                status: 'PENDING' // Explicitly set to PENDING to avoid auto-update from history
            }
        });

        console.log(`✅ Đã tạo RepairTicket mới cho container ${containerNo} (Request: ${requestId}): ${repairTicket.id}`);
    } catch (error) {
        console.error(`❌ Lỗi khi tạo RepairTicket cho container ${containerNo} (Request: ${requestId}):`, error);
        throw error;
    }
}

// Move from PENDING to GATE_IN (theo luồng mới)
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
                time_in: new Date(),
                updatedAt: new Date(),
                history: {
                    ...(request.history as any || {}),
                    [new Date().toISOString()]: {
                        by: user._id,
                        action: 'MOVE_TO_GATE',
                        from_status: 'PENDING',
                        to_status: 'GATE_IN',
                        note: 'Chuyển từ PENDING sang GATE_IN (xe đã vào cổng)'
                    }
                }
            }
        });

        // Nếu là yêu cầu Hạ (IMPORT), tự động tạo RepairTicket khi chuyển sang GATE_IN
        if (request.type === 'IMPORT' && request.container_no) {
            try {
                await createRepairTicketForImport(request.container_no, user._id, request.id);
            } catch (error) {
                console.error('Error auto-creating repair ticket on move to gate:', error);
            }
        }

        res.json({ success: true, data: updatedRequest, message: 'Yêu cầu đã được chuyển đến cổng thành công' });

    } catch (error: any) {
        console.error('Move to gate error:', error);
        res.status(500).json({ success: false, message: error.message || 'Có lỗi xảy ra khi chuyển yêu cầu đến cổng' });
    }
};


