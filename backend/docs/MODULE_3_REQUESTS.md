# MODULE 3: REQUESTS - Quản lý yêu cầu dịch vụ

## Tổng quan
Module này quản lý toàn bộ lifecycle của các yêu cầu dịch vụ container, từ khi tạo request đến khi hoàn thành. Hệ thống đã được cập nhật với **Request State Machine** để quản lý workflow trạng thái một cách nhất quán và có kiểm soát.

## 🚀 Tính năng mới: Phân biệt IMPORT/EXPORT với trạng thái IN_CAR

### **Workflow mới với trạng thái IN_CAR**

#### 1. **Import Request Workflow (Giữ nguyên):**
```
1. CHECKED → POSITIONED (Yard confirm)
2. POSITIONED → FORKLIFTING (Driver click "Bắt đầu")
3. FORKLIFTING → IN_YARD (Forklift approval)
```

#### 2. **Export Request Workflow (MỚI):**
```
1. GATE_IN → FORKLIFTING (Driver click "Bắt đầu")
2. FORKLIFTING → IN_CAR (Forklift approval) ⭐ MỚI
3. Container tự động ẩn khỏi Yard và ContainersPage
```

### **Logic mới khi approve forklift job:**
- **IMPORT requests**: `FORKLIFTING` → `IN_YARD` (giữ nguyên logic cũ)
- **EXPORT requests**: `FORKLIFTING` → `IN_CAR` (logic mới)

### **Ẩn container IN_CAR:**
- Container có trạng thái `IN_CAR` sẽ tự động ẩn khỏi:
  - `http://localhost:5002/Yard` - Không hiển thị trong bản đồ bãi
  - `http://localhost:5002/ContainersPage` - Không hiển thị trong danh sách container

## 🏗️ Kiến trúc hệ thống

### 1. **Request State Machine** (`modules/requests/service/RequestStateMachine.ts`)
- **Chức năng:** Quản lý toàn bộ logic state machine
- **Tính năng chính:**
  - Validate transitions hợp lệ
  - Kiểm tra quyền theo role
  - Ghi audit log tự động
  - Gửi system message vào chat room
  - Cung cấp helper methods cho UI

**Các trạng thái hợp lệ mới:**
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
- `IN_YARD` → Đã ở trong bãi (cho IMPORT)
- `IN_CAR` → Đã lên xe (cho EXPORT) ⭐ **MỚI**

**Transitions mới:**
```typescript
{
  from: 'FORKLIFTING',
  to: 'IN_YARD',
  allowedRoles: ['SaleAdmin', 'SystemAdmin'],
  description: 'Container đã được đặt vào vị trí trong bãi (cho IMPORT)'
},
{
  from: 'FORKLIFTING',
  to: 'IN_CAR',
  allowedRoles: ['SaleAdmin', 'SystemAdmin'],
  description: 'Container đã được đặt lên xe (cho EXPORT)'
}
```

### 2. **Appointment Service** (`modules/requests/service/AppointmentService.ts`)
- **Chức năng:** Quản lý riêng biệt các thao tác liên quan đến lịch hẹn
- **Tính năng chính:**
  - Đặt lịch hẹn (schedule)
  - Cập nhật lịch hẹn
  - Hủy lịch hẹn
  - Lấy thông tin lịch hẹn
  - Danh sách lịch hẹn theo ngày

### 3. **Request Service** (`modules/requests/service/RequestService.ts`)
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

## 🔄 Luồng trạng thái (State Transitions)

### **Transitions được định nghĩa:**

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

### **Container Yard Workflow Integration mới:**

9. **CHECKED → POSITIONED** (Yard Confirm)
   - **Actor:** SaleAdmin, SystemAdmin
   - **Trigger:** Click "Confirm" button trên Yard page
   - **Mô tả:** Container đã được xếp chỗ trong bãi
   - **Side effect:** Tạo ForkliftTask với status = 'PENDING'

10. **POSITIONED → FORKLIFTING** (Driver Start)
    - **Actor:** Driver, SaleAdmin, SystemAdmin
    - **Trigger:** Click "Bắt đầu" button trên DriverDashboard
    - **Mô tả:** Tài xế bắt đầu nâng/hạ container
    - **Side effect:** Cập nhật ForkliftTask.status từ 'PENDING' → 'IN_PROGRESS'

11. **FORKLIFTING → IN_YARD** (Forklift Approval - IMPORT)
    - **Actor:** SaleAdmin, SystemAdmin
    - **Trigger:** Click "Duyệt" button trên Forklift page
    - **Mô tả:** Container đã được đặt vào vị trí trong bãi (cho IMPORT)
    - **Side effect:** Cập nhật ForkliftTask.status thành 'COMPLETED'

12. **FORKLIFTING → IN_CAR** (Forklift Approval - EXPORT) ⭐ **MỚI**
    - **Actor:** SaleAdmin, SystemAdmin
    - **Trigger:** Click "Duyệt" button trên Forklift page
    - **Mô tả:** Container đã được đặt lên xe (cho EXPORT)
    - **Side effect:** Cập nhật ForkliftTask.status thành 'COMPLETED'
    - **Logic mới:** Container tự động ẩn khỏi Yard và ContainersPage

## 🎨 UI/UX Support

### **State Colors & Descriptions mới:**
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
IN_CAR: 'yellow' ⭐ MỚI

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
IN_CAR: 'Đã lên xe' ⭐ MỚI
```

### **System Messages mới:**
- 📋 Yêu cầu đã được tạo và đang chờ xử lý
- 📅 Lịch hẹn đã được đặt
- 📄 Thông tin bổ sung đã được cập nhật
- 🚪 Yêu cầu đã được chuyển tiếp sang Gate
- ❌ Yêu cầu bị từ chối: [lý do]
- ✅ Yêu cầu đã hoàn tất
- 📍 Container đã được xếp chỗ trong bãi
- 🚛 Tài xế đang nâng/hạ container
- 🏭 Container đã được đặt vào vị trí trong bãi
- 🚛 Container đã được đặt lên xe ⭐ **MỚI**

## 🔒 Security & Validation

### **Role-based Access Control:**
- **Customer:** Chỉ có thể bổ sung thông tin khi ở trạng thái SCHEDULED
- **Depot:** Có thể đặt lịch, chuyển Gate, từ chối, hoàn tất
- **System:** Có thể hoàn tất request
- **Driver:** Có thể bắt đầu và hoàn thành forklift job

### **Validation Rules:**
- Transition phải hợp lệ theo state machine
- Lý do bắt buộc khi reject
- Chỉ update appointment khi ở trạng thái SCHEDULED
- Không thể chuyển trực tiếp từ PENDING sang SENT_TO_GATE
- **Logic mới:** Phân biệt IMPORT/EXPORT khi approve forklift job

## 📊 Audit & Logging

### **Audit Events:**
Mỗi transition sẽ tạo audit log với:
- Actor ID
- Action type (REQUEST.SCHEDULED, REQUEST.REJECTED, etc.)
- Entity: REQUEST
- Entity ID
- Metadata: from state, to state, reason, additional data

### **History Tracking:**
Mỗi request lưu history array với:
- Timestamp
- Actor ID
- Action
- Additional data (appointment info, documents, etc.)

## 🔗 Related Files

### **Core Implementation:**
- `modules/requests/service/RequestStateMachine.ts` - State machine logic với trạng thái mới
- `modules/requests/service/AppointmentService.ts` - Appointment management
- `modules/requests/service/RequestService.ts` - Main service với state machine

### **Yard & Forklift Integration:**
- `modules/yard/service/YardService.ts` - Yard confirm logic (CHECKED → POSITIONED)
- `modules/forklift/controller/ForkliftController.ts` - Forklift approval logic mới (FORKKLIFTING → IN_YARD/IN_CAR)
- `modules/driver-dashboard/service/DriverDashboardService.ts` - Driver start logic (POSITIONED → FORKLIFTING)

### **Frontend Components:**
- `pages/ContainersPage/index.tsx` - Logic derived_status và ẩn container IN_CAR
- `pages/Forklift/index.tsx` - Hiển thị trạng thái mới
- `components/RequestTable.tsx` - Hiển thị trạng thái IN_CAR
- `components/DepotRequestTable.tsx` - Hiển thị trạng thái IN_CAR
- `components/SimpleChatBox.tsx` - Hiển thị trạng thái IN_CAR

### **API Layer:**
- `modules/requests/controller/RequestController.ts` - API endpoints
- `modules/requests/controller/RequestRoutes.ts` - Route definitions
- `modules/requests/dto/RequestDtos.ts` - Validation schemas với trạng thái mới

### **API Endpoints mới (v2025-09-09):**

#### `POST /requests/:id/send-customer-confirmation`
- **Mô tả**: Depot gửi xác nhận cho khách hàng (cập nhật viewquote = 2)
- **Authorization**: SaleAdmin, SystemAdmin
- **Body**: None
- **Response**: `{ success: true, message: "Đã gửi xác nhận cho khách hàng thành công" }`
- **Side effect**: Cập nhật viewquote = 2 cho RepairTicket tương ứng

### **Database:**
- `prisma/schema.prisma` - Updated schema với trạng thái mới
- `prisma/migrations/` - Migration cho status enum updates

## 🚀 Future Enhancements

### **Short-term:**
- [ ] Add export status tracking cho container IN_CAR
- [ ] Implement container departure workflow
- [ ] Add notifications khi container chuyển sang IN_CAR
- [ ] Implement document upload logic trong addInfoToRequest
- [ ] Add validation cho appointment time (không được quá khứ)

### **Long-term:**
- [ ] Add workflow engine cho complex business rules
- [ ] Implement state machine visualization
- [ ] Add bulk operations cho Depot
- [ ] Implement auto-completion rules
- [ ] Add slot availability check
- [ ] Implement notification system cho state changes

## 📝 TODO & Future Enhancements

### **Short-term**
- [ ] Implement document upload logic trong addInfoToRequest
- [ ] Add validation cho appointment time (không được quá khứ)
- [ ] Add slot availability check
- [ ] Implement notification system cho state changes

### **Long-term**
- [ ] Add workflow engine cho complex business rules
- [ ] Implement state machine visualization
- [ ] Add bulk operations cho Depot
- [ ] Implement auto-completion rules

---

**Ngày tạo:** 2024-08-16  
**Phiên bản:** 3.0.0 - Container Yard Workflow Integration + IN_CAR Status  
**Tác giả:** Development Team  
**Trạng thái:** ✅ Hoàn thành implementation và debug + Container Yard Workflow + Logic phân biệt IMPORT/EXPORT
