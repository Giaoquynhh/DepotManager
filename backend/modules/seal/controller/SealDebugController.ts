import { Request, Response } from 'express';
import { SealPricingService } from '../service/SealPricingService';

export class SealDebugController {
  private pricingService: SealPricingService;

  constructor() {
    this.pricingService = new SealPricingService();
  }

  // Test endpoint để debug pricing
  async testPricing(req: Request, res: Response) {
    try {
      const { bookingNumber, containerNumber, requestId, sealUnitPrice } = req.body;
      const userId = 'test-user-id';

      console.log('🧪 Testing Seal Pricing...');
      console.log('Input:', { bookingNumber, containerNumber, requestId, sealUnitPrice });

      await this.pricingService.updateServiceRequestPricing(
        bookingNumber || '',
        sealUnitPrice || 150000,
        userId,
        containerNumber,
        requestId
      );

      res.json({
        success: true,
        message: 'Pricing test completed. Check server logs for details.',
        input: { bookingNumber, containerNumber, requestId, sealUnitPrice }
      });
    } catch (error: any) {
      console.error('Test pricing error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Test failed',
        error: error.toString()
      });
    }
  }

  // Endpoint để xem ServiceRequest theo booking
  async findServiceRequest(req: Request, res: Response) {
    try {
      const { bookingNumber, containerNumber, requestId } = req.query;
      
      const { prisma } = await import('../../../shared/config/database');
      
      let serviceRequest = null;
      
      // Tìm theo requestId
      if (requestId) {
        serviceRequest = await prisma.serviceRequest.findFirst({
          where: { id: requestId as string, type: 'EXPORT' },
          include: {
            customer: true,
            invoices: { 
              where: { source_module: 'REQUESTS' },
              include: {
                items: true
              }
            }
          }
        });
      }
      
      // Tìm theo booking_bill
      if (!serviceRequest && bookingNumber) {
        serviceRequest = await prisma.serviceRequest.findFirst({
          where: { booking_bill: bookingNumber as string, type: 'EXPORT' },
          include: {
            customer: true,
            invoices: { 
              where: { source_module: 'REQUESTS' },
              include: {
                items: true
              }
            }
          }
        });
      }
      
      // Tìm theo container_no
      if (!serviceRequest && containerNumber) {
        serviceRequest = await prisma.serviceRequest.findFirst({
          where: { container_no: containerNumber as string, type: 'EXPORT' },
          include: {
            customer: true,
            invoices: { 
              where: { source_module: 'REQUESTS' },
              include: {
                items: true
              }
            }
          }
        });
      }

      res.json({
        success: true,
        data: serviceRequest,
        found: !!serviceRequest
      });
    } catch (error: any) {
      console.error('Find ServiceRequest error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Find failed',
        error: error.toString()
      });
    }
  }

  // Endpoint để xem tất cả seal usage history
  async getAllSealUsage(req: Request, res: Response) {
    try {
      const { prisma } = await import('../../../shared/config/database');
      
      const sealUsages = await prisma.sealUsageHistory.findMany({
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

      res.json({
        success: true,
        data: sealUsages,
        count: sealUsages.length
      });
    } catch (error: any) {
      console.error('Get seal usage error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Get seal usage failed',
        error: error.toString()
      });
    }
  }
}

export default new SealDebugController();
