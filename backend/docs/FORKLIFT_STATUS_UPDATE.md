# Cập nhật Trạng thái Forklift - Workflow Gán Tài xế Mới

## Tổng quan
Đã cập nhật workflow gán tài xế và thêm trạng thái mới `ASSIGNED` (Xe nâng đã nhận) vào hệ thống quản lý xe nâng để cải thiện quy trình làm việc.

## Thay đổi đã thực hiện

### 1. Database Schema (prisma/schema.prisma)
```prisma
model ForkliftTask {
    // ... existing fields ...
    status         String   // PENDING | ASSIGNED | IN_PROGRESS | COMPLETED | CANCELLED
    cost           Float?   @default(0)  // Chi phí dịch vụ xe nâng
    report_status  String?  // Trạng thái báo cáo: PENDING, SUBMITTED, APPROVED, REJECTED
    report_image   String?  // Đường dẫn file ảnh báo cáo
    // ... existing fields ...
}
```

**Thay đổi:** 
- Thêm trạng thái `ASSIGNED` vào comment mô tả
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
        const isReassignment = job.assigned_driver_id && job.assigned_driver_id !== driverId;

        // Cập nhật job với tài xế mới
        const updatedJob = await prisma.forkliftTask.update({
            where: { id: jobId },
            data: {
                assigned_driver_id: driverId,
                // Trạng thái vẫn giữ nguyên PENDING
                status: 'PENDING'
            }
        });

        // Thông báo cho tài xế mới
        io.emit('FORKLIFT_ASSIGNMENT', {
            driverId,
            jobId,
            containerNo: job.container_no,
            is_reassignment: isReassignment
        });

        // Nếu là gán lại, thông báo cho tài xế cũ
        if (isReassignment && job.assigned_driver_id) {
            io.emit('FORKLIFT_REASSIGNMENT', {
                driverId: job.assigned_driver_id,
                jobId,
                containerNo: job.container_no
            });
        }

        return res.json({
            success: true,
            message: 'Driver assigned successfully',
            data: updatedJob
        });

    } catch (error) {
        console.error('Error assigning driver:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
```

**Thay đổi chính:**
- **Trạng thái không thay đổi:** Job vẫn giữ trạng thái `PENDING` sau khi gán tài xế
- **Cho phép gán lại:** Có thể gán lại tài xế khác cho job PENDING đã có tài xế
- **Thông báo WebSocket:** Gửi thông báo cho cả tài xế mới và tài xế cũ (nếu có)

#### b) Hàm `startJob` - Chuyển từ PENDING sang ASSIGNED
```typescript
async startJob(req: AuthRequest, res: Response) {
    try {
        const { jobId } = req.params;
        
        const job = await prisma.forkliftTask.findUnique({
            where: { id: jobId }
        });

        if (!job) {
            return res.status(404).json({ message: 'Forklift job not found' });
        }

        // Chỉ cho phép bắt đầu job đã gán tài xế và ở trạng thái PENDING
        if (!job.assigned_driver_id || job.status !== 'PENDING') {
            return res.status(400).json({ 
                message: 'Job cannot be started. Only pending jobs with assigned drivers can be started.' 
            });
        }

        // Chuyển trạng thái từ PENDING sang ASSIGNED
        const updatedJob = await prisma.forkliftTask.update({
            where: { id: jobId },
            data: { status: 'ASSIGNED' }
        });

        return res.json({
            success: true,
            message: 'Job started successfully',
            data: updatedJob
        });

    } catch (error) {
        console.error('Error starting job:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
```

**Thay đổi chính:**
- **Điều kiện mới:** Chỉ cho phép bắt đầu job có `assigned_driver_id` và trạng thái `PENDING`
- **Trạng thái mới:** Chuyển từ `PENDING` sang `ASSIGNED` (không phải `IN_PROGRESS`)

#### c) Hàm `beginWork` - Chuyển từ ASSIGNED sang IN_PROGRESS
```typescript
async beginWork(req: AuthRequest, res: Response) {
    try {
        const { jobId } = req.params;
        
        const job = await prisma.forkliftTask.findUnique({
            where: { id: jobId }
        });

        if (!job) {
            return res.status(404).json({ message: 'Forklift job not found' });
        }

        // Chỉ cho phép bắt đầu làm việc từ trạng thái ASSIGNED
        if (job.status !== 'ASSIGNED') {
            return res.status(400).json({ 
                message: 'Job cannot begin work. Only assigned jobs can begin work.' 
            });
        }

        // Chuyển trạng thái từ ASSIGNED sang IN_PROGRESS
        const updatedJob = await prisma.forkliftTask.update({
            where: { id: jobId },
            data: { status: 'IN_PROGRESS' }
        });

        return res.json({
            success: true,
            message: 'Job work started successfully',
            data: updatedJob
        });

    } catch (error) {
        console.error('Error beginning work:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
```

**Thay đổi chính:**
- **Hàm mới:** Xử lý chuyển từ `ASSIGNED` sang `IN_PROGRESS`
- **Điều kiện:** Chỉ cho phép từ trạng thái `ASSIGNED`

#### d) Hàm `updateReport` - Cập nhật Báo cáo
```typescript
async updateReport(req: AuthRequest, res: Response) {
    try {
        const { jobId } = req.params;
        const { report_status, report_image } = req.body;

        // Validate report_status
        const validStatuses = ['PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED'];
        if (report_status && !validStatuses.includes(report_status)) {
            return res.status(400).json({
                message: `Invalid report status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const job = await prisma.forkliftTask.findUnique({
            where: { id: jobId }
        });

        if (!job) {
            return res.status(404).json({ message: 'Forklift job not found' });
        }

        const updatedJob = await prisma.forkliftTask.update({
            where: { id: jobId },
            data: {
                report_status: report_status || undefined,
                report_image: report_image || undefined
            }
        });

        // Audit logging
        await audit(req.user!._id, 'FORKLIFT_REPORT_UPDATED', 'FORKLIFT_TASK', jobId, {
            report_status,
            report_image,
            previous_status: job.report_status,
            previous_image: job.report_image
        });

        return res.json({
            success: true,
            message: 'Report updated successfully',
            data: updatedJob
        });

    } catch (error) {
        console.error('Error updating report:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
```

**Thay đổi chính:**
- **Hàm mới:** Xử lý cập nhật trạng thái báo cáo và ảnh
- **Validation:** Kiểm tra trạng thái báo cáo hợp lệ
- **Audit logging:** Ghi log thay đổi

### 3. Backend Routes (modules/forklift/controller/ForkliftRoutes.ts)
```typescript
// Gán tài xế (giữ nguyên trạng thái PENDING)
router.patch('/jobs/:jobId/assign-driver', (req, res) => controller.assignDriver(req as any, res));

// Bắt đầu job (chuyển từ PENDING sang ASSIGNED)
router.patch('/jobs/:jobId/start', (req, res) => controller.startJob(req as any, res));

// Bắt đầu làm việc (chuyển từ ASSIGNED sang IN_PROGRESS)
router.patch('/jobs/:jobId/begin-work', (req, res) => controller.beginWork(req as any, res));

// Cập nhật báo cáo
router.patch('/jobs/:jobId/report', (req, res) => controller.updateReport(req as any, res));

// Hoàn thành job
router.patch('/jobs/:jobId/complete', (req, res) => controller.completeJob(req as any, res));

// Hủy job
router.patch('/jobs/:jobId/cancel', (req, res) => controller.cancelJob(req as any, res));
```

### 4. Service Layer (modules/forklift/service/ForkliftService.ts)
- Cập nhật validation để chấp nhận trạng thái `ASSIGNED`

### 5. Frontend (pages/Forklift/index.tsx)

#### a) Interface
```typescript
interface ForkliftTask {
  // ... existing fields ...
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  cost?: number; // Chi phí dịch vụ xe nâng
  // report_status và report_image đã bị xóa khỏi Forklift page
  // ... existing fields ...
}
```

#### b) Hiển thị trạng thái
- **PENDING:** "Chờ xử lý" (màu vàng)
- **ASSIGNED:** "Xe nâng đã nhận" (màu cam)
- **IN_PROGRESS:** "Đang thực hiện" (màu xanh dương)
- **COMPLETED:** "Hoàn thành" (màu xanh lá)
- **CANCELLED:** "Đã hủy" (màu đỏ)

#### c) Logic nút hành động
- **PENDING + không có tài xế:** "Hủy", "Gán tài xế", "Chỉnh sửa chi phí"
- **PENDING + có tài xế:** "🔄 Gán lại tài xế", "Chỉnh sửa chi phí"
- **ASSIGNED:** "Bắt đầu làm việc", "Chỉnh sửa chi phí"
- **IN_PROGRESS:** "Hoàn thành", "Chỉnh sửa chi phí"
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
PENDING → ASSIGNED → IN_PROGRESS → COMPLETED
    ↓         ↓
CANCELLED  CANCELLED
```

### **Chi tiết workflow mới:**

1. **PENDING** (Chờ xử lý)
   - Job mới được tạo
   - Có thể gán tài xế
   - Có thể hủy

2. **PENDING + assigned_driver_id** (Đã gán tài xế, chưa bắt đầu)
   - Đã có tài xế nhưng trạng thái vẫn PENDING
   - Tài xế thấy nút "Bắt đầu" ở DriverDashboard
   - **Có thể gán lại tài xế khác** (tự động xóa khỏi tài xế cũ)
   - Không thể hủy

3. **ASSIGNED** (Xe nâng đã nhận)
   - Tài xế đã bấm "Bắt đầu" từ DriverDashboard
   - Tài xế thấy nút "Bắt đầu làm việc"
   - Không thể thay đổi gì

4. **IN_PROGRESS** (Đang thực hiện)
   - Tài xế đã bấm "Bắt đầu làm việc"
   - Có thể hoàn thành

## Lợi ích của thay đổi

1. **Tracking tốt hơn:** Biết được xe nâng đã được gán nhưng chưa bắt đầu
2. **Workflow rõ ràng:** Mỗi bước có trạng thái riêng biệt
3. **Quản lý hiệu quả:** Có thể theo dõi thời gian từ khi gán đến khi bắt đầu
4. **Báo cáo chi tiết:** Thống kê được số lượng job ở mỗi giai đoạn
5. **Linh hoạt hơn:** Có thể gán lại tài xế cho job PENDING
6. **Thông báo real-time:** WebSocket notifications cho tài xế

## Cần thực hiện thêm

### 1. Database Migration
```bash
cd manageContainer/backend
npx prisma migrate dev --name add_report_fields_to_forklift
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Restart Backend
```bash
npm run dev
```

## Kiểm tra

1. Tạo job xe nâng mới → Trạng thái: `PENDING`
2. Gán tài xế → Trạng thái: `PENDING` (không đổi)
3. Tài xế bấm "Bắt đầu" → Trạng thái: `ASSIGNED`
4. Tài xế bấm "Bắt đầu làm việc" → Trạng thái: `IN_PROGRESS`
5. Hoàn thành → Trạng thái: `COMPLETED`

## Lưu ý

- Job ở trạng thái `PENDING` **CÓ THỂ** được gán lại tài xế khác
- Job ở trạng thái `ASSIGNED` **KHÔNG THỂ** được gán lại tài xế khác
- Job ở trạng thái `ASSIGNED` **KHÔNG THỂ** bị hủy
- Job ở trạng thái `IN_PROGRESS` không thể hủy
- Chỉ job ở trạng thái `PENDING` mới có thể hủy
- Trường "Báo cáo" đã bị xóa khỏi Forklift page (chỉ giữ ở DriverDashboard)

## Tính năng mới được thêm

### 1. Trường Chi phí (Cost)
- **Mô tả:** Trường số nguyên không âm để lưu chi phí dịch vụ xe nâng
- **Kiểu dữ liệu:** Float (mặc định 0)
- **Cập nhật:** Tài xế có thể nhập và chỉnh sửa trực tiếp trên DriverDashboard
- **API:** `PATCH /driver-dashboard/tasks/:taskId/cost`

### 2. Trường Báo cáo (Report)
- **Trạng thái báo cáo:** PENDING, SUBMITTED, APPROVED, REJECTED
- **Ảnh báo cáo:** Upload và lưu trữ file ảnh
- **Chức năng:** Tài xế upload ảnh báo cáo, admin xem và phê duyệt
- **API:** `POST /driver-dashboard/tasks/:taskId/report`

### 3. Upload ảnh báo cáo
- **Middleware:** Sử dụng Multer để xử lý file upload
- **Lưu trữ:** File được lưu trong `uploads/reports/`
- **Static serving:** Ảnh có thể truy cập trực tiếp qua `/uploads/reports/`
- **Route backup:** Route `/driver-dashboard/reports/:filename` để serve ảnh
- **Cấu hình:** Giới hạn file size 5MB, chỉ chấp nhận file ảnh

### 4. Static File Serving
- **Cấu hình:** `app.use('/uploads', express.static(path.join(__dirname, 'uploads')))`
- **Mục đích:** Cho phép truy cập trực tiếp vào thư mục uploads
- **URL:** `http://localhost:5002/uploads/reports/filename.png`

### 5. Audit Logging
- **TASK_COST_UPDATED:** Log khi cập nhật chi phí
- **TASK_REPORT_UPLOADED:** Log khi upload ảnh báo cáo
- **Meta data:** Lưu thông tin chi tiết về thay đổi
