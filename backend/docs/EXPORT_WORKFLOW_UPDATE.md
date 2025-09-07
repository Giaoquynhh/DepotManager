# Cập nhật Export Workflow - Container Ẩn khi IN_CAR

## Tổng quan
Đã cập nhật workflow export để khi forklift task hoàn thành, container sẽ tự động ẩn khỏi ContainersPage và Yard page vì đã ở trên xe (status IN_CAR).

## Thay đổi đã thực hiện

### 1. Cập nhật ReportsRepository (ContainersPage)
**File:** `manageContainer/backend/modules/reports/repository/ReportsRepository.ts`

**Thay đổi:**
- Thêm điều kiện lọc `WHERE service_status::text <> 'IN_CAR'` trong query ServiceRequest
- Cập nhật logic loại bỏ container IN_CAR khỏi YardPlacement query
- Áp dụng cho cả main query và count query

**Kết quả:** Container có status `IN_CAR` sẽ không xuất hiện trong danh sách ContainersPage.

### 2. Cập nhật ForkliftController (Forklift Completion)
**File:** `manageContainer/backend/modules/forklift/controller/ForkliftController.ts`

**Thay đổi:**
- Thêm logic cập nhật YardPlacement khi export request chuyển sang `IN_CAR`
- Đánh dấu YardPlacement status = `REMOVED` và set `removed_at` timestamp
- Chỉ áp dụng cho export request (type = 'EXPORT')

**Kết quả:** Khi forklift task hoàn thành, container sẽ được đánh dấu là đã rời khỏi bãi.

### 3. YardService đã có sẵn logic lọc
**File:** `manageContainer/backend/modules/yard/service/YardService.ts`

**Logic hiện có:**
- YardService đã có logic loại bỏ container có status `IN_CAR` khỏi yard map
- Sử dụng `notIn: Array.from(inCarContainerNos)` trong query YardPlacement

**Kết quả:** Container có status `IN_CAR` sẽ không hiển thị trong Yard page.

## Workflow hoàn chỉnh

### Trước khi cập nhật:
```
Forklift Complete → Request IN_CAR → Container vẫn hiển thị trong ContainersPage và Yard
```

### Sau khi cập nhật:
```
Forklift Complete → Request IN_CAR → YardPlacement REMOVED → Container ẩn khỏi ContainersPage và Yard
```

## Chi tiết kỹ thuật

### 1. ServiceRequest Status Flow
- `FORKLIFTING` → `IN_CAR` (cho export request)
- `FORKLIFTING` → `IN_YARD` (cho import request - giữ nguyên)

### 2. YardPlacement Status Flow
- `OCCUPIED` → `REMOVED` (khi container chuyển sang IN_CAR)
- Set `removed_at` timestamp

### 3. Filtering Logic
- **ContainersPage:** Loại bỏ container có `service_status = 'IN_CAR'`
- **Yard Page:** Loại bỏ container có `service_status = 'IN_CAR'` khỏi occupied count

## Test Results

### Test Case: Container ISO 9998, ISO 9876
- ✅ ServiceRequest: `FORKLIFTING` → `IN_CAR`
- ✅ YardPlacement: `OCCUPIED` → `REMOVED`
- ✅ ContainersPage: Container ẩn khỏi danh sách
- ✅ Yard Page: Container không hiển thị trong occupied slots

### Test Summary
- **Total containers tested:** 3
- **Containers in IN_CAR:** 2
- **Containers visible in ContainersPage:** 1 (chỉ container FORKLIFTING)
- **Yard occupied slots:** 1 (chỉ container FORKLIFTING)
- **IN_CAR containers still in ContainersPage:** 0 ✅

## Lưu ý quan trọng

1. **Chỉ áp dụng cho Export Request:** Logic này chỉ áp dụng cho container có `type = 'EXPORT'`
2. **Import Request giữ nguyên:** Container import vẫn chuyển sang `IN_YARD` như cũ
3. **YardPlacement được cập nhật:** Container sẽ được đánh dấu `REMOVED` thay vì xóa hoàn toàn
4. **Backward Compatible:** Không ảnh hưởng đến logic hiện có cho import request

## Files Modified

1. `manageContainer/backend/modules/reports/repository/ReportsRepository.ts`
2. `manageContainer/backend/modules/forklift/controller/ForkliftController.ts`

## API Endpoints Affected

- `GET /reports/containers` - ContainersPage data
- `GET /yard/map` - Yard page data  
- `PATCH /forklift/jobs/:jobId/approve` - Forklift completion

## Database Changes

- YardPlacement status: `OCCUPIED` → `REMOVED`
- YardPlacement removed_at: `NULL` → `timestamp`
- ServiceRequest status: `FORKLIFTING` → `IN_CAR` (export only)

