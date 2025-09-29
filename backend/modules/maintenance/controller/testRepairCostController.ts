import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { RepairCostService } from '../../finance/service/RepairCostService';
import { AuthRequest } from '../../../shared/middlewares/auth';

const prisma = new PrismaClient();

/**
 * API endpoint để test RepairCostService integration
 * POST /maintenance/test-repair-cost
 */
export const testRepairCostIntegration = async (req: AuthRequest, res: Response) => {
  try {
    const { container_no, repair_ticket_id } = req.body;

    if (!container_no && !repair_ticket_id) {
      return res.status(400).json({
        success: false,
        message: 'Cần cung cấp container_no hoặc repair_ticket_id'
      });
    }

    console.log(`🧪 Test RepairCostService integration cho container: ${container_no || 'N/A'}, repair_ticket: ${repair_ticket_id || 'N/A'}`);

    const repairCostService = new RepairCostService();

    // Tìm RepairTicket
    let repairTicket = null;
    if (repair_ticket_id) {
      repairTicket = await prisma.repairTicket.findUnique({
        where: { id: repair_ticket_id }
      });
    } else if (container_no) {
      repairTicket = await prisma.repairTicket.findFirst({
        where: { container_no },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!repairTicket) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy RepairTicket'
      });
    }

    console.log(`📋 Tìm thấy RepairTicket: ${repairTicket.id} - Status: ${repairTicket.status}`);

    // Tìm ServiceRequest
    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: {
        container_no: repairTicket.container_no,
        type: 'IMPORT'
      },
      orderBy: { createdAt: 'desc' },
      include: {
        invoices: {
          where: {
            source_module: 'REQUESTS'
          },
          include: {
            items: true
          }
        }
      }
    });

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ServiceRequest cho container này'
      });
    }

    console.log(`📋 Tìm thấy ServiceRequest: ${serviceRequest.id} - Status: ${serviceRequest.status}`);

    // Tính chi phí sửa chữa
    const repairCost = repairCostService.calculateRepairCost(repairTicket);
    console.log(`💰 Chi phí sửa chữa: ${repairCost} VND`);

    // Cập nhật ServiceRequest với repair cost
    await repairCostService.updateServiceRequestWithRepairCost(
      repairTicket.container_no || '',
      repairCost,
      req.user?._id || 'test-user',
      serviceRequest.id
    );

    // Lấy invoice sau khi cập nhật
    const updatedInvoice = await prisma.invoice.findFirst({
      where: {
        source_module: 'REQUESTS',
        source_id: serviceRequest.id
      },
      include: {
        items: true
      }
    });

    const repairItem = updatedInvoice?.items.find((item: any) => item.service_code === 'REPAIR');

    res.json({
      success: true,
      message: 'Test RepairCostService integration thành công',
      data: {
        repairTicket: {
          id: repairTicket.id,
          container_no: repairTicket.container_no,
          status: repairTicket.status,
          estimated_cost: repairTicket.estimated_cost,
          labor_cost: repairTicket.labor_cost,
          total_cost: repairCost
        },
        serviceRequest: {
          id: serviceRequest.id,
          container_no: serviceRequest.container_no,
          status: serviceRequest.status
        },
        invoice: updatedInvoice ? {
          id: updatedInvoice.id,
          total_amount: updatedInvoice.total_amount,
          subtotal: updatedInvoice.subtotal,
          tax_amount: updatedInvoice.tax_amount
        } : null,
        repairCostItem: repairItem ? {
          service_code: repairItem.service_code,
          description: repairItem.description,
          unit_price: repairItem.unit_price,
          line_amount: repairItem.line_amount
        } : null
      }
    });

  } catch (error: any) {
    console.error('❌ Test RepairCostService integration failed:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Có lỗi khi test RepairCostService integration',
      error: error.toString()
    });
  }
};
