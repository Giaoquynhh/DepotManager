import { Request, Response } from 'express';
import { prisma } from './dependencies';

// Get repair cost for a container
export const getRepairCost = async (req: Request, res: Response) => {
  try {
    const { containerNo } = req.params;

    if (!containerNo) {
      return res.status(400).json({ 
        success: false, 
        message: 'Container number is required' 
      });
    }

    // Tìm RepairTicket cho container này
    const repairTicket = await prisma.repairTicket.findFirst({
      where: { 
        container_no: containerNo 
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        container_no: true,
        estimated_cost: true,
        labor_cost: true,
        status: true,
        createdAt: true
      }
    });

    if (!repairTicket) {
      return res.json({ 
        success: true, 
        data: { 
          repairCost: 0,
          hasRepairTicket: false,
          repairTicket: null
        } 
      });
    }

    // Tính tổng chi phí sửa chữa
    const estimatedCost = Number(repairTicket.estimated_cost || 0);
    const laborCost = Number(repairTicket.labor_cost || 0);
    const repairCost = estimatedCost + laborCost;

    return res.json({ 
      success: true, 
      data: { 
        repairCost,
        hasRepairTicket: true,
        repairTicket: {
          id: repairTicket.id,
          container_no: repairTicket.container_no,
          estimated_cost: estimatedCost,
          labor_cost: laborCost,
          status: repairTicket.status,
          createdAt: repairTicket.createdAt
        }
      } 
    });

  } catch (error: any) {
    console.error('getRepairCost error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Có lỗi khi lấy thông tin repair cost' 
    });
  }
};
