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

      // Lấy repair tickets với thông tin từ service request
      const [repairTickets, total] = await Promise.all([
        prisma.repairTicket.findMany({
          where,
          include: {
            equipment: true,
            items: {
              include: {
                inventoryItem: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.repairTicket.count({ where })
      ]);

      // Lấy thông tin từ service request dựa trên container_no
      const repairsWithRequestInfo = await Promise.all(
        repairTickets.map(async (ticket: any) => {
          let serviceRequest = null;
          if (ticket.container_no) {
            serviceRequest = await prisma.serviceRequest.findFirst({
              where: {
                container_no: ticket.container_no,
                type: 'IMPORT'
              },
              include: {
                container_type: {
                  select: { code: true }
                },
                attachments: true
              },
              orderBy: { createdAt: 'desc' }
            });
          }

          // Lấy số lượng ảnh của ticket
          const imagesCount = await prisma.repairImage.count({ where: { repair_ticket_id: ticket.id } });

          return {
            ...ticket,
            serviceRequest,
            imagesCount
          };
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
      res.status(500).json({ 
        message: 'Có lỗi xảy ra khi lấy danh sách phiếu sửa chữa',
        error: error.message 
      });
    }
  }

}
