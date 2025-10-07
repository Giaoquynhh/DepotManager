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

        // BỔ SUNG: Kiểm tra container có EXPORT request với trạng thái khác GATE_OUT không
        const activeExportRequest = await prisma.serviceRequest.findFirst({
            where: {
                container_no: container_no as string,
                type: 'EXPORT',
                status: {
                    notIn: ['COMPLETED', 'REJECTED', 'GATE_REJECTED', 'GATE_OUT']
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

        // Nếu có EXPORT request với trạng thái khác GATE_OUT, không cho phép tạo IMPORT request
        if (activeExportRequest) {
            return res.json({
                success: true,
                exists: true,
                data: {
                    container_no: activeExportRequest.container_no,
                    status: activeExportRequest.status,
                    request_no: activeExportRequest.request_no,
                    created_at: activeExportRequest.createdAt
                },
                message: `Container ${container_no} đang có EXPORT request với trạng thái ${activeExportRequest.status} (khác GATE_OUT). Không thể tạo IMPORT request mới. Chỉ có thể tạo IMPORT request khi container có EXPORT request với trạng thái GATE_OUT hoặc không có EXPORT request nào.`
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

        // Nếu có container IMPORT đang active, không cho phép tạo IMPORT request mới
        if (existingImportContainer) {
            return res.json({
                success: true,
                exists: true,
                data: {
                    container_no: existingImportContainer.container_no,
                    status: existingImportContainer.status,
                    request_no: existingImportContainer.request_no,
                    created_at: existingImportContainer.createdAt
                },
                message: `Container ${container_no} đã tồn tại trong hệ thống với trạng thái ${existingImportContainer.status} (IMPORT). Chỉ có thể tạo request mới khi container không còn trong hệ thống.`
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
