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
            lower_customer_id,
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

        if (lower_customer_id && lower_customer_id !== 'null') {
            const lowerCustomer = await prisma.customer.findUnique({ where: { id: lower_customer_id } });
            if (!lowerCustomer) {
                return res.status(400).json({ success: false, message: 'Lower customer not found' });
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
                lower_customer_id: lower_customer_id || existingRequest.lower_customer_id,
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

// Update reuse status
export const updateReuseStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reuseStatus } = req.body;
        const updatedBy = (req as any).user?._id;

        if (typeof reuseStatus !== 'boolean') {
            return res.status(400).json({ 
                success: false, 
                message: 'reuseStatus phải là boolean (true/false)' 
            });
        }

        const existingRequest = await prisma.serviceRequest.findUnique({
            where: {
                id,
                depot_deleted_at: null
            }
        });

        if (!existingRequest) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
        }

        // Kiểm tra trạng thái request - không cho phép thay đổi reuse status khi ở trạng thái IN_CAR hoặc GATE_OUT
        if (existingRequest.status === 'IN_CAR' || existingRequest.status === 'GATE_OUT') {
            return res.status(400).json({ 
                success: false, 
                message: `Không thể thay đổi trạng thái reuse khi request đang ở trạng thái ${existingRequest.status === 'IN_CAR' ? 'IN_CAR' : 'GATE_OUT'}` 
            });
        }

        const updatedRequest = await prisma.serviceRequest.update({
            where: { id },
            data: { 
                reuse_status: reuseStatus,
                updatedAt: new Date()
            }
        });

        // Ghi log audit
        await prisma.auditLog.create({
            data: {
                actor_id: updatedBy,
                action: 'REUSE_STATUS_UPDATED',
                entity: 'ServiceRequest',
                entity_id: id,
                meta: {
                    oldReuseStatus: existingRequest.reuse_status,
                    newReuseStatus: reuseStatus,
                    containerNo: existingRequest.container_no,
                    requestType: existingRequest.type,
                    timestamp: new Date()
                }
            }
        });

        return res.json({ 
            success: true, 
            data: updatedRequest, 
            message: `Trạng thái reuse đã được ${reuseStatus ? 'bật' : 'tắt'} thành công` 
        });

    } catch (error: any) {
        console.error('Update reuse status error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Có lỗi xảy ra khi cập nhật trạng thái reuse' 
        });
    }
};


