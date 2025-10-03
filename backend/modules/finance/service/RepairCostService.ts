import { prisma } from '../../../shared/config/database';
import { InvoiceService } from './InvoiceService';

export class RepairCostService {
  private invoiceService: InvoiceService;

  constructor() {
    this.invoiceService = new InvoiceService();
  }

  /**
   * Cập nhật tổng tiền cho ServiceRequest khi RepairTicket được CHECKED
   * @param containerNo - Số container từ RepairTicket
   * @param repairCost - Tổng chi phí sửa chữa (estimated_cost + labor_cost)
   * @param userId - ID người thực hiện
   * @param requestId - ID ServiceRequest (optional)
   */
  async updateServiceRequestWithRepairCost(
    containerNo: string, 
    repairCost: number, 
    userId: string,
    requestId?: string
  ): Promise<void> {
    try {
      console.log(`🔍 Tìm ServiceRequest với container: ${containerNo}, requestId: ${requestId}`);
      
      // Tìm ServiceRequest theo nhiều cách
      let serviceRequest = null;
      
      // 1. Tìm theo requestId trước (nếu có)
      if (requestId) {
        serviceRequest = await prisma.serviceRequest.findFirst({
          where: {
            id: requestId,
            type: 'IMPORT' // Chỉ áp dụng cho Import requests
          },
          include: {
            customer: true,
            invoices: {
              where: {
                source_module: 'REQUESTS'
              }
            }
          }
        });
        console.log(`📋 Tìm theo requestId ${requestId}:`, serviceRequest ? 'Found' : 'Not found');
      }
      
      // 2. Tìm theo container_no nếu chưa tìm thấy
      if (!serviceRequest && containerNo) {
        serviceRequest = await prisma.serviceRequest.findFirst({
          where: {
            container_no: containerNo,
            type: 'IMPORT' // Chỉ áp dụng cho Import requests
          },
          include: {
            customer: true,
            invoices: {
              where: {
                source_module: 'REQUESTS'
              }
            }
          }
        });
        console.log(`📋 Tìm theo container_no ${containerNo}:`, serviceRequest ? 'Found' : 'Not found');
      }

      if (!serviceRequest) {
        console.log(`❌ Không tìm thấy ServiceRequest với container: ${containerNo}, requestId: ${requestId}`);
        return;
      }

      console.log(`✅ Tìm thấy ServiceRequest: ${serviceRequest.id} cho container: ${containerNo}`);

      // Kiểm tra xem đã có invoice chưa
      let invoice = serviceRequest.invoices[0];

      if (!invoice) {
        // Tạo invoice mới nếu chưa có
        console.log('📄 Tạo invoice mới cho ServiceRequest');
        
        // Lấy price list cho dịch vụ hạ container
        const priceLists = await prisma.priceList.findMany({ 
          where: { 
            type: { equals: 'Hạ', mode: 'insensitive' as any } 
          } 
        });

        console.log(`📋 Tìm thấy ${priceLists.length} price list items cho dịch vụ hạ`);

        // Tạo items cho invoice (bao gồm cả repair cost)
        const items = priceLists.map((p: any) => ({
          service_code: p.serviceCode,
          description: p.serviceName,
          qty: 1,
          unit_price: Number(p.price || 0)
        }));

        // Thêm repair cost vào items (luôn thêm, ngay cả khi = 0)
        items.push({
          service_code: 'REPAIR',
          description: 'Chi phí sửa chữa container',
          qty: 1,
          unit_price: repairCost
        });

        console.log(`💰 Items cho invoice:`, items);

        const payload = {
          customer_id: serviceRequest.customer_id || serviceRequest.created_by,
          source_module: 'REQUESTS',
          source_id: serviceRequest.id,
          items,
          status: 'DRAFT' // Tạo invoice với status DRAFT
        };

        console.log(`📤 Payload tạo invoice:`, payload);

        invoice = await this.invoiceService.create({ _id: userId } as any, payload);
        console.log(`✅ Đã tạo invoice mới: ${invoice.id} với tổng tiền: ${invoice.total_amount}`);
      } else {
        // Cập nhật invoice hiện có
        console.log('📄 Cập nhật invoice hiện có:', invoice.id);
        
        // Kiểm tra xem đã có repair cost chưa
        const existingRepairItem = await prisma.invoiceLineItem.findFirst({
          where: {
            invoice_id: invoice.id,
            service_code: 'REPAIR'
          }
        });

        if (existingRepairItem) {
          // Cập nhật repair cost hiện có
          await prisma.invoiceLineItem.update({
            where: { id: existingRepairItem.id },
            data: {
              unit_price: repairCost as any,
              line_amount: repairCost as any,
              total_line_amount: repairCost as any
            }
          });
        } else {
          // Thêm repair cost mới (luôn thêm, ngay cả khi = 0)
          await prisma.invoiceLineItem.create({
            data: {
              org_id: null,
              invoice_id: invoice.id,
              service_code: 'REPAIR',
              description: 'Chi phí sửa chữa container',
              qty: 1 as any,
              unit_price: repairCost as any,
              line_amount: repairCost as any,
              tax_code: null,
              tax_rate: null as any,
              tax_amount: 0 as any,
              total_line_amount: repairCost as any
            }
          });
        }

        // Tính lại tổng tiền cho invoice
        const lineItems = await prisma.invoiceLineItem.findMany({
          where: { invoice_id: invoice.id }
        });

        console.log(`📊 Có ${lineItems.length} line items trong invoice`);
        const totals = this.calculateTotals(lineItems);
        
        console.log(`💰 Tổng tiền mới: subtotal=${totals.subtotal}, tax=${totals.tax_amount}, total=${totals.total_amount}`);
        
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            subtotal: totals.subtotal as any,
            tax_amount: totals.tax_amount as any,
            total_amount: totals.total_amount as any
          }
        });

        console.log(`✅ Đã cập nhật tổng tiền invoice: ${totals.total_amount}`);
      }

    } catch (error) {
      console.error('Lỗi khi cập nhật repair cost cho ServiceRequest:', error);
      throw error;
    }
  }

  /**
   * Tính tổng tiền cho invoice
   */
  private calculateTotals(lineItems: any[]) {
    let subtotal = 0;
    let tax = 0;

    for (const item of lineItems) {
      const qty = Number(item.qty);
      const price = Number(item.unit_price);
      const line = qty * price;
      const taxAmt = item.tax_rate ? line * (Number(item.tax_rate) / 100) : 0;
      subtotal += line;
      tax += taxAmt;
    }

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax_amount: Math.round(tax * 100) / 100,
      total_amount: Math.round((subtotal + tax) * 100) / 100
    };
  }

  /**
   * Tính tổng chi phí sửa chữa từ RepairTicket
   * @param repairTicket - RepairTicket object
   * @returns Tổng chi phí sửa chữa
   */
  calculateRepairCost(repairTicket: any): number {
    const estimatedCost = Number(repairTicket.estimated_cost || 0);
    const laborCost = Number(repairTicket.labor_cost || 0);
    const totalCost = estimatedCost + laborCost;
    
    console.log(`💰 Tính chi phí sửa chữa: estimated_cost=${estimatedCost}, labor_cost=${laborCost}, total=${totalCost}`);
    
    return totalCost;
  }
}