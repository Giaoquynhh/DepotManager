# Finance Container Invoice API - Backend Documentation

## Tổng quan
Tài liệu mô tả API backend cho tính năng "Danh sách container cần tạo hóa đơn" trong module Finance. API này cung cấp endpoint để lấy danh sách container có trạng thái phù hợp để tạo hóa đơn.

## API Endpoints

### 1. GET /finance/invoices/containers-need-invoice
**Mục đích**: Lấy danh sách container cần tạo hóa đơn

#### Request
```http
GET /finance/invoices/containers-need-invoice
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

#### Response
```json
[
  {
    "id": "clx1234567890",
    "type": "IMPORT",
    "container_no": "ISO 1234",
    "status": "IN_YARD",
    "createdAt": "2025-08-30T10:00:00.000Z",
    "updatedAt": "2025-08-30T10:00:00.000Z",
    "created_by": "user_id_123",
    "tenant_id": "tenant_123"
  }
]
```

#### Business Logic
- **Filter conditions**: Container có trạng thái `IN_YARD`, `IN_CAR`, hoặc `GATE_OUT`
- **Data source**: Bảng `ServiceRequest`
- **Ordering**: Sắp xếp theo `createdAt` giảm dần (mới nhất trước)

## Implementation Details

### 1. Service Layer
**File**: `modules/finance/service/InvoiceService.ts`

#### Method: getContainersNeedInvoice
```typescript
async getContainersNeedInvoice(actor: any) {
  // Lấy danh sách container cần tạo hóa đơn
  const containers = await prisma.serviceRequest.findMany({
    where: {
      status: {
        in: ['IN_YARD', 'IN_CAR', 'GATE_OUT']
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return containers;
}
```

#### Method: getContainerCosts
```typescript
async getContainerCosts(containerNo: string) {
  // Lấy chi phí sửa chữa từ RepairTicket
  const repairTickets = await prisma.repairTicket.findMany({
    where: {
      container_no: containerNo
    },
    select: {
      id: true,
      code: true,
      estimated_cost: true,
      labor_cost: true,
      status: true,
      createdAt: true
    }
  });

  // Lấy chi phí LOLO từ ForkliftTask
  const forkliftTasks = await prisma.forkliftTask.findMany({
    where: {
      container_no: containerNo
    },
    select: {
      id: true,
      cost: true,
      status: true,
      createdAt: true
    }
  });

  // Tính tổng chi phí
  const totalRepairCost = repairTickets.reduce((sum, ticket) => {
    return sum + (ticket.estimated_cost || 0) + (ticket.labor_cost || 0);
  }, 0);

  const totalLoloCost = forkliftTasks.reduce((sum, task) => {
    return sum + (task.cost || 0);
  }, 0);

  return {
    container_no: containerNo,
    repair_tickets: repairTickets,
    forklift_tasks: forkliftTasks,
    total_repair_cost: totalRepairCost,
    total_lolo_cost: totalLoloCost,
    total_cost: totalRepairCost + totalLoloCost
  };
}
```

### 2. Controller Layer
**File**: `modules/finance/controller/InvoiceController.ts`

#### Method: getContainersNeedInvoice
```typescript
async getContainersNeedInvoice(req: AuthRequest, res: Response){
  try{ 
    return res.json(await service.getContainersNeedInvoice(req.user!)); 
  }catch(e:any){ 
    return res.status(400).json({ message: e.message }); 
  }
}
```

### 3. Route Configuration
**File**: `modules/finance/controller/FinanceRoutes.ts`

```typescript
// Invoices
router.get('/invoices', (req, res) => invoiceCtrl.list(req as any, res));
router.get('/invoices/details', (req, res) => invoiceCtrl.listWithDetails(req as any, res));
router.get('/invoices/containers-need-invoice', (req, res) => invoiceCtrl.getContainersNeedInvoice(req as any, res));
router.post('/invoices', (req, res) => invoiceCtrl.create(req as any, res));
```

## Database Schema

### 1. ServiceRequest Table
```sql
model ServiceRequest {
    id            String   @id @default(cuid())
    tenant_id     String?
    created_by    String
    type          String   // IMPORT | EXPORT | CONVERT
    container_no  String?  // Optional cho EXPORT
    status        String   // PENDING | PICK_CONTAINER | SCHEDULED | FORWARDED | GATE_IN | CHECKING | GATE_REJECTED | REJECTED | COMPLETED | EXPORTED | IN_YARD | LEFT_YARD | PENDING_ACCEPT | ACCEPT | CHECKED | POSITIONED | FORKLIFTING | IN_YARD | IN_CAR | GATE_OUT
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt
    
    // Relations
    docs             DocumentFile[]
    paymentRequests  PaymentRequest[]
    chatRoom         ChatRoom?
    attachments      RequestAttachment[]
    notifications    Notification[]
    invoices         Invoice[]
    
    @@index([status])
    @@index([createdAt])
}
```

### 2. RepairTicket Table (for repair costs)
```sql
model RepairTicket {
  id                  String             @id @default(cuid())
  code                String             @unique
  container_no        String?            // Container number (optional)
  estimated_cost      Float?             @default(0)
  labor_cost          Float?             @default(0)  // Chi phí công sửa chữa
  status              RepairStatus       @default(CHECKING)
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt
  
  @@index([container_no])
}
```

### 3. ForkliftTask Table (for LOLO costs)
```sql
model ForkliftTask {
    id             String   @id @default(cuid())
    container_no   String
    status         String   // PENDING | ASSIGNED | IN_PROGRESS | PENDING_APPROVAL | COMPLETED | CANCELLED
    cost           Float?   @default(0)  // Chi phí dịch vụ xe nâng
    createdAt      DateTime @default(now())
    updatedAt      DateTime @updatedAt
}
```

## Security & Authorization

### 1. RBAC Requirements
- **Role**: `SaleAdmin` hoặc `SystemAdmin`
- **Permission**: Access to finance module
- **Scope**: Organization-level access (tenant_id)

### 2. Authentication
- **Method**: JWT Bearer token
- **Middleware**: `authenticate` + `requireRoles`
- **Token validation**: User existence và role verification

### 3. Data Isolation
- **Tenant isolation**: Filter theo `tenant_id` nếu có
- **User context**: Log user actions cho audit trail

## Error Handling

### 1. Common Error Responses
```json
{
  "message": "UNAUTHORIZED",
  "status": 401
}
```

```json
{
  "message": "FORBIDDEN",
  "status": 403
}
```

```json
{
  "message": "INTERNAL_SERVER_ERROR",
  "status": 500
}
```

### 2. Error Scenarios
- **Invalid token**: 401 Unauthorized
- **Insufficient permissions**: 403 Forbidden
- **Database connection issues**: 500 Internal Server Error
- **Invalid container status**: 400 Bad Request

## Performance Considerations

### 1. Database Optimization
- **Indexes**: `ServiceRequest(status, createdAt)`
- **Query optimization**: Sử dụng `select` để chỉ lấy fields cần thiết
- **Connection pooling**: Sử dụng Prisma connection pool

### 2. Caching Strategy
- **API response caching**: Cache danh sách container (TTL: 5 phút)
- **Database query caching**: Prisma query result caching
- **Redis integration**: External cache cho high-traffic scenarios

### 3. Pagination (Future Enhancement)
```typescript
// Pagination parameters
interface ContainerListParams {
  page?: number;
  limit?: number;
  status?: string[];
  type?: string;
  from_date?: string;
  to_date?: string;
}
```

## Monitoring & Logging

### 1. Audit Trail
- **User actions**: Log tất cả API calls với user context
- **Data changes**: Track modifications to container status
- **Access patterns**: Monitor API usage patterns

### 2. Performance Metrics
- **Response time**: Track API response time
- **Database queries**: Monitor query performance
- **Error rates**: Track error frequency và types

### 3. Health Checks
- **Database connectivity**: Verify Prisma connection
- **Service availability**: Check service health status
- **Dependency status**: Monitor external service dependencies

## Testing Strategy

### 1. Unit Tests
- **Service methods**: Test business logic
- **Controller methods**: Test request/response handling
- **Data validation**: Test input validation

### 2. Integration Tests
- **API endpoints**: Test complete request flow
- **Database operations**: Test data persistence
- **Authentication flow**: Test security mechanisms

### 3. Performance Tests
- **Load testing**: Test với high concurrent requests
- **Database performance**: Test query performance với large datasets
- **Memory usage**: Monitor memory consumption

## Future Enhancements

### 1. Advanced Filtering
- **Date range filtering**: Filter theo ngày tạo/update
- **Container type filtering**: Filter theo loại container
- **Cost-based filtering**: Filter theo chi phí sửa chữa/LOLO

### 2. Bulk Operations
- **Bulk invoice creation**: Tạo hóa đơn cho nhiều container
- **Batch status updates**: Update trạng thái hàng loạt
- **Mass cost calculation**: Tính chi phí cho nhiều container

### 3. Integration Features
- **EIR upload**: Upload Equipment Interchange Receipt
- **Cost calculation**: Tự động tính tổng chi phí
- **Invoice generation**: Tự động tạo hóa đơn dựa trên cost

## Deployment Notes

### 1. Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/container_manager

# JWT
JWT_SECRET=your_jwt_secret_here

# Redis (for caching)
REDIS_URL=redis://localhost:6379
```

### 2. Dependencies
```json
{
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "express": "^4.18.0",
    "jsonwebtoken": "^9.0.0"
  }
}
```

### 3. Health Check Endpoint
```typescript
// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});
```
