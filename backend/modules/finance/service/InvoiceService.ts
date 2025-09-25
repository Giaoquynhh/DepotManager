import { prisma } from '../../../shared/config/database';
import { audit } from '../../../shared/middlewares/audit';

function r2(n: number){ return Math.round(n*100)/100; }
function r3(n: number){ return Math.round(n*1000)/1000; }
function r4(n: number){ return Math.round(n*10000)/10000; }

export class InvoiceService {
  calcTotals(items: Array<{ qty:number; unit_price:number; tax_rate?: number }>) {
    let subtotal = 0, tax = 0;
    for (const it of items){
      const qty = r3(it.qty);
      const price = r4(it.unit_price);
      const line = r2(qty * price);
      const taxAmt = it.tax_rate ? r2(line * (it.tax_rate/100)) : 0;
      subtotal += line; tax += taxAmt;
    }
    return { subtotal: r2(subtotal), tax_amount: r2(tax), total_amount: r2(subtotal+tax) };
  }

  async list(actor: any, query: any){
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.customer_id) where.customer_id = query.customer_id;
    if (query.from || query.to) where.issue_date = { gte: query.from? new Date(query.from): undefined, lte: query.to? new Date(query.to): undefined };
    const data = await prisma.invoice.findMany({ where, orderBy: { issue_date: 'desc' } });
    return data;
  }

  async listWithDetails(actor: any, query: any){
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.customer_id) where.customer_id = query.customer_id;
    if (query.from || query.to) where.issue_date = { gte: query.from? new Date(query.from): undefined, lte: query.to? new Date(query.to): undefined };
    
    // Nếu có filter theo created_by của ServiceRequest
    if (query.created_by) {
      // Tìm tất cả ServiceRequest được tạo bởi user này
      const userRequests = await prisma.serviceRequest.findMany({
        where: { created_by: query.created_by },
        select: { id: true }
      });
      
      const requestIds = userRequests.map(req => req.id);
      where.source_id = { in: requestIds };
      where.source_module = 'REQUESTS';
    }
    
    const data = await prisma.invoice.findMany({ 
      where, 
      orderBy: { issue_date: 'desc' },
      include: {
        items: true,
        allocations: true
      }
    });

    // Lấy thông tin ServiceRequest và Customer cho mỗi invoice
    const enrichedData = await Promise.all(data.map(async (invoice) => {
      let serviceRequest = null;
      let customer = null;
      
      // Lấy thông tin ServiceRequest nếu có source_id
      if (invoice.source_module === 'REQUESTS' && invoice.source_id) {
        serviceRequest = await prisma.serviceRequest.findUnique({
          where: { id: invoice.source_id },
          select: {
            id: true,
            type: true,
            container_no: true,
            status: true,
            tenant_id: true,
            created_by: true,
            request_no: true,
            customer_id: true
          }
        });

        // Ưu tiên lấy khách hàng từ Setup/Customers theo customer_id của request
        if (serviceRequest?.customer_id) {
          customer = await prisma.customer.findUnique({
            where: { id: serviceRequest.customer_id },
            select: { id: true, name: true, tax_code: true, phone: true }
          });
        }
      }
      
      // Fallback: Lấy thông tin Customer từ customer_id nếu có
      if (!customer && invoice.customer_id) {
        customer = await prisma.customer.findUnique({
          where: { id: invoice.customer_id },
          select: {
            id: true,
            name: true,
            tax_code: true,
            phone: true
          }
        });
      }

      return {
        ...invoice,
        // Alias giữ tương thích frontend
        invoice_number: (invoice as any).invoice_no,
        serviceRequest: serviceRequest ? { ...serviceRequest, request_id: serviceRequest.request_no } : null,
        customer
      };
    }));

    return enrichedData;
  }

  async getContainersNeedInvoice(actor: any) {
    // Lấy danh sách container cần tạo hóa đơn (chưa có hóa đơn)
    const containers = await prisma.serviceRequest.findMany({
      where: {
        status: {
          in: ['IN_YARD', 'IN_CAR', 'GATE_OUT']
        }
        // TODO: Thêm has_invoice: false sau khi TypeScript error được giải quyết
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Filter bằng code để chỉ lấy container chưa có hóa đơn
    const filteredContainers = containers.filter(container => !(container as any).has_invoice);

    return filteredContainers;
  }

  async getCustomerInvoices(actor: any, query: any) {
    try {
      // Lấy hóa đơn theo source_id (request_id) nếu có
      const where: any = {};
      
      if (query.source_id) {
        where.source_id = query.source_id;
        where.source_module = 'REQUESTS';
      }
      
      // Chỉ lấy hóa đơn của customer này
      if (actor.role === 'CustomerAdmin' || actor.role === 'CustomerUser') {
        // Tìm các request của customer này
        const customerRequests = await prisma.serviceRequest.findMany({
          where: {
            created_by: actor._id
          },
          select: {
            id: true
          }
        });
        
        const requestIds = customerRequests.map(req => req.id);
        where.source_id = {
          in: requestIds
        };
        where.source_module = 'REQUESTS';
      }
      
      const data = await prisma.invoice.findMany({ 
        where, 
        orderBy: { issue_date: 'desc' },
        include: {
          items: true,
          allocations: true
        }
      });

      // Lấy thông tin ServiceRequest và Customer cho mỗi invoice
      const enrichedData = await Promise.all(data.map(async (invoice) => {
        let serviceRequest = null;
        let customer = null;
        
        // Lấy thông tin ServiceRequest nếu có source_id
        if (invoice.source_module === 'REQUESTS' && invoice.source_id) {
          serviceRequest = await prisma.serviceRequest.findUnique({
            where: { id: invoice.source_id },
            select: {
              id: true,
              type: true,
              container_no: true,
              status: true,
              tenant_id: true,
              created_by: true
            }
          });
          
          // Lấy thông tin User tạo request (customer)
          if (serviceRequest?.created_by) {
            const user = await prisma.user.findUnique({
              where: { id: serviceRequest.created_by },
              select: {
                id: true,
                full_name: true,
                email: true,
                role: true
              }
            });
            
            customer = {
              id: user?.id,
              name: user?.full_name || user?.email,
              tax_code: serviceRequest.tenant_id?.toString()
            };
          }
        }
        
        // Fallback: Lấy thông tin Customer từ customer_id nếu có
        if (!customer && invoice.customer_id) {
          customer = await prisma.customer.findUnique({
            where: { id: invoice.customer_id },
            select: {
              id: true,
              name: true,
              tax_code: true
            }
          });
        }

        return {
          ...invoice,
          serviceRequest,
          customer
        };
      }));

      return enrichedData;
    } catch (error) {
      console.error('Error in getCustomerInvoices:', error);
      throw error;
    }
  }

  async create(actor: any, payload: any){
    const totals = this.calcTotals(payload.items);
    // Phát sinh số hóa đơn dạng HDddmmyyyy00000 (tăng dần, tránh trùng)
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = String(now.getFullYear());
    const prefix = `HD${dd}${mm}${yyyy}`;
    // Lấy hóa đơn gần nhất theo prefix và tăng suffix
    const latest = await prisma.invoice.findFirst({
      where: { invoice_no: { startsWith: prefix } },
      orderBy: { invoice_no: 'desc' }
    });
    let nextSeqNumber = 1;
    if (latest?.invoice_no && latest.invoice_no.startsWith(prefix)){
      const suffix = latest.invoice_no.slice(prefix.length);
      const parsed = parseInt(suffix, 10);
      if (!Number.isNaN(parsed)) nextSeqNumber = parsed + 1;
    }
    const seq = String(nextSeqNumber).padStart(5, '0');
    const invoiceNo = `${prefix}${seq}`;

    const inv = await prisma.invoice.create({ data: {
      org_id: actor.org_id || null,
      customer_id: payload.customer_id,
      currency: payload.currency || 'VND',
      issue_date: payload.issue_date ? new Date(payload.issue_date) : null,
      due_date: payload.due_date ? new Date(payload.due_date) : null,
      subtotal: totals.subtotal as any,
      tax_amount: totals.tax_amount as any,
      total_amount: totals.total_amount as any,
      notes: payload.notes || null,
      created_by: actor._id,
      source_module: payload.source_module || 'REQUESTS',
      source_id: payload.source_id || null,
      invoice_no: invoiceNo
    }});
    for (const it of payload.items){
      const qty = r3(it.qty); const price = r4(it.unit_price);
      const line = r2(qty*price); const taxAmt = it.tax_rate? r2(line*(it.tax_rate/100)) : 0; const totalLine = r2(line+taxAmt);
      await prisma.invoiceLineItem.create({ data: {
        org_id: actor.org_id || null,
        invoice_id: inv.id,
        service_code: it.service_code,
        description: it.description,
        qty: qty as any,
        unit_price: price as any,
        line_amount: line as any,
        tax_code: it.tax_code || null,
        tax_rate: (it.tax_rate ?? null) as any,
        tax_amount: taxAmt as any,
        total_line_amount: totalLine as any
      }});
    }
    await audit(actor._id, 'INVOICE.CREATED', 'FINANCE', inv.id);
    return inv;
  }

  async issue(actor: any, id: string, payload: { issue_date: string; due_date: string }){
    const inv = await prisma.invoice.findUnique({ where: { id } });
    if (!inv) throw new Error('INVOICE_NOT_FOUND');
    if (inv.status !== 'DRAFT') throw new Error('INVALID_STATUS_TRANSITION');
    const issueDate = new Date(payload.issue_date);
    // Giữ nguyên invoice_no đã được tạo theo định dạng HDddmmyyyy00000 ở bước create
    const updated = await prisma.invoice.update({ where: { id }, data: {
      issue_date: issueDate,
      due_date: new Date(payload.due_date),
      status: 'UNPAID'
    }});
    await audit(actor._id, 'INVOICE.ISSUED', 'FINANCE', id, { invoice_no: inv.invoice_no });
    return updated;
  }

  // Đã loại bỏ method get theo yêu cầu bỏ chức năng xem chi tiết hóa đơn
  async getForPdf(id: string){
    const inv = await prisma.invoice.findUnique({ 
      where: { id }, 
      include: { items: true }
    });
    if (!inv) return null;
    let serviceRequest: any = null;
    let customer: any = null;
    if (inv.source_module === 'REQUESTS' && inv.source_id){
      serviceRequest = await prisma.serviceRequest.findUnique({
        where: { id: inv.source_id },
        select: { id: true, request_no: true, type: true, customer_id: true }
      });
    }
    const customerId = serviceRequest?.customer_id || inv.customer_id;
    if (customerId){
      customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { id: true, name: true, tax_code: true, phone: true }
      });
    }
    return { ...inv, serviceRequest, customer } as any;
  }

  async patch(actor: any, id: string, payload: any){
    const inv = await prisma.invoice.findUnique({ where: { id } });
    if (!inv) throw new Error('INVOICE_NOT_FOUND');
    if (inv.status !== 'UNPAID' && inv.status !== 'DRAFT') throw new Error('INVOICE_LOCKED');
    const updated = await prisma.invoice.update({ where: { id }, data: { due_date: payload.due_date? new Date(payload.due_date): inv.due_date, notes: payload.notes ?? inv.notes } });
    await audit(actor._id, 'INVOICE.UPDATED', 'FINANCE', id);
    return updated;
  }

  async cancel(actor: any, id: string){
    const inv = await prisma.invoice.findUnique({ where: { id } });
    if (!inv) throw new Error('INVOICE_NOT_FOUND');
    if (inv.paid_total as any > 0 || inv.status !== 'UNPAID') throw new Error('INVALID_STATUS_TRANSITION');
    const updated = await prisma.invoice.update({ where: { id }, data: { status: 'CANCELLED' } });
    await audit(actor._id, 'INVOICE.CANCELLED', 'FINANCE', id);
    return updated;
  }

  async cleanup(actor: any, params: { source_id?: string; status?: string; only_without_no?: boolean; created_from?: string; created_to?: string }){
    const where: any = {};
    if (params.source_id){ where.source_id = params.source_id; where.source_module = 'REQUESTS'; }
    if (params.status) where.status = params.status;
    if (params.only_without_no) where.invoice_no = null;
    if (params.created_from || params.created_to){
      where.createdAt = {
        gte: params.created_from ? new Date(params.created_from) : undefined,
        lte: params.created_to ? new Date(params.created_to) : undefined
      };
    }

    // Chỉ cho phép xóa DRAFT hoặc UNPAID chưa thu tiền
    const candidates = await prisma.invoice.findMany({ where });
    const deletableIds = candidates
      .filter(inv => (inv.status === 'DRAFT') || (inv.status === 'UNPAID' && Number(inv.paid_total as any) === 0))
      .map(inv => inv.id);

    const deleted = await prisma.invoice.deleteMany({ where: { id: { in: deletableIds } } });
    return { requested: candidates.length, deleted: deleted.count };
  }

  // V2: trả về dữ liệu đã map đúng yêu cầu UI
  async listV2(actor: any, query: any){
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.customer_id) where.customer_id = query.customer_id;

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { items: true }
    });

    const result = await Promise.all(invoices.map(async inv => {
      // Ưu tiên lấy ServiceRequest
      let req: any = null;
      if (inv.source_module === 'REQUESTS' && inv.source_id){
        req = await prisma.serviceRequest.findUnique({
          where: { id: inv.source_id },
          select: { id: true, request_no: true, type: true, customer_id: true }
        });
      }

      // Lấy khách hàng từ Setup/Customers theo customer_id của request; fallback invoice.customer_id
      let customer: any = null;
      const customerId = req?.customer_id || inv.customer_id;
      if (customerId){
        customer = await prisma.customer.findUnique({
          where: { id: customerId },
          select: { id: true, name: true, tax_code: true, phone: true }
        });
      }

      return {
        id: inv.id,
        invoice_no: inv.invoice_no, // đã phát sinh theo HDddmmyyyy00000
        request_no: req?.request_no || null,
        request_type: req?.type || null,
        customer_name: customer?.name || null,
        customer_tax_code: customer?.tax_code || null,
        customer_phone: customer?.phone || null,
        total_amount: inv.total_amount
      };
    }));

    return result;
  }
}

export default new InvoiceService();



