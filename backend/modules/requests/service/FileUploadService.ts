import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

export class FileUploadService {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    // Configure multer for file uploads
    private getMulterConfig() {
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                const uploadPath = path.join(process.cwd(), 'uploads', 'requests');
                
                // Tạo thư mục nếu chưa tồn tại
                if (!fs.existsSync(uploadPath)) {
                    fs.mkdirSync(uploadPath, { recursive: true });
                }
                
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const fileExtension = path.extname(file.originalname);
                const fileName = `request_${uniqueSuffix}${fileExtension}`;
                cb(null, fileName);
            }
        });

        return multer({
            storage: storage,
            limits: {
                fileSize: 10 * 1024 * 1024 // 10MB
            },
            fileFilter: (req, file, cb) => {
                // Chỉ chấp nhận PDF và hình ảnh
                if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
                    cb(null, true);
                } else {
                    cb(new Error('Chỉ chấp nhận file PDF hoặc hình ảnh'));
                }
            }
        });
    }

    // Get multer instance
    getMulter() {
        return this.getMulterConfig();
    }

    // Upload multiple files for a request
    async uploadFiles(
        requestId: string,
        files: Express.Multer.File[],
        uploaderId: string,
        uploaderRole: 'customer' | 'depot' = 'depot'
    ) {
        try {
            // Kiểm tra request tồn tại
            const request = await this.prisma.serviceRequest.findUnique({
                where: { id: requestId }
            });

            if (!request) {
                throw new Error('REQUEST_NOT_FOUND');
            }

            const uploadedFiles = [];

            // Xử lý từng file
            for (const file of files) {
                // Sử dụng tên file mà multer đã tạo
                const fileName = file.filename;
                
                // Tạo storage URL (local path) - sử dụng /backend prefix để proxy qua Next.js
                const storageUrl = `/backend/uploads/requests/${fileName}`;

                // Lưu file vào database
                const attachment = await this.prisma.requestAttachment.create({
                    data: {
                        request_id: requestId,
                        uploader_id: uploaderId,
                        uploader_role: uploaderRole,
                        file_name: file.originalname,
                        file_type: file.mimetype.startsWith('image/') ? 'image' : 'pdf',
                        file_size: file.size,
                        storage_url: storageUrl
                    }
                });

                uploadedFiles.push(attachment);
            }

            // Cập nhật số lượng attachments
            await this.prisma.serviceRequest.update({
                where: { id: requestId },
                data: {
                    attachments_count: {
                        increment: files.length
                    }
                }
            });

            return {
                success: true,
                data: uploadedFiles,
                message: `Đã upload thành công ${files.length} file(s)`
            };

        } catch (error: any) {
            console.error('File upload error:', error);
            return {
                success: false,
                message: error.message || 'Có lỗi xảy ra khi upload file'
            };
        }
    }

    // Get files for a request
    async getFiles(requestId: string) {
        try {
            const files = await this.prisma.requestAttachment.findMany({
                where: {
                    request_id: requestId,
                    deleted_at: null
                },
                orderBy: {
                    uploaded_at: 'desc'
                }
            });

            return {
                success: true,
                data: files
            };

        } catch (error: any) {
            console.error('Get files error:', error);
            return {
                success: false,
                message: error.message || 'Có lỗi xảy ra khi lấy danh sách file'
            };
        }
    }

    // Get ALL files for a request (including deleted) - for ManagerCont compatibility with Maintenance/Repairs
    async getAllFiles(requestId: string) {
        try {
            const files = await this.prisma.requestAttachment.findMany({
                where: {
                    request_id: requestId
                    // Không filter deleted_at để lấy tất cả files
                },
                orderBy: {
                    uploaded_at: 'desc'
                }
            });

            return {
                success: true,
                data: files
            };

        } catch (error: any) {
            console.error('Get all files error:', error);
            return {
                success: false,
                message: error.message || 'Có lỗi xảy ra khi lấy danh sách file'
            };
        }
    }

    // Delete a file
    async deleteFile(fileId: string, deletedBy: string, reason?: string) {
        try {
            const file = await this.prisma.requestAttachment.findUnique({
                where: { id: fileId }
            });

            if (!file) {
                throw new Error('FILE_NOT_FOUND');
            }

            // Soft delete
            await this.prisma.requestAttachment.update({
                where: { id: fileId },
                data: {
                    deleted_at: new Date(),
                    deleted_by: deletedBy,
                    delete_reason: reason
                }
            });

            // Cập nhật số lượng attachments
            await this.prisma.serviceRequest.update({
                where: { id: file.request_id },
                data: {
                    attachments_count: {
                        decrement: 1
                    }
                }
            });

            return {
                success: true,
                message: 'Đã xóa file thành công'
            };

        } catch (error: any) {
            console.error('Delete file error:', error);
            return {
                success: false,
                message: error.message || 'Có lỗi xảy ra khi xóa file'
            };
        }
    }
}

export default FileUploadService;

