# 📝 Request State Machine Implementation

## Tổng quan

Tài liệu này mô tả chi tiết việc implement Request State Machine theo specification đã được định nghĩa. Hệ thống đã được cập nhật để hỗ trợ luồng trạng thái mới giữa Customer và Depot.

## 🏗️ Kiến trúc đã implement

### 1. State Machine Service
**File:** `modules/requests/service/RequestStateMachine.ts`

- **Chức năng:** Quản lý toàn bộ logic state machine
- **Tính năng chính:**
  - Validate transitions hợp lệ
  - Kiểm tra quyền theo role
  - Ghi audit log tự động
  - Gửi system message vào chat room
  - Cung cấp helper methods cho UI

**Các trạng thái hợp lệ:**
- `PENDING` → Chờ xử lý
- `SCHEDULED` → Đã đặt lịch hẹn  
- `SCHEDULED_INFO_ADDED` → Đã bổ sung thông tin
- `SENT_TO_GATE` → Đã chuyển sang Gate
- `REJECTED` → Bị từ chối
- `COMPLETED` → Hoàn tất
- `ACCEPT` → Đã chấp nhận
- `CHECKED` → Đã kiểm tra
- `POSITIONED` → Đã xếp chỗ trong bãi
- `FORKLIFTING` → Đang nâng/hạ container
- `IN_YARD` → Đã ở trong bãi

### 2. Appointment Service
**File:** `modules/requests/service/AppointmentService.ts`

- **Chức năng:** Quản lý riêng biệt các thao tác liên quan đến lịch hẹn
- **Tính năng chính:**
  - Đặt lịch hẹn (schedule)
  - Cập nhật lịch hẹn
  - Hủy lịch hẹn
  - Lấy thông tin lịch hẹn
  - Danh sách lịch hẹn theo ngày

### 3. Cập nhật RequestService
**File:** `modules/requests/service/RequestService.ts`

**Các method mới được thêm:**
- `scheduleRequest()` - Đặt lịch hẹn
- `addInfoToRequest()` - Bổ sung thông tin
- `sendToGate()` - Chuyển tiếp sang Gate
- `completeRequest()` - Hoàn tất request
- `getValidTransitions()` - Lấy transitions hợp lệ
- `getStateInfo()` - Lấy thông tin trạng thái

**Các method được cập nhật:**
- `updateStatus()` - Sử dụng State Machine
- `rejectRequest()` - Sử dụng State Machine

### 4. Cập nhật DTOs
**File:** `modules/requests/dto/RequestDtos.ts`

**DTOs mới:**
- `scheduleRequestSchema` - Validate dữ liệu đặt lịch
- `addInfoSchema` - Validate dữ liệu bổ sung thông tin
- `sendToGateSchema` - Validate chuyển Gate
- `completeRequestSchema` - Validate hoàn tất

**DTOs được cập nhật:**
- `updateRequestStatusSchema` - Cập nhật enum status mới

### 5. Cập nhật Controller
**File:** `modules/requests/controller/RequestController.ts`

**Methods mới:**
- `scheduleRequest()` - API đặt lịch hẹn
- `addInfoToRequest()` - API bổ sung thông tin
- `sendToGate()` - API chuyển Gate
- `completeRequest()` - API hoàn tất
- `getValidTransitions()` - API lấy transitions
- `getStateInfo()` - API lấy thông tin state

### 6. Cập nhật Routes
**File:** `modules/requests/controller/RequestRoutes.ts`

**Routes mới:**
```typescript
// State Machine Routes
PATCH /:id/schedule - Đặt lịch hẹn (SaleAdmin, SystemAdmin)
PATCH /:id/add-info - Bổ sung thông tin (CustomerAdmin, CustomerUser)
PATCH /:id/send-to-gate - Chuyển Gate (SaleAdmin, SystemAdmin)
PATCH /:id/complete - Hoàn tất (SaleAdmin, SystemAdmin)

// Helper routes
GET /:id/transitions - Lấy transitions hợp lệ
GET /state/:state/info - Lấy thông tin state
```

## 🔄 Luồng trạng thái (State Transitions)

### Transitions được định nghĩa:

1. **PENDING → SCHEDULED**
   - **Actor:** SaleAdmin, SystemAdmin
   - **Mô tả:** Depot tiếp nhận và đặt lịch hẹn

2. **PENDING → REJECTED**
   - **Actor:** SaleAdmin, SystemAdmin
   - **Requires:** Lý do từ chối
   - **Mô tả:** Depot từ chối request

3. **SCHEDULED → SCHEDULED_INFO_ADDED**
   - **Actor:** CustomerAdmin, CustomerUser
   - **Mô tả:** Customer bổ sung thông tin

4. **SCHEDULED → SENT_TO_GATE**
   - **Actor:** SaleAdmin, SystemAdmin
   - **Mô tả:** Depot chuyển tiếp sang Gate

5. **SCHEDULED → REJECTED**
   - **Actor:** SaleAdmin, SystemAdmin
   - **Requires:** Lý do từ chối
   - **Mô tả:** Depot từ chối request

6. **SCHEDULED_INFO_ADDED → SENT_TO_GATE**
   - **Actor:** SaleAdmin, SystemAdmin
   - **Mô tả:** Depot chuyển tiếp sang Gate

7. **SCHEDULED_INFO_ADDED → REJECTED**
   - **Actor:** SaleAdmin, SystemAdmin
   - **Requires:** Lý do từ chối
   - **Mô tả:** Depot từ chối request

8. **SENT_TO_GATE → COMPLETED**
   - **Actor:** SaleAdmin, SystemAdmin, System
   - **Mô tả:** Hoàn tất xử lý tại Gate

## 🗄️ Database Changes

### Migration: `20250816212950_update_request_status_enum`

**Thay đổi trong schema:**
```sql
-- Cập nhật comment cho status field
ALTER TABLE "ServiceRequest" ALTER COLUMN "status" TYPE VARCHAR;
-- Comment: PENDING | SCHEDULED | SCHEDULED_INFO_ADDED | SENT_TO_GATE | REJECTED | COMPLETED
```

## 🎨 UI/UX Support

### State Colors & Descriptions
```typescript
// Màu sắc cho từng trạng thái
PENDING: 'yellow'
SCHEDULED: 'blue' 
SCHEDULED_INFO_ADDED: 'cyan'
SENT_TO_GATE: 'purple'
REJECTED: 'red'
COMPLETED: 'green'
POSITIONED: 'blue'
FORKLIFTING: 'orange'
IN_YARD: 'green'

// Mô tả tiếng Việt
PENDING: 'Chờ xử lý'
SCHEDULED: 'Đã đặt lịch hẹn'
SCHEDULED_INFO_ADDED: 'Đã bổ sung thông tin'
SENT_TO_GATE: 'Đã chuyển sang Gate'
REJECTED: 'Bị từ chối'
COMPLETED: 'Hoàn tất'
POSITIONED: 'Đã xếp chỗ trong bãi'
FORKLIFTING: 'Đang nâng/hạ container'
IN_YARD: 'Đã ở trong bãi'
```

### System Messages
Mỗi transition sẽ tự động gửi system message vào chat room:
- 📋 Yêu cầu đã được tạo và đang chờ xử lý
- 📅 Lịch hẹn đã được đặt
- 📄 Thông tin bổ sung đã được cập nhật
- 🚪 Yêu cầu đã được chuyển tiếp sang Gate
- ❌ Yêu cầu bị từ chối: [lý do]
- ✅ Yêu cầu đã hoàn tất
- 📍 Container đã được xếp chỗ trong bãi
- 🚛 Tài xế đang nâng/hạ container
- 🏭 Container đã được đặt vào vị trí trong bãi

## 🔒 Security & Validation

### Role-based Access Control
- **Customer:** Chỉ có thể bổ sung thông tin khi ở trạng thái SCHEDULED
- **Depot:** Có thể đặt lịch, chuyển Gate, từ chối, hoàn tất
- **System:** Có thể hoàn tất request

### Validation Rules
- Transition phải hợp lệ theo state machine
- Lý do bắt buộc khi reject
- Chỉ update appointment khi ở trạng thái SCHEDULED
- Không thể chuyển trực tiếp từ PENDING sang SENT_TO_GATE

## 📊 Audit & Logging

### Audit Events
Mỗi transition sẽ tạo audit log với:
- Actor ID
- Action type (REQUEST.SCHEDULED, REQUEST.REJECTED, etc.)
- Entity: REQUEST
- Entity ID
- Metadata: from state, to state, reason, additional data

### History Tracking
Mỗi request lưu history array với:
- Timestamp
- Actor ID
- Action
- Additional data (appointment info, documents, etc.)

## 🧪 Testing Considerations

### Test Cases cần implement:
1. **Valid Transitions:**
   - Customer tạo request → PENDING
   - Depot đặt lịch → SCHEDULED
   - Customer bổ sung info → SCHEDULED_INFO_ADDED
   - Depot chuyển Gate → SENT_TO_GATE
   - System hoàn tất → COMPLETED

2. **Invalid Transitions:**
   - Customer không thể chuyển trực tiếp sang SENT_TO_GATE
   - Depot không thể tạo request với status khác PENDING
   - Không thể bổ sung info sau khi đã SENT_TO_GATE

3. **Role Validation:**
   - Customer chỉ có thể add info
   - Depot có đầy đủ quyền
   - System chỉ có thể complete

## 🚀 Deployment Notes

### Migration Required
```bash
npx prisma migrate dev --name update_request_status_enum
```

### Environment Variables
Không cần thay đổi environment variables.

### Breaking Changes
- Status enum đã thay đổi từ cũ sang mới
- Các request cũ với status không hợp lệ cần được migrate
- Frontend cần cập nhật để sử dụng API mới

## 🔧 Debug và Sửa lỗi

### Vấn đề đã gặp phải

#### 1. Lỗi TypeScript trong AppointmentController
**Lỗi:** AppointmentController sử dụng constructor và methods không tồn tại trong AppointmentService mới
**Giải pháp:** Xóa file AppointmentController.ts và AppointmentRoutes.ts cũ

#### 2. Lỗi 404 khi tạo lịch hẹn
**Lỗi:** Frontend gọi API `/requests/${requestId}/accept` nhưng API mới là `/requests/${requestId}/schedule`
**Giải pháp:** Cập nhật AppointmentModal.tsx để gọi đúng endpoint

#### 3. Modal không có thanh cuộn
**Vấn đề:** Modal cố định chiều cao, không thể cuộn khi nội dung dài
**Giải pháp:** Thêm cấu trúc modal với header, body có thể cuộn, và footer cố định

### Những gì đã sửa

#### Backend
- ✅ Xóa AppointmentController.ts và AppointmentRoutes.ts cũ
- ✅ Cập nhật main.ts để loại bỏ import không cần thiết
- ✅ Cấu hình prisma seed trong package.json
- ✅ Backend chạy ở port 1000

#### Frontend
- ✅ Cập nhật AppointmentModal.tsx để gọi API đúng endpoint
- ✅ Thêm thanh cuộn cho modal
- ✅ Cải thiện UI/UX của modal với header, body, footer riêng biệt

### Cấu trúc Modal mới

```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
            <h2>Tạo lịch hẹn</h2>
            <button>✕</button>
        </div>
        
        {/* Body - Có thể cuộn */}
        <div className="flex-1 overflow-y-auto p-6">
            <form>...</form>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
            <button>Hủy</button>
            <button>Tạo lịch hẹn</button>
        </div>
    </div>
</div>
```

### Cấu hình Ports

- **Backend:** `http://localhost:1000`
- **Frontend:** `http://localhost:1100`
- **Proxy:** `/backend/*` → `http://localhost:1000/*`

### Testing

#### Backend Health Check:
```bash
curl http://localhost:1000/health
# Response: {"ok":true}
```

#### API Test (cần authentication):
```bash
# Cần token trong header Authorization: Bearer <token>
curl -X PATCH http://localhost:1000/requests/:id/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"appointment_time":"2024-08-20T10:00:00Z","appointment_location_type":"gate","appointment_location_id":"GATE_01"}'
```

### Next Steps

1. ✅ Khởi động backend ở port 1000
2. ✅ Khởi động frontend ở port 1100
3. ✅ Test tạo lịch hẹn từ UI
4. 🔄 Test các state transitions khác
5. 🔄 Implement document upload trong add-info
6. 🔄 Add validation cho appointment time

## 📝 TODO & Future Enhancements

### Short-term
- [ ] Implement document upload logic trong addInfoToRequest
- [ ] Add validation cho appointment time (không được quá khứ)
- [ ] Add slot availability check
- [ ] Implement notification system cho state changes

### Long-term
- [ ] Add workflow engine cho complex business rules
- [ ] Implement state machine visualization
- [ ] Add bulk operations cho Depot
- [ ] Implement auto-completion rules

## 🚛 Container Yard Workflow Integration

### 6.3.1) New Status Flow
Hệ thống đã được mở rộng với các trạng thái mới để quản lý workflow container trong bãi:

**Workflow mới:**
1. **CHECKED** → **POSITIONED** (Yard Confirm)
   - Trigger: Click "Confirm" button trên Yard page (`http://localhost:5002/Yard`)
   - Action: Cập nhật `ServiceRequest.status` từ `CHECKED` → `POSITIONED`
   - Side effect: Tạo `ForkliftTask` với `status = 'PENDING'`
   - System message: "📍 Container đã được xếp chỗ trong bãi"

2. **POSITIONED** → **FORKLIFTING** (Driver Start)
   - Trigger: Click "Bắt đầu" button trên DriverDashboard (`http://localhost:5002/DriverDashboard`)
   - Action: Cập nhật `ServiceRequest.status` từ `POSITIONED` → `FORKLIFTING`
   - Side effect: Cập nhật `ForkliftTask.status` từ `PENDING` → `IN_PROGRESS`
   - System message: "🚛 Tài xế đang nâng/hạ container"
   - Note: Message thay đổi theo loại request:
     - **Import**: "đang nâng container"
     - **Export**: "đang hạ container"

3. **FORKLIFTING** → **IN_YARD** (Forklift Approval)
   - Trigger: Click "Duyệt" button trên Forklift page (`http://localhost:5002/Forklift`)
   - Action: Cập nhật `ServiceRequest.status` từ `FORKLIFTING` → `IN_YARD`
   - Side effect: Cập nhật `ForkliftTask.status` thành `COMPLETED`
   - System message: "🏭 Container đã được đặt vào vị trí trong bãi"

### 6.3.2) State Machine Updates
**RequestStateMachine** đã được cập nhật với:

**Valid States mới:**
- `POSITIONED` → Đã xếp chỗ trong bãi
- `FORKLIFTING` → Đang nâng/hạ container  
- `IN_YARD` → Đã ở trong bãi

**Transitions mới:**
```typescript
{
  from: 'CHECKED',
  to: 'POSITIONED',
  allowedRoles: ['SaleAdmin', 'SystemAdmin'],
  description: 'Container đã được xếp chỗ trong bãi'
},
{
  from: 'POSITIONED',
  to: 'FORKLIFTING',
  allowedRoles: ['Driver', 'SaleAdmin', 'SystemAdmin'],
  description: 'Tài xế bắt đầu nâng/hạ container'
},
{
  from: 'FORKLIFTING',
  to: 'IN_YARD',
  allowedRoles: ['SaleAdmin', 'SystemAdmin'],
  description: 'Container đã được đặt vào vị trí trong bãi'
}
```

**System Messages mới:**
- `POSITIONED`: "📍 Container đã được xếp chỗ trong bãi"
- `FORKLIFTING`: "🚛 Tài xế đang nâng/hạ container"
- `IN_YARD`: "🏭 Container đã được đặt vào vị trí trong bãi"

**State Colors mới:**
- `POSITIONED`: `blue` (Đã xếp chỗ trong bãi)
- `FORKLIFTING`: `orange` (Đang nâng/hạ container)
- `IN_YARD`: `green` (Đã ở trong bãi)

### 6.3.3) Frontend Integration
**ContainersPage** sử dụng logic `derived_status` để hiển thị trạng thái container:

**Priority Order:**
1. **`IN_YARD`** (cao nhất) - Container đã được duyệt trên Forklift
2. **`ASSIGNED`** - Container có `slot_code` (đã confirm trên Yard)
3. **`PENDING`** - Container chưa có `slot_code` (chưa confirm trên Yard)
4. **`null`** - Container chưa được kiểm tra

**Frontend Filtering Strategy:**
- Filter được thực hiện hoàn toàn ở frontend dựa trên `derived_status`
- API luôn trả về tất cả container cần thiết
- Performance tốt hơn vì chỉ gọi API một lần

## 🔗 Related Files

### Core Implementation
- `modules/requests/service/RequestStateMachine.ts` - State machine logic với trạng thái mới
- `modules/requests/service/AppointmentService.ts` - Appointment management
- `modules/requests/service/RequestService.ts` - Main service với state machine

### Yard & Forklift Integration
- `modules/yard/service/YardService.ts` - Yard confirm logic (CHECKED → POSITIONED)
- `modules/driver-dashboard/service/DriverDashboardService.ts` - Driver start logic (POSITIONED → FORKLIFTING)
- `modules/forklift/controller/ForkliftController.ts` - Forklift approval logic (FORKLIFTING → IN_YARD)

### API Layer
- `modules/requests/controller/RequestController.ts` - API endpoints
- `modules/requests/controller/RequestRoutes.ts` - Route definitions
- `modules/requests/dto/RequestDtos.ts` - Validation schemas với trạng thái mới

### Database
- `prisma/schema.prisma` - Updated schema với trạng thái mới
- `prisma/migrations/` - Migration cho status enum updates

### Documentation
- `docs/REQUEST_STATE_MACHINE_IMPLEMENTATION.md` - This file
- `docs/MODULE_3_REQUESTS.md` - Module overview với Container Yard Workflow

---

**Ngày tạo:** 2024-08-16  
**Phiên bản:** 2.0.0 - Container Yard Workflow Integration  
**Tác giả:** Development Team  
**Trạng thái:** ✅ Hoàn thành implementation và debug + Container Yard Workflow
