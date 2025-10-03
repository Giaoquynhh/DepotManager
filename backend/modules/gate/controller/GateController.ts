import { Request, Response } from 'express';
import { GateService } from '../service/GateService';
import { 
  forwardRequestSchema, 
  gateAcceptSchema, 
  gateRejectSchema, 
  gateSearchSchema,
  gateApproveSchema
} from '../dto/GateDtos';
import { AuthRequest } from '../../../shared/middlewares/auth';

export class GateController {
  private gateService: GateService;

  constructor() {
    this.gateService = new GateService();
  }

  /**
   * Forward request từ Kho sang Gate
   */
  async forwardRequest(req: AuthRequest, res: Response) {
    try {
      const { error } = forwardRequestSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          message: 'Dữ liệu không hợp lệ', 
          error: error.details[0].message 
        });
      }

      const requestId = req.params.id;
      const actorId = req.user?._id;

      if (!actorId) {
        return res.status(401).json({ message: 'Không có quyền truy cập' });
      }

      const result = await this.gateService.forwardRequest(requestId, actorId);
      
      res.json({
        message: 'Đã chuyển tiếp request sang Gate thành công',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({ 
        message: error.message || 'Có lỗi xảy ra khi chuyển tiếp request' 
      });
    }
  }

  /**
   * Gate chấp nhận xe vào
   */
  async acceptGate(req: AuthRequest, res: Response) {
    try {
      const { error } = gateAcceptSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          message: 'Dữ liệu không hợp lệ', 
          error: error.details[0].message 
        });
      }

      const requestId = req.params.id;
      const actorId = req.user?._id;
      const driverInfo = req.body;

      if (!actorId) {
        return res.status(401).json({ message: 'Không có quyền truy cập' });
      }

      const result = await this.gateService.acceptGate(requestId, actorId, driverInfo);
      
      res.json({
        message: 'Đã chấp nhận xe vào thành công',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({ 
        message: error.message || 'Có lỗi xảy ra khi chấp nhận xe vào' 
      });
    }
  }

  /**
   * Gate approve request
   */
  async approveGate(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const actorId = req.user?._id;

      if (!actorId) {
        return res.status(401).json({ message: 'Không có quyền truy cập' });
      }

      // Validate yêu cầu có biển số xe
      const { error } = gateApproveSchema.validate(req.body || {});
      if (error) {
        return res.status(400).json({ message: error.details?.[0]?.message || 'Biển số xe không hợp lệ' });
      }

      const result = await this.gateService.approveGate(id, actorId, req.body);
      
      res.json({
        message: 'Đã approve request thành công',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        message: error.message || 'Lỗi khi approve request'
      });
    }
  }

  /**
   * Gate reject request
   */
  async rejectGate(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const actorId = req.user?._id;
      const { error, value } = gateRejectSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          message: 'Dữ liệu không hợp lệ',
          error: error.details[0].message
        });
      }

      if (!actorId) {
        return res.status(401).json({ message: 'Không có quyền truy cập' });
      }

      const result = await this.gateService.rejectGate(id, actorId, value);
      
      res.json({
        message: 'Đã từ chối request thành công',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        message: error.message || 'Lỗi khi từ chối request'
      });
    }
  }

  /**
   * Tìm kiếm requests ở Gate
   */
  async searchRequests(req: AuthRequest, res: Response) {
    try {
      const { error, value } = gateSearchSchema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          message: 'Tham số tìm kiếm không hợp lệ', 
          error: error.details[0].message
        });
      }

      const actorId = req.user?._id;
      if (!actorId) {
        return res.status(401).json({ message: 'Không có quyền truy cập' });
      }

      const searchParams = {
        status: req.query.status as string,
        statuses: req.query.statuses as string,
        container_no: req.query.container_no as string,
        license_plate: req.query.license_plate as string, // Thêm trường biển số xe
        type: req.query.type as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20
      };

      const result = await this.gateService.searchRequests(searchParams, actorId);
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ 
        message: error.message || 'Có lỗi xảy ra khi tìm kiếm requests' 
      });
    }
  }

  /**
   * Lấy chi tiết request để xử lý ở Gate
   */
  async getRequestDetails(req: AuthRequest, res: Response) {
    try {
      const requestId = req.params.id;
      const actorId = req.user?._id;

      if (!actorId) {
        return res.status(401).json({ message: 'Không có quyền truy cập' });
      }

      const result = await this.gateService.getRequestDetails(requestId);
      
      res.json({
        message: 'Lấy thông tin request thành công',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({ 
        message: error.message || 'Có lỗi xảy ra khi lấy thông tin request' 
      });
    }
  }

  /**
   * Lấy danh sách chứng từ của request
   */
  async getRequestDocuments(req: AuthRequest, res: Response) {
    try {
      const requestId = req.params.id;
      const actorId = req.user?._id;

      if (!actorId) {
        return res.status(401).json({ message: 'Không có quyền truy cập' });
      }

      const result = await this.gateService.getRequestDocuments(requestId);
      
      res.json({
        message: 'Lấy danh sách chứng từ thành công',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({ 
        message: error.message || 'Có lỗi xảy ra khi lấy danh sách chứng từ' 
      });
    }
  }

  /**
   * Xem file chứng từ
   */
  async viewDocument(req: AuthRequest, res: Response) {
    try {
      const { requestId, documentId } = req.params;
      const actorId = req.user?._id;

      if (!actorId) {
        return res.status(401).json({ message: 'Không có quyền truy cập' });
      }

      const result = await this.gateService.viewDocument(requestId, documentId);
      
      // Set headers for file download/view
      res.setHeader('Content-Type', result.contentType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${result.fileName}"`);
      
      res.send(result.fileBuffer);
    } catch (error: any) {
      res.status(400).json({ 
        message: error.message || 'Có lỗi xảy ra khi xem file' 
      });
    }
  }

  /**
   * Gate OUT - Xe rời kho
   */
  async gateOut(req: AuthRequest, res: Response) {
    try {
      const requestId = req.params.id;
      const actorId = req.user?._id;

      if (!actorId) {
        return res.status(401).json({ message: 'Không có quyền truy cập' });
      }

      const result = await this.gateService.gateOut(requestId, actorId);
      
      res.json({
        message: 'Đã chuyển trạng thái sang GATE_OUT - Xe rời kho thành công',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({ 
        message: error.message || 'Có lỗi xảy ra khi chuyển trạng thái GATE_OUT' 
      });
    }
  }

  /**
   * Check-in - Xe vào cổng từ trạng thái NEW_REQUEST
   */
  async checkIn(req: AuthRequest, res: Response) {
    try {
      const requestId = req.params.id;
      const actorId = req.user?._id;

      if (!actorId) {
        return res.status(401).json({ message: 'Không có quyền truy cập' });
      }

      const result = await this.gateService.checkIn(requestId, actorId);
      
      res.json({
        message: 'Check-in thành công',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({ 
        message: error.message || 'Có lỗi xảy ra khi Check-in' 
      });
    }
  }

  /**
   * Check-out - Xe rời cổng từ trạng thái NEW_REQUEST
   */
  async checkOut(req: AuthRequest, res: Response) {
    try {
      const requestId = req.params.id;
      const actorId = req.user?._id;

      if (!actorId) {
        return res.status(401).json({ message: 'Không có quyền truy cập' });
      }

      const result = await this.gateService.checkOut(requestId, actorId);
      
      res.json({
        message: 'Check-out thành công',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({ 
        message: error.message || 'Có lỗi xảy ra khi Check-out' 
      });
    }
  }

  /**
   * Lấy lịch sử xe ra vào cổng
   */
  async getGateHistory(req: AuthRequest, res: Response) {
    try {
      const params = req.query;
      const result = await this.gateService.getGateHistory(params);
      
      res.json({
        message: 'Lấy lịch sử xe ra vào cổng thành công',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error: any) {
      res.status(400).json({ 
        message: error.message || 'Có lỗi xảy ra khi lấy lịch sử xe ra vào cổng' 
      });
    }
  }

  /**
   * Cập nhật trạng thái kiểm tra container
   */
  async updateInspectionStatus(req: AuthRequest, res: Response) {
    try {
      const { requestId } = req.params;
      const { isCheck, isRepair, inspectionStatus, images } = req.body;

      const result = await this.gateService.updateInspectionStatus(
        requestId, 
        { isCheck, isRepair, inspectionStatus, images }
      );

      res.json({
        success: true,
        message: 'Cập nhật trạng thái kiểm tra thành công',
        data: result
      });
    } catch (error) {
      console.error('Error in updateInspectionStatus:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi cập nhật trạng thái kiểm tra',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate EIR cho container
   */
  async generateEIR(req: Request, res: Response) {
    try {
      const requestId = req.params.id;
      
      console.log('📄 Generating EIR for request:', requestId);
      
      const result = await this.gateService.generateEIR(requestId);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message || 'Không thể tạo phiếu EIR'
        });
      }

      // Set headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
      
      // Send file buffer
      res.send(result.data.fileBuffer);
      
    } catch (error: any) {
      console.error('❌ Error generating EIR:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo phiếu EIR',
        error: error.message
      });
    }
  }
}

export default new GateController();


