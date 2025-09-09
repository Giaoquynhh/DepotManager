# Status Display Consistency Fix - v2025-01-27

## 📋 Tổng quan

Tài liệu này mô tả việc đảm bảo tính nhất quán trong hiển thị trạng thái container giữa các trang khác nhau trong frontend sau khi sửa lỗi đồng bộ backend.

## 🎯 Vấn đề đã được giải quyết

### **Mô tả vấn đề:**
- Container hiển thị status `CHECKING` trong trang Requests/Depot và Requests/Customer
- Nhưng cùng container đó hiển thị status `CHECKED` trong trang Maintenance/Repairs
- Gây ra sự nhầm lẫn cho người dùng về trạng thái thực tế của container

### **Nguyên nhân:**
- Backend không đồng bộ trạng thái giữa `RepairTicket` và `ServiceRequest`
- Frontend hiển thị dữ liệu từ `ServiceRequest` (Requests pages) và `RepairTicket` (Maintenance page) riêng biệt
- Không có cơ chế đồng bộ real-time giữa các module

## 🔧 Giải pháp đã thực hiện

### **1. Backend Sync Logic (Đã hoàn thành)**
- Khôi phục logic đồng bộ tự động giữa RepairTicket và ServiceRequest
- Khi RepairTicket được cập nhật thành `CHECKED` → ServiceRequest tự động cập nhật thành `CHECKED`
- Có API endpoint để đồng bộ thủ công nếu cần

### **2. Frontend Status Display (Không cần thay đổi)**
- Frontend đã có logic hiển thị trạng thái đúng
- Các component đã được thiết kế để hiển thị status từ database
- SWR cache sẽ tự động refresh khi backend cập nhật dữ liệu

## 📱 Các trang hiển thị trạng thái

### **1. Requests/Depot Page**
**File:** `pages/Requests/Depot.tsx`
**Component:** `DepotRequestTable.tsx`
**Data Source:** ServiceRequest table
**Status Mapping:**
```typescript
const getStatusLabel = (status: string) => {
  const statusConfig: Record<string, string> = {
    CHECKING: safeT('pages.requests.filterOptions.checking', 'Checking'),
    CHECKED: safeT('pages.requests.filterOptions.checked', 'Checked'),
    // ... other statuses
  };
  return statusConfig[status] || status;
};
```

### **2. Requests/Customer Page**
**File:** `pages/Requests/Customer.tsx`
**Component:** `RequestTable.tsx`
**Data Source:** ServiceRequest table
**Status Mapping:**
```typescript
const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { label: string; className: string }> = {
    CHECKING: { label: t('pages.requests.filterOptions.checking'), className: 'status-checking' },
    CHECKED: { label: t('pages.requests.filterOptions.checked'), className: 'status-checked' },
    // ... other statuses
  };
  return statusConfig[status] || { label: status, className: 'status-default' };
};
```

### **3. Maintenance/Repairs Page**
**File:** `pages/Maintenance/Repairs.tsx`
**Component:** `RepairTable.tsx`
**Data Source:** RepairTicket table
**Status Mapping:**
```typescript
// RepairTicket status được hiển thị trực tiếp từ database
// Status: CHECKING, PENDING_ACCEPT, ACCEPT, REPAIRING, CHECKED, REJECTED
```

## 🔄 Cơ chế đồng bộ Frontend

### **1. SWR Auto-refresh**
```typescript
// Trong các trang Requests
const { data, error, isLoading, isValidating } = useSWR('/requests?page=1&limit=20', fetcher, {
  revalidateOnFocus: true, // Tự động cập nhật khi focus vào tab
  revalidateOnReconnect: true, // Tự động cập nhật khi kết nối lại
  refreshInterval: 30000, // Tự động cập nhật mỗi 30 giây
  dedupingInterval: 5000, // Tránh duplicate requests trong 5 giây
});
```

### **2. Manual Cache Invalidation**
```typescript
// Khi có thay đổi status, invalidate cache
mutate('/requests?page=1&limit=20');
mutate((key) => typeof key === 'string' && key.startsWith('/requests'));
```

### **3. Real-time Updates**
- Backend đồng bộ tự động khi RepairTicket thay đổi
- Frontend tự động nhận dữ liệu mới qua SWR
- Không cần thay đổi code frontend

## 🎨 UI/UX Improvements

### **Status Badge Styling**
```css
/* status-checking */
.status-checking {
  background: #fef3c7;
  color: #92400e;
}

/* status-checked */
.status-checked {
  background: #d1fae5;
  color: #065f46;
}
```

### **Consistent Status Labels**
- **CHECKING:** "Đang kiểm tra" / "Checking"
- **CHECKED:** "Đã kiểm tra" / "Checked"
- **REJECTED:** "Từ chối" / "Rejected"

## 📊 Kết quả sau khi sửa

### **Trước khi sửa:**
- Maintenance/Repairs: ISO 1113 = "Đã kiểm tra" (CHECKED)
- Requests/Depot: ISO 1113 = "Đang kiểm tra" (CHECKING) ❌
- Requests/Customer: ISO 1113 = "Đang kiểm tra" (CHECKING) ❌

### **Sau khi sửa:**
- Maintenance/Repairs: ISO 1113 = "Đã kiểm tra" (CHECKED) ✅
- Requests/Depot: ISO 1113 = "Đã kiểm tra" (CHECKED) ✅
- Requests/Customer: ISO 1113 = "Đã kiểm tra" (CHECKED) ✅

## 🔍 Debug và Monitoring

### **1. Console Logs**
Frontend sẽ hiển thị logs khi có thay đổi dữ liệu:
```javascript
console.log('🔍 Depot: useEffect triggered with data:', data);
console.log('🔍 Depot: Setting requestsData with:', data.data.length, 'items');
```

### **2. Network Tab**
Kiểm tra API calls để đảm bảo dữ liệu được fetch đúng:
- `GET /requests?page=1&limit=20` - Lấy danh sách requests
- `GET /maintenance/repairs?status=CHECKED` - Lấy danh sách repairs

### **3. Database Verification**
```sql
-- Kiểm tra trạng thái đồng bộ
SELECT 
  rt.container_no,
  rt.status as repair_status,
  sr.status as request_status
FROM "RepairTicket" rt
LEFT JOIN "ServiceRequest" sr ON sr.container_no = rt.container_no
WHERE rt.container_no = 'ISO 1113'
ORDER BY rt.updatedAt DESC, sr.createdAt DESC;
```

## 🗂️ Files liên quan

### **Frontend Components:**
- `pages/Requests/Depot.tsx` - Trang depot requests
- `pages/Requests/Customer.tsx` - Trang customer requests  
- `pages/Maintenance/Repairs.tsx` - Trang maintenance repairs
- `components/RequestTable.tsx` - Component hiển thị request table
- `components/Maintenance/RepairTable.tsx` - Component hiển thị repair table
- `components/Maintenance/PendingContainersModal.tsx` - Modal pending containers

### **Backend Services:**
- `modules/maintenance/service/MaintenanceService.ts` - Logic đồng bộ
- `modules/requests/service/RequestBaseService.ts` - Service request logic
- `modules/requests/service/RequestStateMachine.ts` - State machine

### **API Endpoints:**
- `GET /requests` - Lấy danh sách requests
- `GET /maintenance/repairs` - Lấy danh sách repairs
- `POST /maintenance/repairs/sync-status` - Đồng bộ thủ công

## 🚀 Best Practices

### **1. Status Consistency**
- Luôn sử dụng cùng một mapping cho status labels
- Đảm bảo styling nhất quán cho các status badges
- Sử dụng translation keys thay vì hardcode text

### **2. Error Handling**
- Xử lý lỗi khi fetch dữ liệu
- Hiển thị loading states khi cần thiết
- Fallback cho các trường hợp dữ liệu không có

### **3. Performance**
- Sử dụng SWR để cache dữ liệu
- Debounce search và filter
- Lazy loading cho các component lớn

## ⚠️ Lưu ý quan trọng

1. **Cache Management:** SWR cache có thể cần được clear khi có thay đổi lớn
2. **Real-time Updates:** Cần monitor để đảm bảo đồng bộ hoạt động đúng
3. **User Experience:** Status changes cần được hiển thị rõ ràng cho user
4. **Error Recovery:** Có cơ chế retry khi đồng bộ thất bại

---

**Tác giả:** AI Assistant  
**Ngày cập nhật:** 2025-01-27  
**Phiên bản:** 1.0  
**Trạng thái:** ✅ Hoàn thành
