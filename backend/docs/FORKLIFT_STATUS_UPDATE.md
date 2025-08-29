# Cập nhật Trạng thái Forklift - Workflow Gán Tài xế Mới

## Tổng quan
Đã cập nhật workflow gán tài xế và thêm trạng thái mới `ASSIGNED` (Xe nâng đã nhận) và `PENDING_APPROVAL` (Chờ duyệt) vào hệ thống quản lý xe nâng để cải thiện quy trình làm việc.

## Thay đổi đã thực hiện

### 1. Database Schema (prisma/schema.prisma)
```prisma
model ForkliftTask {
    // ... existing fields ...
    status         String   // PENDING | ASSIGNED | IN_PROGRESS | PENDING_APPROVAL | COMPLETED | CANCELLED
    cost           Float?   @default(0)  // Chi phí dịch vụ xe nâng
    report_status  String?  // Trạng thái báo cáo: PENDING, SUBMITTED, APPROVED, REJECTED
    report_image   String?  // Đường dẫn file ảnh báo cáo
    // ... existing fields ...
}
```

**Thay đổi:** 
- Thêm trạng thái `ASSIGNED` và `PENDING_APPROVAL` vào comment mô tả
- Thêm trường `cost` cho chi phí dịch vụ
- Thêm trường `report_status` và `report_image` cho báo cáo

### 2. Backend Controller (modules/forklift/controller/ForkliftController.ts)

#### a) Hàm `assignDriver` - Logic Gán Tài xế Mới
```typescript
async assignDriver(req: AuthRequest, res: Response) {
    try {
        const { jobId } = req.params;
        const { driverId } = req.body;

        // Kiểm tra job có tồn tại và ở trạng thái PENDING
        const job = await prisma.forkliftTask.findUnique({
            where: { id: jobId }
        });

        if (!job) {
            return res.status(404).json({ message: 'Forklift job not found' });
        }

        // Chỉ cho phép gán tài xế cho job PENDING
        if (job.status !== 'PENDING') {
            return res.status(400).json({ 
                message: 'Job cannot be assigned. Only pending jobs can be assigned to drivers.' 
            });
        }

        // Kiểm tra xem có phải gán lại tài xế không
        if (job.assigned_driver_id && job.assigned_driver_id !== driverId) {
            return res.status(400).json({ 
                message: 'Job already assigned to another driver. Cannot reassign.' 
            });
        }

        // Cập nhật job với tài xế mới
        const updatedJob = await prisma.forkliftTask.update({
            where: { id: jobId },
            data: {
                assigned_driver_id: driverId,
                status: 'ASSIGNED' // Chuyển sang trạng thái ASSIGNED
            }
        });

        // Ghi log audit
        await prisma.auditLog.create({
            data: {
                actor_id: req.user._id,
                action: 'FORKLIFT_DRIVER_ASSIGNED',
                entity: 'ForkliftTask',
                entity_id: jobId,
                meta: {
                    driverId,
                    oldStatus: job.status,
                    newStatus: 'ASSIGNED',
                    timestamp: new Date()
                }
            }
        });

        return res.json({
            message: 'Driver assigned successfully',
            job: updatedJob
        });

    } catch (error) {
        console.error('Error assigning driver:', error);
        return res.status(500).json({ 
            message: 'Internal server error' 
        });
    }
}
```

**Endpoint**: `PATCH /forklift/jobs/:jobId/assign-driver`
**Status Allowed**: `PENDING` → `ASSIGNED`

#### b) Hàm `startJob` - Logic Bắt đầu Công việc
```typescript
async startJob(req: AuthRequest, res: Response) {
    try {
        const { jobId } = req.params;
        const driverId = req.user._id;

        // Kiểm tra job có tồn tại và được gán cho tài xế này
        const job = await prisma.forkliftTask.findFirst({
            where: { 
                id: jobId,
                assigned_driver_id: driverId
            }
        });

        if (!job) {
            return res.status(404).json({ message: 'Forklift job not found or not assigned to you' });
        }

        // Chỉ cho phép bắt đầu từ trạng thái ASSIGNED
        if (job.status !== 'ASSIGNED') {
            return res.status(400).json({ 
                message: 'Job cannot be started. Only assigned jobs can be started.' 
            });
        }

        // Cập nhật trạng thái sang IN_PROGRESS
        const updatedJob = await prisma.forkliftTask.update({
            where: { id: jobId },
            data: { status: 'IN_PROGRESS' }
        });

        // Ghi log audit
        await prisma.auditLog.create({
            data: {
                actor_id: driverId,
                action: 'FORKLIFT_JOB_STARTED',
                entity: 'ForkliftTask',
                entity_id: jobId,
                meta: {
                    oldStatus: job.status,
                    newStatus: 'IN_PROGRESS',
                    timestamp: new Date()
                }
            }
        });

        return res.json({
            message: 'Job started successfully',
            job: updatedJob
        });

    } catch (error) {
        console.error('Error starting job:', error);
        return res.status(500).json({ 
            message: 'Internal server error' 
        });
    }
}
```

**Endpoint**: `PATCH /forklift/jobs/:jobId/start`
**Status Allowed**: `ASSIGNED` → `IN_PROGRESS`

#### c) Hàm `completeJob` - Logic Hoàn thành Công việc (Cập nhật)
```typescript
async completeJob(req: AuthRequest, res: Response) {
    try {
        const { jobId } = req.params;
        const driverId = req.user._id;

        // Kiểm tra job có tồn tại và được gán cho tài xế này
        const job = await prisma.forkliftTask.findFirst({
            where: { 
                id: jobId,
                assigned_driver_id: driverId
            }
        });

        if (!job) {
            return res.status(404).json({ message: 'Forklift job not found or not assigned to you' });
        }

        // Chỉ cho phép hoàn thành từ trạng thái IN_PROGRESS
        if (job.status !== 'IN_PROGRESS') {
            return res.status(400).json({ 
                message: 'Job cannot be completed. Only in-progress jobs can be completed.' 
            });
        }

        // Kiểm tra chi phí và báo cáo
        if (!job.cost || job.cost <= 0) {
            return res.status(400).json({ 
                message: 'Cannot complete job: Cost is required and must be greater than 0' 
            });
        }

        if (!job.report_status) {
            return res.status(400).json({ 
                message: 'Cannot complete job: Report is required' 
            });
        }

        // Cập nhật trạng thái sang PENDING_APPROVAL (chờ duyệt)
        const updatedJob = await prisma.forkliftTask.update({
            where: { id: jobId },
            data: { status: 'PENDING_APPROVAL' }
        });

        // Ghi log audit
        await prisma.auditLog.create({
            data: {
                actor_id: driverId,
                action: 'FORKLIFT_JOB_PENDING_APPROVAL',
                entity: 'ForkliftTask',
                entity_id: jobId,
                meta: {
                    oldStatus: job.status,
                    newStatus: 'PENDING_APPROVAL',
                    timestamp: new Date()
                }
            }
        });

        return res.json({
            message: 'Job submitted for approval successfully',
            job: updatedJob
        });

    } catch (error) {
        console.error('Error completing job:', error);
        return res.status(500).json({ 
            message: 'Internal server error' 
        });
    }
}
```

**Endpoint**: `PATCH /forklift/jobs/:jobId/complete`
**Status Allowed**: `IN_PROGRESS` → `PENDING_APPROVAL`

### 3. Service Layer (modules/forklift/service/ForkliftService.ts)
- Cập nhật validation để chấp nhận trạng thái `ASSIGNED` và `PENDING_APPROVAL`

### 4. Frontend (pages/Forklift/index.tsx)

#### a) Interface
```typescript
interface ForkliftTask {
  // ... existing fields ...
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'COMPLETED' | 'CANCELLED';
  cost?: number; // Chi phí dịch vụ xe nâng
  // report_status và report_image đã bị xóa khỏi Forklift page
  // ... existing fields ...
}
```

#### b) Hiển thị trạng thái
- **PENDING:** "Chờ xử lý" (màu vàng)
- **ASSIGNED:** "Xe nâng đã nhận" (màu cam)
- **IN_PROGRESS:** "Đang thực hiện" (màu xanh dương)
- **PENDING_APPROVAL:** "Chờ duyệt" (màu cam)
- **COMPLETED:** "Hoàn thành" (màu xanh lá)
- **CANCELLED:** "Đã hủy" (màu đỏ)

#### c) Logic nút hành động
- **PENDING + không có tài xế:** "Hủy", "Gán tài xế", "Chỉnh sửa chi phí"
- **PENDING + có tài xế:** "🔄 Gán lại tài xế", "Chỉnh sửa chi phí"
- **ASSIGNED:** "Bắt đầu làm việc", "Chỉnh sửa chi phí"
- **IN_PROGRESS:** "Hoàn thành", "Chỉnh sửa chi phí"
- **PENDING_APPROVAL:** "Đang chờ duyệt" (không có nút hành động)
- **COMPLETED:** Không hiển thị nút hành động
- **CANCELLED:** Không hiển thị nút hành động

#### d) Hiển thị thông tin
- **VỊ TRÍ NHẬN:** Hiển thị thông tin tài xế (tên, biển số)
- **VỊ TRÍ XẾP:** Hiển thị vị trí thực tế (yard/block/slot)
- **CHI PHÍ:** Hiển thị chi phí dịch vụ với định dạng VNĐ

## Workflow mới

### Trước đây:
```
PENDING → IN_PROGRESS → COMPLETED
    ↓
CANCELLED
```

### Hiện tại:
```
PENDING → ASSIGNED → IN_PROGRESS → PENDING_APPROVAL → COMPLETED
    ↓         ↓
CANCELLED  CANCELLED
```

### **Chi tiết workflow mới:**

1. **PENDING** (Chờ xử lý)
   - Job mới được tạo
   - Có thể gán tài xế
   - Có thể hủy

2. **PENDING + assigned_driver_id** (Đã gán tài xế, chưa bắt đầu)
   - Tài xế thấy nút "Bắt đầu"
   - Không thể gán lại tài xế khác
   - Không thể hủy
   - Không thể bắt đầu công việc

3. **ASSIGNED** (Xe nâng đã nhận)
   - Tài xế thấy nút "Bắt đầu làm việc"
   - Không thể thay đổi gì khác

4. **IN_PROGRESS** (Đang thực hiện)
   - Tài xế thấy nút "Hoàn thành"
   - Khi click "Hoàn thành" → chuyển sang PENDING_APPROVAL
   - Không thể thay đổi gì khác

5. **PENDING_APPROVAL** (Chờ duyệt)
   - Task đã hoàn thành và chờ admin duyệt
   - Không thể thay đổi gì thêm
   - Admin có thể duyệt để chuyển sang COMPLETED

6. **COMPLETED** (Hoàn thành)
   - Task đã được duyệt và hoàn tất
   - Không thể thay đổi gì thêm

7. **CANCELLED** (Đã hủy)
   - Task đã bị hủy
   - Không thể thay đổi gì thêm

## Lưu ý quan trọng

### **Điều kiện để chuyển sang PENDING_APPROVAL:**
- **Trạng thái phải là:** `IN_PROGRESS`
- **Chi phí:** Phải có và > 0 VNĐ
- **Báo cáo:** Phải được gửi (`report_status` phải có giá trị)

### **Quyền duyệt:**
- Chỉ admin mới có thể duyệt task từ `PENDING_APPROVAL` sang `COMPLETED`
- Tài xế không thể tự chuyển sang `COMPLETED`

### **Audit Trail:**
- Tất cả các thay đổi trạng thái đều được ghi log
- Bao gồm thông tin về người thực hiện, thời gian, và trạng thái cũ/mới
