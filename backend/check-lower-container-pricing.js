/**
 * Script kiểm tra giá tiền của các container trong LowerContainer
 * Kiểm tra PriceList, RepairCost, SealCost và tổng giá tiền
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLowerContainerPricing() {
  try {
    console.log('💰 Kiểm tra giá tiền LowerContainer...\n');

    // 1. Kiểm tra PriceList cho dịch vụ "Hạ"
    console.log('📋 1. Kiểm tra PriceList cho dịch vụ "Hạ":');
    const priceLists = await prisma.priceList.findMany({
      where: {
        type: {
          equals: 'Hạ',
          mode: 'insensitive'
        }
      }
    });

    if (priceLists.length > 0) {
      console.log(`✅ Tìm thấy ${priceLists.length} dịch vụ hạ container:`);
      priceLists.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.serviceCode} - ${item.serviceName}: ${Number(item.price).toLocaleString('vi-VN')} VND`);
      });
      
      const totalBasePrice = priceLists.reduce((sum, item) => sum + Number(item.price), 0);
      console.log(`   📊 Tổng giá cơ bản: ${totalBasePrice.toLocaleString('vi-VN')} VND`);
    } else {
      console.log('❌ Không tìm thấy PriceList nào cho dịch vụ "Hạ"');
    }

    // 2. Kiểm tra các ServiceRequest IMPORT (LowerContainer)
    console.log('\n📦 2. Kiểm tra ServiceRequest IMPORT (LowerContainer):');
    const importRequests = await prisma.serviceRequest.findMany({
      where: {
        type: 'IMPORT'
      },
      include: {
        customer: {
          select: { id: true, name: true, code: true }
        },
        shipping_line: {
          select: { id: true, name: true, code: true }
        },
        container_type: {
          select: { id: true, code: true, description: true }
        },
        invoices: {
          include: {
            items: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log(`✅ Tìm thấy ${importRequests.length} yêu cầu IMPORT:`);

    for (const request of importRequests) {
      console.log(`\n   📋 Request: ${request.request_no} (${request.container_no})`);
      console.log(`      Status: ${request.status}`);
      console.log(`      Customer: ${request.customer?.name} (${request.customer?.code})`);
      console.log(`      Shipping Line: ${request.shipping_line?.name} (${request.shipping_line?.code})`);
      console.log(`      Container Type: ${request.container_type?.code} - ${request.container_type?.description}`);

      // Kiểm tra RepairCost
      const repairTicket = await prisma.repairTicket.findFirst({
        where: { container_no: request.container_no },
        orderBy: { createdAt: 'desc' }
      });

      let repairCost = 0;
      if (repairTicket) {
        const estimatedCost = Number(repairTicket.estimated_cost || 0);
        const laborCost = Number(repairTicket.labor_cost || 0);
        repairCost = estimatedCost + laborCost;
        console.log(`      🔧 Repair Cost: ${repairCost.toLocaleString('vi-VN')} VND (Estimated: ${estimatedCost.toLocaleString('vi-VN')}, Labor: ${laborCost.toLocaleString('vi-VN')})`);
      } else {
        console.log(`      🔧 Repair Cost: 0 VND (Không có RepairTicket)`);
      }

      // Kiểm tra SealCost
      const sealUsage = await prisma.sealUsageHistory.findFirst({
        where: {
          OR: [
            { container_number: request.container_no },
            { booking_number: request.booking_bill }
          ]
        },
        orderBy: { created_at: 'desc' },
        include: {
          seal: true
        }
      });

      let sealCost = 0;
      if (sealUsage && sealUsage.seal) {
        sealCost = Number(sealUsage.seal.unit_price || 0);
        console.log(`      🏷️ Seal Cost: ${sealCost.toLocaleString('vi-VN')} VND (Seal: ${sealUsage.seal_number})`);
      } else {
        console.log(`      🏷️ Seal Cost: 0 VND (Không có seal usage)`);
      }

      // Kiểm tra Invoice
      if (request.invoices && request.invoices.length > 0) {
        const invoice = request.invoices[0];
        console.log(`      💰 Invoice: ${invoice.invoice_no} (Status: ${invoice.status})`);
        console.log(`         Subtotal: ${Number(invoice.subtotal || 0).toLocaleString('vi-VN')} VND`);
        console.log(`         Tax: ${Number(invoice.tax_amount || 0).toLocaleString('vi-VN')} VND`);
        console.log(`         Total: ${Number(invoice.total_amount || 0).toLocaleString('vi-VN')} VND`);

        if (invoice.items && invoice.items.length > 0) {
          console.log(`         📋 Line Items:`);
          invoice.items.forEach((item, index) => {
            const lineTotal = Number(item.qty) * Number(item.unit_price);
            console.log(`            ${index + 1}. ${item.service_code} - ${item.description}: ${Number(item.unit_price).toLocaleString('vi-VN')} VND x ${item.qty} = ${lineTotal.toLocaleString('vi-VN')} VND`);
          });
        }
      } else {
        console.log(`      💰 Invoice: Chưa có invoice`);
        
        // Tính toán giá dự kiến
        const basePriceTotal = priceLists.reduce((sum, item) => sum + Number(item.price), 0);
        const estimatedTotal = basePriceTotal + repairCost + sealCost;
        console.log(`      📊 Giá dự kiến: ${basePriceTotal.toLocaleString('vi-VN')} (base) + ${repairCost.toLocaleString('vi-VN')} (repair) + ${sealCost.toLocaleString('vi-VN')} (seal) = ${estimatedTotal.toLocaleString('vi-VN')} VND`);
      }
    }

    // 3. Thống kê tổng quan
    console.log('\n📊 3. Thống kê tổng quan:');
    
    const totalRequests = await prisma.serviceRequest.count({
      where: { type: 'IMPORT' }
    });

    const paidRequests = await prisma.serviceRequest.count({
      where: { 
        type: 'IMPORT',
        is_paid: true
      }
    });

    const unpaidRequests = totalRequests - paidRequests;

    console.log(`   📦 Tổng số yêu cầu IMPORT: ${totalRequests}`);
    console.log(`   ✅ Đã thanh toán: ${paidRequests}`);
    console.log(`   ❌ Chưa thanh toán: ${unpaidRequests}`);

    // Tính tổng doanh thu từ invoices
    const totalRevenue = await prisma.invoice.aggregate({
      where: {
        source_module: 'REQUESTS',
        source_id: {
          in: importRequests.map(r => r.id)
        },
        status: {
          in: ['PAID', 'PARTIALLY_PAID']
        }
      },
      _sum: {
        total_amount: true
      }
    });

    const revenue = Number(totalRevenue._sum.total_amount || 0);
    console.log(`   💰 Tổng doanh thu đã thu: ${revenue.toLocaleString('vi-VN')} VND`);

    console.log('\n🎉 Kiểm tra hoàn tất!');

  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy kiểm tra
if (require.main === module) {
  checkLowerContainerPricing();
}

module.exports = { checkLowerContainerPricing };
