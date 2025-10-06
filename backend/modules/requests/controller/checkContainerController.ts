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
        // Tìm container IMPORT đang active (không phải COMPLETED, REJECTED, GATE_REJECTED)
        const existingImportContainer = await prisma.serviceRequest.findFirst({
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

        // Nếu có container IMPORT đang active
        if (existingImportContainer) {
            // Kiểm tra xem có container EXPORT nào đang active không
            const existingExportContainer = await prisma.serviceRequest.findFirst({
                where: {
                    container_no: container_no as string,
                    type: 'EXPORT',
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

            // Nếu có cả IMPORT và EXPORT đang active, cho phép tạo request mới
            if (existingExportContainer) {
                return res.json({
                    success: true,
                    exists: false,
                    message: `Container ${container_no} có cả IMPORT và EXPORT đang active - có thể tạo request mới`
                });
            }

            // Chỉ có IMPORT active - không cho phép tạo request mới
            return res.json({
                success: true,
                exists: true,
                data: {
                    container_no: existingImportContainer.container_no,
                    status: existingImportContainer.status,
                    request_no: existingImportContainer.request_no,
                    created_at: existingImportContainer.createdAt
                },
                message: `Container ${container_no} đã tồn tại trong hệ thống với trạng thái ${existingImportContainer.status}. Chỉ có thể tạo request mới khi container không còn trong hệ thống.`
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
