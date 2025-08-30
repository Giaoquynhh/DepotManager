# Tính năng Tạo Hóa đơn với Chi phí và EIR

## Tổng quan
Tính năng này cho phép SaleAdmin xem danh sách container cần tạo hóa đơn và hiển thị popup chi tiết với thông tin chi phí sửa chữa, chi phí LOLO, upload EIR file, và **tạo hóa đơn thực tế**.

## Cách sử dụng

### 1. Truy cập trang Finance Invoices
- Đăng nhập với role `SaleAdmin`
- Truy cập: `http://localhost:5002/finance/invoices`

### 2. Mở danh sách container cần tạo hóa đơn
- Click nút **"Danh sách container cần tạo hóa đơn"** (màu xanh lá)
- Modal sẽ hiển thị danh sách container với các thông tin:
  - Loại container (Nhập/Xuất/Chuyển đổi)
  - Container No
  - Trạng thái
  - Ngày tạo
  - Chi phí dự kiến
  - Nút "Tạo hóa đơn"

### 3. Xem chi tiết chi phí và tạo hóa đơn
- Click nút **"Tạo hóa đơn"** cho container muốn xử lý
- Modal mới sẽ hiển thị:
  - **Chi phí sửa chữa**: Từ RepairTicket
  - **Chi phí LOLO**: Từ ForkliftTask
  - **Tổng chi phí**: Tổng hợp hai loại chi phí
  - **Upload EIR**: Form upload file PDF hoặc hình ảnh

### 4. Tạo hóa đơn thực tế
- **Click "Hoàn tất"** trong modal
- Hệ thống sẽ:
  - Tạo hóa đơn thực tế với API `POST /finance/invoices`
  - Tự động tính VAT 10% cho mỗi item
  - Cập nhật `has_invoice = true` trong ServiceRequest
  - Hiển thị thông báo "Tạo hóa đơn thành công!"
  - Đóng modal và refresh trang
  - **Container bị xóa khỏi danh sách** (vì `has_invoice = true`)
  - Hóa đơn mới hiển thị trong bảng chính

### 5. Upload EIR file
- Chọn file PDF hoặc hình ảnh (PNG, JPG, JPEG)
- File size tối đa: 10MB
- Click **"Upload EIR"**
- File sẽ được lưu vào `D:\container21\manageContainer\backend\uploads`

## Tính năng chi tiết

### Chi phí sửa chữa (RepairTicket)
- Lấy từ bảng `RepairTicket` theo `container_no`
- Tính tổng: `estimated_cost` (không bao gồm labor_cost để phù hợp với bảng Maintenance)
- Hiển thị từng phiếu sửa chữa với mã và chi phí

### Chi phí LOLO (ForkliftTask)
- Lấy từ bảng `ForkliftTask` theo `container_no`
- Lấy trường `cost` của mỗi task
- Tính tổng chi phí xe nâng

### Tạo hóa đơn thực tế
- **API**: `POST /finance/invoices`
- **Items**: Tự động tạo từ chi phí sửa chữa và LOLO
- **Tax**: 10% VAT cho mỗi item
- **Status**: DRAFT → UNPAID
- **Database**: Tạo record trong bảng `Invoice` và `InvoiceLineItem`
- **Update**: Cập nhật `has_invoice = true` trong `ServiceRequest`

### Upload EIR
- **File types**: PDF, PNG, JPG, JPEG
- **Size limit**: 10MB
- **Storage**: Thư mục uploads với tên unique
- **Naming**: `EIR_{container_no}_{timestamp}_{original_name}`

## API Endpoints

### 1. Lấy danh sách container
```http
GET /finance/invoices/containers-need-invoice
Authorization: Bearer <JWT_TOKEN>
```

### 2. Lấy chi phí sửa chữa
```http
GET /maintenance/repairs?container_no={container_no}
Authorization: Bearer <JWT_TOKEN>
```

### 3. Lấy chi phí LOLO
```http
GET /forklift/jobs?container_no={container_no}
Authorization: Bearer <JWT_TOKEN>
```

### 4. Tạo hóa đơn
```http
POST /finance/invoices
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "customer_id": "customer_123",
  "currency": "VND",
  "issue_date": "2025-01-27T10:00:00.000Z",
  "due_date": "2025-02-26T10:00:00.000Z",
  "notes": "Hóa đơn cho container ISO 9999",
  "items": [
    {
      "service_code": "REPAIR",
      "description": "Chi phí sửa chữa container",
      "qty": 1,
      "unit_price": 500000,
      "tax_rate": 10
    }
  ]
}
```

### 5. Cập nhật has_invoice
```http
PATCH /finance/requests/{request_id}/invoice-status
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "has_invoice": true
}
```

### 6. Upload EIR
```http
POST /finance/upload/eir
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

Body:
- file: File PDF hoặc hình ảnh
- container_no: Số container
```

## Cấu trúc dữ liệu

### Container Response
```json
{
  "id": "clx1234567890",
  "type": "IMPORT",
  "container_no": "ISO 1234",
  "status": "GATE_OUT",
  "createdAt": "2025-08-30T10:00:00.000Z",
  "estimated_cost": 500000,
  "has_invoice": false
}
```

### Chi phí sửa chữa
```json
{
  "id": "repair_id",
  "code": "REP-001",
  "estimated_cost": 300000,
  "labor_cost": 200000,
  "status": "CHECKED"
}
```

### Chi phí LOLO
```json
{
  "id": "task_id",
  "cost": 150000,
  "status": "COMPLETED"
}
```

### Hóa đơn được tạo
```json
{
  "id": "invoice_123",
  "invoice_no": "INV-2025-001",
  "customer_id": "customer_123",
  "subtotal": 800000,
  "tax_amount": 80000,
  "total_amount": 880000,
  "status": "DRAFT",
  "createdAt": "2025-01-27T10:00:00.000Z"
}
```

## Workflow hoàn chỉnh

### 1. Tạo hóa đơn
1. **Click "Danh sách container cần tạo hóa đơn"**
2. **Chọn container và click "Tạo hóa đơn"**
3. **Modal hiển thị thông tin chi phí**
4. **Upload EIR file (tùy chọn)**
5. **Click "Hoàn tất"**
6. **Hệ thống tạo hóa đơn thực tế**
7. **Cập nhật `has_invoice = true`**
8. **Refresh danh sách hóa đơn**
9. **Hóa đơn mới hiển thị trong bảng chính**

### 2. Data Flow
```
Container → Chi phí sửa chữa + LOLO → Tạo hóa đơn → Update has_invoice → Refresh UI
```

## Xử lý lỗi

### 1. Không có chi phí
- Hiển thị "Không có chi phí sửa chữa" hoặc "Không có chi phí LOLO"
- Tổng chi phí = 0
- Vẫn có thể tạo hóa đơn với chi phí 0

### 2. Upload EIR thất bại
- Kiểm tra file type và size
- Hiển thị thông báo lỗi cụ thể
- Cho phép thử lại

### 3. Tạo hóa đơn thất bại
- Kiểm tra customer_id và items
- Hiển thị thông báo lỗi từ server
- Retry mechanism cho network errors

### 4. Cập nhật has_invoice thất bại
- Log lỗi và hiển thị thông báo
- Hóa đơn vẫn được tạo nhưng trạng thái không được cập nhật

## Quyền truy cập

### Role yêu cầu
- **SaleAdmin**: Đầy đủ quyền
- **SystemAdmin**: Đầy đủ quyền
- **BusinessAdmin**: Có thể xem nhưng không tạo hóa đơn

### Quyền cụ thể
- Xem danh sách container
- Xem thông tin chi phí
- Upload EIR file
- **Tạo hóa đơn thực tế**
- Cập nhật trạng thái has_invoice

## Troubleshooting

### 1. Modal không hiển thị
- Kiểm tra console errors
- Verify JWT token
- Check role permissions

### 2. Không load được chi phí
- Kiểm tra API endpoints
- Verify container_no format
- Check database connections

### 3. Upload EIR thất bại
- Kiểm tra file size và type
- Verify uploads directory permissions
- Check multer configuration

### 4. Tạo hóa đơn thất bại
- Kiểm tra customer_id
- Verify items data structure
- Check invoice API endpoint

### 5. Không cập nhật được has_invoice
- Kiểm tra request_id
- Verify RequestStatusController
- Check database permissions

## Development

### 1. Backend
- **File**: `modules/finance/controller/FinanceRoutes.ts`
- **Multer config**: Disk storage với đường dẫn cố định
- **File validation**: Type và size limits
- **Invoice creation**: Integration với InvoiceController

### 2. Frontend
- **Components**: `ContainersNeedInvoiceModal.tsx`, `CreateInvoiceModal.tsx`
- **State management**: React hooks với SWR
- **Styling**: Styled-jsx với responsive design
- **API calls**: Real-time invoice creation

### 3. Database
- **Tables**: `RepairTicket`, `ForkliftTask`, `ServiceRequest`, `Invoice`, `InvoiceLineItem`
- **Indexes**: `container_no`, `has_invoice` cho performance
- **Relations**: Foreign key constraints

## Testing

### 1. Unit Tests
```bash
# Test components
npm test -- --testPathPattern=CreateInvoiceModal
npm test -- --testPathPattern=ContainersNeedInvoiceModal
```

### 2. API Tests
```bash
# Test tạo hóa đơn
curl -X POST http://localhost:5002/finance/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"customer_id":"test","items":[{"service_code":"REPAIR","description":"Test","qty":1,"unit_price":100000}]}'

# Test cập nhật has_invoice
curl -X PATCH http://localhost:5002/finance/requests/<request_id>/invoice-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{"has_invoice": true}'

# Test upload EIR
curl -X POST http://localhost:5002/finance/upload/eir \
  -F "file=@test-file.pdf" \
  -F "container_no=ISO1234"
```

### 3. Integration Tests
- Test full flow từ danh sách đến tạo hóa đơn
- Verify file storage và database updates
- Check error handling scenarios
- Test has_invoice status update

## Deployment

### 1. Backend
- Ensure uploads directory exists
- Set proper file permissions
- Configure multer storage path
- Verify invoice creation API

### 2. Frontend
- Build và deploy components
- Verify API endpoint URLs
- Test role-based access
- Test invoice creation flow

### 3. Database
- Run Prisma migrations
- Verify indexes và constraints
- Test data queries
- Check invoice relationships

## Monitoring

### 1. File Uploads
- Monitor uploads directory size
- Track file upload success/failure rates
- Alert on storage space issues

### 2. API Performance
- Monitor response times
- Track error rates
- Alert on service degradation

### 3. Invoice Creation
- Track invoice creation success/failure
- Monitor has_invoice updates
- Alert on database errors

### 4. User Activity
- Track modal open/close events
- Monitor EIR upload patterns
- Analyze invoice creation usage

## Future Enhancements

### 1. Invoice Management
- View chi tiết hóa đơn
- Edit hóa đơn (DRAFT status)
- Issue hóa đơn (DRAFT → UNPAID)
- Cancel hóa đơn

### 2. Payment Integration
- Payment status tracking
- Payment allocation
- Payment history

### 3. Advanced Features
- Bulk invoice creation
- Invoice templates
- Email notifications
- PDF generation

### 4. Cost Management
- Real-time cost updates
- Cost approval workflows
- Historical cost tracking

## Dependencies

### Frontend
- React hooks (useState, useEffect)
- SWR for data fetching
- Styled-jsx for styling

### Backend
- Express.js
- Multer for file upload
- Prisma for database access
- RequestStatusController for invoice status

## File Structure
```
frontend/
├── components/
│   ├── ContainersNeedInvoiceModal.tsx
│   └── CreateInvoiceModal.tsx
├── pages/
│   └── finance/invoices/index.tsx
└── services/
    └── finance.ts

backend/
├── modules/finance/
│   └── controller/FinanceRoutes.ts
├── modules/requests/
│   └── controllers/RequestStatusController.ts
└── uploads/ (EIR files storage)
```

## Test Scripts

### 1. Test Create Invoice
**File**: `backend/test-create-invoice.js`
- Kiểm tra thư mục uploads
- Test data cho hóa đơn
- Hướng dẫn test với curl

### 2. Test EIR Upload
**File**: `backend/test-eir-upload.js`
- Kiểm tra thư mục uploads
- Tạo file test
- Hướng dẫn test manual
