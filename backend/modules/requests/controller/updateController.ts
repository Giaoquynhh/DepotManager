import { Request, Response } from 'express';
import { prisma, fileUploadService } from './dependencies';

// Update request with validation and file uploads
export const updateRequest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            type,
            container_no,
            eta,
            shipping_line_id,
            container_type_id,
            customer_id,
            vehicle_company_id,
            license_plate,
            driver_name,
            driver_phone,
            appointment_time,
            booking_bill,
            notes
        } = req.body;

        const files = req.files as Express.Multer.File[];
        const updatedBy = (req as any).user?._id;

        const existingRequest = await prisma.serviceRequest.findUnique({
            where: {
                id,
                depot_deleted_at: null
            }
        });

        if (!existingRequest) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
        }

        if (shipping_line_id) {
            const shippingLine = await prisma.shippingLine.findUnique({ where: { id: shipping_line_id } });
            if (!shippingLine) {
                return res.status(400).json({ success: false, message: 'Shipping line not found' });
            }
        }

        if (container_type_id) {
            const containerType = await prisma.containerType.findUnique({ where: { id: container_type_id } });
            if (!containerType) {
                return res.status(400).json({ success: false, message: 'Container type not found' });
            }
        }

        if (customer_id && customer_id !== 'null') {
            const customer = await prisma.customer.findUnique({ where: { id: customer_id } });
            if (!customer) {
                return res.status(400).json({ success: false, message: 'Customer not found' });
            }
        }

        if (vehicle_company_id) {
            const vehicleCompany = await prisma.transportCompany.findUnique({ where: { id: vehicle_company_id } });
            if (!vehicleCompany) {
                return res.status(400).json({ success: false, message: 'Vehicle company not found' });
            }
        }

        const updatedRequest = await prisma.serviceRequest.update({
            where: { id },
            data: {
                type: type || existingRequest.type,
                container_no: container_no || existingRequest.container_no,
                shipping_line_id: shipping_line_id || existingRequest.shipping_line_id,
                container_type_id: container_type_id || existingRequest.container_type_id,
                customer_id: customer_id || existingRequest.customer_id,
                vehicle_company_id: vehicle_company_id || existingRequest.vehicle_company_id,
                eta: eta ? new Date(eta) : existingRequest.eta,
                appointment_time: appointment_time ? new Date(appointment_time) : existingRequest.appointment_time,
                appointment_note: notes || existingRequest.appointment_note,
                booking_bill: booking_bill || existingRequest.booking_bill,
                driver_name: driver_name || existingRequest.driver_name,
                driver_phone: driver_phone || existingRequest.driver_phone,
                license_plate: license_plate || existingRequest.license_plate,
                updatedAt: new Date(),
                attachments_count: existingRequest.attachments_count + (files ? files.length : 0)
            }
        });

        if (files && files.length > 0) {
            const uploadResult = await fileUploadService.uploadFiles(
                id,
                files,
                updatedBy,
                'depot'
            );

            if (!uploadResult.success) {
                return res.status(400).json({ success: false, message: uploadResult.message });
            }
        }

        res.json({ success: true, data: updatedRequest, message: 'Cập nhật yêu cầu thành công' });

    } catch (error: any) {
        console.error('Update request error:', error);
        res.status(500).json({ success: false, message: error.message || 'Có lỗi xảy ra khi cập nhật yêu cầu' });
    }
};


