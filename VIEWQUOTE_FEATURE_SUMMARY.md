# Tính năng ViewQuote cho RepairTicket

## Tổng quan
Tính năng `viewquote` được thêm vào `RepairTicket` để kiểm soát quyền xem hóa đơn sửa chữa ở các trang khác nhau trong hệ thống.

## Các giá trị của viewquote

### `viewquote = 0` (Mặc định)
- **Ý nghĩa**: Chỉ page `http://localhost:5002/Maintenance/Repairs` mới có thể xem hóa đơn sửa chữa
- **Trạng thái**: Đây là trạng thái ban đầu khi tạo phiếu sửa chữa

### `viewquote = 1`
- **Kích hoạt**: Khi ở page `http://localhost:5002/Maintenance/Repairs` click button "Gửi yêu cầu xác nhận" với `repairtick status = PENDING_ACCEPT`
- **Hiệu ứng**: Page `http://localhost:5002/Requests/Depot` sẽ hiển thị button "Xem hóa đơn/Gửi xác nhận" ở cột action
- **API**: `POST /maintenance/repairs/:id/confirmation-request`

### `viewquote = 2`
- **Kích hoạt**: Khi ở page `http://localhost:5002/Requests/Depot` click button "Gửi xác nhận"
- **Hiệu ứng**: Page `http://localhost:5002/Requests/Customer` sẽ hiển thị action "Xem hóa đơn/Chấp nhận/Từ chối"
- **API**: `POST /requests/:id/send-customer-confirmation`

## Luồng hoạt động

```
1. Maintenance/Repairs (viewquote = 0)
   ↓ Click "Gửi yêu cầu xác nhận"
2. Depot có thể xem hóa đơn (viewquote = 1)
   ↓ Click "Gửi xác nhận"
3. Customer có thể xem hóa đơn và quyết định (viewquote = 2)
```

## Các thay đổi đã thực hiện

### Backend

#### 1. Database Schema
- **File**: `manageContainer/backend/prisma/schema.prisma`
- **Thay đổi**: Thêm field `viewquote Int @default(0)` vào model `RepairTicket`
- **Migration**: `20250909010849_add_viewquote_to_repair_ticket`

#### 2. Maintenance Service
- **File**: `manageContainer/backend/modules/maintenance/service/MaintenanceService.ts`
- **Thay đổi**: Cập nhật hàm `sendConfirmationRequest` để set `viewquote = 1`

#### 3. Request Customer Service
- **File**: `manageContainer/backend/modules/requests/service/RequestCustomerService.ts`
- **Thay đổi**: Thêm hàm `sendCustomerConfirmation` để set `viewquote = 2`

#### 4. Request Controller & Routes
- **Files**: 
  - `manageContainer/backend/modules/requests/controller/RequestController.ts`
  - `manageContainer/backend/modules/requests/controller/RequestRoutes.ts`
- **Thay đổi**: Thêm API endpoint `POST /requests/:id/send-customer-confirmation`

#### 5. Request Base Service
- **File**: `manageContainer/backend/modules/requests/service/RequestBaseService.ts`
- **Thay đổi**: Cập nhật hàm `list` để trả về thông tin `viewquote` từ RepairTicket

### Frontend

#### 1. Depot Request Table
- **File**: `manageContainer/frontend/pages/Requests/components/DepotRequestTable.tsx`
- **Thay đổi**: Chỉ hiển thị button "Xem hóa đơn" và "Gửi xác nhận" khi `viewquote = 1`

#### 2. Request Table (Customer)
- **File**: `manageContainer/frontend/components/RequestTable.tsx`
- **Thay đổi**: 
  - Thêm `viewquote?: number` vào interface `Request`
  - Chỉ hiển thị actions khi `viewquote = 2`

#### 3. Depot Actions Hook
- **File**: `manageContainer/frontend/pages/Requests/hooks/useDepotActions.ts`
- **Thay đổi**: Cập nhật `handleSendCustomerConfirmation` để gọi API thực sự

## API Endpoints

### 1. Gửi yêu cầu xác nhận (Maintenance → Depot)
```
POST /maintenance/repairs/:id/confirmation-request
Authorization: Required (SaleAdmin, SystemAdmin)
Body: None
Response: { success: true, message: "..." }
```

### 2. Gửi xác nhận cho khách hàng (Depot → Customer)
```
POST /requests/:id/send-customer-confirmation
Authorization: Required (SaleAdmin, SystemAdmin)
Body: None
Response: { success: true, message: "Đã gửi xác nhận cho khách hàng thành công" }
```

## Kiểm tra tính năng

### Bước 1: Tạo phiếu sửa chữa
1. Vào `http://localhost:5002/Maintenance/Repairs`
2. Tạo phiếu sửa chữa mới
3. Kiểm tra `viewquote = 0` (mặc định)

### Bước 2: Gửi yêu cầu xác nhận
1. Ở phiếu sửa chữa có status `PENDING_ACCEPT`
2. Click button "Gửi yêu cầu xác nhận"
3. Kiểm tra `viewquote = 1`
4. Vào `http://localhost:5002/Requests/Depot`
5. Kiểm tra button "Xem hóa đơn" và "Gửi xác nhận" xuất hiện

### Bước 3: Gửi xác nhận cho khách hàng
1. Ở Depot page, click button "Gửi xác nhận"
2. Kiểm tra `viewquote = 2`
3. Vào `http://localhost:5002/Requests/Customer`
4. Kiểm tra actions "Xem hóa đơn", "Chấp nhận", "Từ chối" xuất hiện

## Lưu ý quan trọng

1. **Bảo mật**: Chỉ các role phù hợp mới có thể thực hiện các action
2. **Validation**: Kiểm tra trạng thái request trước khi cho phép chuyển đổi viewquote
3. **Error Handling**: Xử lý lỗi gracefully để không ảnh hưởng đến flow chính
4. **Audit Logging**: Ghi lại tất cả các thay đổi viewquote
5. **Database Consistency**: Đảm bảo viewquote được cập nhật đúng cho tất cả RepairTicket có cùng container_no

## Kết luận

Tính năng viewquote đã được implement hoàn chỉnh với:
- ✅ Database schema và migration
- ✅ Backend API endpoints
- ✅ Frontend UI updates
- ✅ Logic validation và error handling
- ✅ Audit logging

Tính năng này giúp kiểm soát quyền xem hóa đơn sửa chữa một cách có hệ thống và bảo mật.
