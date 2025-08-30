# 🚛 Driver Dashboard Export Status Update

## 🎯 Tổng quan

Tài liệu này mô tả thay đổi logic trong DriverDashboard frontend để khi tài xế click nút "Bắt đầu" trên export request, trạng thái sẽ chuyển từ `GATE_IN` → `FORKLIFTING`, trong khi import request vẫn giữ nguyên logic hiện tại.

## 🔄 Logic mới

### **Trước đây (Logic cũ)**
- **Tất cả requests**: Chỉ có thể chuyển từ `POSITIONED` → `FORKLIFTING`
- **Import requests**: `POSITIONED` → `FORKLIFTING` (giữ nguyên)
- **Export requests**: Không có logic chuyển trạng thái khi tài xế bắt đầu

### **Bây giờ (Logic mới)**
- **Import requests**: `POSITIONED` → `FORKLIFTING` (giữ nguyên logic cũ)
- **Export requests**: `GATE_IN` → `FORKLIFTING` (logic mới)
- **Các trường hợp khác**: Không thay đổi trạng thái

## 📍 Vị trí thay đổi

### **Frontend Component**
```typescript
// File: pages/DriverDashboard/index.tsx
// Component: DriverDashboard

// Nút "Bắt đầu" hiển thị khi:
{task.status === 'PENDING' && (
          <button
    onClick={() => handleStatusUpdate(task.id, 'IN_PROGRESS')}
    className="btn btn-primary btn-sm"
  >
    Bắt đầu
          </button>
        )}

// Hàm xử lý status update:
const handleStatusUpdate = async (taskId: string, newStatus: string) => {
  try {
    const response = await updateTaskStatus(taskId, newStatus);
    // Backend tự động xử lý logic phân biệt IMPORT/EXPORT
    // và cập nhật ServiceRequest status tương ứng
  } catch (error) {
    console.error('Error updating task status:', error);
  }
};
```

### **API Service**
```typescript
// File: services/driverDashboardService.ts
// Method: updateTaskStatus

export const updateTaskStatus = async (taskId: string, status: string, notes?: string) => {
  const response = await fetch(`/api/driver-dashboard/tasks/${taskId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ status, notes })
  });
  
  if (!response.ok) {
    throw new Error('Failed to update task status');
  }
  
  return response.json();
};
```

## 🚀 Quy trình hoạt động

### **1. Tài xế truy cập DriverDashboard**
- URL: `http://localhost:5002/DriverDashboard`
- Hiển thị danh sách tasks được giao

### **2. Hiển thị nút "Bắt đầu"**
- Chỉ hiển thị khi `task.status === 'PENDING'`
- Áp dụng cho cả IMPORT và EXPORT requests

### **3. Tài xế click "Bắt đầu"**
- Gọi `handleStatusUpdate(task.id, 'IN_PROGRESS')`
- Frontend gửi request đến backend API

### **4. Backend xử lý logic**
- `DriverDashboardService.updateTaskStatus()` được gọi
- Tự động phân biệt IMPORT vs EXPORT
- Cập nhật cả ForkliftTask và ServiceRequest

### **5. Kết quả hiển thị**
- **Export requests**: `GATE_IN` → `FORKLIFTING`
- **Import requests**: `POSITIONED` → `FORKLIFTING`
- UI cập nhật real-time

## 🎨 UI Components

### **Task Status Display**
```typescript
// Hiển thị trạng thái hiện tại
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'GATE_IN':
      return <span className="badge badge-warning">GATE_IN</span>;
    case 'FORKLIFTING':
      return <span className="badge badge-info">FORKLIFTING</span>;
    case 'POSITIONED':
      return <span className="badge badge-secondary">POSITIONED</span>;
    default:
      return <span className="badge badge-light">{status}</span>;
  }
};
```

### **Action Buttons**
```typescript
// Nút "Bắt đầu" chỉ hiển thị khi có thể thực hiện
const renderActionButtons = (task: ForkliftTask) => {
  if (task.status === 'PENDING') {
    return (
      <div className="btn-group">
        <button 
          onClick={() => handleStatusUpdate(task.id, 'IN_PROGRESS')}
          className="btn btn-primary btn-sm"
        >
          Bắt đầu
        </button>
      </div>
    );
  }
  
  return null;
};
```

## 📱 User Experience

### **Real-time Updates**
- Status thay đổi ngay lập tức sau khi click
- Không cần refresh trang
- Loading state hiển thị trong quá trình xử lý

### **Error Handling**
- Hiển thị thông báo lỗi nếu có
- Validation trước khi gửi request
- Graceful degradation nếu API fail

### **Responsive Design**
- Hoạt động tốt trên mobile và desktop
- Touch-friendly buttons
- Adaptive layout

## 🔧 Integration Points

### **Backend API**
- **Endpoint**: `PUT /api/driver-dashboard/tasks/:taskId/status`
- **Service**: `DriverDashboardService.updateTaskStatus()`
- **Database**: Transaction update cho cả ForkliftTask và ServiceRequest

### **State Management**
- Local state cho task status
- Optimistic updates cho UX tốt hơn
- Error state handling

### **Real-time Communication**
- WebSocket updates (nếu có)
- Polling cho status changes
- Event-driven updates

## 🧪 Testing

### **Frontend Test Cases**
1. **Export Request**: Click "Bắt đầu" → Status chuyển `GATE_IN` → `FORKLIFTING` ✅
2. **Import Request**: Click "Bắt đầu" → Status chuyển `POSITIONED` → `FORKLIFTING` ✅
3. **Invalid Status**: Nút "Bắt đầu" không hiển thị nếu status không phù hợp ✅
4. **Error Handling**: Hiển thị lỗi nếu API call thất bại ✅

### **Integration Testing**
- End-to-end test với backend
- API response validation
- Database state verification

## 📊 Monitoring & Debugging

### **Frontend Logs**
```typescript
// Debug logging
console.log('Task status update:', {
  taskId,
  oldStatus: task.status,
  newStatus: 'IN_PROGRESS',
  timestamp: new Date()
});
```

### **Performance Metrics**
- Response time của API calls
- UI render performance
- Memory usage

## 🔄 Future Enhancements

### **Planned Features**
- [ ] Real-time status updates via WebSocket
- [ ] Push notifications cho status changes
- [ ] Offline support với sync khi online
- [ ] Advanced filtering và sorting

### **UI Improvements**
- [ ] Dark mode support
- [ ] Customizable dashboard layout
- [ ] Drag & drop task reordering
- [ ] Advanced search functionality

## 📝 Ghi chú

- Logic mới chỉ áp dụng cho export requests
- Import requests vẫn giữ nguyên workflow hiện tại
- Frontend không cần thay đổi logic, chỉ cần gọi API
- Backend tự động xử lý phân biệt IMPORT/EXPORT

## 🔗 Liên quan

- **Backend**: `modules/driver-dashboard/service/DriverDashboardService.ts`
- **State Machine**: `modules/requests/service/RequestStateMachine.ts`
- **API Routes**: `modules/driver-dashboard/routes/`
- **Database Schema**: `ServiceRequest.status`, `ForkliftTask.status`

---

## 🆕 **TÍNH NĂNG MỚI ĐƯỢC THÊM**

### **1. Upload Báo Cáo (Report Upload)**
- **Chức năng**: Tài xế có thể upload ảnh báo cáo cho mỗi task
- **Giao diện**: Nút "Gửi tài liệu" với file picker
- **Validation**: Chỉ chấp nhận file ảnh (jpg, png, gif)
- **Storage**: Lưu file vào thư mục `uploads/reports/`

### **2. Quản Lý Chi Phí (Cost Management)**
- **Chức năng**: Tài xế có thể nhập và chỉnh sửa chi phí dịch vụ
- **Giao diện**: Input field với validation số nguyên không âm
- **Nút hành động**: "Thêm/Sửa", "Lưu", "Hủy"
- **Hiển thị**: Định dạng VNĐ với badge xanh lá

### **3. Cải Tiến Giao Diện**
- **Trường mới**: Thêm cột "Chi phí" và "Báo cáo" vào bảng
- **Badge system**: Màu sắc phân biệt rõ ràng cho từng trạng thái
- **Responsive design**: Hoạt động tốt trên mọi thiết bị
- **Interactive elements**: Nút "Xem ảnh" để mở ảnh báo cáo

## 🔧 **API ENDPOINTS MỚI**

### **1. Cập nhật chi phí**
```typescript
PATCH /driver-dashboard/tasks/:taskId/cost
Body: { cost: number }
Response: { success: boolean, message: string, data: ForkliftTask }
```

### **2. Upload ảnh báo cáo**
```typescript
POST /driver-dashboard/tasks/:taskId/report
Body: FormData (report_image: File)
Response: { success: boolean, message: string, data: ForkliftTask }
```

## 📁 **CẤU HÌNH FILE UPLOAD**

### **Backend Configuration**
```typescript
// main.ts
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Upload directory structure
uploads/
└── reports/
    ├── report_taskId_timestamp_filename.jpg
    └── report_taskId_timestamp_filename.png
```

### **Frontend URL Handling**
```typescript
// Logic xử lý URL ảnh
if (task.report_image.startsWith('http')) {
  imageUrl = task.report_image;
} else if (task.report_image.startsWith('/uploads/')) {
  imageUrl = `http://localhost:5002${task.report_image}`;
} else {
  const filename = task.report_image.split('/').pop();
  imageUrl = `http://localhost:5002/driver-dashboard/reports/${filename}`;
}
```

## 🎨 **GIAO DIỆN VÀ UX**

### **Màu sắc và Theme**
- **Chi phí**: Màu xanh lá (#059669) với background xanh nhạt
- **Báo cáo**: Màu cam (#92400e) với background vàng nhạt
- **Tài xế**: Màu xanh dương (#1e293b) với background xanh nhạt
- **Biển số**: Màu cam (#1e293b) với background vàng nhạt

### **Interactive Elements**
- **Nút "Xem ảnh"**: Mở ảnh trong tab mới
- **Hover effects**: Hiệu ứng khi di chuột qua
- **Loading states**: Trạng thái tải dữ liệu
- **Error feedback**: Hiển thị lỗi nếu upload thất bại

## 🧪 **TESTING TÍNH NĂNG MỚI**

### **Upload Testing**
1. **File validation**: Chỉ chấp nhận file ảnh hợp lệ ✅
2. **File size**: Kiểm tra giới hạn kích thước file ✅
3. **Upload success**: File được lưu và hiển thị đúng ✅
4. **Error handling**: Hiển thị lỗi nếu upload thất bại ✅

### **Cost Management Testing**
1. **Input validation**: Chỉ chấp nhận số nguyên không âm ✅
2. **Save functionality**: Chi phí được lưu vào database ✅
3. **Edit functionality**: Có thể chỉnh sửa chi phí đã nhập ✅
4. **Display format**: Hiển thị đúng định dạng VNĐ ✅

## 📊 **MONITORING & DEBUGGING**

### **Upload Logs**
```typescript
// Debug logging cho upload
console.log('=== UPLOAD DEBUG INFO ===');
console.log('File info:', {
  originalname: file.originalname,
  mimetype: file.mimetype,
  size: file.size,
  hasBuffer: !!file.buffer,
  hasPath: !!file.path
});
console.log('Upload directory path:', fixedUploadDir);
```

### **Performance Metrics**
- File upload success rate
- Upload processing time
- Storage usage
- Error rate analysis

## 🔄 **WORKFLOW HOÀN CHỈNH**

### **Export Request với Báo Cáo**
```
1. FORWARDED → GATE_IN (Gate approve)
2. GATE_IN → FORKLIFTING (Driver click "Bắt đầu") ← MỚI
3. FORKLIFTING → IN_YARD (Forklift approval)
4. Upload báo cáo + Nhập chi phí
5. Hoàn thành task
```

### **Import Request với Báo Cáo**
```
1. CHECKED → POSITIONED (Yard confirm)
2. POSITIONED → FORKLIFTING (Driver click "Bắt đầu")
3. FORKLIFTING → IN_YARD (Forklift approval)
4. Upload báo cáo + Nhập chi phí
5. Hoàn thành task
```

---

*Tài liệu được cập nhật lần cuối: $(date)*  
*Version: 2.0.0*
