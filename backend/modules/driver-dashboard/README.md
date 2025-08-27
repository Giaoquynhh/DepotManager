# Driver Dashboard Module - Bảng điều khiển Tài xế

## Tổng quan
Module Driver Dashboard cung cấp giao diện quản lý công việc dành riêng cho tài xế xe nâng. Tài xế có thể xem tổng quan công việc, quản lý task được giao và theo dõi lịch sử công việc.

## Tính năng chính

### 1. Dashboard Tổng quan
- **Thống kê công việc**: Tổng số task, hoàn thành hôm nay, đang chờ
- **Tỷ lệ hoàn thành**: Phần trăm công việc đã hoàn thành
- **Công việc hiện tại**: Hiển thị task đang thực hiện
- **Thao tác nhanh**: Chuyển đổi giữa các tab

### 2. Quản lý Công việc
- **Danh sách task được giao**: Xem tất cả công việc PENDING và IN_PROGRESS
- **Cập nhật trạng thái**: Bắt đầu, hoàn thành công việc
- **Thông tin chi tiết**: Vị trí nguồn, đích, container

### 3. Lịch sử Công việc
- **Task đã hoàn thành**: Xem các công việc COMPLETED và CANCELLED
- **Thông tin thời gian**: Ngày hoàn thành công việc
- **Giới hạn**: Chỉ hiển thị 20 task gần nhất

## Cấu trúc API

### Endpoints
- `GET /driver-dashboard/dashboard` - Lấy dữ liệu dashboard chính
- `GET /driver-dashboard/tasks` - Lấy danh sách task được giao
- `PATCH /driver-dashboard/tasks/:taskId/status` - Cập nhật trạng thái task
- `GET /driver-dashboard/tasks/history` - Lấy lịch sử task

### Bảo mật
- Tất cả endpoints yêu cầu authentication
- Chỉ role "Driver" mới có thể truy cập
- Tài xế chỉ có thể thao tác với task được giao cho mình

## Cấu trúc Database

### Bảng chính
- **ForkliftTask**: Lưu trữ thông tin công việc xe nâng
- **AuditLog**: Ghi log các thay đổi trạng thái

### Quan hệ
- Task liên kết với YardSlot (vị trí nguồn và đích)
- YardSlot liên kết với YardBlock và Yard
- Task được gán cho Driver thông qua assigned_driver_id

## Giao diện Frontend

### Tabs chính
1. **Tổng quan**: Hiển thị thống kê và công việc hiện tại
2. **Công việc**: Quản lý task được giao
3. **Lịch sử**: Xem lịch sử công việc

### Responsive Design
- Hỗ trợ mobile và desktop
- Grid layout linh hoạt
- Loading states và error handling

## Cách sử dụng

### 1. Đăng nhập với role Driver
```typescript
// User phải có role = 'Driver'
const user = {
  role: 'Driver',
  permissions: ['driver.dashboard']
};
```

### 2. Truy cập Dashboard
- Vào sidebar menu "Bảng điều khiển"
- Hoặc truy cập trực tiếp `/DriverDashboard`

### 3. Quản lý công việc
- Xem tổng quan trong tab "Tổng quan"
- Chuyển sang tab "Công việc" để xem task được giao
- Click "Bắt đầu" để bắt đầu task
- Click "Hoàn thành" khi hoàn thành task

## Phát triển

### Thêm tính năng mới
1. Cập nhật `DriverDashboardService.ts`
2. Thêm endpoint trong `DriverDashboardController.ts`
3. Cập nhật routes trong `DriverDashboardRoutes.ts`
4. Thêm API call trong `driverDashboard.ts` (frontend)
5. Cập nhật UI trong `DriverDashboard/index.tsx`

### Testing
```bash
# Test API endpoints
curl -H "Authorization: Bearer <token>" \
  http://localhost:5002/driver-dashboard/dashboard

# Test với role khác (sẽ bị từ chối)
curl -H "Authorization: Bearer <token>" \
  http://localhost:5002/driver-dashboard/dashboard
```

## Lưu ý bảo mật

1. **Role-based Access Control**: Chỉ Driver mới truy cập được
2. **Data Isolation**: Driver chỉ thấy task của mình
3. **Audit Logging**: Ghi log mọi thay đổi trạng thái
4. **Input Validation**: Validate dữ liệu đầu vào
5. **Error Handling**: Xử lý lỗi an toàn, không expose thông tin nhạy cảm
