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
            notes
        } = req.body;

        const files = req.files as Express.Multer.File[];
        const createdBy = (req as any).user?.id;

        // Tạo request
        const request = await prisma.serviceRequest.create({
            data: {
                created_by: createdBy,
                type: type || 'IMPORT',
                container_no,
                eta: eta ? new Date(eta) : null,
                status: 'PENDING',
                appointment_time: appointment_time ? new Date(appointment_time) : null,
                appointment_note: notes,
                driver_name,
                license_plate: vehicle_number
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

