# Invoice và Payment Status Update - Thêm biến binary kiểm tra trạng thái

## 🎯 Tổng quan

Tài liệu này mô tả việc thêm hai biến binary vào model `ServiceRequest` để theo dõi trạng thái hóa đơn và thanh toán:

1. **`has_invoice`** - Boolean kiểm tra request đã có hóa đơn chưa
2. **`is_paid`** - Boolean kiểm tra request đã được thanh toán chưa

## 🔄 Thay đổi kỹ thuật

### **1. Database Schema Updates**

#### **ServiceRequest Model**
```prisma
model ServiceRequest {
    // ... existing fields ...
    
    // Invoice và Payment status
    has_invoice              Boolean  @default(false)  // Kiểm tra request đã có hóa đơn chưa
    is_paid                  Boolean  @default(false)  // Kiểm tra request đã được thanh toán chưa
    
    // ... existing fields ...
    
    @@index([has_invoice])
    @@index([is_paid])
}
```

#### **Migration SQL**
```sql
-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN "has_invoice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "is_paid" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ServiceRequest_has_invoice_idx" ON "ServiceRequest"("has_invoice");
CREATE INDEX "ServiceRequest_is_paid_idx" ON "ServiceRequest"("is_paid");
```

### **2. Business Logic**

#### **Cập nhật `has_invoice`**
- **`true`**: Khi request có ít nhất một hóa đơn được tạo
- **`false`**: Khi request chưa có hóa đơn nào

#### **Cập nhật `is_paid`**
- **`true`**: Khi request đã được thanh toán đầy đủ
- **`false`**: Khi request chưa được thanh toán hoặc thanh toán chưa đầy đủ

### **3. API Endpoints**

#### **Cập nhật trạng thái hóa đơn**
```http
PATCH /requests/:id/invoice-status
Authorization: Bearer <token>
Content-Type: application/json

{
  "has_invoice": true
}
```

#### **Cập nhật trạng thái thanh toán**
```http
PATCH /requests/:id/payment-status
Authorization: Bearer <token>
Content-Type: application/json

{
  "is_paid": true
}
```

#### **Search với filter trạng thái**
```http
GET /requests/search?has_invoice=true&is_paid=false
```

## 🚀 Quy trình hoạt động

### **1. Tạo hóa đơn**
- Khi tạo hóa đơn cho request → `has_invoice = true`
- Cập nhật tự động thông qua trigger hoặc business logic

### **2. Xử lý thanh toán**
- Khi thanh toán hoàn tất → `is_paid = true`
- Khi có thanh toán một phần → `is_paid = false` (có thể mở rộng thành decimal)

### **3. Sử dụng trong Gate Dashboard**
- Filter requests theo trạng thái hóa đơn và thanh toán
- Hiển thị visual indicators cho từng trạng thái
- Cho phép xử lý ưu tiên các request đã có hóa đơn

## 🎯 Use Cases

### **Gate Dashboard**
- Hiển thị requests chưa có hóa đơn để nhắc nhở
- Filter requests đã thanh toán để xử lý ưu tiên
- Thống kê số lượng requests theo trạng thái

### **Finance Module**
- Theo dõi requests chưa thanh toán
- Báo cáo doanh thu theo trạng thái thanh toán
- Quản lý công nợ khách hàng

### **Customer Portal**
- Khách hàng có thể xem trạng thái hóa đơn và thanh toán
- Nhắc nhở thanh toán cho requests chưa hoàn tất

## 📊 Tác động hệ thống

### **Frontend:**
- Thêm columns trong RequestTable để hiển thị trạng thái
- Filter options cho trạng thái hóa đơn và thanh toán
- Visual indicators (icons, colors) cho từng trạng thái

### **Backend:**
- API endpoints mới để cập nhật trạng thái
- Business logic để tự động cập nhật trạng thái
- Search và filter functionality mở rộng

### **Database:**
- Thêm 2 columns mới với default values
- Indexes để tối ưu performance cho search queries
- Migration script để cập nhật database hiện tại

## 🔧 Implementation Steps

### **1. Database Migration** ✅
- [x] Cập nhật Prisma schema
- [x] Tạo migration file
- [x] Apply migration vào database

### **2. Backend Updates**
- [ ] Cập nhật Prisma client
- [ ] Thêm API endpoints cho cập nhật trạng thái
- [ ] Cập nhật search và filter logic
- [ ] Thêm business logic tự động cập nhật

### **3. Frontend Updates**
- [ ] Cập nhật RequestTable component
- [ ] Thêm filter options
- [ ] Thêm visual indicators
- [ ] Cập nhật search functionality

### **4. Testing**
- [ ] Unit tests cho business logic
- [ ] Integration tests cho API endpoints
- [ ] E2E tests cho frontend functionality

## 📚 Tài liệu liên quan

- [GATE_DASHBOARD_UPDATE.md](./GATE_DASHBOARD_UPDATE.md) - Gate Dashboard
- [MODULE_7_FINANCE.md](./MODULE_7_FINANCE.md) - Finance Module
- [REQUEST_STATE_MACHINE_IMPLEMENTATION.md](./REQUEST_STATE_MACHINE_IMPLEMENTATION.md) - State Machine

## 🚀 Future Enhancements

### **Có thể mở rộng:**
- Thêm trường `payment_amount` để theo dõi số tiền đã thanh toán
- Thêm trường `invoice_count` để đếm số lượng hóa đơn
- Thêm trường `last_payment_date` để theo dõi ngày thanh toán cuối
- Thêm trường `payment_method` để lưu phương thức thanh toán
- Thêm trường `partial_payment` để hỗ trợ thanh toán từng phần
