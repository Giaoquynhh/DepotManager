import { Request, Response } from 'express';
import { prisma, fileUploadService } from './dependencies';

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
            license_plate,
            driver_name,
            driver_phone,
            appointment_time,
            booking_bill,
            notes,
            status
        } = req.body;

        const files = req.files as Express.Multer.File[];
        const createdBy = (req as any).user?._id;

        if (!createdBy) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
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

        // Validation: Kiểm tra container number trùng lặp cho IMPORT requests
        if (type === 'IMPORT' && container_no) {
            const existingContainer = await prisma.serviceRequest.findFirst({
                where: {
                    container_no: container_no,
                    type: 'IMPORT',
                    status: {
                        notIn: ['COMPLETED', 'REJECTED', 'GATE_REJECTED']
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            if (existingContainer) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Container ${container_no} đã tồn tại trong hệ thống với trạng thái ${existingContainer.status}. Chỉ có thể tạo request mới khi container không còn trong hệ thống.` 
                });
            }
        }

        const request = await prisma.serviceRequest.create({
            data: {
                created_by: createdBy,
                type: type || 'IMPORT',
                request_no: req.body.request_no,
                container_no,
                shipping_line_id: shipping_line_id || null,
                container_type_id: container_type_id || null,
                customer_id: customer_id || null,
                vehicle_company_id: vehicle_company_id || null,
                eta: eta ? new Date(eta) : null,
                status: status || 'PENDING',
                appointment_time: appointment_time ? new Date(appointment_time) : null,
                appointment_note: notes,
                booking_bill: booking_bill || null,
                driver_name,
                driver_phone,
                license_plate: license_plate,
                tenant_id: null,
                attachments_count: files ? files.length : 0,
                locked_attachments: false,
                has_invoice: false,
                is_paid: false,
                is_pick: false
            }
        });

        if (files && files.length > 0) {
            const uploadResult = await fileUploadService.uploadFiles(
                request.id,
                files,
                createdBy,
                'depot'
            );

            if (!uploadResult.success) {
                await prisma.serviceRequest.delete({ where: { id: request.id } });
                return res.status(400).json({ success: false, message: uploadResult.message });
            }
        }

        res.status(201).json({ success: true, data: request, message: 'Tạo yêu cầu thành công' });

    } catch (error: any) {
        console.error('Create request error:', error);
        res.status(500).json({ success: false, message: error.message || 'Có lỗi xảy ra khi tạo yêu cầu' });
    }
};


