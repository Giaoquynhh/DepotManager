# Đơn giản hóa Forklift Workflow - IN_PROGRESS → COMPLETED

## Tổng quan
Đã cập nhật workflow forklift để loại bỏ bước `PENDING_APPROVAL` và cho phép chuyển trực tiếp từ `IN_PROGRESS` → `COMPLETED` với tự động cập nhật ServiceRequest và YardPlacement.

## Thay đổi workflow

### Trước khi cập nhật:
```
PENDING → ASSIGNED → IN_PROGRESS → PENDING_APPROVAL → COMPLETED
```

### Sau khi cập nhật:
```
PENDING → ASSIGNED → IN_PROGRESS → COMPLETED
```

## Thay đổi đã thực hiện

### 1. Cập nhật ForkliftController.completeJob()
**File:** `manageContainer/backend/modules/forklift/controller/ForkliftController.ts`

**Thay đổi:**
- Thêm logic tự động cập nhật ServiceRequest và YardPlacement khi forklift task chuyển sang `COMPLETED`
- Sử dụng transaction để đảm bảo tính nhất quán dữ liệu
- Phân biệt logic cho EXPORT và IMPORT request

**Logic mới:**
```typescript
// Export request: FORKLIFTING → IN_CAR + YardPlacement REMOVED
// Import request: FORKLIFTING → IN_YARD (giữ nguyên)
```

### 2. Cập nhật DriverDashboardService.updateTaskStatus()
**File:** `manageContainer/backend/modules/driver-dashboard/service/DriverDashboardService.ts`

**Thay đổi:**
- Thêm logic xử lý khi driver cập nhật task status sang `COMPLETED`
- Tự động cập nhật ServiceRequest và YardPlacement
- Ghi log audit cho việc thay đổi trạng thái

## Chi tiết kỹ thuật

### 1. ForkliftController.completeJob()
- **Input:** `jobId` (forklift task ID)
- **Validation:** Chỉ cho phép từ status `IN_PROGRESS`, `PENDING`, `ASSIGNED`
- **Transaction:** Cập nhật ForkliftTask + ServiceRequest + YardPlacement
- **Output:** ForkliftTask đã cập nhật

### 2. DriverDashboardService.updateTaskStatus()
- **Input:** `driverId`, `taskId`, `status`, `notes`
- **Validation:** Kiểm tra quyền của driver
- **Transaction:** Cập nhật ForkliftTask + ServiceRequest + YardPlacement (nếu COMPLETED)
- **Output:** ForkliftTask đã cập nhật

### 3. ServiceRequest Status Flow
- **EXPORT:** `FORKLIFTING` → `IN_CAR`
- **IMPORT:** `FORKLIFTING` → `IN_YARD`

### 4. YardPlacement Status Flow
- **EXPORT:** `OCCUPIED`/`HOLD` → `REMOVED` (set `removed_at`)
- **IMPORT:** Không thay đổi (giữ nguyên trong bãi)

## API Endpoints

### 1. Complete Forklift Job
```
PATCH /forklift/jobs/:jobId/complete
```
- **Method:** PATCH
- **Auth:** Required
- **Body:** None
- **Response:** ForkliftTask + ServiceRequest + YardPlacement updated

### 2. Update Task Status (Driver)
```
PATCH /driver-dashboard/tasks/:taskId/status
```
- **Method:** PATCH
- **Auth:** Required (Driver)
- **Body:** `{ status: string, notes?: string }`
- **Response:** ForkliftTask + ServiceRequest + YardPlacement updated (if COMPLETED)

## Test Results

### Test Case: Container ISO 1999
- ✅ ForkliftTask: `IN_PROGRESS` → `COMPLETED`
- ✅ ServiceRequest: `FORKLIFTING` → `IN_CAR`
- ✅ YardPlacement: `OCCUPIED` → `REMOVED`
- ✅ Container ẩn khỏi ContainersPage
- ✅ Container ẩn khỏi Yard page

## Lợi ích

### 1. Đơn giản hóa workflow
- Loại bỏ bước `PENDING_APPROVAL` không cần thiết
- Giảm số bước thực hiện từ 5 xuống 4
- Tăng tốc độ xử lý

### 2. Tự động hóa
- Tự động cập nhật ServiceRequest và YardPlacement
- Không cần can thiệp thủ công
- Đảm bảo tính nhất quán dữ liệu

### 3. Cải thiện UX
- Driver có thể hoàn thành task trực tiếp
- Không cần chờ approval
- Giảm thời gian xử lý

## Backward Compatibility

- **ApproveJob endpoint vẫn hoạt động** cho các task cũ
- **Logic cũ vẫn được giữ** cho import request
- **Không ảnh hưởng** đến dữ liệu hiện có

## Files Modified

1. `manageContainer/backend/modules/forklift/controller/ForkliftController.ts`
2. `manageContainer/backend/modules/driver-dashboard/service/DriverDashboardService.ts`

## Database Changes

- **ForkliftTask:** Status flow thay đổi
- **ServiceRequest:** Tự động cập nhật khi forklift complete
- **YardPlacement:** Tự động cập nhật cho export request
- **AuditLog:** Ghi log cho tất cả thay đổi

## Migration Notes

- Không cần migration database
- Code changes chỉ ảnh hưởng đến logic xử lý
- Có thể rollback bằng cách revert code changes
