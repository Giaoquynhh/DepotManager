import { Request, Response } from 'express';
import { prisma } from './dependencies';
import invoiceService from '../../finance/service/InvoiceService';

// Mark request as paid and optionally advance status for EXPORT flow
export const markPaid = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu' });
    }

    const data: any = { is_paid: true, updatedAt: new Date() };
    // Nếu là EXPORT và hiện đang ở GATE_IN sau khi nâng, chuyển sang IN_CAR để Gate_out
    if (existing.type === 'EXPORT' && existing.status === 'GATE_IN') {
      data.status = 'IN_CAR';
    }

    const updated = await prisma.serviceRequest.update({ where: { id }, data });

    // Auto-create invoice if not exists yet
    const existingInvoice = await prisma.invoice.findFirst({ where: { source_module: 'REQUESTS', source_id: id } });
    if (!existingInvoice) {
      // Lấy khách hàng từ request (ưu tiên customer_id)
      const customerId = updated.customer_id || null;
      // Tính tổng: cộng tất cả price list loại "Nâng"
      const priceLists = await prisma.priceList.findMany({ where: { type: { equals: 'Nâng', mode: 'insensitive' as any } } as any });
      const totalUnit = priceLists.reduce((sum, p:any) => sum + Number(p.price||0), 0);
      const items = priceLists.map((p:any) => ({ service_code: p.serviceCode, description: p.serviceName, qty: 1, unit_price: Number(p.price||0) }));
      if (items.length === 0) {
        items.push({ service_code: 'LOLO', description: 'Nâng container', qty: 1, unit_price: 0 });
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
    }

    return res.json({ success: true, message: 'Đã xác nhận thanh toán', data: updated });
  } catch (error: any) {
    console.error('markPaid error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Có lỗi khi xác nhận thanh toán' });
  }
};


