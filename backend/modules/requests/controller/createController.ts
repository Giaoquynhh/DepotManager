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
            lower_customer_id,
            vehicle_company_id,
            license_plate,
            driver_name,
            driver_phone,
            appointment_time,
            booking_bill,
            notes,
            status,
            seal_number,
            dem_det
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

        // Validation: Kiểm tra container number trùng lặp cho IMPORT requests
        if (type === 'IMPORT' && container_no) {
            // BỔ SUNG: Kiểm tra container có EXPORT request với trạng thái khác GATE_OUT không
            const activeExportRequest = await prisma.serviceRequest.findFirst({
                where: {
                    container_no: container_no,
                    type: 'EXPORT',
                    status: {
                        notIn: ['COMPLETED', 'REJECTED', 'GATE_REJECTED', 'GATE_OUT']
                    }
                },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    container_no: true,
                    status: true,
                    request_no: true,
                    createdAt: true
                }
            });

            // Nếu có EXPORT request với trạng thái khác GATE_OUT, không cho phép tạo IMPORT request
            if (activeExportRequest) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Container ${container_no} đang có EXPORT request với trạng thái ${activeExportRequest.status} (khác GATE_OUT). Không thể tạo IMPORT request mới. Chỉ có thể tạo IMPORT request khi container có EXPORT request với trạng thái GATE_OUT hoặc không có EXPORT request nào.` 
                });
            }

            // Kiểm tra container có EXPORT request với status GATE_OUT không
            // Nếu có EXPORT GATE_OUT, cho phép tạo IMPORT request mới (bỏ qua IMPORT request cũ)
            const exportGateOutRequest = await prisma.serviceRequest.findFirst({
                where: {
                    container_no: container_no,
                    type: 'EXPORT',
                    status: 'GATE_OUT'
                },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    container_no: true,
                    status: true,
                    request_no: true,
                    createdAt: true
                }
            });

            // Nếu có EXPORT request với status GATE_OUT, cho phép tạo IMPORT request mới
            if (exportGateOutRequest) {
                // Cho phép tạo request - không return error
                console.log(`Container ${container_no} có thể tạo IMPORT request mới vì đã có EXPORT request với trạng thái GATE_OUT (${exportGateOutRequest.request_no})`);
            } else {
                // Tìm container IMPORT đang active
                const activeImportRequest = await prisma.serviceRequest.findFirst({
                    where: {
                        container_no: container_no,
                        type: 'IMPORT',
                        status: {
                            notIn: ['COMPLETED', 'REJECTED', 'GATE_REJECTED']
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                });

                // Nếu có container IMPORT đang active, không cho phép tạo IMPORT request mới
                if (activeImportRequest) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Container ${container_no} đã tồn tại trong hệ thống với trạng thái ${activeImportRequest.status} (IMPORT). Chỉ có thể tạo request mới khi container không còn trong hệ thống hoặc đã có EXPORT request với trạng thái GATE_OUT.` 
                    });
                }
            }
        }

        // BỔ SUNG: Tìm seal_number hiện có của container trước khi tạo request mới
        let existingSealNumber = null;
        if (container_no) {
            try {
                // Tìm ServiceRequest mới nhất của container này để lấy seal_number
                const latestRequest = await prisma.serviceRequest.findFirst({
                    where: { container_no },
                    orderBy: { createdAt: 'desc' },
                    select: { seal_number: true }
                });
                
                if (latestRequest?.seal_number) {
                    existingSealNumber = latestRequest.seal_number;
                    console.log(`🔍 Found existing seal_number for container ${container_no}: ${existingSealNumber}`);
                } else {
                    // Fallback: tìm trong Container table
                    const container = await prisma.container.findUnique({
                        where: { container_no },
                        select: { seal_number: true }
                    });
                    
                    if (container?.seal_number) {
                        existingSealNumber = container.seal_number;
                        console.log(`🔍 Found existing seal_number in Container table for ${container_no}: ${existingSealNumber}`);
                    }
                }
            } catch (error) {
                console.log(`⚠️ Error finding existing seal_number for container ${container_no}:`, error);
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
                lower_customer_id: lower_customer_id || null,
                vehicle_company_id: vehicle_company_id || null,
                eta: eta ? new Date(eta) : null,
                status: status || 'NEW_REQUEST',
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
                is_pick: false,
                // BỔ SUNG: Ưu tiên seal_number từ request mới, nếu không có thì dùng seal_number hiện có
                seal_number: seal_number || existingSealNumber || null,
                dem_det: dem_det || null
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


