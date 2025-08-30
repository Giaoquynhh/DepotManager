# Finance Invoice Container List - Frontend Documentation

## Tổng quan
Tài liệu mô tả logic frontend cho tính năng "Danh sách container cần tạo hóa đơn" trong module Finance. Tính năng này thay thế nút "Tạo hóa đơn" cũ bằng nút "Danh sách container cần tạo hóa đơn" và hiển thị popup modal với danh sách container cần tạo hóa đơn.

## Business Requirements
- **Mục đích**: Hiển thị danh sách container cần tạo hóa đơn cho SaleAdmin
- **Điều kiện lọc**: Container có trạng thái `IN_YARD`, `IN_CAR`, hoặc `GATE_OUT`
- **Nguồn dữ liệu**: API `/finance/invoices/containers-need-invoice`

## Component Architecture

### 1. Main Page Component
**File**: `pages/finance/invoices/index.tsx`

#### Thay đổi chính
- Thay thế nút "Tạo hóa đơn" bằng nút "Danh sách container cần tạo hóa đơn"
- Tích hợp `ContainersNeedInvoiceModal` component
- Sử dụng API `financeApi.listInvoicesWithDetails()` để lấy dữ liệu invoices

#### State Management
```typescript
const [isModalOpen, setIsModalOpen] = useState(false);
```

#### UI Elements
- **Filter dropdown**: Lọc theo trạng thái hóa đơn
- **Main button**: "Danh sách container cần tạo hóa đơn" (màu xanh lá)
- **Invoice table**: Hiển thị danh sách hóa đơn với các trường mới
- **Modal integration**: Popup hiển thị container cần tạo hóa đơn

### 2. Modal Component
**File**: `components/ContainersNeedInvoiceModal.tsx`

#### Props Interface
```typescript
interface ContainersNeedInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}
```

#### Features
- **Data fetching**: Sử dụng SWR để lấy dữ liệu container
- **Table display**: Hiển thị danh sách container với các cột:
  - Loại (Nhập/Xuất/Chuyển đổi)
  - Container No
  - Trạng thái
  - Ngày tạo
  - Hành động (nút "Tạo hóa đơn")
- **Status badges**: Màu sắc khác nhau cho từng loại container và trạng thái
- **Responsive design**: Modal responsive với scroll cho nội dung dài

#### Styling
- **Modal overlay**: Background mờ với z-index cao
- **Type badges**: Màu sắc khác nhau cho IMPORT/EXPORT/CONVERT
- **Status badges**: Màu sắc khác nhau cho IN_YARD/IN_CAR/GATE_OUT
- **Hover effects**: Hiệu ứng hover cho table rows và buttons

## API Integration

### 1. Frontend Service
**File**: `services/finance.ts`

#### New Methods
```typescript
// Lấy danh sách container cần tạo hóa đơn
async getContainersNeedInvoice() {
  const { data } = await api.get('/finance/invoices/containers-need-invoice');
  return data as any[];
}

// Lấy danh sách invoices với thông tin chi tiết
async listInvoicesWithDetails(params?: any) {
  const { data } = await api.get('/finance/invoices/details', { params });
  return data as any[];
}
```

### 2. Data Flow
1. **Page load**: Gọi `financeApi.listInvoicesWithDetails()` để lấy danh sách invoices
2. **Button click**: Mở modal và trigger `financeApi.getContainersNeedInvoice()`
3. **Modal data**: Hiển thị danh sách container từ API response
4. **Create invoice**: Nút "Tạo hóa đơn" trong modal (TODO: implement logic tạo hóa đơn)

## UI/UX Design

### 1. Color Scheme
- **Primary button**: `#28a745` (xanh lá)
- **Type badges**:
  - IMPORT: `#e3f2fd` background, `#1976d2` text
  - EXPORT: `#f3e5f5` background, `#7b1fa2` text
  - CONVERT: `#e8f5e8` background, `#2e7d32` text
- **Status badges**:
  - IN_YARD: `#fff3e0` background, `#f57c00` text
  - IN_CAR: `#e8f5e8` background, `#2e7d32` text
  - GATE_OUT: `#e3f2fd` background, `#1976d2` text

### 2. Responsive Design
- **Modal width**: 90% viewport width, max 1000px
- **Table**: Horizontal scroll cho màn hình nhỏ
- **Mobile friendly**: Touch-friendly buttons và spacing

### 3. User Experience
- **Loading states**: SWR tự động quản lý loading
- **Error handling**: Hiển thị error message nếu API fail
- **Empty states**: Message "Không có container nào cần tạo hóa đơn"
- **Accessibility**: Keyboard navigation và screen reader support

## Code Structure

### 1. File Organization
```
frontend/
├── pages/finance/invoices/
│   └── index.tsx                    # Main page component
├── components/
│   └── ContainersNeedInvoiceModal.tsx # Modal component
└── services/
    └── finance.ts                   # API service
```

### 2. Component Dependencies
- **Header**: Navigation component
- **Card**: UI wrapper component
- **SWR**: Data fetching library
- **Styled JSX**: CSS-in-JS styling

### 3. State Management
- **Local state**: Modal open/close state
- **Server state**: Container list và invoice list (managed by SWR)
- **Form state**: Filter dropdown selection

## Future Enhancements

### 1. Create Invoice Flow
- **Modal form**: Form tạo hóa đơn cho container được chọn
- **Cost integration**: Tích hợp chi phí sửa chữa và LOLO
- **EIR upload**: Cho phép upload file EIR (PDF/Image)

### 2. Advanced Features
- **Bulk operations**: Tạo hóa đơn cho nhiều container cùng lúc
- **Cost calculation**: Tự động tính tổng chi phí dựa trên RepairTicket và ForkliftTask
- **Invoice templates**: Template hóa đơn theo loại container

### 3. Performance Optimizations
- **Pagination**: Phân trang cho danh sách container dài
- **Search/filter**: Tìm kiếm và lọc container theo nhiều tiêu chí
- **Caching**: Cache dữ liệu container để giảm API calls

## Testing Considerations

### 1. Unit Tests
- Component rendering với các props khác nhau
- State management (modal open/close)
- API integration và error handling

### 2. Integration Tests
- End-to-end flow từ page load đến modal display
- API response handling và data display
- User interactions (button clicks, modal navigation)

### 3. Accessibility Tests
- Keyboard navigation
- Screen reader compatibility
- Color contrast compliance

## Deployment Notes

### 1. Build Requirements
- Next.js 12+ với TypeScript
- SWR library cho data fetching
- Styled JSX cho styling

### 2. Environment Variables
- API base URL configuration
- Feature flags cho enable/disable tính năng

### 3. Monitoring
- API response time monitoring
- Error tracking cho modal failures
- User interaction analytics

## Troubleshooting

### 1. Button "Hoàn tất" không hoạt động
**Triệu chứng**: Click nút "Hoàn tất" nhưng không tạo hóa đơn, thay vào đó hiển thị dialog chọn file
**Nguyên nhân**: Xung đột event handler hoặc file input được trigger
**Giải pháp**: 
- Đã thêm `type="button"` cho tất cả button
- Ẩn file input với `style={{ display: 'none' }}`
- Thêm console.log để debug
- Kiểm tra browser console để xem debug logs

### 2. Logic tạo hóa đơn sau khi click "Hoàn tất"
**Workflow**:
1. Click "Hoàn tất" → Gọi API `POST /finance/invoices`
2. Nếu thành công → Cập nhật `has_invoice = true`
3. Hiển thị thông báo "Tạo hóa đơn thành công!"
4. Đóng modal và refresh trang
5. Container bị xóa khỏi danh sách (vì `has_invoice = true`)

**Thông báo lỗi**:
- **400**: "Dữ liệu hóa đơn không hợp lệ!"
- **401**: "Không có quyền tạo hóa đơn!"
- **500**: "Lỗi server! Vui lòng thử lại sau."
- **Khác**: Hiển thị message từ server

### 2. Chi phí hiển thị khác nhau
**Triệu chứng**: Chi phí trong popup khác với chi phí trong bảng Maintenance
**Nguyên nhân**: Cách tính toán chi phí khác nhau
**Giải pháp**: 
- Popup: Chỉ sử dụng `estimated_cost` (không bao gồm `labor_cost`)
- Bảng Maintenance: Hiển thị `estimated_cost`
- Đã sửa để hai nơi hiển thị giống nhau

### 3. Modal không hiển thị
- Kiểm tra console errors
- Verify JWT token
- Check role permissions

### 4. Không load được chi phí
- Kiểm tra API endpoints
- Verify container_no format
- Check database connections

### 5. Upload EIR thất bại
- Kiểm tra file size và type
- Verify uploads directory permissions
- Check multer configuration

### 6. Tạo hóa đơn thất bại
- Kiểm tra customer_id
- Verify items data structure
- Check invoice API endpoint

### 7. Không cập nhật được has_invoice
- Kiểm tra request_id
- Verify RequestStatusController
- Check database permissions
