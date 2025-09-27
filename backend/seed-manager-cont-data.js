const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedManagerContData() {
  try {
    console.log('=== Tạo dữ liệu cho ManagerCont ===');
    
    // 1. Tạo Customers
    const customers = [
      { name: 'Công ty TNHH Thủy sản Minh Phú', code: 'CUST001', tax_code: '0123456789' },
      { name: 'Công ty TNHH Canon Việt Nam', code: 'CUST002', tax_code: '0123456790' },
      { name: 'Công ty CP Logistics Miền Trung', code: 'CUST003', tax_code: '0123456791' },
      { name: 'Công ty CP Giày Da Hưng Yên', code: 'CUST004', tax_code: '0123456792' },
      { name: 'Công ty TNHH Samsung Electronics', code: 'CUST005', tax_code: '0123456793' }
    ];

    for (const customer of customers) {
      await prisma.customer.upsert({
        where: { code: customer.code },
        update: {},
        create: {
          name: customer.name,
          code: customer.code,
          tax_code: customer.tax_code,
          status: 'ACTIVE'
        }
      });
      console.log(`Tạo customer: ${customer.name}`);
    }

    // 2. Tạo Shipping Lines
    const shippingLines = [
      { code: 'WANHAI', name: 'Wan Hai Lines', eir: 'WANHAI-EIR' },
      { code: 'KMT', name: 'Korea Marine Transport Co.', eir: 'KMT-EIR' },
      { code: 'MSC', name: 'Mediterranean Shipping Company', eir: 'MSC-EIR' },
      { code: 'CMA', name: 'CMA CGM', eir: 'CMA-EIR' },
      { code: 'EVERGREEN', name: 'Evergreen Line', eir: 'EVERGREEN-EIR' }
    ];

    for (const line of shippingLines) {
      await prisma.shippingLine.upsert({
        where: { code: line.code },
        update: {},
        create: {
          code: line.code,
          name: line.name,
          eir: line.eir
        }
      });
      console.log(`Tạo shipping line: ${line.name}`);
    }

    // 3. Tạo Container Types
    const containerTypes = [
      { code: '45GO', description: '45ft General Purpose' },
      { code: '40OT', description: '40ft Open Top' },
      { code: '40VH', description: '40ft High Cube' },
      { code: '20GP', description: '20ft General Purpose' },
      { code: '40GP', description: '40ft General Purpose' },
      { code: '40HC', description: '40ft High Cube' },
      { code: '20RF', description: '20ft Refrigerated' },
      { code: '40RF', description: '40ft Refrigerated' }
    ];

    for (const type of containerTypes) {
      await prisma.containerType.upsert({
        where: { code: type.code },
        update: {},
        create: {
          code: type.code,
          description: type.description
        }
      });
      console.log(`Tạo container type: ${type.code}`);
    }

    // 4. Tạo Transport Companies
    const transportCompanies = [
      { code: 'TCT001', name: 'Công ty TNHH Vận tải ABC' },
      { code: 'TCT002', name: 'Công ty CP Logistics XYZ' },
      { code: 'TCT003', name: 'Công ty TNHH Giao nhận DEF' }
    ];

    for (const company of transportCompanies) {
      await prisma.transportCompany.upsert({
        where: { code: company.code },
        update: {},
        create: {
          code: company.code,
          name: company.name,
          status: 'ACTIVE'
        }
      });
      console.log(`Tạo transport company: ${company.name}`);
    }

    // 5. Tạo Containers mẫu
    const admin = await prisma.user.findFirst({
      where: { role: 'SystemAdmin' }
    });

    if (admin) {
      const customers = await prisma.customer.findMany();
      const shippingLines = await prisma.shippingLine.findMany();
      const containerTypes = await prisma.containerType.findMany();

      const containers = [
        {
          container_no: 'AB111',
          customer: customers[0],
          shipping_line: shippingLines[0],
          container_type: containerTypes[0],
          status: 'EMPTY_IN_YARD',
          yard_name: 'B',
          block_code: 'B1',
          slot_code: 'B1-8',
          seal_number: 'SEAL001',
          dem_det: '11/11/2025'
        },
        {
          container_no: 'ac100',
          customer: customers[1],
          shipping_line: shippingLines[1],
          container_type: containerTypes[1],
          status: 'EMPTY_IN_YARD',
          yard_name: 'B',
          block_code: 'B1',
          slot_code: 'B1-12',
          seal_number: 'SEAL002',
          dem_det: 'Không có'
        },
        {
          container_no: 'SC110',
          customer: customers[2],
          shipping_line: shippingLines[2],
          container_type: containerTypes[2],
          status: 'EMPTY_IN_YARD',
          yard_name: 'B',
          block_code: 'B1',
          slot_code: 'B1-6',
          seal_number: 'SEAL003',
          dem_det: '15/12/2025'
        },
        {
          container_no: 'SM110',
          customer: customers[3],
          shipping_line: shippingLines[3],
          container_type: containerTypes[3],
          status: 'EMPTY_IN_YARD',
          yard_name: 'B',
          block_code: 'B1',
          slot_code: 'B1-5',
          seal_number: 'SEAL004',
          dem_det: 'Không có'
        },
        {
          container_no: 'SA111',
          customer: customers[4],
          shipping_line: shippingLines[4],
          container_type: containerTypes[4],
          status: 'EMPTY_IN_YARD',
          yard_name: 'B',
          block_code: 'B1',
          slot_code: 'B1-4',
          seal_number: 'SEAL005',
          dem_det: '20/12/2025'
        }
      ];

      for (const container of containers) {
        await prisma.container.upsert({
          where: { container_no: container.container_no },
          update: {},
          create: {
            container_no: container.container_no,
            customer_id: container.customer.id,
            shipping_line_id: container.shipping_line.id,
            container_type_id: container.container_type.id,
            status: container.status,
            yard_name: container.yard_name,
            block_code: container.block_code,
            slot_code: container.slot_code,
            seal_number: container.seal_number,
            dem_det: container.dem_det,
            created_by: admin.id
          }
        });
        console.log(`Tạo container: ${container.container_no}`);
      }
    }

    console.log('=== Hoàn thành tạo dữ liệu cho ManagerCont ===');
    
  } catch (error) {
    console.error('Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedManagerContData();

