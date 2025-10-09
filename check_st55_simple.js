const { exec } = require('child_process');
const fs = require('fs');

// Tạo file SQL query
const sqlQuery = `
-- Kiểm tra Container table
SELECT 'Container' as table_name, container_no, container_quality, status, "createdAt", "updatedAt"
FROM "Container" 
WHERE container_no = 'ST55'

UNION ALL

-- Kiểm tra ServiceRequest table
SELECT 'ServiceRequest' as table_name, container_no, NULL as container_quality, status, "createdAt", "updatedAt"
FROM "ServiceRequest" 
WHERE container_no = 'ST55'
ORDER BY "createdAt" DESC
LIMIT 5

UNION ALL

-- Kiểm tra RepairTicket table
SELECT 'RepairTicket' as table_name, container_no, NULL as container_quality, status::text as status, "createdAt", "updatedAt"
FROM "RepairTicket" 
WHERE container_no = 'ST55'
ORDER BY "createdAt" DESC
LIMIT 5

UNION ALL

-- Kiểm tra YardPlacement table
SELECT 'YardPlacement' as table_name, container_no, NULL as container_quality, status, "createdAt", "updatedAt"
FROM "YardPlacement" 
WHERE container_no = 'ST55'
ORDER BY "createdAt" DESC
LIMIT 5;
`;

// Ghi query vào file
fs.writeFileSync('query_st55.sql', sqlQuery);

console.log('🔍 Kiểm tra container ST55...\n');
console.log('📋 SQL Query đã được tạo: query_st55.sql\n');

// Chạy query bằng psql (nếu có)
console.log('💡 Để chạy query, bạn có thể:');
console.log('1. Mở PostgreSQL client (pgAdmin, DBeaver, etc.)');
console.log('2. Chạy nội dung file query_st55.sql');
console.log('3. Hoặc chạy lệnh: psql -d your_database -f query_st55.sql\n');

console.log('📄 Nội dung query:');
console.log(sqlQuery);
