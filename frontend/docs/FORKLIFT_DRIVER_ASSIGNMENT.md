# Hệ thống Gán Tài Xế Xe Nâng

## Tổng quan

Hệ thống cho phép quản lý viên gán tài xế cho các công việc xe nâng và gửi thông báo real-time đến tài xế được chọn.

## Tính năng chính

### 1. Gán Tài Xế
- **Quyền truy cập**: SaleAdmin, SystemAdmin, YardManager
- **Chức năng**: Chọn tài xế từ danh sách có sẵn để gán cho công việc xe nâng
- **Thông tin hiển thị**: Container, vị trí nguồn, vị trí đích, trạng thái

### 2. Thông Báo Real-time
- **Đối tượng**: Tài xế (Driver)
- **Phương thức**: WebSocket + Browser Notification
- **Nội dung**: Chi tiết công việc được gán

### 3. Quản Lý Trạng Thái
- **PENDING**: Chờ xử lý
- **IN_PROGRESS**: Đang thực hiện  
- **COMPLETED**: Hoàn thành
- **CANCELLED**: Đã hủy

## API Endpoints

### Backend Routes
```
GET    /forklift/jobs                    # Lấy danh sách công việc
PATCH  /forklift/jobs/:jobId/assign-driver  # Gán tài xế
PATCH  /forklift/jobs/:jobId/start       # Bắt đầu công việc
PATCH  /forklift/jobs/:jobId/complete    # Hoàn thành công việc
PATCH  /forklift/jobs/:jobId/cancel      # Hủy công việc
```

### Frontend Components
```
/components/Forklift/AssignDriverModal.tsx  # Modal chọn tài xế
/components/DriverNotification.tsx          # Component thông báo
/pages/Forklift/index.tsx                   # Trang quản lý xe nâng
```

## Luồng hoạt động

### 1. Gán Tài Xế
```
Quản lý viên → Chọn công việc → Nhấn "Gán tài xế" → Chọn tài xế → Xác nhận
```

### 2. Thông Báo
```
Backend → WebSocket → Driver → Browser Notification + UI Notification
```

### 3. Cập Nhật Trạng Thái
```
Quản lý viên → Chọn hành động → Backend cập nhật → Frontend refresh
```

## Cấu hình

### Backend
- **Database**: Sử dụng model `ForkliftTask` với field `assigned_driver_id`
- **WebSocket**: Tích hợp với hệ thống chat hiện có
- **Audit**: Ghi log tất cả thao tác gán tài xế

### Frontend
- **Real-time**: Socket.io client kết nối đến `/chat`
- **Notifications**: Browser API + Custom UI
- **Permissions**: Kiểm tra role Driver để hiển thị thông báo

## Sử dụng

### Cho Quản Lý Viên
1. Truy cập trang "Quản lý Xe nâng"
2. Chọn công việc cần gán tài xế
3. Nhấn nút "Gán tài xế"
4. Chọn tài xế từ danh sách
5. Xác nhận gán

### Cho Tài Xế
1. Đăng nhập với role Driver
2. Cho phép thông báo trình duyệt
3. Nhận thông báo khi được gán công việc
4. Xem chi tiết container và vị trí

## Bảo mật

- **Authentication**: JWT token required
- **Authorization**: Role-based access control
- **Audit**: Log tất cả thao tác quan trọng
- **Validation**: Kiểm tra dữ liệu đầu vào

## Troubleshooting

### Thông báo không hiển thị
1. Kiểm tra kết nối WebSocket
2. Xác nhận quyền thông báo trình duyệt
3. Kiểm tra role user có phải Driver không

### Không thể gán tài xế
1. Kiểm tra quyền truy cập
2. Xác nhận tài xế có trạng thái ACTIVE
3. Kiểm tra công việc có tồn tại không

### WebSocket lỗi kết nối
1. Kiểm tra backend WebSocket server
2. Xác nhận token authentication
3. Kiểm tra network connectivity
