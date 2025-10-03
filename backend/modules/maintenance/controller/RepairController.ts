import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../../shared/middlewares/auth';
import { RepairCostService } from '../../finance/service/RepairCostService';

const prisma = new PrismaClient();

export class RepairController {
  private repairCostService: RepairCostService;

  constructor() {
    this.repairCostService = new RepairCostService();
  }
  /**
   * Lấy danh sách repair tickets với thông tin từ import request
   */
  async getRepairs(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 20, container_no } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      
      // Filter theo container_no nếu có
      if (container_no) {
        where.container_no = container_no;
      }

      const [repairTickets, total] = await Promise.all([
        prisma.repairTicket.findMany({
          where,
          include: {
            equipment: true,
            items: {
              include: { inventoryItem: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.repairTicket.count({ where })
      ]);

      const repairsWithRequestInfo = await Promise.all(
        repairTickets.map(async (ticket: any) => {
          let serviceRequest = null;
          if (ticket.container_no) {
            serviceRequest = await prisma.serviceRequest.findFirst({
              where: { container_no: ticket.container_no, type: 'IMPORT' },
              include: {
                container_type: { select: { code: true } },
                attachments: true
              },
              orderBy: { createdAt: 'desc' }
            });
          }

          const imagesCount = await prisma.repairImage.count({ where: { repair_ticket_id: ticket.id } });

          return { ...ticket, serviceRequest, imagesCount };
        })
      );

      res.json({
        data: repairsWithRequestInfo,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      });
    } catch (error: any) {
      console.error('Error fetching repairs:', error);
      res.status(500).json({ message: 'Có lỗi xảy ra khi lấy danh sách phiếu sửa chữa', error: error.message });
    }
  }

  /**
   * Quyết định phiếu kiểm tra: accept/reject
   */
  async decide(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params as any;
      const { decision, canRepair, repairServices, totalCost } = (req as any).body || {};

      const ticket = await prisma.repairTicket.findUnique({ where: { id } });
      if (!ticket) return res.status(404).json({ message: 'RepairTicket không tồn tại' });

      const request = ticket.container_no
        ? await prisma.serviceRequest.findFirst({ where: { container_no: ticket.container_no, type: 'IMPORT' }, orderBy: { createdAt: 'desc' } })
        : null;

      // Cập nhật trạng thái RepairTicket theo yêu cầu:
      // - ACCEPT + canRepair = false: chuyển thành COMPLETE (Container tốt)
      // - ACCEPT + canRepair = true: chuyển thành COMPLETE_NEEDREPAIR (Container xấu có thể sửa chữa)
      // - REJECT: chuyển thành REJECT
      let statusUpdate = ticket.status as any;
      if (decision === 'REJECT') statusUpdate = 'REJECT';
      else if (decision === 'ACCEPT') {
        statusUpdate = canRepair ? 'COMPLETE_NEEDREPAIR' : 'COMPLETE';
      }

      // Khi từ chối repair ticket, cập nhật ServiceRequest để hiển thị button "Hủy"
      if (decision === 'REJECT' && request) {
        // Cập nhật ServiceRequest để có thể hiển thị button "Hủy" ở trang LowerContainer
        await prisma.serviceRequest.update({
          where: { id: request.id },
          data: {
            // Thêm flag để frontend biết có thể hiển thị button "Hủy"
            isRepairRejected: true,
            // Cập nhật lý do từ chối mặc định
            rejected_reason: 'Container xấu không thể sửa chữa',
            rejected_by: req.user?._id,
            rejected_at: new Date()
          }
        });
      }

      // Tính toán chi phí sửa chữa từ repairServices
      let estimatedCost = 0;
      let laborCost = 0;
      
      if (decision === 'ACCEPT' && canRepair && repairServices && repairServices.length > 0) {
        // Tính estimated_cost từ tổng giá trị các dịch vụ được chọn
        estimatedCost = totalCost || 0;
        // Labor cost có thể được tính riêng hoặc là một phần của estimated_cost
        laborCost = 0; // Tạm thời set = 0, có thể điều chỉnh sau
      }

      const txCalls: any[] = [
        prisma.repairTicket.update({ 
          where: { id }, 
          data: { 
            status: statusUpdate, 
            estimated_cost: estimatedCost,
            labor_cost: laborCost,
            updatedAt: new Date(),
            endTime: decision === 'ACCEPT' ? new Date() : undefined
          } 
        })
      ];
      if (request) {
        // Đồng bộ ImportRequest theo yêu cầu nghiệp vụ:
        if (decision === 'ACCEPT') {
          // Khi chấp nhận: isCheck = true, isRepair = true, status = 'CHECKED'
          txCalls.push(
            prisma.serviceRequest.update({
              where: { id: request.id },
              data: { isCheck: true, isRepair: true, status: 'CHECKED', updatedAt: new Date() }
            })
          );
        } else if (decision === 'REJECT') {
          // Khi từ chối: isCheck = true, isRepair = false, status = 'REJECTED'
          txCalls.push(
            prisma.serviceRequest.update({
              where: { id: request.id },
              data: { isCheck: true, isRepair: false, status: 'REJECTED', updatedAt: new Date() }
            })
          );
        }
      }
      const [updatedTicket] = await prisma.$transaction(txCalls as any);

      // Lưu repair services vào RepairTicketItem nếu có
      if (decision === 'ACCEPT' && canRepair && repairServices && repairServices.length > 0) {
        try {
          console.log(`📝 Lưu repair services cho ticket: ${updatedTicket.id}`);
          
          // Xóa các items cũ trước
          await prisma.repairTicketItem.deleteMany({
            where: { repair_ticket_id: updatedTicket.id }
          });
          
          // Tạo items mới từ repairServices
          const repairItems = repairServices.map((service: any) => ({
            repair_ticket_id: updatedTicket.id,
            inventory_item_id: service.id, // Sử dụng service.id làm inventory_item_id
            quantity: service.quantity || 1,
            unit_price: service.price || 0,
            total_price: service.lineTotal || 0
          }));
          
          await prisma.repairTicketItem.createMany({
            data: repairItems
          });
          
          console.log(`✅ Đã lưu ${repairItems.length} repair services`);
        } catch (error) {
          console.error('❌ Lỗi khi lưu repair services:', error);
        }
      }

      // Cập nhật repair cost vào invoice khi RepairTicket được ACCEPT
      // Không tạo invoice ngay khi RepairTicket được ACCEPT
      // Invoice sẽ được tạo khi thanh toán thành công (giống logic LiftContainer)
      if (decision === 'ACCEPT' && request && ticket.container_no) {
        console.log(`💰 RepairTicket được ACCEPT cho container: ${ticket.container_no}`);
        console.log(`📄 Invoice sẽ được tạo khi thanh toán thành công`);
        
        // Lưu repair cost vào RepairTicket để sử dụng sau này khi thanh toán
        const repairCost = this.repairCostService.calculateRepairCost(updatedTicket);
      }

      return res.json({ success: true, data: updatedTicket });
    } catch (e: any) {
      console.error('Decide repair ticket error:', e);
      res.status(400).json({ message: e.message || 'Có lỗi khi quyết định phiếu' });
    }
  }

  /**
   * Xóa repair ticket và các ảnh liên quan
   */
  async remove(req: AuthRequest, res: Response) {
    try {
      const { id } = (req as any).params;

      // Xóa ảnh liên quan trước để tránh lỗi ràng buộc
      await prisma.repairImage.deleteMany({ where: { repair_ticket_id: id } });

      // Xóa ticket
      const deleted = await prisma.repairTicket.delete({ where: { id } });

      return res.json({ success: true, data: deleted });
    } catch (e: any) {
      console.error('Delete repair ticket error:', e);
      res.status(400).json({ success: false, message: e.message || 'Delete repair ticket error' });
    }
  }
}
