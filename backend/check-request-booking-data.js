const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRequestBookingData() {
  try {
    console.log('🔍 KIỂM TRA DỮ LIỆU BOOKING CỦA REQUEST');
    console.log('=' .repeat(60));

    const requestNumber = 'NA03102500004';

    // Tìm request theo request_no
    const request = await prisma.serviceRequest.findFirst({
      where: {
        OR: [
          { request_no: requestNumber },
          { id: requestNumber }
        ]
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
        }
      }
    });

    if (!request) {
      console.log(`❌ Không tìm thấy request với số yêu cầu: ${requestNumber}`);
      return;
    }

    console.log('✅ Tìm thấy request:');
    console.log(`   - Request ID: ${request.id}`);
    console.log(`   - Request No: ${request.request_no}`);
    console.log(`   - Container: ${request.container_no}`);
    console.log(`   - Type: ${request.type}`);
    console.log(`   - Status: ${request.status}`);
    console.log(`   - Created At: ${request.createdAt}`);
    console.log(`   - Updated At: ${request.updatedAt}`);

    console.log('\n📋 THÔNG TIN CHI TIẾT:');
    console.log('=' .repeat(50));
    console.log(`   - Customer: ${request.customer?.name || 'N/A'}`);
    console.log(`   - Shipping Line: ${request.shipping_line?.name || 'N/A'}`);
    console.log(`   - Container Type: ${request.container_type?.description || 'N/A'}`);

    console.log('\n🔍 KIỂM TRA CÁC TRƯỜNG BOOKING:');
    console.log('=' .repeat(50));
    console.log(`   - booking_number: "${request.booking_number || 'NULL'}"`);
    console.log(`   - booking_reference: "${request.booking_reference || 'NULL'}"`);
    console.log(`   - bill_of_lading: "${request.bill_of_lading || 'NULL'}"`);
    console.log(`   - booking_id: "${request.booking_id || 'NULL'}"`);

    // Kiểm tra tất cả các trường có thể chứa thông tin booking
    console.log('\n📊 TẤT CẢ CÁC TRƯỜNG CỦA REQUEST:');
    console.log('=' .repeat(50));
    Object.keys(request).forEach(key => {
      if (request[key] !== null && request[key] !== undefined) {
        console.log(`   - ${key}: ${request[key]}`);
      }
    });

    // Kiểm tra xem có request nào khác có booking không
    console.log('\n🔍 KIỂM TRA CÁC REQUEST KHÁC CÓ BOOKING:');
    console.log('=' .repeat(50));
    
    const requestsWithBooking = await prisma.serviceRequest.findMany({
      where: {
        booking_number: {
          not: null
        }
      },
      select: {
        id: true,
        request_no: true,
        container_no: true,
        type: true,
        booking_number: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    if (requestsWithBooking.length > 0) {
      console.log(`   Tìm thấy ${requestsWithBooking.length} request có booking:`);
      requestsWithBooking.forEach(req => {
        console.log(`   - ${req.request_no} (${req.container_no}): "${req.booking_number}"`);
      });
    } else {
      console.log('   ❌ Không tìm thấy request nào có booking_number');
    }

    // Kiểm tra schema để xem có trường nào khác không
    console.log('\n🔍 KIỂM TRA SCHEMA CỦA SERVICEREQUEST:');
    console.log('=' .repeat(50));
    
    // Lấy một request mẫu để xem tất cả các trường
    const sampleRequest = await prisma.serviceRequest.findFirst({
      select: {
        id: true,
        request_no: true,
        container_no: true,
        type: true,
        status: true,
        booking_number: true,
        booking_reference: true,
        bill_of_lading: true,
        booking_id: true,
        notes: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (sampleRequest) {
      console.log('   Các trường có sẵn trong ServiceRequest:');
      Object.keys(sampleRequest).forEach(key => {
        console.log(`   - ${key}: ${sampleRequest[key]}`);
      });
    }

  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra dữ liệu booking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRequestBookingData();
