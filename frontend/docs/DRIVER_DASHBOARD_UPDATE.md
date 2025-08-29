# DriverDashboard Update - Thêm Trường Mới

## Tổng quan
Đã cập nhật DriverDashboard để thêm 2 trường mới: **Chi phí** và **Báo cáo** với giao diện đẹp và logic hiển thị thông minh.

## Thay đổi đã thực hiện

### 1. Interface Update (pages/DriverDashboard/index.tsx)

#### a) ForkliftTask Interface
```typescript
interface ForkliftTask {
  // ... existing fields ...
  cost?: number; // Chi phí dịch vụ xe nâng
  report_status?: string; // Trạng thái báo cáo: PENDING, SUBMITTED, APPROVED, REJECTED
  report_image?: string; // Đường dẫn file ảnh báo cáo
  // ... existing fields ...
}
```

**Thay đổi:**
- **Thêm `cost?: number`** - Chi phí dịch vụ xe nâng
- **Thêm `report_status?: string`** - Trạng thái báo cáo
- **Thêm `report_image?: string`** - Đường dẫn file ảnh báo cáo

### 2. Table Header Update

#### a) Bảng "Công việc được giao"
```typescript
<thead>
  <tr>
    <th>Container</th>
    <th>Từ vị trí</th>
    <th>Đến vị trí</th>
    <th>Chi phí</th>        {/* Cột mới */}
    <th>Báo cáo</th>        {/* Cột mới */}
    <th>Trạng thái</th>
    <th>Thao tác</th>
  </tr>
</thead>
```

#### b) Bảng "Lịch sử công việc"
```typescript
<thead>
  <tr>
    <th>Container</th>
    <th>Từ vị trí</th>
    <th>Đến vị trí</th>
    <th>Trạng thái</th>
    <th>Ngày hoàn thành</th>
    {/* Chưa thêm cột mới vào lịch sử */}
  </tr>
</thead>
```

### 3. Cột Dữ Liệu Mới

#### a) Cột "Chi phí"
```typescript
<td>
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    {task.cost ? (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        padding: '6px',
        backgroundColor: '#f0fdf4',
        borderRadius: '4px',
        border: '1px solid #bbf7d0'
      }}>
        <span style={{ 
          color: '#059669', 
          fontWeight: '700',
          fontSize: '14px',
          fontFamily: 'monospace'
        }}>
          {task.cost.toLocaleString('vi-VN')}
        </span>
        <span style={{
          fontSize: '10px',
          color: '#16a34a',
          backgroundColor: '#dcfce7',
          padding: '2px 4px',
          borderRadius: '2px',
          fontWeight: '600'
        }}>
          VNĐ
        </span>
      </div>
    ) : (
      <span style={{ 
        color: '#94a3b8', 
        fontSize: '12px',
        fontStyle: 'italic'
      }}>
        Chưa có
      </span>
    )}
  </div>
</td>
```

**Tính năng:**
- **Hiển thị chi phí:** Định dạng VNĐ với màu xanh lá
- **Fallback:** "Chưa có" nếu chưa có giá trị
- **Giao diện:** Badge đẹp với đơn vị tiền tệ

#### b) Cột "Báo cáo"
```typescript
<td>
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    {task.report_status ? (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        padding: '6px',
        backgroundColor: '#fef3c7',
        borderRadius: '4px',
        border: '1px solid #f59e0b'
      }}>
        <span style={{ 
          color: '#92400e', 
          fontWeight: '600',
          fontSize: '12px'
        }}>
          {task.report_status}
        </span>
        {task.report_image && (
          <button
            className="btn btn-sm btn-outline"
            style={{
              fontSize: '10px',
              padding: '2px 4px'
            }}
            onClick={() => window.open(task.report_image, '_blank')}
          >
            Xem ảnh
          </button>
        )}
      </div>
    ) : (
      <span style={{ 
        color: '#94a3b8', 
        fontSize: '12px',
        fontStyle: 'italic'
      }}>
        Chưa có
      </span>
    )}
  </div>
</td>
```

**Tính năng:**
- **Trạng thái báo cáo:** PENDING, SUBMITTED, APPROVED, REJECTED
- **Ảnh báo cáo:** Nút "Xem ảnh" nếu có file
- **Fallback:** "Chưa có" nếu chưa có báo cáo
- **Giao diện:** Badge màu cam với nút tương tác

### 4. Logic Hiển Thị Thông Minh

#### a) Hiển thị "Từ vị trí"
```typescript
<td>
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '4px'
  }}>
    {task.container_info?.driver_name && task.container_info?.license_plate ? (
      <>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px'
        }}>
          <span style={{ 
            color: '#64748b', 
            fontWeight: '600',
            minWidth: '50px'
          }}>Tài xế:</span>
          <span style={{ 
            color: '#1e293b', 
            fontWeight: '500',
            backgroundColor: '#dbeafe',
            padding: '2px 6px',
            borderRadius: '3px',
            fontSize: '11px'
          }}>
            {task.container_info.driver_name}
          </span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px'
        }}>
          <span style={{ 
            color: '#64748b', 
            fontWeight: '600',
            minWidth: '50px'
          }}>Biển số:</span>
          <span style={{ 
            color: '#1e293b', 
            fontWeight: '500',
            backgroundColor: '#fef3c7',
            padding: '2px 6px',
            borderRadius: '3px',
            fontFamily: 'monospace',
            fontSize: '11px'
          }}>
            {task.container_info.license_plate}
          </span>
        </div>
      </>
    ) : (
      <span className="location-text">
        {task.from_slot
          ? `${task.from_slot.block.yard.name} - ${task.from_slot.block.code} - ${task.from_slot.code}`
          : 'Bên ngoài'
        }
      </span>
    )}
  </div>
</td>
```

**Logic:**
- **Ưu tiên:** Hiển thị thông tin tài xế (tên, biển số) nếu có
- **Fallback:** Hiển thị vị trí thực tế (yard/block/slot) nếu không có tài xế
- **Giao diện:** Badge màu xanh cho tên tài xế, màu vàng cho biển số

## Cấu trúc Bảng Mới

### Bảng "Công việc được giao"
1. **Container** - Số container
2. **Từ vị trí** - Thông tin tài xế hoặc vị trí thực tế
3. **Đến vị trí** - Vị trí đích
4. **Chi phí** - Chi phí dịch vụ (VNĐ) ⭐ **MỚI**
5. **Báo cáo** - Trạng thái và ảnh báo cáo ⭐ **MỚI**
6. **Trạng thái** - Trạng thái công việc
7. **Thao tác** - Các nút hành động

### Bảng "Lịch sử công việc"
1. **Container** - Số container
2. **Từ vị trí** - Thông tin tài xế hoặc vị trí thực tế
3. **Đến vị trí** - Vị trí đích
4. **Trạng thái** - Trạng thái công việc
5. **Ngày hoàn thành** - Thời gian hoàn thành

## Giao Diện và UX

### 1. Màu sắc và Theme
- **Chi phí:** Màu xanh lá (#059669) với background xanh nhạt
- **Báo cáo:** Màu cam (#92400e) với background vàng nhạt
- **Tài xế:** Màu xanh dương (#1e293b) với background xanh nhạt
- **Biển số:** Màu cam (#1e293b) với background vàng nhạt

### 2. Responsive Design
- **Mobile:** Các cột tự động co giãn
- **Tablet:** Layout tối ưu cho màn hình vừa
- **Desktop:** Hiển thị đầy đủ thông tin

### 3. Interactive Elements
- **Nút "Xem ảnh":** Mở ảnh trong tab mới
- **Hover effects:** Hiệu ứng khi di chuột qua
- **Loading states:** Trạng thái tải dữ liệu

## Backend Integration

### 1. API Endpoints
```typescript
// Lấy danh sách công việc được giao
GET /api/driver-dashboard/assigned-tasks

// Lấy lịch sử công việc
GET /api/driver-dashboard/task-history

// Cập nhật trạng thái công việc
PATCH /api/driver-dashboard/tasks/:taskId/status
```

### 2. Data Structure
```typescript
// Response từ API
{
  id: string;
  container_no: string;
  status: string;
  cost?: number;
  report_status?: string;
  report_image?: string;
  container_info?: {
    driver_name?: string;
    license_plate?: string;
  };
  // ... other fields
}
```

## Lợi Ích Của Cập Nhật

### 1. Thông Tin Đầy Đủ
- **Chi phí:** Tài xế biết được chi phí dịch vụ
- **Báo cáo:** Theo dõi trạng thái báo cáo
- **Tài xế:** Hiển thị thông tin người lái xe

### 2. Giao Diện Đẹp
- **Badge system:** Màu sắc phân biệt rõ ràng
- **Typography:** Font chữ và kích thước phù hợp
- **Spacing:** Khoảng cách hợp lý giữa các element

### 3. Trải Nghiệm Người Dùng
- **Thông tin rõ ràng:** Dễ đọc và hiểu
- **Tương tác tốt:** Nút bấm và hover effects
- **Responsive:** Hoạt động tốt trên mọi thiết bị

## Cần Thực Hiện Thêm

### 1. Backend API
- Đảm bảo API trả về đầy đủ `cost`, `report_status`, `report_image`
- Cập nhật `DriverDashboardService` để include các trường mới

### 2. Database
- Chạy migration để thêm các trường mới
- Generate Prisma client

### 3. Testing
- Test hiển thị với dữ liệu thực tế
- Test responsive design trên các thiết bị
- Test logic fallback khi không có dữ liệu

## Kết Luận

DriverDashboard đã được cập nhật với:
- **2 trường mới:** Chi phí và Báo cáo
- **Giao diện đẹp:** Badge system với màu sắc phù hợp
- **Logic thông minh:** Hiển thị thông tin tài xế ưu tiên
- **UX tốt:** Responsive design và interactive elements

Các trường mới này giúp tài xế có thông tin đầy đủ hơn về công việc và cải thiện trải nghiệm sử dụng.

## Tính năng mới được thêm

### 1. Trường Chi phí (Cost)
- **Chức năng:** Tài xế có thể nhập và chỉnh sửa chi phí dịch vụ xe nâng
- **Giao diện:** Input field với validation số nguyên không âm
- **Nút hành động:** "Thêm/Sửa", "Lưu", "Hủy"
- **Hiển thị:** Định dạng VNĐ với badge xanh lá

### 2. Trường Báo cáo (Report)
- **Chức năng:** Upload ảnh báo cáo và hiển thị trạng thái
- **Giao diện:** Nút "Gửi tài liệu" để upload file
- **Hiển thị:** Trạng thái báo cáo với badge vàng
- **Xem ảnh:** Nút "Xem ảnh" để mở ảnh trong tab mới

### 3. Upload ảnh báo cáo
- **File input:** Chọn file ảnh với validation
- **Nút hành động:** "Gửi", "Hủy"
- **Error handling:** Hiển thị lỗi nếu upload thất bại
- **Success feedback:** Tự động refresh sau khi upload thành công

### 4. Cải tiến kỹ thuật
- **State management:** `editingCost`, `uploadingImage`, `selectedFile`
- **API integration:** `updateTaskCost`, `uploadReportImage`
- **Error handling:** Validation và error messages
- **Port configuration:** Sửa lỗi port 5000 → 5002 cho ảnh
- **URL handling:** Xử lý URL ảnh với fallback routes

## API Endpoints mới

### 1. Cập nhật chi phí
```typescript
PATCH /driver-dashboard/tasks/:taskId/cost
Body: { cost: number }
Response: { success: boolean, message: string, data: ForkliftTask }
```

### 2. Upload ảnh báo cáo
```typescript
POST /driver-dashboard/tasks/:taskId/report
Body: FormData (report_image: File)
Response: { success: boolean, message: string, data: ForkliftTask }
```

## Cấu hình Static File Serving

### 1. Backend Configuration
```typescript
// main.ts
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

### 2. URL Structure
- **Static serving:** `http://localhost:5002/uploads/reports/filename.png`
- **Route backup:** `http://localhost:5002/driver-dashboard/reports/filename`

### 3. Frontend URL Handling
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
