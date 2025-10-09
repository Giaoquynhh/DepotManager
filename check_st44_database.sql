-- Kiểm tra ST44 trong database
-- Chạy query này trong PostgreSQL client (pgAdmin, DBeaver, etc.)

-- 1. Kiểm tra Container table
SELECT 'Container' as table_name, container_no, container_quality, status, "createdAt", "updatedAt"
FROM "Container" 
WHERE container_no = 'ST44';

-- 2. Kiểm tra YardPlacement table
SELECT 'YardPlacement' as table_name, container_no, status, placed_at, removed_at, "createdAt", "updatedAt"
FROM "YardPlacement" 
WHERE container_no = 'ST44'
ORDER BY "createdAt" DESC;

-- 3. Kiểm tra ServiceRequest table
SELECT 'ServiceRequest' as table_name, container_no, type, status, "createdAt", "updatedAt"
FROM "ServiceRequest" 
WHERE container_no = 'ST44'
ORDER BY "createdAt" DESC;

-- 4. Kiểm tra RepairTicket table
SELECT 'RepairTicket' as table_name, container_no, status, "createdAt", "updatedAt"
FROM "RepairTicket" 
WHERE container_no = 'ST44'
ORDER BY "createdAt" DESC;

-- 5. Kiểm tra tổng số records
SELECT 'Container' as table_name, COUNT(*) as total_records FROM "Container"
UNION ALL
SELECT 'YardPlacement' as table_name, COUNT(*) as total_records FROM "YardPlacement"
UNION ALL
SELECT 'ServiceRequest' as table_name, COUNT(*) as total_records FROM "ServiceRequest"
UNION ALL
SELECT 'RepairTicket' as table_name, COUNT(*) as total_records FROM "RepairTicket";

-- 6. Lấy một vài records mẫu
SELECT 'Sample Containers' as info, container_no, container_quality, status
FROM "Container" 
ORDER BY "createdAt" DESC
LIMIT 5;

SELECT 'Sample YardPlacements' as info, container_no, status, removed_at
FROM "YardPlacement" 
ORDER BY "createdAt" DESC
LIMIT 5;

-- 7. Kiểm tra YardPlacement với status OCCUPIED và removed_at IS NULL
SELECT 'OCCUPIED YardPlacements' as info, container_no, status, removed_at, "createdAt"
FROM "YardPlacement" 
WHERE status = 'OCCUPIED' 
  AND removed_at IS NULL
  AND container_no IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 10;
