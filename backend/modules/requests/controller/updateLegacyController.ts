import { Request, Response } from 'express';
import { prisma } from './dependencies';

// Update request (legacy generic update)
export const updateRequestLegacy = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const existingRequest = await prisma.serviceRequest.findUnique({
            where: {
                id,
                depot_deleted_at: null
            }
        });

        if (!existingRequest) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
        }

        const cleanData = Object.fromEntries(
            Object.entries(updateData).filter(([_, value]) => value !== undefined && value !== null)
        );

        const request = await prisma.serviceRequest.update({
            where: { id },
            data: cleanData,
            include: {
                shipping_line: { select: { name: true } },
                container_type: { select: { code: true } },
                customer: { select: { name: true } },
                vehicle_company: { select: { name: true } }
            }
        });

        res.json({ success: true, message: 'Cập nhật yêu cầu thành công', data: request });

    } catch (error: any) {
        console.error('Update request error:', error);
        res.status(500).json({ success: false, message: error.message || 'Có lỗi xảy ra khi cập nhật yêu cầu' });
    }
};


