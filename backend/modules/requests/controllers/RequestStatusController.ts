import { Request, Response } from 'express';
import { RequestStatusService } from '../services/RequestStatusService';

const requestStatusService = new RequestStatusService();

export class RequestStatusController {
  /**
   * Cập nhật trạng thái hóa đơn cho request
   */
  async updateInvoiceStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { has_invoice } = req.body;
      
      // Debug: Kiểm tra user object
      console.log('🔍 Debug RequestStatusController:');
      console.log('🔍 req.user:', (req as any).user);
      console.log('🔍 req.body:', req.body);
      console.log('🔍 req.params:', req.params);
      console.log('🔍 has_invoice:', has_invoice);
      
      // Validate input
      if (typeof has_invoice !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'has_invoice phải là boolean'
        });
      }
      
      const userId = (req as any).user?.id || (req as any).user?._id || 'SYSTEM';
      console.log('🔍 userId:', userId);

      const request = await requestStatusService.updateInvoiceStatus(
        id,
        has_invoice,
        userId
      );

      console.log('✅ Request updated successfully:', request);

      res.json({
        success: true,
        message: `Đã cập nhật trạng thái hóa đơn: ${has_invoice ? 'Có hóa đơn' : 'Chưa có hóa đơn'}`,
        data: {
          id: request.id,
          has_invoice: has_invoice,
          updatedAt: request.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('❌ Error in updateInvoiceStatus:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi không xác định',
      });
    }
  }

  /**
   * Cập nhật trạng thái thanh toán cho request
   */
  async updatePaymentStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { is_paid } = req.body;
      
      // Debug: Kiểm tra user object
      console.log('🔍 Debug updatePaymentStatus:');
      console.log('🔍 req.user:', (req as any).user);
      console.log('🔍 req.body:', req.body);
      console.log('🔍 req.params:', req.params);
      console.log('🔍 is_paid:', is_paid);
      
      if (typeof is_paid !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'is_paid phải là boolean'
        });
      }
      
      const userId = (req as any).user?.id || (req as any).user?._id || 'SYSTEM';
      const userRole = (req as any).user?.role;
      
      console.log('🔍 userId:', userId);
      console.log('🔍 userRole:', userRole);

      // Kiểm tra quyền: customer chỉ có thể thanh toán hóa đơn của họ
      if (userRole === 'CustomerAdmin' || userRole === 'CustomerUser') {
        // Tìm request để kiểm tra xem có phải của user này không
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        const request = await prisma.serviceRequest.findUnique({
          where: { id },
          select: { created_by: true }
        });
        
        if (!request) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy request'
          });
        }
        
        if (request.created_by !== userId) {
          console.log('🔍 Access denied: customer cannot update payment status of other users');
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền thanh toán hóa đơn của request này'
          });
        }
        
        console.log('🔍 Access granted: customer updating their own request');
      }

      const request = await requestStatusService.updatePaymentStatus(
        id,
        is_paid,
        userId
      );

      console.log('✅ Payment status updated successfully:', request);

      res.json({
        success: true,
        message: `Đã cập nhật trạng thái thanh toán: ${is_paid ? 'Đã thanh toán' : 'Chưa thanh toán'}`,
        data: {
          id: request.id,
          is_paid: is_paid,
          updatedAt: request.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('❌ Error in updatePaymentStatus:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi không xác định',
      });
    }
  }

  /**
   * Cập nhật cả hai trạng thái cùng lúc
   */
  async updateBothStatuses(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { has_invoice, is_paid } = req.body;
      
      if (typeof has_invoice !== 'boolean' || typeof is_paid !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'has_invoice và is_paid phải là boolean'
        });
      }
      
      const userId = (req as any).user?.id || (req as any).user?._id || 'SYSTEM';

      const request = await requestStatusService.updateBothStatuses(
        id,
        has_invoice,
        is_paid,
        userId
      );

      res.json({
        success: true,
        message: 'Đã cập nhật cả hai trạng thái thành công',
        data: {
          id: request.id,
          has_invoice: has_invoice,
          is_paid: is_paid,
          updatedAt: request.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('❌ Error in updateBothStatuses:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi không xác định',
      });
    }
  }

  /**
   * Tìm kiếm requests theo trạng thái hóa đơn và thanh toán
   */
  async searchRequestsByStatus(req: Request, res: Response) {
    try {
      const filters = req.query;

      const result = await requestStatusService.getRequestsByStatus(filters);

      res.json({
        success: true,
        message: 'Tìm kiếm requests thành công',
        data: result,
      });
    } catch (error: any) {
      console.error('❌ Error in searchRequestsByStatus:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi không xác định',
      });
    }
  }

  /**
   * Lấy thống kê trạng thái requests
   */
  async getStatusStatistics(req: Request, res: Response) {
    try {
      const statistics = await requestStatusService.getStatusStatistics();

      res.json({
        success: true,
        message: 'Lấy thống kê thành công',
        data: statistics,
      });
    } catch (error: any) {
      console.error('❌ Error in getStatusStatistics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi không xác định',
      });
    }
  }

  /**
   * Tự động cập nhật trạng thái hóa đơn
   */
  async autoUpdateInvoiceStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await requestStatusService.autoUpdateInvoiceStatus(id);

      res.json({
        success: true,
        message: 'Tự động cập nhật trạng thái hóa đơn thành công',
        data: result,
      });
    } catch (error: any) {
      console.error('❌ Error in autoUpdateInvoiceStatus:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi không xác định',
      });
    }
  }

  /**
   * Tự động cập nhật trạng thái thanh toán
   */
  async autoUpdatePaymentStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await requestStatusService.autoUpdatePaymentStatus(id);

      res.json({
        success: true,
        message: 'Tự động cập nhật trạng thái thanh toán thành công',
        data: result,
      });
    } catch (error: any) {
      console.error('❌ Error in autoUpdatePaymentStatus:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi không xác định',
      });
    }
  }

  /**
   * Lấy thông tin trạng thái của request
   */
  async getRequestStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const request = await requestStatusService.getRequestsByStatus({
        status: undefined,
        type: undefined,
        limit: 1,
        offset: 0,
      });

      if (request.requests.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy request',
        });
      }

      const requestData = request.requests[0];

      res.json({
        success: true,
        message: 'Lấy thông tin trạng thái thành công',
        data: {
          id: requestData.id,
          has_invoice: (requestData as any).has_invoice,
          is_paid: (requestData as any).is_paid,
          status: requestData.status,
          type: requestData.type,
          updatedAt: requestData.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('❌ Error in getRequestStatus:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi không xác định',
      });
    }
  }
}
