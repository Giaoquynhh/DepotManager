import { Request, Response } from 'express';
import { prisma } from './dependencies';
import invoiceService from '../../finance/service/InvoiceService';

// Helper function to calculate totals
function calculateTotals(lineItems: any[]) {
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

// Mark request as paid and optionally advance status for EXPORT flow
export const markPaid = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
    }

    const data: any = { is_paid: true, updatedAt: new Date() };
    // Nếu là EXPORT và đang ở GATE_IN hoặc DONE_LIFTING, chuyển sang IN_CAR để Gate_out
    if (existing.type === 'EXPORT' && (existing.status === 'GATE_IN' || existing.status === 'DONE_LIFTING')) {
      data.status = 'IN_CAR';
    }

    const updated = await prisma.serviceRequest.update({ where: { id }, data });

    // Auto-create invoice if not exists yet
    const existingInvoice = await prisma.invoice.findFirst({ 
      where: { source_module: 'REQUESTS', source_id: id },
      include: {
        items: true
      }
    });
    
    if (!existingInvoice) {
      // Lấy khách hàng từ request (ưu tiên customer_id)
      const customerId = updated.customer_id || null;
      
      let items: any[] = [];
      
      if (updated.type === 'EXPORT') {
        // Logic cho yêu cầu nâng container (EXPORT)
        const priceLists = await prisma.priceList.findMany({ where: { type: { equals: 'Nâng', mode: 'insensitive' as any } } as any });
        const totalUnit = priceLists.reduce((sum, p:any) => sum + Number(p.price||0), 0);
        items = priceLists.map((p:any) => ({ service_code: p.serviceCode, description: p.serviceName, qty: 1, unit_price: Number(p.price||0) }));
        if (items.length === 0) {
          items.push({ service_code: 'LOLO', description: 'Nâng container', qty: 1, unit_price: 0 });
        }
      } else if (updated.type === 'IMPORT') {
        // Logic cho yêu cầu hạ container (IMPORT)
        const priceLists = await prisma.priceList.findMany({ where: { type: { equals: 'Hạ', mode: 'insensitive' as any } } as any });
        items = priceLists.map((p:any) => ({ service_code: p.serviceCode, description: p.serviceName, qty: 1, unit_price: Number(p.price||0) }));
        if (items.length === 0) {
          items.push({ service_code: 'LOWER', description: 'Hạ container', qty: 1, unit_price: 0 });
        }
        
        // Thêm repair cost nếu có RepairTicket với chi phí sửa chữa
        console.log(`🔍 Tìm RepairTicket cho container: ${updated.container_no}`);
        const repairTicket = await prisma.repairTicket.findFirst({
          where: { container_no: updated.container_no },
          orderBy: { createdAt: 'desc' }
        });
        
        if (repairTicket && ((repairTicket.estimated_cost || 0) > 0 || (repairTicket.labor_cost || 0) > 0)) {
          const repairCost = (repairTicket.estimated_cost || 0) + (repairTicket.labor_cost || 0);
          if (repairCost > 0) {
            items.push({
              service_code: 'REPAIR',
              description: 'Chi phí sửa chữa container',
              qty: 1,
              unit_price: repairCost
            });
            console.log(`💰 Đã thêm repair cost: ${repairCost} VND vào invoice`);
          }
        }
      }
      
      // Thêm seal cost nếu có seal được sử dụng cho container này
      console.log(`🔍 Tìm seal usage cho container: ${updated.container_no}, booking: ${updated.booking_bill}`);
      
      const sealUsage = await prisma.sealUsageHistory.findFirst({
        where: {
          OR: [
            { container_number: updated.container_no },
            { booking_number: updated.booking_bill }
          ]
        },
        include: {
          seal: {
            select: {
              unit_price: true,
              shipping_company: true
            }
          }
        }
      });
      
      console.log(`📊 Seal usage found:`, sealUsage ? 'Yes' : 'No');
      if (sealUsage) {
        console.log(`   - Container: ${sealUsage.container_number}`);
        console.log(`   - Booking: ${sealUsage.booking_number}`);
        console.log(`   - Seal Price: ${sealUsage.seal?.unit_price} VND`);
      }
      
      if (sealUsage && sealUsage.seal) {
        items.push({
          service_code: 'SEAL',
          description: `Chi phí seal container (${sealUsage.seal.shipping_company})`,
          qty: 1,
          unit_price: Number(sealUsage.seal.unit_price)
        });
        console.log(`💰 Đã thêm seal cost: ${sealUsage.seal.unit_price} VND vào invoice`);
      }
      
      if (!customerId) {
        // fallback: tạo customer tạm nếu thiếu
        const fallbackCustomer = await prisma.customer.findFirst();
        const payload = { customer_id: fallbackCustomer?.id || updated.customer_id!, source_module: 'REQUESTS', source_id: id, items };
        await invoiceService.create((req as any).user!, payload);
      } else {
        const payload = { customer_id: customerId, source_module: 'REQUESTS', source_id: id, items };
        await invoiceService.create((req as any).user!, payload);
      }
    } else {
      // Cập nhật invoice hiện có nếu chưa có seal cost hoặc repair cost
      const hasSealCost = existingInvoice.items.some(item => item.service_code === 'SEAL');
      const hasRepairCost = existingInvoice.items.some(item => item.service_code === 'REPAIR');
      
      let needsUpdate = false;
      
      // Chuyển invoice từ DRAFT sang UNPAID khi thanh toán
      if (existingInvoice.status === 'DRAFT') {
        await prisma.invoice.update({
          where: { id: existingInvoice.id },
          data: { status: 'UNPAID' }
        });
        console.log(`📄 Đã chuyển invoice ${existingInvoice.id} từ DRAFT sang UNPAID`);
      }
      
      // Thêm repair cost cho IMPORT nếu chưa có
      if (updated.type === 'IMPORT' && !hasRepairCost) {
        console.log(`🔍 Tìm RepairTicket cho invoice hiện có - container: ${updated.container_no}`);
        const repairTicket = await prisma.repairTicket.findFirst({
          where: { container_no: updated.container_no },
          orderBy: { createdAt: 'desc' }
        });
        
        if (repairTicket && ((repairTicket.estimated_cost || 0) > 0 || (repairTicket.labor_cost || 0) > 0)) {
          const repairCost = (repairTicket.estimated_cost || 0) + (repairTicket.labor_cost || 0);
          if (repairCost > 0) {
            await prisma.invoiceLineItem.create({
              data: {
                org_id: null,
                invoice_id: existingInvoice.id,
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
            console.log(`💰 Đã thêm repair cost: ${repairCost} VND vào invoice ${existingInvoice.id}`);
            needsUpdate = true;
          }
        }
      }
      
      if (!hasSealCost) {
        // Tìm seal cost cho container này
        console.log(`🔍 Tìm seal usage cho invoice hiện có - container: ${updated.container_no}, booking: ${updated.booking_bill}`);
        
        const sealUsage = await prisma.sealUsageHistory.findFirst({
          where: {
            OR: [
              { container_number: updated.container_no },
              { booking_number: updated.booking_bill }
            ]
          },
          include: {
            seal: {
              select: {
                unit_price: true,
                shipping_company: true
              }
            }
          }
        });
        
        console.log(`📊 Seal usage found for existing invoice:`, sealUsage ? 'Yes' : 'No');
        if (sealUsage) {
          console.log(`   - Container: ${sealUsage.container_number}`);
          console.log(`   - Booking: ${sealUsage.booking_number}`);
          console.log(`   - Seal Price: ${sealUsage.seal?.unit_price} VND`);
        }
        
        if (sealUsage && sealUsage.seal) {
          // Thêm seal cost vào invoice hiện có
          await prisma.invoiceLineItem.create({
            data: {
              org_id: null,
              invoice_id: existingInvoice.id,
              service_code: 'SEAL',
              description: `Chi phí seal container (${sealUsage.seal.shipping_company})`,
              qty: 1 as any,
              unit_price: Number(sealUsage.seal.unit_price) as any,
              line_amount: Number(sealUsage.seal.unit_price) as any,
              tax_code: null,
              tax_rate: null as any,
              tax_amount: 0 as any,
              total_line_amount: Number(sealUsage.seal.unit_price) as any
            }
          });
          
          // Tính lại tổng tiền
          const allLineItems = await prisma.invoiceLineItem.findMany({
            where: { invoice_id: existingInvoice.id }
          });
          
          const totals = calculateTotals(allLineItems);
          
          await prisma.invoice.update({
            where: { id: existingInvoice.id },
            data: {
              subtotal: totals.subtotal as any,
              tax_amount: totals.tax_amount as any,
              total_amount: totals.total_amount as any
            }
          });
          
          console.log(`💰 Đã cập nhật invoice ${existingInvoice.id} với seal cost: ${sealUsage.seal.unit_price} VND`);
          needsUpdate = true;
        }
      }
      
      // Tính lại tổng tiền nếu có thay đổi
      if (needsUpdate) {
        const allLineItems = await prisma.invoiceLineItem.findMany({
          where: { invoice_id: existingInvoice.id }
        });
        
        const totals = calculateTotals(allLineItems);
        
        await prisma.invoice.update({
          where: { id: existingInvoice.id },
          data: {
            subtotal: totals.subtotal as any,
            tax_amount: totals.tax_amount as any,
            total_amount: totals.total_amount as any
          }
        });
        
        console.log(`💰 Đã cập nhật tổng tiền invoice ${existingInvoice.id}: ${totals.total_amount} VND`);
      }
    }

    return res.json({ success: true, message: 'Đã xác nhận thanh toán', data: updated });
  } catch (error: any) {
    console.error('markPaid error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Có lỗi khi xác nhận thanh toán' });
  }
};


