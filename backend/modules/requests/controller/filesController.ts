import { Request, Response } from 'express';
import { prisma, fileUploadService } from './dependencies';

// Upload multiple files for a request
export const uploadFiles = async (req: Request, res: Response) => {
    try {
        const { requestId } = req.params;
        const files = req.files as Express.Multer.File[];
        const uploaderId = (req as any).user?._id || (req as any).user?.id;
        const uploaderRole = (req as any).user?.role || 'depot';

        console.log('Upload files - User info:', {
            user: (req as any).user,
            uploaderId,
            uploaderRole
        });

        if (!uploaderId) {
            console.error('Upload files - No uploaderId found:', {
                user: (req as any).user,
                headers: req.headers,
                auth: req.headers.authorization
            });
            return res.status(401).json({
                success: false,
                message: 'Không thể xác định người upload'
            });
        }

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có file nào được upload'
            });
        }

        // Fallback nếu uploaderId vẫn undefined - tìm user SystemAdmin đầu tiên
        let finalUploaderId = uploaderId;
        let finalUploaderRole = uploaderRole;
        
        if (!finalUploaderId) {
            try {
                const systemAdmin = await prisma.user.findFirst({
                    where: { role: 'SystemAdmin' },
                    select: { id: true }
                });
                finalUploaderId = systemAdmin?.id || 'cmgaazgln002fnjllom8z9s2y'; // Fallback to a known user ID
                finalUploaderRole = 'SystemAdmin';
            } catch (error) {
                console.error('Error finding system admin:', error);
                finalUploaderId = 'cmgaazgln002fnjllom8z9s2y'; // Fallback to a known user ID
                finalUploaderRole = 'SystemAdmin';
            }
        }

        console.log('Final uploader info:', {
            finalUploaderId,
            finalUploaderRole
        });

        const result = await fileUploadService.uploadFiles(
            requestId,
            files,
            finalUploaderId,
            finalUploaderRole
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


