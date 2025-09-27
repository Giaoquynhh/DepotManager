import { Request, Response } from 'express';
import { prisma } from './dependencies';

// Lấy seal cost cho một request
export const getSealCost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      select: {
        id: true,
        container_no: true,
        booking_bill: true,
        type: true,
        status: true
      }
    });

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ServiceRequest'
      });
    }

    // Tìm seal usage cho container này
    const sealUsage = await prisma.sealUsageHistory.findFirst({
      where: {
        OR: [
          { container_number: serviceRequest.container_no },
          { booking_number: serviceRequest.booking_bill }
        ]
      },
      include: {
        seal: {
          select: {
            unit_price: true,
            shipping_company: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (!sealUsage || !sealUsage.seal) {
      return res.json({
        success: true,
        data: {
          hasSealCost: false,
          sealCost: 0,
          message: 'Không có seal cost cho request này'
        }
      });
    }

    const sealCost = Number(sealUsage.seal.unit_price);


    res.json({
      success: true,
      data: {
        hasSealCost: true,
        sealCost: sealCost,
        shippingCompany: sealUsage.seal.shipping_company,
        containerNumber: sealUsage.container_number,
        bookingNumber: sealUsage.booking_number
      }
    });

  } catch (error: any) {
    console.error('❌ Lỗi khi lấy seal cost:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Có lỗi khi lấy seal cost'
    });
  }
};
