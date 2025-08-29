# Demo Forklift Workflow - Workflow Gán Tài xế Mới

## Tổng quan
Tài liệu này mô tả workflow hoàn chỉnh của hệ thống quản lý xe nâng với logic gán tài xế mới và trạng thái `ASSIGNED`.

## Workflow Hoàn Chỉnh

### **1. Tạo Job Mới**
```
Trạng thái: PENDING
Tài xế: Chưa có
Hành động có thể: Gán tài xế, Hủy, Chỉnh sửa chi phí
```

**Mô tả:** Job xe nâng mới được tạo, chưa có tài xế nào được gán.

### **2. Gán Tài xế**
```
Trạng thái: PENDING (không đổi)
Tài xế: Đã gán
Hành động có thể: 🔄 Gán lại tài xế, Chỉnh sửa chi phí
```

**Mô tả:** 
- Admin gán tài xế cho job
- Trạng thái vẫn giữ nguyên `PENDING`
- Job xuất hiện trong DriverDashboard của tài xế
- Tài xế thấy nút "Bắt đầu"

**Logic Backend:**
```typescript
// ForkliftController.assignDriver()
const updatedJob = await prisma.forkliftTask.update({
    where: { id: jobId },
    data: {
        assigned_driver_id: driverId,
        status: 'PENDING' // Giữ nguyên trạng thái
    }
});

// Thông báo WebSocket cho tài xế mới
io.emit('FORKLIFT_ASSIGNMENT', {
    driverId,
    jobId,
    containerNo: job.container_no,
    is_reassignment: false
});
```

### **3. Tài xế Bấm "Bắt đầu"**
```
Trạng thái: ASSIGNED
Tài xế: Đã gán
Hành động có thể: Bắt đầu làm việc, Chỉnh sửa chi phí
```

**Mô tả:**
- Tài xế bấm nút "Bắt đầu" ở DriverDashboard
- Trạng thái chuyển từ `PENDING` sang `ASSIGNED`
- Tài xế thấy nút "Bắt đầu làm việc"

**Logic Backend:**
```typescript
// ForkliftController.startJob()
if (!job.assigned_driver_id || job.status !== 'PENDING') {
    return res.status(400).json({ 
        message: 'Job cannot be started. Only pending jobs with assigned drivers can be started.' 
    });
}

const updatedJob = await prisma.forkliftTask.update({
    where: { id: jobId },
    data: { status: 'ASSIGNED' }
});
```

### **4. Tài xế Bấm "Bắt đầu làm việc"**
```
Trạng thái: IN_PROGRESS
Tài xế: Đã gán
Hành động có thể: Hoàn thành, Chỉnh sửa chi phí
```

**Mô tả:**
- Tài xế bấm nút "Bắt đầu làm việc"
- Trạng thái chuyển từ `ASSIGNED` sang `IN_PROGRESS`
- Tài xế bắt đầu thực hiện công việc thực tế

**Logic Backend:**
```typescript
// ForkliftController.beginWork()
if (job.status !== 'ASSIGNED') {
    return res.status(400).json({ 
        message: 'Job cannot begin work. Only assigned jobs can begin work.' 
    });
}

const updatedJob = await prisma.forkliftTask.update({
    where: { id: jobId },
    data: { status: 'IN_PROGRESS' }
});
```

### **5. Hoàn thành Job**
```
Trạng thái: COMPLETED
Tài xế: Đã gán
Hành động có thể: Không có
```

**Mô tả:**
- Tài xế bấm nút "Hoàn thành"
- Trạng thái chuyển từ `IN_PROGRESS` sang `COMPLETED`
- Job kết thúc

**Logic Backend:**
```typescript
// ForkliftController.completeJob()
if (!['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(job.status)) {
    return res.status(400).json({ 
        message: 'Job cannot be completed from current status.' 
    });
}

const updatedJob = await prisma.forkliftTask.update({
    where: { id: jobId },
    data: { status: 'COMPLETED' }
});
```

## Tính Năng Đặc Biệt

### **1. Gán Lại Tài xế**
```
Trường hợp: Job PENDING đã có tài xế
Hành động: Gán tài xế khác
Kết quả: Tài xế cũ không còn thấy job, tài xế mới thấy job
```

**Logic Backend:**
```typescript
// Kiểm tra có phải gán lại không
const isReassignment = job.assigned_driver_id && job.assigned_driver_id !== driverId;

// Cập nhật tài xế mới
const updatedJob = await prisma.forkliftTask.update({
    where: { id: jobId },
    data: { assigned_driver_id: driverId }
});

// Thông báo cho tài xế mới
io.emit('FORKLIFT_ASSIGNMENT', {
    driverId,
    jobId,
    containerNo: job.container_no,
    is_reassignment: true
});

// Thông báo cho tài xế cũ (để xóa job khỏi view)
if (isReassignment && job.assigned_driver_id) {
    io.emit('FORKLIFT_REASSIGNMENT', {
        driverId: job.assigned_driver_id,
        jobId,
        containerNo: job.container_no
    });
}
```

### **2. WebSocket Notifications**
```
Event: FORKLIFT_ASSIGNMENT
- Gửi cho tài xế mới được gán
- Chứa thông tin job và container
- Flag is_reassignment để biết có phải gán lại không

Event: FORKLIFT_REASSIGNMENT  
- Gửi cho tài xế cũ bị thay thế
- Để tài xế cũ xóa job khỏi view
```

### **3. Validation Rules**
```
PENDING:
- Có thể gán tài xế
- Có thể gán lại tài xế khác
- Có thể hủy
- Có thể chỉnh sửa chi phí

ASSIGNED:
- Không thể gán lại tài xế
- Không thể hủy
- Có thể chỉnh sửa chi phí
- Có thể bắt đầu làm việc

IN_PROGRESS:
- Không thể gán lại tài xế
- Không thể hủy
- Có thể chỉnh sửa chi phí
- Có thể hoàn thành

COMPLETED:
- Không thể thay đổi gì

CANCELLED:
- Không thể thay đổi gì
```

## API Endpoints

### **1. Gán Tài xế**
```
PATCH /api/forklift/jobs/:jobId/assign-driver
Body: { driverId: string }
Response: { success: boolean, message: string, data: ForkliftTask }
```

### **2. Bắt đầu Job**
```
PATCH /api/forklift/jobs/:jobId/start
Response: { success: boolean, message: string, data: ForkliftTask }
```

### **3. Bắt đầu Làm việc**
```
PATCH /api/forklift/jobs/:jobId/begin-work
Response: { success: boolean, message: string, data: ForkliftTask }
```

### **4. Cập nhật Báo cáo**
```
PATCH /api/forklift/jobs/:jobId/report
Body: { report_status?: string, report_image?: string }
Response: { success: boolean, message: string, data: ForkliftTask }
```

### **5. Hoàn thành Job**
```
PATCH /api/forklift/jobs/:jobId/complete
Response: { success: boolean, message: string, data: ForkliftTask }
```

### **6. Hủy Job**
```
PATCH /api/forklift/jobs/:jobId/cancel
Body: { cancel_reason: string }
Response: { success: boolean, message: string, data: ForkliftTask }
```

## Frontend Logic

### **1. Forklift Page (Admin)**
```typescript
// Logic hiển thị nút hành động
if (task.status === 'PENDING' && !task.assigned_driver_id) {
    // Hiển thị: Hủy, Gán tài xế, Chỉnh sửa chi phí
} else if (task.status === 'PENDING' && task.assigned_driver_id) {
    // Hiển thị: 🔄 Gán lại tài xế, Chỉnh sửa chi phí
} else if (task.status === 'ASSIGNED') {
    // Hiển thị: Bắt đầu làm việc, Chỉnh sửa chi phí
} else if (task.status === 'IN_PROGRESS') {
    // Hiển thị: Hoàn thành, Chỉnh sửa chi phí
}
```

### **2. DriverDashboard Page (Tài xế)**
```typescript
// Logic hiển thị nút hành động
if (task.status === 'PENDING') {
    // Hiển thị: Bắt đầu
} else if (task.status === 'ASSIGNED') {
    // Hiển thị: Bắt đầu làm việc
} else if (task.status === 'IN_PROGRESS') {
    // Hiển thị: Hoàn thành
}
```

## Lợi Ích Của Workflow Mới

### **1. Tracking Chi Tiết**
- Biết được job đã gán tài xế nhưng chưa bắt đầu
- Theo dõi được thời gian từ khi gán đến khi bắt đầu
- Phân biệt rõ ràng các giai đoạn của job

### **2. Quản Lý Linh Hoạt**
- Có thể gán lại tài xế cho job PENDING
- Tài xế cũ tự động không còn thấy job
- Không bị mất dữ liệu khi thay đổi tài xế

### **3. Workflow Rõ Ràng**
- Mỗi bước có trạng thái riêng biệt
- Validation chặt chẽ cho từng trạng thái
- Hành động phù hợp với từng giai đoạn

### **4. Thông Báo Real-time**
- WebSocket notifications cho tài xế
- Cập nhật ngay lập tức khi có thay đổi
- Trải nghiệm người dùng tốt hơn

## Kiểm Tra và Test

### **1. Test Case 1: Gán Tài xế Mới**
```
1. Tạo job mới → PENDING
2. Gán tài xế A → PENDING (vẫn giữ nguyên)
3. Kiểm tra tài xế A thấy job trong DriverDashboard
4. Kiểm tra nút "Bắt đầu" hiển thị
```

### **2. Test Case 2: Gán Lại Tài xế**
```
1. Job PENDING đã có tài xế A
2. Gán lại tài xế B
3. Kiểm tra tài xế A không còn thấy job
4. Kiểm tra tài xế B thấy job
5. Kiểm tra trạng thái vẫn PENDING
```

### **3. Test Case 3: Workflow Hoàn Chỉnh**
```
1. Tạo job → PENDING
2. Gán tài xế → PENDING
3. Tài xế bấm "Bắt đầu" → ASSIGNED
4. Tài xế bấm "Bắt đầu làm việc" → IN_PROGRESS
5. Tài xế bấm "Hoàn thành" → COMPLETED
```

### **4. Test Case 4: Validation Rules**
```
1. Thử gán tài xế cho job ASSIGNED → Lỗi
2. Thử bắt đầu job PENDING không có tài xế → Lỗi
3. Thử bắt đầu làm việc từ PENDING → Lỗi
4. Thử hoàn thành từ ASSIGNED → Thành công
```

## Kết Luận

Workflow mới này cung cấp:
- **Tracking chi tiết** hơn cho quá trình gán tài xế
- **Quản lý linh hoạt** với khả năng gán lại tài xế
- **Validation chặt chẽ** cho từng trạng thái
- **Thông báo real-time** qua WebSocket
- **Trải nghiệm người dùng** tốt hơn cho cả admin và tài xế

Workflow này đảm bảo tính nhất quán và dễ quản lý cho hệ thống xe nâng.

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
