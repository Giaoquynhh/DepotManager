import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import FileUploadService from '../service/FileUploadService';

const prisma = new PrismaClient();
const fileUploadService = new FileUploadService(prisma);

// Upload multiple files for a request
export const uploadFiles = async (req: Request, res: Response) => {
    try {
        const { requestId } = req.params;
        const files = req.files as Express.Multer.File[];
        const uploaderId = (req as any).user?.id;
        const uploaderRole = (req as any).user?.role || 'depot';

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có file nào được upload'
            });
        }

        const result = await fileUploadService.uploadFiles(
            requestId,
            files,
            uploaderId,
            uploaderRole
        );

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }

    } catch (error: any) {
        console.error('Upload files error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Có lỗi xảy ra khi upload file'
        });
    }
};

// Get files for a request
export const getFiles = async (req: Request, res: Response) => {
    try {
        const { requestId } = req.params;

        const result = await fileUploadService.getFiles(requestId);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }

    } catch (error: any) {
        console.error('Get files error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Có lỗi xảy ra khi lấy danh sách file'
        });
    }
};

// Delete a file
export const deleteFile = async (req: Request, res: Response) => {
    try {
        const { fileId } = req.params;
        const deletedBy = (req as any).user?.id;
        const { reason } = req.body;

        const result = await fileUploadService.deleteFile(fileId, deletedBy, reason);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }

    } catch (error: any) {
        console.error('Delete file error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Có lỗi xảy ra khi xóa file'
        });
    }
};

// Create a new request with files
export const createRequest = async (req: Request, res: Response) => {
    try {
        const {
            type,
            container_no,
            eta,
            shipping_line_id,
            container_type_id,
            customer_id,
            vehicle_company_id,
            vehicle_number,
            driver_name,
            driver_phone,
            appointment_time,
            booking_bill,
            notes
        } = req.body;

        const files = req.files as Express.Multer.File[];
        const createdBy = (req as any).user?._id;

        // Debug logging

        // Validate createdBy
        if (!createdBy) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Validate foreign keys exist
        if (shipping_line_id) {
            const shippingLine = await prisma.shippingLine.findUnique({ where: { id: shipping_line_id } });
            if (!shippingLine) {
                return res.status(400).json({
                    success: false,
                    message: 'Shipping line not found'
                });
            }
        }

        if (container_type_id) {
            const containerType = await prisma.containerType.findUnique({ where: { id: container_type_id } });
            if (!containerType) {
                return res.status(400).json({
                    success: false,
                    message: 'Container type not found'
                });
            }
        }

        if (customer_id && customer_id !== 'null') {
            const customer = await prisma.customer.findUnique({ where: { id: customer_id } });
            if (!customer) {
                return res.status(400).json({
                    success: false,
                    message: 'Customer not found'
                });
            }
        }

        if (vehicle_company_id) {
            const vehicleCompany = await prisma.transportCompany.findUnique({ where: { id: vehicle_company_id } });
            if (!vehicleCompany) {
                return res.status(400).json({
                    success: false,
                    message: 'Vehicle company not found'
                });
            }
        }

        // Tạo request
        const request = await prisma.serviceRequest.create({
            data: {
                created_by: createdBy,
                type: type || 'IMPORT',
                request_no: req.body.request_no, // Lưu request_no từ frontend
                container_no,
                shipping_line_id: shipping_line_id || null,
                container_type_id: container_type_id || null,
                customer_id: customer_id || null,
                vehicle_company_id: vehicle_company_id || null,
                eta: eta ? new Date(eta) : null,
                status: 'PENDING',
                appointment_time: appointment_time ? new Date(appointment_time) : null,
                appointment_note: notes,
                booking_bill: booking_bill || null,
                driver_name,
                license_plate: vehicle_number,
                // Thêm các field bắt buộc khác
                tenant_id: null, // Có thể cần lấy từ user context
                attachments_count: files ? files.length : 0,
                locked_attachments: false,
                has_invoice: false,
                is_paid: false,
                is_pick: false
            }
        });

        // Upload files nếu có
        if (files && files.length > 0) {
            const uploadResult = await fileUploadService.uploadFiles(
                request.id,
                files,
                createdBy,
                'depot'
            );

            if (!uploadResult.success) {
                // Nếu upload file thất bại, xóa request
                await prisma.serviceRequest.delete({
                    where: { id: request.id }
                });

                return res.status(400).json({
                    success: false,
                    message: uploadResult.message
                });
            }
        }

        res.status(201).json({
            success: true,
            data: request,
            message: 'Tạo yêu cầu thành công'
        });

    } catch (error: any) {
        console.error('Create request error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Có lỗi xảy ra khi tạo yêu cầu'
        });
    }
};

// Get list of requests
export const getRequests = async (req: any, res: any) => {
    try {
        const { type, status, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Build where clause
        const where: any = {
            depot_deleted_at: null // Only show non-deleted requests
        };

        if (type) {
            where.type = type;
        }

        if (status) {
            where.status = status;
        }

        // Get requests with relations
        const requests = await prisma.serviceRequest.findMany({
            where,
            include: {
                shipping_line: {
                    select: { name: true }
                },
                container_type: {
                    select: { code: true }
                },
                customer: {
                    select: { name: true }
                },
                vehicle_company: {
                    select: { name: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: offset,
            take: parseInt(limit)
        });

        // Get total count
        const total = await prisma.serviceRequest.count({ where });

        res.json({
            success: true,
            data: requests,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error: any) {
        console.error('Get requests error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Có lỗi xảy ra khi lấy danh sách yêu cầu'
        });
    }
};

