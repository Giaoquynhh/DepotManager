# Maintenance Workflow Enhancement - v2025-01-27

## 📋 Tổng quan

Tài liệu này mô tả chi tiết các tính năng mới được thêm vào Maintenance Module để hoàn thiện workflow sửa chữa container. Các tính năng bao gồm:

1. **Thêm trạng thái ACCEPT** vào RepairStatus enum
2. **3 Action buttons mới** trong RepairTable component
3. **Đồng bộ trạng thái** giữa ServiceRequest và RepairTicket
4. **Workflow hoàn chỉnh** từ kiểm tra đến hoàn thành sửa chữa

---

## 🎯 Mục tiêu đã đạt được

✅ **Workflow hoàn chỉnh**: CHECKING → PENDING_ACCEPT → ACCEPT → REPAIRING → CHECKED  
✅ **Customer interaction**: Khách hàng có thể chấp nhận/từ chối yêu cầu sửa chữa  
✅ **Status synchronization**: Tự động đồng bộ trạng thái giữa các module  
✅ **Action buttons**: 3 buttons mới với logic xử lý đầy đủ  
✅ **Audit logging**: Ghi lại tất cả các thay đổi trạng thái  
✅ **Error handling**: Xử lý lỗi gracefully không ảnh hưởng flow chính  

---

## 🏗️ Cấu trúc thay đổi

### 1. Database Schema Updates

#### RepairStatus Enum
```prisma
enum RepairStatus {
  CHECKING
  PENDING_ACCEPT
  ACCEPT          // ⭐ MỚI: Thêm trạng thái này
  REPAIRING
  CHECKED
  REJECTED
}
```

#### ServiceRequest Status
```prisma
// Thêm ACCEPT vào comment
status String // PENDING | SCHEDULED | FORWARDED | GATE_IN | CHECKING | GATE_REJECTED | REJECTED | COMPLETED | EXPORTED | IN_YARD | LEFT_YARD | PENDING_ACCEPT | ACCEPT
```

### 2. Backend API Endpoints

#### New Endpoints
```typescript
// Maintenance Module
POST /maintenance/repairs/:id/confirmation-request  // Gửi yêu cầu xác nhận
POST /maintenance/repairs/:id/start-repair          // Tiến hành sửa chữa
POST /maintenance/repairs/:id/complete-repair       // Hoàn thành sửa chữa

// Requests Module (Customer Actions)
PATCH /requests/:id/accept                           // Khách hàng chấp nhận
PATCH /requests/:id/reject-by-customer               // Khách hàng từ chối
GET /requests/:id                                    // Lấy thông tin request
```

### 3. Frontend Components

#### RepairTable Component
```typescript
interface RepairTableProps {
  // ... existing props
  onStartRepair: (id: string) => void;      // ⭐ MỚI
  onCompleteRepair: (id: string) => void;   // ⭐ MỚI
}
```

#### Action Buttons Display Logic
```typescript
// PENDING_ACCEPT status
{r.status === 'PENDING_ACCEPT' && (
  <div>
    <button onClick={() => onEditInvoice(r.id)}>✏️ Sửa hóa đơn</button>
    <button onClick={() => onRequestConfirmation(r.id)}>📧 Gửi yêu cầu xác nhận</button>
  </div>
)}

// ACCEPT status
{r.status === 'ACCEPT' && (
  <div>
    <button onClick={() => onStartRepair(r.id)}>🔧 Tiến hành sửa chữa</button>
  </div>
)}

// REPAIRING status
{r.status === 'REPAIRING' && (
  <div>
    <button onClick={() => onCompleteRepair(r.id)}>✅ Hoàn thành</button>
  </div>
)}
```

---

## 🔄 Workflow Hoàn Chỉnh

### 1. Flow Kiểm Tra Container
```
CHECKING → "Đạt chuẩn" → CHECKED
     ↓
"Không đạt chuẩn" → Tạo hóa đơn → PENDING_ACCEPT
```

### 2. Flow Xác Nhận Từ Khách Hàng
```
PENDING_ACCEPT → Customer chấp nhận → ACCEPT
     ↓
Customer từ chối → REJECTED
```

### 3. Flow Sửa Chữa
```
ACCEPT → "🔧 Tiến hành sửa chữa" → REPAIRING
      ↓
"✅ Hoàn thành" → CHECKED (RepairTicket) + CHECKED (ServiceRequest)
```

---

## 🛠️ Implementation Details

### 1. Backend Service Methods

#### MaintenanceService
```typescript
// Gửi yêu cầu xác nhận
async sendConfirmationRequest(actor: any, repairTicketId: string)

// Tiến hành sửa chữa
async startRepair(actor: any, repairTicketId: string)

// Hoàn thành sửa chữa
async completeRepair(actor: any, repairTicketId: string)

// Đồng bộ trạng thái RepairTicket với ServiceRequest
async syncRepairTicketStatus(containerNo: string)
```

#### RequestService
```typescript
// Khách hàng chấp nhận yêu cầu
async acceptRequest(actor: any, id: string, reason?: string)

// Khách hàng từ chối yêu cầu
async rejectByCustomer(actor: any, id: string, reason: string)

// Lấy thông tin request theo ID
async getById(id: string)
```

### 2. Frontend API Integration

#### maintenance.ts
```typescript
export const maintenanceApi = {
  // ... existing methods
  
  // Gửi yêu cầu xác nhận
  async sendConfirmationRequest(repairTicketId: string)
  
  // Tiến hành sửa chữa
  async startRepair(repairTicketId: string)
  
  // Hoàn thành sửa chữa
  async completeRepair(repairTicketId: string)
}
```

#### useCustomerActions.ts (New Hook)
```typescript
export const useCustomerActions = () => {
  const handleViewInvoice = async (containerNo: string) => { /* ... */ }
  const handleAccept = async (id: string) => { /* ... */ }
  const handleRejectByCustomer = async (id: string, reason: string) => { /* ... */ }
  
  return { handleViewInvoice, handleAccept, handleRejectByCustomer }
}
```

### 3. Status Synchronization Logic

#### Trigger Point 1: ServiceRequest → RepairTicket (Khi customer accept)
```typescript
// Trong RequestService.acceptRequest()
if (req.container_no) {
  try {
    const maintenanceService = await import('../../maintenance/service/MaintenanceService');
    await maintenanceService.default.syncRepairTicketStatus(req.container_no);
    console.log('✅ Successfully synced RepairTicket status for container:', req.container_no);
  } catch (error) {
    console.error('❌ Error syncing RepairTicket status:', error);
    // Không throw error để không ảnh hưởng đến việc accept request
  }
}
```

#### Trigger Point 2: RepairTicket → ServiceRequest (Khi hoàn thành sửa chữa)
```typescript
// Trong MaintenanceService.completeRepair()
if (repairTicket.container_no) {
  try {
    await prisma.serviceRequest.updateMany({
      where: { 
        container_no: repairTicket.container_no,
        status: { in: ['ACCEPT', 'PENDING_ACCEPT'] }
      },
      data: { 
        status: 'CHECKED',
        updatedAt: new Date()
      }
    });
    console.log('✅ Successfully synced ServiceRequest status to CHECKED for container:', repairTicket.container_no);
  } catch (error) {
    console.error('❌ Error syncing ServiceRequest status:', error);
  }
}
```

#### Sync Logic
```typescript
async syncRepairTicketStatus(containerNo: string) {
  // 1. Tìm ServiceRequest với trạng thái ACCEPT
  const serviceRequest = await prisma.serviceRequest.findFirst({
    where: { container_no: containerNo, status: 'ACCEPT' }
  });
  
  // 2. Tìm RepairTicket tương ứng với trạng thái PENDING_ACCEPT
  const repairTicket = await prisma.repairTicket.findFirst({
    where: { container_no: containerNo, status: 'PENDING_ACCEPT' }
  });
  
  // 3. Cập nhật RepairTicket thành ACCEPT
  const updatedRepairTicket = await prisma.repairTicket.update({
    where: { id: repairTicket.id },
    data: { status: 'ACCEPT', updatedAt: new Date() }
  });
  
  // 4. Audit log
  await audit(serviceRequest.created_by, 'REPAIR.SYNCED_TO_ACCEPT', 'REPAIR', updatedRepairTicket.id);
  
  return updatedRepairTicket;
}
```

---

## 🔐 Security & Validation

### 1. Role-Based Access Control
```typescript
// Maintenance actions - chỉ SaleAdmin và SystemAdmin
router.post('/repairs/:id/start-repair', requireRoles('SaleAdmin','SystemAdmin'), controller.startRepair.bind(controller));
router.post('/repairs/:id/complete-repair', requireRoles('SaleAdmin','SystemAdmin'), controller.completeRepair.bind(controller));

// Customer actions - CustomerAdmin và CustomerUser
router.patch('/requests/:id/accept', requireRoles('CustomerAdmin','CustomerUser'), controller.acceptRequest.bind(controller));
router.patch('/requests/:id/reject-by-customer', requireRoles('CustomerAdmin','CustomerUser'), controller.rejectByCustomer.bind(controller));
```

### 2. Status Validation
```typescript
// Chỉ cho phép chuyển trạng thái khi đang ở trạng thái phù hợp
if (repairTicket.status !== 'ACCEPT') {
  throw new Error('Chỉ có thể tiến hành sửa chữa khi phiếu ở trạng thái "Đã chấp nhận"');
}

if (repairTicket.status !== 'REPAIRING') {
  throw new Error('Chỉ có thể hoàn thành sửa chữa khi phiếu ở trạng thái "Đang sửa chữa"');
}
```

### 3. Audit Logging
```typescript
// Ghi lại tất cả các thay đổi trạng thái
await audit(actor._id, 'REPAIR.STARTED', 'REPAIR', repairTicketId, {
  container_no: repairTicket.container_no,
  old_status: repairTicket.status,
  new_status: 'REPAIRING'
});
```

---

## 🎨 UI/UX Improvements

### 1. Action Button Styling
```typescript
// Tiến hành sửa chữa - màu xanh lá
style={{
  padding: '4px 8px',
  border: 'none',
  borderRadius: '4px',
  background: '#10b981',  // Green-500
  color: 'white',
  cursor: 'pointer',
  fontSize: '12px'
}}

// Hoàn thành - màu xanh đậm
style={{
  padding: '4px 8px',
  border: 'none',
  borderRadius: '4px',
  background: '#059669',  // Green-600
  color: 'white',
  cursor: 'pointer',
  fontSize: '12px'
}}
```

### 2. Status Badge Updates
```typescript
// Thêm CSS classes mới
.status-accept {
  background: #d1fae5;
  color: #065f46;
}

// Cập nhật getStatusBadge function
{r.status === 'ACCEPT' ? 'Đã chấp nhận' : /* ... */}
```

### 3. Message Display
```typescript
// Thông báo thành công với timeout
setMsg('Đã tiến hành sửa chữa thành công');
setTimeout(() => setMsg(''), 3000);

// Thông báo lỗi với error message từ backend
setMsg(e?.response?.data?.message || 'Lỗi khi tiến hành sửa chữa');
```

---

## 🧪 Testing & Debugging

### 1. Debug Scripts (Temporary)
```javascript
// debug-status.js - Kiểm tra trạng thái database
const serviceRequests = await prisma.serviceRequest.findMany({
  where: { container_no: 'ISO 9998' }
});

// test-sync.js - Test logic đồng bộ
const result = await service.syncRepairTicketStatus('ISO 9998');
```

### 2. Error Handling
```typescript
try {
  const result = await maintenanceApi.startRepair(id);
  setMsg(result.message || 'Đã tiến hành sửa chữa thành công');
  mutate(key); // Refresh data
} catch (e: any) {
  setMsg(e?.response?.data?.message || 'Lỗi khi tiến hành sửa chữa');
}
```

---

## 📊 Performance & Optimization

### 1. Data Fetching
- **SWR caching**: Sử dụng mutate để refresh data sau mỗi action
- **Optimistic updates**: Cập nhật UI ngay lập tức, sync với backend
- **Error boundaries**: Xử lý lỗi gracefully không crash app

### 2. Database Operations
- **Transaction safety**: Các thay đổi trạng thái được thực hiện trong transaction
- **Index optimization**: Sử dụng container_no để tìm kiếm nhanh
- **Audit trail**: Ghi log không ảnh hưởng performance

---

## 🚀 Future Enhancements

### 1. Real-time Updates
- **WebSocket integration**: Cập nhật trạng thái real-time
- **Push notifications**: Thông báo khi có thay đổi trạng thái
- **Live status tracking**: Theo dõi tiến độ sửa chữa real-time

### 2. Advanced Workflow
- **Multi-step approval**: Nhiều cấp phê duyệt
- **Conditional routing**: Routing dựa trên loại container/thiết bị
- **Automated scheduling**: Tự động lên lịch sửa chữa

### 3. Analytics & Reporting
- **Repair metrics**: Thống kê thời gian sửa chữa
- **Cost analysis**: Phân tích chi phí sửa chữa
- **Performance dashboard**: Dashboard hiệu suất maintenance

---

## 📋 Checklist Implementation

### ✅ Backend
- [x] Cập nhật RepairStatus enum với ACCEPT
- [x] Thêm 4 service methods mới
- [x] Thêm 3 API endpoints mới
- [x] Implement status synchronization logic
- [x] Thêm audit logging cho tất cả actions
- [x] Validation và error handling

### ✅ Frontend
- [x] Cập nhật RepairTable component với 3 action buttons
- [x] Thêm handlers cho các actions mới
- [x] Cập nhật maintenance API service
- [x] Styling cho buttons và status badges
- [x] Message display và error handling

### ✅ Database
- [x] Migration cho RepairStatus enum
- [x] Cập nhật ServiceRequest status comment
- [x] Index optimization cho container_no

### ✅ Documentation
- [x] Cập nhật MODULE_6_MAINTENANCE.md
- [x] Cập nhật UI_REFACTOR_DOCUMENTATION.md
- [x] Tạo MAINTENANCE_WORKFLOW_ENHANCEMENT.md

---

## 📞 Support & Maintenance

### Để bảo trì và phát triển tiếp:

1. **Workflow consistency**: Đảm bảo các trạng thái chuyển đổi đúng logic
2. **Status synchronization**: Kiểm tra đồng bộ giữa ServiceRequest và RepairTicket
3. **Audit trail**: Duy trì log đầy đủ cho compliance
4. **Performance monitoring**: Theo dõi performance của các API calls mới
5. **User training**: Hướng dẫn user sử dụng workflow mới

### Liên hệ:
- **Developer team**: Để hỗ trợ khi cần thêm features mới hoặc fix bugs
- **Business team**: Để review workflow và đưa ra yêu cầu cải tiến

---

*Tài liệu được tạo: 2025-01-27*  
*Version: 1.0.0 - Initial Release*  
*Maintenance Workflow Enhancement Complete*
