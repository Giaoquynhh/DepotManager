# API Handover - Request Status Management

## 🎯 Tổng quan

Tài liệu này cung cấp hướng dẫn sử dụng API để quản lý trạng thái hóa đơn và thanh toán cho các requests trong hệ thống Container Management.

## 🔑 Authentication

Tất cả API endpoints yêu cầu Bearer token trong header:

```bash
Authorization: Bearer <your_jwt_token>
```

## 📋 API Endpoints

### 1. Cập nhật trạng thái hóa đơn

**Endpoint:** `PATCH /requests/:id/invoice-status`

**Mô tả:** Cập nhật trạng thái hóa đơn cho request cụ thể

**Curl Example:**
```bash
# Đánh dấu request đã có hóa đơn
curl -X PATCH "http://localhost:3000/requests/cmex1234567890/invoice-status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "has_invoice": true
  }'

# Đánh dấu request chưa có hóa đơn
curl -X PATCH "http://localhost:3000/requests/cmex1234567890/invoice-status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "has_invoice": false
  }'
```

**Response Success:**
```json
{
  "success": true,
  "message": "Đã cập nhật trạng thái hóa đơn: Có hóa đơn",
  "data": {
    "id": "cmex1234567890",
    "has_invoice": true,
    "updatedAt": "2025-08-30T16:30:00.000Z"
  }
}
```

### 2. Cập nhật trạng thái thanh toán

**Endpoint:** `PATCH /requests/:id/payment-status`

**Mô tả:** Cập nhật trạng thái thanh toán cho request cụ thể

**Curl Example:**
```bash
# Đánh dấu request đã thanh toán
curl -X PATCH "http://localhost:3000/requests/cmex1234567890/payment-status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_paid": true
  }'

# Đánh dấu request chưa thanh toán
curl -X PATCH "http://localhost:3000/requests/cmex1234567890/payment-status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_paid": false
  }'
```

**Response Success:**
```json
{
  "success": true,
  "message": "Đã cập nhật trạng thái thanh toán: Đã thanh toán",
  "data": {
    "id": "cmex1234567890",
    "is_paid": true,
    "updatedAt": "2025-08-30T16:30:00.000Z"
  }
}
```

### 3. Cập nhật cả hai trạng thái cùng lúc

**Endpoint:** `PATCH /requests/:id/both-statuses`

**Mô tả:** Cập nhật cả trạng thái hóa đơn và thanh toán cùng lúc

**Curl Example:**
```bash
curl -X PATCH "http://localhost:3000/requests/cmex1234567890/both-statuses" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "has_invoice": true,
    "is_paid": false
  }'
```

**Response Success:**
```json
{
  "success": true,
  "message": "Đã cập nhật cả hai trạng thái thành công",
  "data": {
    "id": "cmex1234567890",
    "has_invoice": true,
    "is_paid": false,
    "updatedAt": "2025-08-30T16:30:00.000Z"
  }
}
```

### 4. Tìm kiếm requests theo trạng thái

**Endpoint:** `GET /requests/search/status`

**Mô tả:** Tìm kiếm requests dựa trên trạng thái hóa đơn và thanh toán

**Query Parameters:**
- `hasInvoice`: `true` hoặc `false` (optional)
- `isPaid`: `true` hoặc `false` (optional)
- `status`: Trạng thái request (optional)
- `type`: Loại request - IMPORT, EXPORT, CONVERT (optional)
- `limit`: Số lượng kết quả tối đa (default: 50)
- `offset`: Số lượng bỏ qua (default: 0)

**Curl Examples:**
```bash
# Tìm tất cả requests có hóa đơn
curl -X GET "http://localhost:3000/requests/search/status?hasInvoice=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Tìm requests chưa thanh toán
curl -X GET "http://localhost:3000/requests/search/status?isPaid=false" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Tìm requests có hóa đơn nhưng chưa thanh toán
curl -X GET "http://localhost:3000/requests/search/status?hasInvoice=true&isPaid=false" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Tìm requests theo loại và trạng thái
curl -X GET "http://localhost:3000/requests/search/status?type=IMPORT&hasInvoice=true&limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Success:**
```json
{
  "success": true,
  "message": "Tìm kiếm requests thành công",
  "data": {
    "requests": [
      {
        "id": "cmex1234567890",
        "type": "IMPORT",
        "status": "IN_YARD",
        "has_invoice": true,
        "is_paid": false,
        "container_no": "ABCD1234567",
        "eta": "2025-08-30T10:00:00.000Z",
        "driver_name": "Nguyễn Văn A",
        "license_plate": "30A-12345"
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0
  }
}
```

### 5. Lấy thống kê trạng thái

**Endpoint:** `GET /requests/statistics/status`

**Mô tả:** Lấy thống kê tổng quan về trạng thái hóa đơn và thanh toán

**Curl Example:**
```bash
curl -X GET "http://localhost:3000/requests/statistics/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Success:**
```json
{
  "success": true,
  "message": "Lấy thống kê thành công",
  "data": {
    "total": 150,
    "invoice_status": {
      "with_invoice": 120,
      "without_invoice": 30
    },
    "payment_status": {
      "paid": 80,
      "unpaid": 70
    }
  }
}
```

### 6. Tự động cập nhật trạng thái hóa đơn

**Endpoint:** `POST /requests/:id/auto-update-invoice`

**Mô tả:** Tự động cập nhật trạng thái hóa đơn dựa trên DocumentFile

**Curl Example:**
```bash
curl -X POST "http://localhost:3000/requests/cmex1234567890/auto-update-invoice" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Success:**
```json
{
  "success": true,
  "message": "Tự động cập nhật trạng thái hóa đơn thành công",
  "data": {
    "has_invoice": true,
    "updated": true
  }
}
```

### 7. Tự động cập nhật trạng thái thanh toán

**Endpoint:** `POST /requests/:id/auto-update-payment`

**Mô tả:** Tự động cập nhật trạng thái thanh toán dựa trên PaymentRequest

**Curl Example:**
```bash
curl -X POST "http://localhost:3000/requests/cmex1234567890/auto-update-payment" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Success:**
```json
{
  "success": true,
  "message": "Tự động cập nhật trạng thái thanh toán thành công",
  "data": {
    "is_paid": false,
    "updated": false
  }
}
```

### 8. Lấy thông tin trạng thái request

**Endpoint:** `GET /requests/:id/status`

**Mô tả:** Lấy thông tin trạng thái hóa đơn và thanh toán của request cụ thể

**Curl Example:**
```bash
curl -X GET "http://localhost:3000/requests/cmex1234567890/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Success:**
```json
{
  "success": true,
  "message": "Lấy thông tin trạng thái thành công",
  "data": {
    "id": "cmex1234567890",
    "has_invoice": true,
    "is_paid": false,
    "status": "IN_YARD",
    "type": "IMPORT",
    "updatedAt": "2025-08-30T16:30:00.000Z"
  }
}
```

## 🔒 Role Permissions

### **YardManager, SaleAdmin, FinanceAdmin**
- Có thể cập nhật tất cả trạng thái
- Có thể xem thống kê
- Có thể sử dụng auto-update functions

### **Customer**
- Chỉ có thể xem thông tin trạng thái của requests của mình
- Không thể cập nhật trạng thái

## 📊 Business Logic

### **Trạng thái hóa đơn (`has_invoice`)**
- `true`: Request đã có ít nhất một hóa đơn
- `false`: Request chưa có hóa đơn nào
- Tự động cập nhật khi có DocumentFile với type = 'INVOICE'

### **Trạng thái thanh toán (`is_paid`)**
- `true`: Request đã được thanh toán đầy đủ
- `false`: Request chưa được thanh toán hoặc thanh toán chưa đầy đủ
- Tự động cập nhật dựa trên PaymentRequest status

## 🚀 Use Cases

### **1. Quản lý hóa đơn**
```bash
# Khi tạo hóa đơn mới
curl -X PATCH "http://localhost:3000/requests/cmex1234567890/invoice-status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"has_invoice": true}'
```

### **2. Theo dõi thanh toán**
```bash
# Khi thanh toán hoàn tất
curl -X PATCH "http://localhost:3000/requests/cmex1234567890/payment-status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_paid": true}'
```

### **3. Báo cáo tài chính**
```bash
# Lấy thống kê để báo cáo
curl -X GET "http://localhost:3000/requests/statistics/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **4. Tìm kiếm requests cần xử lý**
```bash
# Tìm requests có hóa đơn nhưng chưa thanh toán
curl -X GET "http://localhost:3000/requests/search/status?hasInvoice=true&isPaid=false" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## ⚠️ Error Handling

### **Common Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation error: has_invoice must be a boolean"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Access token required"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Request not found"
}
```

## 🔧 Testing

Sử dụng script test có sẵn:

```bash
cd manageContainer/backend
node test-request-status-api.js
```

## 📚 Tài liệu liên quan

- [INVOICE_PAYMENT_STATUS_UPDATE.md](./INVOICE_PAYMENT_STATUS_UPDATE.md) - Chi tiết kỹ thuật
- [GATE_DASHBOARD_UPDATE.md](./GATE_DASHBOARD_UPDATE.md) - Gate Dashboard
- [MODULE_7_FINANCE.md](./MODULE_7_FINANCE.md) - Finance Module
