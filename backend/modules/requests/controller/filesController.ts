import { Request, Response } from 'express';
import { prisma, fileUploadService } from './dependencies';

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


