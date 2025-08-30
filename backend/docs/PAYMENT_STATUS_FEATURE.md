# Tính năng Trạng thái Thanh toán (Payment Status Feature)

## Tổng quan

Tính năng này cho phép quản lý và theo dõi trạng thái thanh toán của các yêu cầu dịch vụ (Service Requests) trong hệ thống Smartlog Container Manager.

## Các trường dữ liệu

### 1. Trạng thái Hóa đơn (`has_invoice`)
- **Kiểu dữ liệu**: Boolean
- **Mô tả**: Xác định xem request đã có hóa đơn hay chưa
- **Giá trị**:
  - `true`: Có hóa đơn
  - `false`: Chưa có hóa đơn

### 2. Trạng thái Thanh toán (`is_paid`)
- **Kiểu dữ liệu**: Boolean
- **Mô tả**: Xác định xem request đã được thanh toán hay chưa
- **Giá trị**:
  - `true`: Đã thanh toán
  - `false`: Chưa thanh toán

## API Endpoints

### 1. Cập nhật trạng thái hóa đơn
```http
PATCH /requests/:id/invoice-status
```

**Request Body:**
```json
{
  "has_invoice": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã cập nhật trạng thái hóa đơn: Có hóa đơn",
  "data": {
    "id": "request_id",
    "has_invoice": true,
    "updatedAt": "2025-01-09T10:30:00.000Z"
  }
}
```

### 2. Cập nhật trạng thái thanh toán
```http
PATCH /requests/:id/payment-status
```

**Request Body:**
```json
{
  "is_paid": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã cập nhật trạng thái thanh toán: Đã thanh toán",
  "data": {
    "id": "request_id",
    "is_paid": true,
    "updatedAt": "2025-01-09T10:30:00.000Z"
  }
}
```

### 3. Cập nhật cả hai trạng thái cùng lúc
```http
PATCH /requests/:id/both-statuses
```

**Request Body:**
```json
{
  "has_invoice": true,
  "is_paid": false
}
```

### 4. Tìm kiếm requests theo trạng thái
```http
GET /requests/search/status?has_invoice=true&is_paid=false
```

### 5. Lấy thông tin trạng thái request
```http
GET /requests/:id/status
```

### 6. Lấy thống kê trạng thái
```http
GET /requests/statistics/status
```

## Quyền truy cập

Các API endpoints này yêu cầu quyền truy cập của các role sau:
- `YardManager`
- `SaleAdmin`
- `FinanceAdmin`
- `SystemAdmin`

## Giao diện người dùng

### Trang Depot (`/Requests/Depot`)

Bảng hiển thị requests đã được cập nhật với cột "Trạng thái thanh toán" mới, bao gồm:

1. **Trạng thái hóa đơn**: Hiển thị icon và text tương ứng
2. **Trạng thái thanh toán**: Hiển thị icon và text tương ứng
3. **Nút cập nhật**: Cho phép thay đổi trạng thái thanh toán

### Styles CSS

Các styles được định nghĩa trong `DepotRequestTable.css`:

```css
.payment-status-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 140px;
}

.status-indicator.has-invoice {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.status-indicator.paid {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
}

.status-indicator.unpaid {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}
```

## Cách sử dụng

### 1. Cập nhật trạng thái thanh toán

1. Truy cập trang Depot (`/Requests/Depot`)
2. Trong cột "Trạng thái thanh toán", nhấn nút cập nhật
3. Hệ thống sẽ gọi API để cập nhật trạng thái
4. Trang sẽ được refresh để hiển thị thông tin mới

### 2. Theo dõi trạng thái

- **Chưa có hóa đơn + Chưa thanh toán**: 📝 Chưa có hóa đơn + ⏳ Chưa thanh toán
- **Có hóa đơn + Chưa thanh toán**: 📄 Có hóa đơn + ⏳ Chưa thanh toán
- **Có hóa đơn + Đã thanh toán**: 📄 Có hóa đơn + 💰 Đã thanh toán

## Scripts hỗ trợ

### 1. Cập nhật dữ liệu mẫu
```bash
node update-sample-payment-status.js
```

### 2. Test API
```bash
node test-payment-status-api.js
```

## Lưu ý kỹ thuật

1. **Database**: Các trường `has_invoice` và `is_paid` đã có sẵn trong schema Prisma
2. **Authentication**: Tất cả API endpoints đều yêu cầu xác thực JWT
3. **Authorization**: Kiểm tra role-based access control (RBAC)
4. **Audit Log**: Các thay đổi trạng thái được ghi log (tạm thời bị comment out)

## Tương lai

- [ ] Thêm audit logging cho các thay đổi trạng thái
- [ ] Tích hợp với hệ thống hóa đơn
- [ ] Thêm notifications khi trạng thái thay đổi
- [ ] Export báo cáo trạng thái thanh toán
- [ ] Dashboard thống kê thanh toán

## Liên hệ

Nếu có vấn đề hoặc câu hỏi về tính năng này, vui lòng liên hệ team phát triển.
