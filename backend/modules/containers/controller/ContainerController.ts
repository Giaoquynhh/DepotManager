import { Request, Response } from 'express';
import { prisma } from '../../../shared/config/database';

export class ContainerController {
  async get(req: Request, res: Response) {
    try {
      const { container_no } = req.params;
      
      // Tìm container trong ServiceRequest
      const container = await prisma.serviceRequest.findFirst({
        where: {
          container_no,
          depot_deleted_at: null
        },
        include: {
          shipping_line: { select: { name: true, code: true } },
          container_type: { select: { code: true, description: true } },
          customer: { select: { name: true, code: true } },
          vehicle_company: { select: { name: true, code: true } },
              attachments: {
                where: { deleted_at: null },
                select: { 
                  id: true, 
                  file_name: true, 
                  file_type: true, 
                  storage_url: true,
                  file_size: true
                }
              }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!container) {
        return res.status(404).json({ 
          success: false, 
          message: 'Không tìm thấy container' 
        });
      }

      res.json({
        success: true,
        data: container
      });

    } catch (error: any) {
      console.error('Error getting container:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy thông tin container',
        error: error.message
      });
    }
  }

  async alerts(req: Request, res: Response) {
    try {
      // Tạm thời trả về empty array
      res.json({
        success: true,
        data: []
      });
    } catch (error: any) {
      console.error('Error getting alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi lấy danh sách alerts',
        error: error.message
      });
    }
  }

  async updateContainer(req: Request, res: Response) {
    try {
      const { container_no } = req.params;
      const {
        shipping_line_id,
        container_type_id,
        customer_id,
        vehicle_company_id,
        dem_det,
        seal_number
      } = req.body;

      // Tìm container trong ServiceRequest
      const existingRequest = await prisma.serviceRequest.findFirst({
        where: {
          container_no,
          depot_deleted_at: null
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!existingRequest) {
        return res.status(404).json({ 
          success: false, 
          message: 'Không tìm thấy container' 
        });
      }

      // Validate foreign keys
      if (shipping_line_id) {
        const shippingLine = await prisma.shippingLine.findUnique({ 
          where: { id: shipping_line_id } 
        });
        if (!shippingLine) {
          return res.status(400).json({ 
            success: false, 
            message: 'Hãng tàu không tồn tại' 
          });
        }
      }

      if (container_type_id) {
        const containerType = await prisma.containerType.findUnique({ 
          where: { id: container_type_id } 
        });
        if (!containerType) {
          return res.status(400).json({ 
            success: false, 
            message: 'Loại container không tồn tại' 
          });
        }
      }

      if (customer_id) {
        const customer = await prisma.customer.findUnique({ 
          where: { id: customer_id } 
        });
        if (!customer) {
          return res.status(400).json({ 
            success: false, 
            message: 'Khách hàng không tồn tại' 
          });
        }
      }

      if (vehicle_company_id) {
        const transportCompany = await prisma.transportCompany.findUnique({ 
          where: { id: vehicle_company_id } 
        });
        if (!transportCompany) {
          return res.status(400).json({ 
            success: false, 
            message: 'Nhà xe không tồn tại' 
          });
        }
      }

      // Cập nhật ServiceRequest
      const updatedRequest = await prisma.serviceRequest.update({
        where: { id: existingRequest.id },
        data: {
          shipping_line_id: shipping_line_id || existingRequest.shipping_line_id,
          container_type_id: container_type_id || existingRequest.container_type_id,
          customer_id: customer_id || existingRequest.customer_id,
          vehicle_company_id: vehicle_company_id || existingRequest.vehicle_company_id,
          dem_det: dem_det || existingRequest.dem_det,
          seal_number: seal_number || existingRequest.seal_number
        },
        include: {
          shipping_line: { select: { name: true, code: true } },
          container_type: { select: { code: true, description: true } },
          customer: { select: { name: true, code: true } },
          vehicle_company: { select: { name: true, code: true } }
        }
      });

      res.json({
        success: true,
        message: 'Cập nhật container thành công',
        data: updatedRequest
      });

    } catch (error: any) {
      console.error('Error updating container:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi cập nhật container',
        error: error.message
      });
    }
  }
}

export default new ContainerController();