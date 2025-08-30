# Request State Machine Implementation

## Tổng quan
Hệ thống quản lý container đã được cập nhật với **Request State Machine** để quản lý workflow trạng thái một cách nhất quán và có kiểm soát.

## 🚀 Workflow mới với trạng thái IN_CAR

### **Container Yard Workflow Integration**

#### 6.3.1) New Status Flow
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

3. **FORKLIFTING** → **IN_YARD/IN_CAR** (Forklift Approval) ⭐ **MỚI**
   - Trigger: Click "Duyệt" button trên Forklift page (`http://localhost:5002/Forklift`)
   - Action: Cập nhật `ServiceRequest.status` từ `FORKLIFTING` → trạng thái mới
   - Side effect: Cập nhật `ForkliftTask.status` thành `COMPLETED`
   - **Logic mới**: Phân biệt giữa IMPORT và EXPORT:
     - **IMPORT requests**: `FORKLIFTING` → `IN_YARD` (giữ nguyên logic cũ)
     - **EXPORT requests**: `FORKLIFTING` → `IN_CAR` (logic mới)
   - System message: 
     - Import: "🏭 Container đã được đặt vào vị trí trong bãi"
     - Export: "🚛 Container đã được đặt lên xe"

### 6.3.2) State Machine Updates
**RequestStateMachine** đã được cập nhật với:

**Valid States mới:**
- `POSITIONED` → Đã xếp chỗ trong bãi
- `FORKLIFTING` → Đang nâng/hạ container  
- `IN_YARD` → Đã ở trong bãi (cho IMPORT)
- `IN_CAR` → Đã lên xe (cho EXPORT) ⭐ **MỚI**

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
  description: 'Container đã được đặt vào vị trí trong bãi (cho IMPORT)'
},
{
  from: 'FORKLIFTING',
  to: 'IN_CAR',
  allowedRoles: ['SaleAdmin', 'SystemAdmin'],
  description: 'Container đã được đặt lên xe (cho EXPORT)'
}
```

**System Messages mới:**
- `POSITIONED`: "📍 Container đã được xếp chỗ trong bãi"
- `FORKLIFTING`: "🚛 Tài xế đang nâng/hạ container"
- `IN_YARD`: "🏭 Container đã được đặt vào vị trí trong bãi"
- `IN_CAR`: "🚛 Container đã được đặt lên xe" ⭐ **MỚI**

**State Colors mới:**
- `POSITIONED`: `blue` (Đã xếp chỗ trong bãi)
- `FORKLIFTING`: `orange` (Đang nâng/hạ container)
- `IN_YARD`: `green` (Đã ở trong bãi)
- `IN_CAR`: `yellow` (Đã lên xe) ⭐ **MỚI**

### 6.3.3) Frontend Integration
**ContainersPage** sử dụng logic `derived_status` để hiển thị trạng thái container:

**Priority Order mới:**
1. **`IN_YARD`** (cao nhất) - Container đã được duyệt trên Forklift (cho IMPORT)
2. **`IN_CAR`** (cao nhất) - Container đã được duyệt trên Forklift (cho EXPORT) ⭐ **MỚI**
3. **`ASSIGNED`** - Container có `slot_code` (đã confirm trên Yard)
4. **`PENDING`** - Container chưa có `slot_code` (chưa confirm trên Yard)
5. **`null`** - Container chưa được kiểm tra

**Frontend Filtering Strategy:**
- Filter được thực hiện hoàn toàn ở frontend dựa trên `derived_status`
- API luôn trả về tất cả container cần thiết
- Performance tốt hơn vì chỉ gọi API một lần

**Logic ẩn container IN_CAR:**
- Container có trạng thái `IN_CAR` được đánh dấu `hidden: true`
- Tự động ẩn khỏi danh sách hiển thị
- Không còn hiển thị trong filter options

## 🔗 Related Files

### Core Implementation
- `modules/requests/service/RequestStateMachine.ts` - State machine logic với trạng thái mới
- `modules/requests/service/AppointmentService.ts` - Appointment management
- `modules/requests/service/RequestService.ts` - Main service với state machine

### Yard & Forklift Integration
- `modules/yard/service/YardService.ts` - Yard confirm logic (CHECKED → POSITIONED)
- `modules/forklift/controller/ForkliftController.ts` - Forklift approval logic mới (FORKKLIFTING → IN_YARD/IN_CAR)
- `modules/driver-dashboard/service/DriverDashboardService.ts` - Driver start logic (POSITIONED → FORKLIFTING)

### Frontend Components
- `pages/ContainersPage/index.tsx` - Logic derived_status và ẩn container IN_CAR
- `pages/Forklift/index.tsx` - Hiển thị trạng thái mới
- `components/RequestTable.tsx` - Hiển thị trạng thái IN_CAR
- `components/DepotRequestTable.tsx` - Hiển thị trạng thái IN_CAR
- `components/SimpleChatBox.tsx` - Hiển thị trạng thái IN_CAR

## 📊 Workflow Summary

### **Import Request Workflow (Giữ nguyên):**
```
1. CHECKED → POSITIONED (Yard confirm)
2. POSITIONED → FORKLIFTING (Driver click "Bắt đầu")
3. FORKLIFTING → IN_YARD (Forklift approval)
```

### **Export Request Workflow (MỚI):**
```
1. GATE_IN → FORKLIFTING (Driver click "Bắt đầu")
2. FORKLIFTING → IN_CAR (Forklift approval) ⭐ MỚI
3. Container tự động ẩn khỏi Yard và ContainersPage
```

## 🎯 Business Logic

### **Khi approve forklift job:**
- **IMPORT requests**: Container được đặt vào vị trí trong bãi → Hiển thị trong Yard và ContainersPage
- **EXPORT requests**: Container được đặt lên xe → Tự động ẩn khỏi Yard và ContainersPage

### **Lý do logic mới:**
- Container EXPORT đã lên xe không còn ở depot
- Cần ẩn khỏi giao diện quản lý bãi
- Logic phân biệt rõ ràng giữa nhập và xuất

## 🔧 Technical Implementation

### **Backend Changes:**
1. **ForkliftController.approveJob()**: Logic phân biệt IMPORT/EXPORT
2. **RequestStateMachine**: Thêm trạng thái IN_CAR và transitions
3. **YardService**: Lọc bỏ container IN_CAR khỏi yard operations

### **Frontend Changes:**
1. **ContainersPage**: Logic ẩn container IN_CAR
2. **Status Display**: Thêm hiển thị cho trạng thái IN_CAR
3. **Filter Options**: Loại bỏ option IN_CAR (vì không hiển thị)

## 📈 Performance Impact

### **Database Queries:**
- Thêm filter để loại bỏ container IN_CAR trong yard operations
- Không ảnh hưởng đến performance vì chỉ filter thêm điều kiện

### **Frontend Rendering:**
- Container IN_CAR được ẩn hoàn toàn
- Giảm số lượng item hiển thị
- Cải thiện UX cho người dùng

## 🚀 Future Enhancements

### **Short-term:**
- [ ] Add export status tracking cho container IN_CAR
- [ ] Implement container departure workflow
- [ ] Add notifications khi container chuyển sang IN_CAR

### **Long-term:**
- [ ] Add workflow engine cho complex business rules
- [ ] Implement state machine visualization
- [ ] Add bulk operations cho Depot
- [ ] Implement auto-completion rules
