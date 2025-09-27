import { Request, Response } from 'express';
import { prisma } from './dependencies';

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

// Cập nhật tất cả invoice hiện có với seal cost
export const updateAllInvoicesWithSealCost = async (req: Request, res: Response) => {
  try {
    console.log('🔄 Bắt đầu cập nhật tất cả invoice với seal cost...');
    
    // Lấy tất cả ServiceRequest có type EXPORT
    const serviceRequests = await prisma.serviceRequest.findMany({
      where: {
        type: 'EXPORT'
      },
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

    console.log(`📋 Tìm thấy ${serviceRequests.length} ServiceRequest EXPORT`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const serviceRequest of serviceRequests) {
      const invoice = serviceRequest.invoices[0];
      
      if (!invoice) {
        console.log(`⚠️ ServiceRequest ${serviceRequest.id} chưa có invoice, bỏ qua`);
        skippedCount++;
        continue;
      }

      // Kiểm tra xem đã có seal cost chưa
      const hasSealCost = invoice.items.some(item => item.service_code === 'SEAL');
      
      if (hasSealCost) {
        console.log(`✅ Invoice ${invoice.id} đã có seal cost, bỏ qua`);
        skippedCount++;
        continue;
      }

      // Tìm seal cost cho container này
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
        }
      });

      if (!sealUsage || !sealUsage.seal) {
        console.log(`⚠️ Không tìm thấy seal usage cho ServiceRequest ${serviceRequest.id}, bỏ qua`);
        skippedCount++;
        continue;
      }

      // Thêm seal cost vào invoice
      await prisma.invoiceLineItem.create({
        data: {
          org_id: null,
          invoice_id: invoice.id,
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
        where: { invoice_id: invoice.id }
      });

      const totals = calculateTotals(allLineItems);

      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          subtotal: totals.subtotal as any,
          tax_amount: totals.tax_amount as any,
          total_amount: totals.total_amount as any
        }
      });

      console.log(`✅ Đã cập nhật invoice ${invoice.id} với seal cost: ${sealUsage.seal.unit_price} VND`);
      console.log(`   - Tổng tiền mới: ${totals.total_amount} VND`);
      updatedCount++;
    }

    res.json({
      success: true,
      message: `Đã cập nhật ${updatedCount} invoice, bỏ qua ${skippedCount} invoice`,
      data: {
        total: serviceRequests.length,
        updated: updatedCount,
        skipped: skippedCount
      }
    });

  } catch (error: any) {
    console.error('❌ Lỗi khi cập nhật invoice với seal cost:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Có lỗi khi cập nhật invoice',
      error: error.toString()
    });
  }
};

// Cập nhật invoice cụ thể với seal cost
export const updateInvoiceWithSealCost = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    
    console.log(`🔄 Cập nhật invoice cho ServiceRequest: ${requestId}`);

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
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
        message: 'Không tìm thấy ServiceRequest'
      });
    }

    const invoice = serviceRequest.invoices[0];
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'ServiceRequest chưa có invoice'
      });
    }

    // Kiểm tra xem đã có seal cost chưa
    const hasSealCost = invoice.items.some(item => item.service_code === 'SEAL');
    
    if (hasSealCost) {
      return res.json({
        success: true,
        message: 'Invoice đã có seal cost',
        data: invoice
      });
    }

    // Tìm seal cost cho container này
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
      }
    });

    if (!sealUsage || !sealUsage.seal) {
      return res.json({
        success: true,
        message: 'Không tìm thấy seal usage cho container này',
        data: invoice
      });
    }

    // Thêm seal cost vào invoice
    await prisma.invoiceLineItem.create({
      data: {
        org_id: null,
        invoice_id: invoice.id,
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
      where: { invoice_id: invoice.id }
    });

    const totals = calculateTotals(allLineItems);

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        subtotal: totals.subtotal as any,
        tax_amount: totals.tax_amount as any,
        total_amount: totals.total_amount as any
      },
      include: {
        items: true
      }
    });

    console.log(`✅ Đã cập nhật invoice ${invoice.id} với seal cost: ${sealUsage.seal.unit_price} VND`);

    res.json({
      success: true,
      message: 'Đã cập nhật invoice với seal cost',
      data: {
        invoice: updatedInvoice,
        sealCost: Number(sealUsage.seal.unit_price),
        newTotal: totals.total_amount
      }
    });

  } catch (error: any) {
    console.error('❌ Lỗi khi cập nhật invoice:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Có lỗi khi cập nhật invoice',
      error: error.toString()
    });
  }
};
