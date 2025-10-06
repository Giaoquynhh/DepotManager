-- Copy customers from Customer table to LowerCustomer table
INSERT INTO "LowerCustomer" (id, name, tax_code, address, status, "createdAt", "updatedAt", code, email, phone)
SELECT 
    id,
    name,
    tax_code,
    address,
    status,
    "createdAt",
    "updatedAt",
    code,
    email,
    phone
FROM "Customer"
WHERE status = 'ACTIVE'
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    tax_code = EXCLUDED.tax_code,
    address = EXCLUDED.address,
    status = EXCLUDED.status,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    "updatedAt" = CURRENT_TIMESTAMP;

