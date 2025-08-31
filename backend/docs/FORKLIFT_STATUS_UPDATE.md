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
                message: 'Job đã được gán cho tài xế khác. Không thể gán lại.' 
            });
        }

        // Cập nhật trạng thái sang ASSIGNED
        const updatedJob = await prisma.forkliftTask.update({
            where: { id: jobId },
            data: { 
                assigned_driver_id: driverId,
                status: 'ASSIGNED',
                updatedAt: new Date()
            }
        });

        // Ghi log audit
        await audit(req.user!._id, 'FORKLIFT_DRIVER_ASSIGNED', 'FORKLIFT_TASK', jobId, { 
            driver_id: driverId,
            previous_status: job.status,
            new_status: 'ASSIGNED'
        });

        return res.json({
            success: true,
            message: 'Tài xế đã được gán thành công',
            data: updatedJob
        });

    } catch (error) {
        console.error('Error assigning driver:', error);
        return res.status(500).json({ message: 'Internal server error' });
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
            data: { 
                status: 'IN_PROGRESS',
                updatedAt: new Date()
            }
        });

        // Ghi log audit
        await audit(req.user!._id, 'FORKLIFT_JOB_STARTED', 'FORKLIFT_TASK', jobId, { 
            previous_status: job.status,
            new_status: 'IN_PROGRESS'
        });

        return res.json({
            success: true,
            message: 'Công việc đã được bắt đầu',
            data: updatedJob
        });

    } catch (error) {
        console.error('Error starting job:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
```

**Endpoint**: `PATCH /forklift/jobs/:jobId/start`
**Status Allowed**: `ASSIGNED` → `IN_PROGRESS`

#### c) Hàm `completeJob` - Logic Hoàn thành Công việc
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
            success: true,
            message: 'Công việc đã hoàn thành và chờ duyệt',
            data: updatedJob
        });

    } catch (error) {
        console.error('Error completing job:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
```

**Endpoint**: `PATCH /forklift/jobs/:jobId/complete`
**Status Allowed**: `IN_PROGRESS` → `PENDING_APPROVAL`

#### d) Hàm `approveJob` - Logic Duyệt Công việc (MỚI)
```typescript
async approveJob(req: AuthRequest, res: Response) {
    try {
        const { jobId } = req.params;

        const job = await prisma.forkliftTask.findUnique({
            where: { id: jobId }
        });

        if (!job) {
            return res.status(404).json({ message: 'Forklift job not found' });
        }

        // Kiểm tra trạng thái hiện tại
        if (job.status !== 'PENDING_APPROVAL') {
            return res.status(400).json({ 
                message: 'Chỉ có thể duyệt công việc ở trạng thái CHỜ DUYỆT' 
            });
        }

        // Kiểm tra chi phí và báo cáo đã được nhập
        if (!job.cost || job.cost <= 0) {
            return res.status(400).json({ 
                message: 'Không thể duyệt: Chi phí chưa được nhập hoặc không hợp lệ' 
            });
        }

        if (!job.report_status) {
            return res.status(400).json({ 
                message: 'Không thể duyệt: Báo cáo chưa được gửi' 
            });
        }

        // Thực hiện transaction để cập nhật cả forklift task và service request
        const updatedJob = await prisma.$transaction(async (tx) => {
            // Cập nhật trạng thái forklift task sang COMPLETED
            const updatedForkliftTask = await tx.forkliftTask.update({
                where: { id: jobId },
                data: { 
                    status: 'COMPLETED',
                    updatedAt: new Date()
                }
            });

            // Cập nhật ServiceRequest từ FORKLIFTING sang trạng thái mới
            if (job.container_no) {
                const latestRequest = await tx.serviceRequest.findFirst({
                    where: { container_no: job.container_no },
                    orderBy: { createdAt: 'desc' }
                });

                if (latestRequest && latestRequest.status === 'FORKLIFTING') {
                    // Logic mới: Phân biệt giữa IMPORT và EXPORT
                    let newStatus: string;
                    if (latestRequest.type === 'EXPORT') {
                        // Export request: FORKLIFTING → IN_CAR
                        newStatus = 'IN_CAR';
                    } else {
                        // Import request: FORKLIFTING → IN_YARD (giữ nguyên logic cũ)
                        newStatus = 'IN_YARD';
                    }

                    await tx.serviceRequest.update({
                        where: { id: latestRequest.id },
                        data: { 
                            status: newStatus,
                            updatedAt: new Date()
                        }
                    });
                }
            }

            return updatedForkliftTask;
        });

        // Ghi log audit
        await audit(req.user!._id, 'FORKLIFT_JOB_APPROVED', 'FORKLIFT_TASK', jobId, { 
            previous_status: job.status,
            new_status: 'COMPLETED',
            approved_at: new Date()
        });

        return res.json({
            success: true,
            message: 'Công việc đã được duyệt thành công',
            data: updatedJob
        });

    } catch (error) {
        console.error('Error approving job:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
```

**Endpoint**: `PATCH /forklift/jobs/:jobId/approve`
**Status Allowed**: `PENDING_APPROVAL` → `COMPLETED`
**Logic mới**: Phân biệt IMPORT/EXPORT khi cập nhật ServiceRequest status

### 3. Frontend Components (frontend/pages/Forklift/)

#### a) Hiển thị trạng thái mới
- **PENDING**: "Chờ xử lý" (badge-yellow)
- **ASSIGNED**: "Xe nâng đã nhận" (badge-orange) 
- **IN_PROGRESS**: "Đang thực hiện" (badge-blue)
- **PENDING_APPROVAL**: "Chờ duyệt" (badge-orange)
- **COMPLETED**: "Hoàn thành" (badge-green)
- **CANCELLED**: "Đã hủy" (badge-red)

#### b) Hiển thị thông tin
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

### **Logic mới khi approve (Phân biệt IMPORT/EXPORT):**
- **IMPORT requests**: `FORKLIFTING` → `IN_YARD` (giữ nguyên logic cũ)
- **EXPORT requests**: `FORKLIFTING` → `IN_CAR` (logic mới)

### **Ẩn container IN_CAR:**
- Container có trạng thái `IN_CAR` sẽ tự động ẩn khỏi:
  - `http://localhost:5002/Yard` - Không hiển thị trong bản đồ bãi
  - `http://localhost:5002/ContainersPage` - Không hiển thị trong danh sách container

## API Endpoints

| Method | Endpoint | Description | Status Allowed |
|--------|----------|-------------|----------------|
| `PATCH` | `/forklift/jobs/:jobId/assign-driver` | Gán tài xế | `PENDING` → `ASSIGNED` |
| `PATCH` | `/forklift/jobs/:jobId/start` | Bắt đầu công việc | `ASSIGNED` → `IN_PROGRESS` |
| `PATCH` | `/forklift/jobs/:jobId/complete` | Hoàn thành công việc | `IN_PROGRESS` → `PENDING_APPROVAL` |
| `PATCH` | `/forklift/jobs/:jobId/approve` | Duyệt công việc | `PENDING_APPROVAL` → `COMPLETED` |
| `PATCH` | `/forklift/jobs/:jobId/cancel` | Hủy công việc | `PENDING`, `ASSIGNED` → `CANCELLED` |

## Files đã cập nhật

### Backend:
- `modules/forklift/controller/ForkliftController.ts` - Logic approve job mới
- `modules/requests/service/RequestStateMachine.ts` - Thêm trạng thái IN_CAR
- `modules/yard/service/YardService.ts` - Lọc bỏ container IN_CAR

### Frontend:
- `pages/Forklift/index.tsx` - Hiển thị trạng thái mới
- `pages/ContainersPage/index.tsx` - Ẩn container IN_CAR
- `components/RequestTable.tsx` - Hiển thị trạng thái IN_CAR
- `components/DepotRequestTable.tsx` - Hiển thị trạng thái IN_CAR
- `components/SimpleChatBox.tsx` - Hiển thị trạng thái IN_CAR
