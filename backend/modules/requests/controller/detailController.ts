import { Request, Response } from 'express';
import { prisma } from './dependencies';

// Get single request details
export const getRequest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const request = await prisma.serviceRequest.findUnique({
            where: {
                id,
                depot_deleted_at: null
            },
            include: {
                shipping_line: { select: { id: true, name: true } },
                container_type: { select: { id: true, code: true } },
                customer: { select: { id: true, name: true } },
                vehicle_company: { select: { id: true, name: true } },
                attachments: {
                    select: {
                        id: true,
                        file_name: true,
                        file_type: true,
                        file_size: true,
                        storage_url: true,
                        uploaded_at: true,
                        uploader: { select: { id: true } }
                    }
                }
            }
        });

        if (!request) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
        }

        res.json({ success: true, data: request, message: 'Lấy thông tin yêu cầu thành công' });

    } catch (error: any) {
        console.error('Get request error:', error);
        res.status(500).json({ success: false, message: error.message || 'Có lỗi xảy ra khi lấy thông tin yêu cầu' });
    }
};


