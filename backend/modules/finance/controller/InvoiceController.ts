import { Response } from 'express';
import { AuthRequest } from '../../../shared/middlewares/auth';
import service from '../service/InvoiceService';
import { createInvoiceSchema, issueInvoiceSchema, patchInvoiceSchema } from '../dto/FinanceDtos';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument: any = require('pdfkit');
import fs from 'fs';
import path from 'path';

export class InvoiceController {
  async list(req: AuthRequest, res: Response){
    try{ return res.json(await service.list(req.user!, req.query)); }catch(e:any){ return res.status(400).json({ message: e.message }); }
  }
  async create(req: AuthRequest, res: Response){
    console.log('📤 Create invoice request received:');
    console.log('  - req.body:', req.body);
    
    const { error, value } = createInvoiceSchema.validate(req.body);
    if (error) {
      console.log('❌ Validation error:', error.message);
      console.log('  - Validation details:', error.details);
      return res.status(400).json({ message: error.message });
    }
    
    console.log('✅ Validation passed, calling service...');
    try{ 
      const inv = await service.create(req.user!, value); 
      return res.status(201).json(inv); 
    }catch(e:any){ 
      console.log('❌ Service error:', e.message);
      return res.status(400).json({ message: e.message }); 
    }
  }
  async issue(req: AuthRequest, res: Response){
    const { error, value } = issueInvoiceSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    try{ return res.json(await service.issue(req.user!, req.params.id, value)); }catch(e:any){ return res.status(400).json({ message: e.message }); }
  }
  // Đã loại bỏ API get theo yêu cầu bỏ chức năng xem chi tiết hóa đơn

  async exportPdf(req: AuthRequest, res: Response){
    try{
      const inv = await service.getForPdf(req.params.id);
      if (!inv) return res.status(404).json({ message: 'INVOICE_NOT_FOUND' });

      const doc = new PDFDocument({ margin: 36 });
      res.setHeader('Content-Type','application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="invoice_${inv.invoice_no || inv.id}.pdf"`);
      doc.pipe(res as any);

      // Font setup: prefer Times New Roman from Windows; fallback Times-Roman
      const candidates = [
        'C:\\Windows\\Fonts\\times.ttf',
        'C:\\Windows\\Fonts\\times.TTF',
        'C:\\Windows\\Fonts\\timesbd.ttf',
        'C:\\Windows\\Fonts\\timesnewroman.ttf',
        'C:\\Windows\\Fonts\\Times New Roman.ttf'
      ];
      const fontPath = candidates.find(p=>{ try{ return fs.existsSync(p); }catch{ return false; } });
      if (fontPath){ try{ doc.font(fontPath); }catch{ doc.font('Times-Roman'); } } else { doc.font('Times-Roman'); }

      const currency = (n:any)=> `${Number(n||0).toLocaleString('vi-VN')} VND`;
      const right = (txt:string, x:number, y?:number, w=80)=> doc.text(txt, x, y, { width:w, align:'right' });

      // Header
      doc.fontSize(20).text('HÓA ĐƠN DỊCH VỤ', { align: 'center' });
      doc.moveDown(0.6);
      doc.fontSize(11);
      const startY = doc.y;
      const leftX = 36, midX = 330;
      doc.text(`Số HĐ: ${inv.invoice_no || inv.id}`, leftX, startY);
      doc.moveDown(0.3);
      if (inv.serviceRequest?.request_no) {
        doc.text(`Số yêu cầu: ${inv.serviceRequest.request_no}`);
        doc.moveDown(0.3);
      }
      doc.text(`Khách hàng: ${inv.customer?.name || inv.customer_id}`);
      doc.moveDown(0.3);
      if (inv.customer?.tax_code) {
        doc.text(`MST: ${inv.customer.tax_code}`);
        doc.moveDown(0.3);
      }
      const phoneDigits = String(inv.customer?.phone || '').replace(/\D/g,'');
      if (phoneDigits) {
        doc.text(`SĐT: ${phoneDigits}`);
        doc.moveDown(0.3);
      }
      // Bỏ hộp tóm tắt số tiền ở phần đầu theo yêu cầu
      doc.moveDown(0.5);

      // Table header
      doc.fontSize(12).text('Danh sách dịch vụ');
      doc.moveDown(0.3);
      // Bố cục cột: bảo đảm vừa trang A4 (nội dung ~523pt)
      // widths: code 50, desc 230, qty 35, unit 80, tax 55, total 70; gap 6
      const colX = [36, 92, 328, 369, 455, 516];
      const headerY = doc.y;
      // Header background
      doc.save();
      doc.rect(36, headerY - 2, 523, 20).fillOpacity(0.08).fill('#000');
      doc.restore();
      doc.fontSize(10);
      doc.text('Mã DV', colX[0], headerY);
      doc.text('Mô tả', colX[1], headerY);
      right('SL', colX[2], headerY, 35);
      right('Đơn giá', colX[3], headerY, 80);
      right('Thuế', colX[4], headerY, 55);
      right('Thành tiền', colX[5], headerY, 70);
      doc.moveTo(36, headerY + 16).lineTo(595-36, headerY + 16).strokeColor('#999').lineWidth(0.6).stroke();
      // Extra spacing before first row
      doc.moveDown(0.7);

      // Rows
      inv.items.forEach((it:any, idx:number)=>{
        const y = doc.y;
        // optional zebra rows
        if (idx % 2 === 1){
          doc.save();
          doc.rect(36, y - 3, 595-72, 16).fillOpacity(0.04).fill('#000');
          doc.restore();
        }
        doc.fontSize(9).text(it.service_code || '-', colX[0], y);
        doc.text(it.description || '-', colX[1], y, { width: 230 });
        right(Number(it.qty ?? 0).toLocaleString('vi-VN'), colX[2], y, 35);
        right(currency(it.unit_price), colX[3], y, 80);
        right(currency(it.tax_amount || 0), colX[4], y, 55);
        right(currency(it.total_line_amount), colX[5], y, 70);
        doc.moveDown(0.7);
      });

      // Totals block - đẹp hơn, canh phải, có khung
      doc.moveDown(0.6);
      const blockWidth = 220;
      const blockX = 595 - 36 - blockWidth;
      let blockY = doc.y;
      const lineH = 16;
      // Box
      doc.roundedRect(blockX, blockY - 6, blockWidth, lineH * 3 + 16, 6).strokeColor('#666').lineWidth(0.8).stroke();
      // Labels + values
      const labelX = blockX + 10;
      const valueWidth = blockWidth - 20;
      doc.fontSize(10);
      doc.text('Tạm tính', labelX, blockY);
      doc.text(`${currency(inv.subtotal)}`, labelX, blockY, { width: valueWidth, align: 'right' });
      blockY += lineH;
      doc.text('Thuế', labelX, blockY);
      doc.text(`${currency(inv.tax_amount)}`, labelX, blockY, { width: valueWidth, align: 'right' });
      blockY += lineH;
      // Divider
      doc.moveTo(blockX + 8, blockY).lineTo(blockX + blockWidth - 8, blockY).strokeColor('#bbb').lineWidth(0.6).stroke();
      blockY += 4;
      // Total bold
      doc.fontSize(12);
      doc.text('Tổng cộng', labelX, blockY);
      doc.text(`${currency(inv.total_amount)}`, labelX, blockY, { width: valueWidth, align: 'right' });

      doc.end();
    }catch(e:any){
      return res.status(400).json({ message: e.message });
    }
  }
  async patch(req: AuthRequest, res: Response){
    const { error, value } = patchInvoiceSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    try{ return res.json(await service.patch(req.user!, req.params.id, value)); }catch(e:any){ return res.status(400).json({ message: e.message }); }
  }
  async cancel(req: AuthRequest, res: Response){
    try{ return res.json(await service.cancel(req.user!, req.params.id)); }catch(e:any){ return res.status(400).json({ message: e.message }); }
  }
  async listWithDetails(req: AuthRequest, res: Response){
    try{ return res.json(await service.listWithDetails(req.user!, req.query)); }catch(e:any){ return res.status(400).json({ message: e.message }); }
  }
  async getContainersNeedInvoice(req: AuthRequest, res: Response){
    try{ return res.json(await service.getContainersNeedInvoice(req.user!)); }catch(e:any){ return res.status(400).json({ message: e.message }); }
  }
  
  async getCustomerInvoices(req: AuthRequest, res: Response){
    try{ return res.json(await service.getCustomerInvoices(req.user!, req.query)); }catch(e:any){ return res.status(400).json({ message: e.message }); }
  }

  async cleanup(req: AuthRequest, res: Response){
    try{
      const result = await service.cleanup(req.user!, {
        source_id: req.query.source_id as string | undefined,
        status: req.query.status as string | undefined,
        only_without_no: req.query.only_without_no === 'true',
        created_from: req.query.created_from as string | undefined,
        created_to: req.query.created_to as string | undefined
      });
      return res.json(result);
    }catch(e:any){
      return res.status(400).json({ message: e.message });
    }
  }

  // V2: Chuẩn hóa dữ liệu theo yêu cầu hiển thị UI
  async listV2(req: AuthRequest, res: Response){
    try{
      return res.json(await service.listV2(req.user!, req.query));
    }catch(e:any){
      return res.status(400).json({ message: e.message });
    }
  }
}

export default new InvoiceController();



