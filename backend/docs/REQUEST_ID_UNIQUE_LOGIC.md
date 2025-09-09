# Request ID Unique Logic Documentation

## Tổng quan
Tài liệu này mô tả logic đảm bảo mỗi request có ID duy nhất và có thể tạo request mới cho container đã bị reject mà không gây conflict.

## Vấn đề ban đầu
- Khi tạo request cho container 1234, nếu request đó bị reject (REJECTED)
- Sau một thời gian, request status tự động chuyển từ REJECTED → CHECKING
- Điều này gây nhầm lẫn vì user có thể tạo request mới cho cùng container 1234
- Cần đảm bảo mỗi request có ID duy nhất để phân biệt

## Giải pháp

### 1. Backend Logic

#### 1.1 Request ID Generation
- Mỗi request được tạo với ID duy nhất sử dụng Prisma `@default(cuid())`
- ID được tạo tự động khi tạo record mới trong database

#### 1.2 Container Validation Logic
**File:** `modules/requests/service/RequestBaseService.ts`

```typescript
private async validateContainerNotExists(container_no: string) {
  // Query để tìm container đã tồn tại
  const containerExists = await prisma.$queryRaw`
    WITH latest_sr AS (
      SELECT DISTINCT ON (sr.container_no)
        sr.container_no,
        sr.status as service_status,
        sr.id as request_id
      FROM "ServiceRequest" sr
      WHERE sr.container_no IS NOT NULL
      ORDER BY sr.container_no, sr."createdAt" DESC
    )
    SELECT 
      sr.container_no,
      sr.service_status,
      sr.request_id,
      'SERVICE_REQUEST' as source
    FROM latest_sr sr
    WHERE sr.container_no = ${container_no}
  `;

  if (containerExists.length === 0) {
    return; // Cho phép tạo request mới
  }

  const container = containerExists[0];

  if (container.source === 'SERVICE_REQUEST') {
    const isCompleted = ['COMPLETED', 'REJECTED', 'GATE_REJECTED'].includes(container.service_status);
    if (!isCompleted) {
      throw new Error(`Container ${container_no} đã tồn tại với trạng thái ${container.service_status}`);
    }
    
    // Cho phép tạo request mới nếu status là REJECTED hoặc GATE_REJECTED
    if (['REJECTED', 'GATE_REJECTED'].includes(container.service_status)) {
      console.log(`Cho phép tạo request mới cho container ${container_no} (request cũ ID: ${container.request_id} đã bị ${container.service_status})`);
      return;
    }
  }
}
```

#### 1.3 Repair Invoice Logic Fix
**File:** `modules/maintenance/service/MaintenanceService.ts`

```typescript
// Cập nhật trạng thái request thành PENDING_ACCEPT nếu có
if (repairTicket.container_no) {
  try {
    // Chỉ cập nhật request ACTIVE (không phải REJECTED, COMPLETED, GATE_REJECTED)
    await prisma.serviceRequest.updateMany({
      where: { 
        container_no: repairTicket.container_no,
        status: { 
          notIn: ['COMPLETED', 'REJECTED', 'GATE_REJECTED'] // Chỉ cập nhật request active
        }
      },
      data: {
        status: 'PENDING_ACCEPT'
      }
    });
  } catch (error) {
    console.log('Không thể cập nhật trạng thái request:', error);
  }
}
```

### 2. Database Schema

#### 2.1 ServiceRequest Model
```prisma
model ServiceRequest {
  id            String   @id @default(cuid())  // ID duy nhất tự động tạo
  container_no  String?  // Container number
  status        String   // PENDING | REJECTED | PENDING_ACCEPT | ...
  created_by    String
  rejected_at   DateTime?
  rejected_by   String?
  rejected_reason String?
  // ... other fields
}
```

#### 2.2 Status Transitions
- **PENDING** → **REJECTED**: Khi depot từ chối request
- **PENDING** → **PENDING_ACCEPT**: Khi tạo repair invoice
- **REJECTED**: Không thể chuyển sang trạng thái khác (trừ khi tạo request mới)

### 3. API Endpoints

#### 3.1 Tạo Request Mới
```
POST /requests
Content-Type: application/json

{
  "type": "IMPORT",
  "container_no": "1234",
  "eta": "2025-09-09T12:00:00Z"
}
```

**Response:**
```json
{
  "id": "cmfc4twz40000hdsu0w5iqjbk",  // ID duy nhất
  "container_no": "1234",
  "status": "PENDING",
  "createdAt": "2025-09-09T05:50:53.489Z"
}
```

#### 3.2 Reject Request
```
PATCH /requests/{id}/reject
Content-Type: application/json

{
  "reason": "Container không đạt tiêu chuẩn"
}
```

**Response:**
```json
{
  "id": "cmfc4twz40000hdsu0w5iqjbk",
  "status": "REJECTED",
  "rejected_reason": "Container không đạt tiêu chuẩn",
  "rejected_at": "2025-09-09T05:50:53.495Z"
}
```

### 4. Test Cases

#### 4.1 Test Request ID Generation
```javascript
// Test tạo request mới cho container đã bị reject
const testRequestIdGeneration = async () => {
  // 1. Tạo request đầu tiên
  const firstRequest = await prisma.serviceRequest.create({
    data: {
      created_by: 'test-user-id',
      type: 'IMPORT',
      container_no: '1234',
      status: 'PENDING'
    }
  });

  // 2. Reject request
  await prisma.serviceRequest.update({
    where: { id: firstRequest.id },
    data: { status: 'REJECTED' }
  });

  // 3. Tạo request mới cho cùng container
  const secondRequest = await prisma.serviceRequest.create({
    data: {
      created_by: 'test-user-id',
      type: 'IMPORT',
      container_no: '1234',
      status: 'PENDING'
    }
  });

  // 4. Verify ID khác nhau
  console.log('ID khác nhau:', firstRequest.id !== secondRequest.id); // true
};
```

#### 4.2 Test Rejected Request Fix
```javascript
// Test request REJECTED không bị "sống lại"
const testRejectedRequestFix = async () => {
  // 1. Tạo và reject request
  const rejectedRequest = await createAndRejectRequest('1234');
  
  // 2. Tạo request mới
  const newRequest = await createNewRequest('1234');
  
  // 3. Tạo repair invoice (trigger logic cập nhật)
  await createRepairInvoice('1234');
  
  // 4. Verify rejected request vẫn REJECTED
  const updatedRejected = await prisma.serviceRequest.findUnique({
    where: { id: rejectedRequest.id }
  });
  
  console.log('Rejected request status:', updatedRejected.status); // REJECTED
  console.log('New request status:', newRequest.status); // PENDING_ACCEPT
};
```

### 5. Error Handling

#### 5.1 Container Already Active
```json
{
  "error": "Container 1234 đã tồn tại trong hệ thống với trạng thái PENDING. Chỉ có thể tạo request mới khi container không còn trong hệ thống hoặc đã bị từ chối."
}
```

#### 5.2 Container In Repair
```json
{
  "error": "Container 1234 đang trong quy trình sửa chữa. Không thể tạo request import mới."
}
```

### 6. Monitoring & Logging

#### 6.1 Log Messages
```typescript
// Khi cho phép tạo request mới cho container đã bị reject
console.log(`Cho phép tạo request mới cho container ${container_no} (request cũ ID: ${container.request_id} đã bị ${container.service_status})`);

// Khi cập nhật ServiceRequest status
console.log(`✅ Updated ServiceRequest status to PENDING_ACCEPT for container: ${container_no}`);
```

#### 6.2 Audit Logs
```typescript
// Audit log cho việc tạo request mới
await audit(actor._id, 'REQUEST.CREATED', 'ServiceRequest', req.id);

// Audit log cho việc reject request
await audit(actor._id, 'REQUEST.REJECTED', 'ServiceRequest', id, { reason });
```

### 7. Performance Considerations

#### 7.1 Database Indexes
```sql
-- Index cho container_no để tối ưu query
CREATE INDEX "ServiceRequest_container_no_idx" ON "ServiceRequest"("container_no");

-- Index cho status để tối ưu filter
CREATE INDEX "ServiceRequest_status_idx" ON "ServiceRequest"("status");
```

#### 7.2 Query Optimization
- Sử dụng `DISTINCT ON` để lấy request mới nhất cho mỗi container
- Sử dụng `notIn` thay vì `not` để tối ưu performance
- Cache kết quả validation nếu cần thiết

### 8. Migration Guide

#### 8.1 Existing Data
- Không cần migration cho existing data
- Logic mới tương thích với data cũ
- Chỉ cần deploy code mới

#### 8.2 Rollback Plan
- Revert code về version cũ
- Logic cũ vẫn hoạt động bình thường
- Không ảnh hưởng đến data

### 9. Best Practices

#### 9.1 Code Organization
- Tách logic validation thành method riêng
- Sử dụng constants cho status values
- Implement proper error handling

#### 9.2 Testing
- Unit test cho validation logic
- Integration test cho end-to-end flow
- Performance test cho large datasets

#### 9.3 Documentation
- Cập nhật API documentation
- Maintain changelog
- Document breaking changes

## Kết luận

Logic này đảm bảo:
- ✅ Mỗi request có ID duy nhất
- ✅ Có thể tạo request mới cho container đã bị reject
- ✅ Tránh conflict khi status tự động chuyển
- ✅ Request cũ và mới hoạt động độc lập
- ✅ Performance tối ưu với proper indexing
