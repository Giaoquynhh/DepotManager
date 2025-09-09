# Frontend Implementation: ViewQuote Feature

## Tổng quan

Tính năng `viewquote` kiểm soát quyền xem hóa đơn sửa chữa ở các trang khác nhau trong hệ thống frontend. Tính năng này được implement thông qua conditional rendering dựa trên giá trị `viewquote` từ API.

## Luồng hoạt động

```
1. Maintenance/Repairs (viewquote = 0)
   ↓ Click "Gửi yêu cầu xác nhận"
2. Depot có thể xem hóa đơn (viewquote = 1)
   ↓ Click "Gửi xác nhận"
3. Customer có thể xem hóa đơn và quyết định (viewquote = 2)
```

## Components được cập nhật

### 1. DepotRequestTable.tsx

**File**: `frontend/pages/Requests/components/DepotRequestTable.tsx`

#### Thay đổi chính
- Thêm điều kiện `item.viewquote === 1` cho việc hiển thị actions
- Chỉ hiển thị button "Xem hóa đơn" và "Gửi xác nhận" khi `viewquote = 1`

#### Code mới
```typescript
{/* PENDING_ACCEPT Status Actions - chỉ hiển thị khi viewquote = 1 */}
{item.status === 'PENDING_ACCEPT' && item.viewquote === 1 && (
    <div className="action-group">
        <button
            className="btn btn-sm btn-info"
            disabled={loadingId === item.id + 'VIEW_INVOICE'}
            onClick={() => onViewInvoice?.(item.id)}
            title={safeT('pages.requests.actions.viewRepairInvoiceTitle', 'View repair invoice')}
        >
            {loadingId === item.id + 'VIEW_INVOICE' ? '⏳' : '📄'} {safeT('pages.requests.actions.viewRepairInvoice', 'View invoice')}
        </button>
        <button
            className="btn btn-sm btn-success"
            disabled={loadingId === item.id + 'CONFIRM'}
            onClick={() => onSendCustomerConfirmation?.(item.id)}
            title={safeT('pages.requests.actions.sendConfirmationTitle', 'Send confirmation to customer')}
        >
            {loadingId === item.id + 'CONFIRM' ? '⏳' : '📧'} {safeT('pages.requests.actions.sendConfirmation', 'Send confirmation')}
        </button>
    </div>
)}
```

### 2. RequestTable.tsx (Customer)

**File**: `frontend/components/RequestTable.tsx`

#### Thay đổi chính
- Thêm `viewquote?: number` vào interface `Request`
- Thêm điều kiện `item.viewquote === 2` cho việc hiển thị actions
- Chỉ hiển thị actions khi `viewquote = 2`

#### Interface cập nhật
```typescript
interface Request {
  id: string;
  type: string;
  container_no: string;
  eta: string;
  status: string;
  rejected_reason?: string;
  latest_payment?: any;
  documents?: any[];
  has_invoice?: boolean;
  is_paid?: boolean;
  appointment_time?: string;
  appointment_location_type?: string;
  appointment_location_id?: string;
  appointment_note?: string;
  viewquote?: number; // ✅ New field
}
```

#### Code mới
```typescript
{/* Actions for PENDING_ACCEPT requests (Customer only) - chỉ hiển thị khi viewquote = 2 */}
{item.status === 'PENDING_ACCEPT' && item.viewquote === 2 && userRole && ['CustomerAdmin', 'CustomerUser'].includes(userRole) && (
    <>
        <button className="btn btn-sm btn-info" /* ... */ >
            📄 {t('pages.requests.actions.viewRepairInvoice')}
        </button>
        <button className="btn btn-sm btn-success" /* ... */ >
            ✅ {t('pages.requests.actions.accept')}
        </button>
        <button className="btn btn-sm btn-danger" /* ... */ >
            ❌ {t('pages.requests.actions.reject')}
        </button>
    </>
)}
```

### 3. useDepotActions.ts

**File**: `frontend/pages/Requests/hooks/useDepotActions.ts`

#### Thay đổi chính
- Cập nhật `handleSendCustomerConfirmation` để gọi API thực sự thay vì TODO

#### Code mới
```typescript
// Gửi xác nhận cho khách hàng
const handleSendCustomerConfirmation = async (id: string) => {
    setMsg(null);
    setLoadingId(id + 'CONFIRM');
    try {
        const response = await api.post(`/requests/${id}/send-customer-confirmation`);
        setMsg({ text: response.data.message || safeT('pages.requests.messages.customerConfirmationSent', 'Customer confirmation sent successfully'), ok: true });
    } catch (e: any) {
        setMsg({ text: `${safeT('pages.requests.messages.sendConfirmationFailed', 'Send confirmation failed')}: ${e?.response?.data?.message || safeT('common.error', 'Error')}`, ok: false });
    } finally {
        setLoadingId('');
    }
};
```

## API Integration

### 1. API Endpoints được sử dụng

#### `POST /requests/:id/send-customer-confirmation`
- **Mô tả**: Depot gửi xác nhận cho khách hàng
- **Authorization**: SaleAdmin, SystemAdmin
- **Response**: `{ success: true, message: "..." }`

### 2. Data Flow

1. **Maintenance/Repairs** → Click "Gửi yêu cầu xác nhận"
   - API: `POST /maintenance/repairs/:id/confirmation-request`
   - Kết quả: `viewquote = 1`

2. **Requests/Depot** → Hiển thị buttons khi `viewquote = 1`
   - API: `GET /requests` (trả về `viewquote` trong response)
   - UI: Hiển thị "Xem hóa đơn" và "Gửi xác nhận"

3. **Requests/Depot** → Click "Gửi xác nhận"
   - API: `POST /requests/:id/send-customer-confirmation`
   - Kết quả: `viewquote = 2`

4. **Requests/Customer** → Hiển thị actions khi `viewquote = 2`
   - API: `GET /requests` (trả về `viewquote` trong response)
   - UI: Hiển thị "Xem hóa đơn", "Chấp nhận", "Từ chối"

## Conditional Rendering Logic

### Depot Page
```typescript
// Chỉ hiển thị khi PENDING_ACCEPT và viewquote = 1
{item.status === 'PENDING_ACCEPT' && item.viewquote === 1 && (
    <div className="action-group">
        {/* View Invoice Button */}
        {/* Send Confirmation Button */}
    </div>
)}
```

### Customer Page
```typescript
// Chỉ hiển thị khi PENDING_ACCEPT và viewquote = 2
{item.status === 'PENDING_ACCEPT' && item.viewquote === 2 && userRole && ['CustomerAdmin', 'CustomerUser'].includes(userRole) && (
    <>
        {/* View Invoice Button */}
        {/* Accept Button */}
        {/* Reject Button */}
    </>
)}
```

## State Management

### 1. Loading States
- `loadingId` được sử dụng để disable buttons khi đang xử lý
- Format: `item.id + 'CONFIRM'` cho send confirmation action

### 2. Message States
- `msg` object chứa thông báo thành công/lỗi
- `setMsg({ text: "...", ok: true/false })`

### 3. Data Refresh
- Sau khi thực hiện action thành công, data sẽ được refresh tự động
- Sử dụng SWR để revalidate data

## Error Handling

### 1. API Errors
```typescript
try {
    const response = await api.post(`/requests/${id}/send-customer-confirmation`);
    setMsg({ text: response.data.message, ok: true });
} catch (e: any) {
    setMsg({ text: `Error: ${e?.response?.data?.message || 'Unknown error'}`, ok: false });
}
```

### 2. Loading States
```typescript
disabled={loadingId === item.id + 'CONFIRM'}
{loadingId === item.id + 'CONFIRM' ? '⏳' : '📧'}
```

## Testing

### 1. Test Cases

#### Test Case 1: viewquote = 0
- **Setup**: Tạo phiếu sửa chữa mới
- **Expected**: Chỉ Maintenance/Repairs có thể xem hóa đơn
- **Verify**: Depot và Customer không hiển thị actions

#### Test Case 2: viewquote = 1
- **Setup**: Click "Gửi yêu cầu xác nhận" ở Maintenance/Repairs
- **Expected**: Depot hiển thị "Xem hóa đơn" và "Gửi xác nhận"
- **Verify**: Customer vẫn chưa hiển thị actions

#### Test Case 3: viewquote = 2
- **Setup**: Click "Gửi xác nhận" ở Depot
- **Expected**: Customer hiển thị "Xem hóa đơn", "Chấp nhận", "Từ chối"
- **Verify**: Depot vẫn hiển thị actions (có thể cần cập nhật logic)

### 2. Manual Testing Steps

1. **Tạo phiếu sửa chữa**
   - Vào `http://localhost:5002/Maintenance/Repairs`
   - Tạo phiếu mới với status `PENDING_ACCEPT`
   - Verify `viewquote = 0`

2. **Gửi yêu cầu xác nhận**
   - Click "Gửi yêu cầu xác nhận"
   - Verify `viewquote = 1`
   - Vào `http://localhost:5002/Requests/Depot`
   - Verify buttons xuất hiện

3. **Gửi xác nhận cho khách hàng**
   - Click "Gửi xác nhận" ở Depot
   - Verify `viewquote = 2`
   - Vào `http://localhost:5002/Requests/Customer`
   - Verify actions xuất hiện

## Future Enhancements

### 1. UI Improvements
- [ ] Thêm tooltip giải thích viewquote
- [ ] Thêm visual indicator cho trạng thái viewquote
- [ ] Thêm confirmation modal cho các actions

### 2. UX Improvements
- [ ] Auto-refresh data sau khi thực hiện action
- [ ] Thêm loading skeleton cho buttons
- [ ] Thêm success animation

### 3. Error Handling
- [ ] Retry mechanism cho failed requests
- [ ] Better error messages
- [ ] Offline support

## Dependencies

### 1. External Libraries
- `swr` - Data fetching và caching
- `axios` - HTTP client
- `react` - UI framework

### 2. Internal Dependencies
- `@services/api` - API client
- `@hooks/useTranslation` - Internationalization
- `@components/RequestTable` - Base table component

## File Structure

```
frontend/
├── pages/
│   ├── Requests/
│   │   ├── Depot.tsx                    # Depot page
│   │   ├── Customer.tsx                 # Customer page
│   │   └── components/
│   │       └── DepotRequestTable.tsx    # Depot table component
├── components/
│   └── RequestTable.tsx                 # Customer table component
└── pages/Requests/hooks/
    └── useDepotActions.ts               # Depot actions hook
```

---

**Ngày tạo:** 2025-09-09  
**Phiên bản:** 1.0.0  
**Tác giả:** Development Team  
**Trạng thái:** ✅ Hoàn thành implementation
