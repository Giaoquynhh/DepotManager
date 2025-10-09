
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
