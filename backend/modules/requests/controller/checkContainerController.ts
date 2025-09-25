import { Request, Response } from 'express';
import { prisma } from './dependencies';

// Check if container number already exists in the system
export const checkContainerExists = async (req: Request, res: Response) => {
    try {
        const { container_no } = req.query;

        if (!container_no) {
            return res.status(400).json({
                success: false,
                message: 'Container number is required'
            });
        }

        // Kiểm tra container có tồn tại trong hệ thống không
        const existingContainer = await prisma.serviceRequest.findFirst({
            where: {
                container_no: container_no as string,
                type: 'IMPORT',
                status: {
                    notIn: ['COMPLETED', 'REJECTED', 'GATE_REJECTED']
                }
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                container_no: true,
                status: true,
                request_no: true,
                createdAt: true
            }
        });

        if (existingContainer) {
            return res.json({
                success: true,
                exists: true,
                data: {
                    container_no: existingContainer.container_no,
                    status: existingContainer.status,
                    request_no: existingContainer.request_no,
                    created_at: existingContainer.createdAt
                },
                message: `Container ${container_no} đã tồn tại trong hệ thống với trạng thái ${existingContainer.status}`
            });
        }

        // Container không tồn tại - có thể tạo request mới
        return res.json({
            success: true,
            exists: false,
            message: `Container ${container_no} có thể tạo request mới`
        });

    } catch (error: any) {
        console.error('Check container exists error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Có lỗi xảy ra khi kiểm tra container' 
        });
    }
};
