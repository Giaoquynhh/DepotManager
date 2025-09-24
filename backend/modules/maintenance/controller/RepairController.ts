import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../../shared/middlewares/auth';

const prisma = new PrismaClient();

export class RepairController {
  /**
   * Lấy danh sách repair tickets với thông tin từ import request
   */
  async getRepairs(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

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
      const { decision, canRepair } = (req as any).body || {};

      const ticket = await prisma.repairTicket.findUnique({ where: { id } });
      if (!ticket) return res.status(404).json({ message: 'RepairTicket không tồn tại' });

      const request = ticket.container_no
        ? await prisma.serviceRequest.findFirst({ where: { container_no: ticket.container_no, type: 'IMPORT' }, orderBy: { createdAt: 'desc' } })
        : null;

      // Cập nhật trạng thái RepairTicket theo yêu cầu:
      // - ACCEPT + canRepair = true  -> COMPLETE_NEEDREPAIR (chấp nhận nhưng cần sửa chữa)
      // - ACCEPT + canRepair = false -> COMPLETE (container tốt)
      // - REJECT                      -> REJECT
      let statusUpdate = ticket.status as any;
      if (decision === 'REJECT') statusUpdate = 'REJECT';
      else if (decision === 'ACCEPT') statusUpdate = canRepair ? 'COMPLETE_NEEDREPAIR' : 'COMPLETE';

      const txCalls: any[] = [
        prisma.repairTicket.update({ where: { id }, data: { status: statusUpdate, updatedAt: new Date() } })
      ];
      if (request) {
        // Đồng bộ ImportRequest theo yêu cầu nghiệp vụ:
        // - isCheck = true
        // - isRepair = true
        // - status = 'CHECKED'
        txCalls.push(
          prisma.serviceRequest.update({
            where: { id: request.id },
            data: { isCheck: true, isRepair: true, status: 'CHECKED', updatedAt: new Date() }
          })
        );
      }
      const [updatedTicket] = await prisma.$transaction(txCalls as any);

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
