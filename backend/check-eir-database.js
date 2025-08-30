const { PrismaClient } = require('@prisma/client');

async function checkEIRDatabase() {
  console.log('🔍 Kiểm tra database EIR documents...\n');
  
  const prisma = new PrismaClient();
  
  try {
    // 1. Kiểm tra ServiceRequest cho container ISO 1234
    console.log('1️⃣ Kiểm tra ServiceRequest cho container ISO 1234:');
    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: { container_no: 'ISO 1234' },
      select: {
        id: true,
        container_no: true,
        type: true,
        status: true,
        createdAt: true
      }
    });
    
    if (serviceRequest) {
      console.log('✅ Tìm thấy ServiceRequest:', serviceRequest);
    } else {
      console.log('❌ KHÔNG tìm thấy ServiceRequest cho container ISO 1234');
      return;
    }
    
    // 2. Kiểm tra DocumentFile EIR cho container này
    console.log('\n2️⃣ Kiểm tra DocumentFile EIR:');
    const eirDocuments = await prisma.documentFile.findMany({
      where: {
        request_id: serviceRequest.id,
        type: 'EIR',
        deleted_at: null
      },
      select: {
        id: true,
        request_id: true,
        type: true,
        name: true,
        storage_key: true,
        size: true,
        createdAt: true
      },
      orderBy: { version: 'desc' }
    });
    
    if (eirDocuments.length > 0) {
      console.log('✅ Tìm thấy EIR documents:', eirDocuments);
      
      // 3. Kiểm tra file trên disk
      console.log('\n3️⃣ Kiểm tra file trên disk:');
      const fs = require('fs');
      const path = require('path');
      
      for (const doc of eirDocuments) {
        const filePath = path.join('D:\\container21\\manageContainer\\backend\\uploads', doc.storage_key);
        const fileExists = fs.existsSync(filePath);
        
        console.log(`  - Document: ${doc.name}`);
        console.log(`  - Storage key: ${doc.storage_key}`);
        console.log(`  - File exists: ${fileExists ? '✅ Có' : '❌ Không'}`);
        
        if (fileExists) {
          const stats = fs.statSync(filePath);
          console.log(`  - File size: ${(stats.size / 1024).toFixed(2)} KB`);
        }
        console.log('');
      }
      
    } else {
      console.log('❌ KHÔNG tìm thấy EIR documents cho container ISO 1234');
      
      // 4. Kiểm tra tất cả DocumentFile EIR
      console.log('\n4️⃣ Kiểm tra tất cả DocumentFile EIR:');
      const allEIRDocs = await prisma.documentFile.findMany({
        where: {
          type: 'EIR',
          deleted_at: null
        },
        select: {
          id: true,
          request_id: true,
          name: true,
          storage_key: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
      
      if (allEIRDocs.length > 0) {
        console.log('📋 Các EIR documents gần đây:');
        for (const doc of allEIRDocs) {
          console.log(`  - ID: ${doc.id}, Name: ${doc.name}, Storage: ${doc.storage_key}`);
        }
      } else {
        console.log('❌ Không có EIR documents nào trong database');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy check
checkEIRDatabase();
