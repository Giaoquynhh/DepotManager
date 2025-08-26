import { Response } from 'express';
import { AuthRequest } from '../../../shared/middlewares/auth';
import service from '../service/MaintenanceService';
import { approveSchema, createRepairSchema, listRepairsSchema, rejectSchema, updateInventorySchema, createInventorySchema, createRepairInvoiceSchema } from '../dto/MaintenanceDtos';
import { Request } from 'express';
import path from 'path';

export class MaintenanceController {
  async listRepairs(req: AuthRequest, res: Response) {
    const { error, value } = listRepairsSchema.validate(req.query);
    if (error) return res.status(400).json({ message: error.message });
    try { return res.json(await service.listRepairs(value)); } catch (e:any){ return res.status(400).json({ message: e.message }); }
  }
  async createRepair(req: AuthRequest, res: Response) {
    const { error, value } = createRepairSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    try { return res.status(201).json(await service.createRepair(req.user!, value)); } catch (e:any){ return res.status(400).json({ message: e.message }); }
  }
  async approve(req: AuthRequest, res: Response) {
    const { error, value } = approveSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    try { return res.json(await service.approveRepair(req.user!, req.params.id, value.manager_comment)); } catch (e:any){ return res.status(400).json({ message: e.message }); }
  }
  async reject(req: AuthRequest, res: Response) {
    const { error, value } = rejectSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    try { return res.json(await service.rejectRepair(req.user!, req.params.id, value.manager_comment)); } catch (e:any){ return res.status(400).json({ message: e.message }); }
  }

  async updateStatus(req: AuthRequest, res: Response) {
    const { status, manager_comment } = req.body;
    if (!status) return res.status(400).json({ message: 'Trạng thái là bắt buộc' });
    try { return res.json(await service.updateRepairStatus(req.user!, req.params.id, status, manager_comment)); } catch (e:any){ return res.status(400).json({ message: e.message }); }
  }

  async completeCheck(req: AuthRequest, res: Response) {
    const { result, manager_comment } = req.body;
    if (!result || !['PASS', 'FAIL'].includes(result)) return res.status(400).json({ message: 'Kết quả kiểm tra phải là PASS hoặc FAIL' });
    try { return res.json(await service.completeRepairCheck(req.user!, req.params.id, result, manager_comment)); } catch (e:any){ return res.status(400).json({ message: e.message }); }
  }

  async listInventory(req: AuthRequest, res: Response) {
    try { return res.json(await service.listInventory(req.query)); } catch (e:any){ return res.status(400).json({ message: e.message }); }
  }
  async updateInventory(req: AuthRequest, res: Response) {
    const { error, value } = updateInventorySchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    try { return res.json(await service.updateInventory(req.user!, req.params.id, value)); } catch (e:any){ return res.status(400).json({ message: e.message }); }
  }

  async createInventory(req: AuthRequest, res: Response) {
    const { error, value } = createInventorySchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    try { return res.status(201).json(await service.createInventory(req.user!, value)); } catch (e:any){ return res.status(400).json({ message: e.message }); }
  }

  async createRepairInvoice(req: AuthRequest, res: Response) {
    const { error, value } = createRepairInvoiceSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    try { return res.status(201).json(await service.createRepairInvoice(req.user!, value)); } catch (e:any){ return res.status(400).json({ message: e.message }); }
  }

  async getRepairInvoice(req: AuthRequest, res: Response) {
    try { return res.json(await service.getRepairInvoice(req.params.id)); } catch (e:any){ return res.status(400).json({ message: e.message }); }
  }

  async uploadRepairInvoicePDF(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { pdfBase64, fileName } = req.body;

      if (!pdfBase64 || !fileName) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu dữ liệu PDF hoặc tên file'
        });
      }

      // Gọi service để xử lý upload
      const result = await service.uploadRepairInvoicePDF(
        id,
        pdfBase64,
        fileName
      );

      res.json({
        success: true,
        message: 'Đã upload PDF thành công',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi upload PDF: ' + error.message
      });
    }
  }

  async downloadRepairInvoicePDF(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      // Lấy thông tin phiếu để có ticketCode
      const repairTicket = await service.getRepairTicketById(id);
      
      if (!repairTicket) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy phiếu sửa chữa'
        });
      }
      
      // Gọi service để lấy file PDF với ticketCode
      const pdfPath = await service.getRepairInvoicePDFPath(id, repairTicket.code);
      
      if (!pdfPath) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy hóa đơn PDF'
        });
      }

      // Gửi file PDF với headers phù hợp
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${path.basename(pdfPath)}"`);
      res.download(pdfPath);
    } catch (error: any) {
      console.error('Lỗi trong downloadRepairInvoicePDF:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi download PDF: ' + error.message
      });
    }
  }

  // Cập nhật hóa đơn sửa chữa
  async updateRepairInvoice(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const invoiceData = req.body;

      if (!invoiceData) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu dữ liệu hóa đơn'
        });
      }

      const result = await service.updateRepairInvoice(req.user!, id, invoiceData);

      res.json({
        success: true,
        message: 'Đã cập nhật hóa đơn thành công',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật hóa đơn: ' + error.message
      });
    }
  }

  // Gửi yêu cầu xác nhận
  async sendConfirmationRequest(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const result = await service.sendConfirmationRequest(req.user!, id);

      res.json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi gửi yêu cầu xác nhận: ' + error.message
      });
    }
  }

  // Đồng bộ trạng thái RepairTicket (for testing)
  async syncRepairTicketStatus(req: AuthRequest, res: Response) {
    try {
      const { container_no } = req.body;
      
      if (!container_no) {
        return res.status(400).json({
          success: false,
          message: 'Container number là bắt buộc'
        });
      }

      const result = await service.syncRepairTicketStatus(container_no);

      res.json({
        success: true,
        message: result ? 'Đã đồng bộ trạng thái RepairTicket thành công' : 'Không tìm thấy dữ liệu để đồng bộ',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đồng bộ trạng thái: ' + error.message
      });
    }
  }

  // Tiến hành sửa chữa
  async startRepair(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const result = await service.startRepair(req.user!, id);

      res.json({
        success: true,
        message: 'Đã tiến hành sửa chữa thành công',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tiến hành sửa chữa: ' + error.message
      });
    }
  }

  // Hoàn thành sửa chữa
  async completeRepair(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const result = await service.completeRepair(req.user!, id);

      res.json({
        success: true,
        message: 'Đã hoàn thành sửa chữa thành công',
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi hoàn thành sửa chữa: ' + error.message
      });
    }
  }
}

export default new MaintenanceController();


