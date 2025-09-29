import { prisma } from '../../../shared/config/database';
import { InvoiceService } from '../../finance/service/InvoiceService';

export class SealPricingService {
  private invoiceService: InvoiceService;

  constructor() {
    this.invoiceService = new InvoiceService();
  }

  /**
   * Cập nhật tổng tiền cho ServiceRequest khi seal được sử dụng
   * @param bookingNumber - Số booking từ ServiceRequest
   * @param sealUnitPrice - Đơn giá seal
   * @param userId - ID người thực hiện
   */
  async updateServiceRequestPricing(
    bookingNumber: string, 
    sealUnitPrice: number, 
    userId: string,
    containerNumber?: string,
    requestId?: string,
    createInvoice: boolean = true // Mặc định là true để giữ nguyên behavior hiện tại
  ): Promise<void> {
    try {
      console.log(`🔍 Tìm ServiceRequest với booking: ${bookingNumber}, container: ${containerNumber}, requestId: ${requestId}`);
      
      // Tìm ServiceRequest theo nhiều cách
      let serviceRequest = null;
      
      // 1. Tìm theo requestId trước (nếu có)
      if (requestId) {
        serviceRequest = await prisma.serviceRequest.findFirst({
          where: {
            id: requestId,
            type: 'EXPORT'
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
      
      // 2. Tìm theo booking_bill nếu chưa tìm thấy
      if (!serviceRequest && bookingNumber) {
        serviceRequest = await prisma.serviceRequest.findFirst({
          where: {
            booking_bill: bookingNumber,
            type: 'EXPORT'
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
        console.log(`📋 Tìm theo booking_bill ${bookingNumber}:`, serviceRequest ? 'Found' : 'Not found');
      }
      
      // 3. Tìm theo container_no nếu chưa tìm thấy
      if (!serviceRequest && containerNumber) {
        serviceRequest = await prisma.serviceRequest.findFirst({
          where: {
            container_no: containerNumber,
            type: 'EXPORT'
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
        console.log(`📋 Tìm theo container_no ${containerNumber}:`, serviceRequest ? 'Found' : 'Not found');
      }

      if (!serviceRequest) {
        console.log(`❌ Không tìm thấy ServiceRequest với booking: ${bookingNumber}, container: ${containerNumber}, requestId: ${requestId}`);
        return;
      }

      console.log(`✅ Tìm thấy ServiceRequest: ${serviceRequest.id} cho booking: ${bookingNumber}`);

      // Kiểm tra xem đã có invoice chưa
      let invoice = serviceRequest.invoices[0];

      // Chỉ tạo invoice nếu createInvoice = true
      if (!invoice && createInvoice) {
        // Tạo invoice mới nếu chưa có
        console.log('📄 Tạo invoice mới cho ServiceRequest');
        
        // Lấy price list cho dịch vụ nâng container
        const priceLists = await prisma.priceList.findMany({ 
          where: { 
            type: { equals: 'Nâng', mode: 'insensitive' as any } 
          } 
        });

        console.log(`📋 Tìm thấy ${priceLists.length} price list items cho dịch vụ nâng`);

        // Tạo items cho invoice (bao gồm cả seal cost)
        const items = priceLists.map((p: any) => ({
          service_code: p.serviceCode,
          description: p.serviceName,
          qty: 1,
          unit_price: Number(p.price || 0)
        }));

        // Thêm seal cost vào items
        items.push({
          service_code: 'SEAL',
          description: 'Chi phí seal container',
          qty: 1,
          unit_price: sealUnitPrice
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
      } else if (invoice && createInvoice) {
        // Cập nhật invoice hiện có
        console.log('📄 Cập nhật invoice hiện có:', invoice.id);
        
        // Kiểm tra xem đã có seal cost chưa
        const existingSealItem = await prisma.invoiceLineItem.findFirst({
          where: {
            invoice_id: invoice.id,
            service_code: 'SEAL'
          }
        });

        if (existingSealItem) {
          // Cập nhật seal cost hiện có
          console.log('🔄 Cập nhật seal cost hiện có:', existingSealItem.id);
          await prisma.invoiceLineItem.update({
            where: { id: existingSealItem.id },
            data: {
              unit_price: sealUnitPrice as any,
              line_amount: sealUnitPrice as any,
              total_line_amount: sealUnitPrice as any
            }
          });
          console.log('✅ Đã cập nhật seal cost hiện có');
        } else {
          // Thêm seal cost mới
          console.log('➕ Thêm seal cost mới vào invoice');
          await prisma.invoiceLineItem.create({
            data: {
              org_id: null,
              invoice_id: invoice.id,
              service_code: 'SEAL',
              description: 'Chi phí seal container',
              qty: 1 as any,
              unit_price: sealUnitPrice as any,
              line_amount: sealUnitPrice as any,
              tax_code: null,
              tax_rate: null as any,
              tax_amount: 0 as any,
              total_line_amount: sealUnitPrice as any
            }
          });
          console.log('✅ Đã thêm seal cost mới');
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
      console.error('Lỗi khi cập nhật pricing cho ServiceRequest:', error);
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
}
