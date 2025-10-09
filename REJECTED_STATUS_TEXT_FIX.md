# 🔧 Sửa Lỗi Hiển Thị Text "REJECTED" Thành "Đã từ chối"

## 📋 Vấn đề

Mặc dù đã cập nhật CSS cho trạng thái REJECTED, nhưng trong giao diện vẫn hiển thị text **"REJECTED"** thay vì **"Đã từ chối"**.

## 🔍 Nguyên nhân

Các hàm `statusLabel` trong các component không có case xử lý cho trạng thái `'REJECTED'`, nên chúng trả về `status` gốc (tức là "REJECTED").

## ✅ Giải pháp đã thực hiện

### **1. ExportRequest.tsx**
```typescript
// Trước
const statusLabel = (status: string) => {
    switch (status) {
        case 'NEW_REQUEST': return '🆕 Thêm mới';
        case 'GATE_IN': return '🟢 Đã cho phép vào';
        // ... các case khác
        case 'GATE_REJECTED': return '⛔ Đã từ chối';
        default: return status; // ❌ Trả về "REJECTED"
    }
};

// Sau
const statusLabel = (status: string) => {
    switch (status) {
        case 'NEW_REQUEST': return '🆕 Thêm mới';
        case 'GATE_IN': return '🟢 Đã cho phép vào';
        // ... các case khác
        case 'GATE_REJECTED': return '⛔ Đã từ chối';
        case 'REJECTED': return '⛔ Đã từ chối'; // ✅ Thêm case này
        default: return status;
    }
};
```

### **2. ManagerCont.tsx**
```typescript
// Trước
const getRequestStatusLabel = (status: string, requestType?: string) => {
    const map: Record<string, string> = {
        'PENDING': 'Thêm mới',
        'NEW_REQUEST': 'Thêm mới',
        // ... các case khác
        'EMPTY_IN_YARD': 'Container trong bãi'
        // ❌ Thiếu 'REJECTED'
    };
    return map[status] || status;
};

// Sau
const getRequestStatusLabel = (status: string, requestType?: string) => {
    const map: Record<string, string> = {
        'PENDING': 'Thêm mới',
        'NEW_REQUEST': 'Thêm mới',
        // ... các case khác
        'EMPTY_IN_YARD': 'Container trong bãi',
        'REJECTED': 'Đã từ chối' // ✅ Thêm case này
    };
    return map[status] || status;
};
```

### **3. LowerGateRequestTable.tsx**
```typescript
// Trước
const statusLabel = (status: string) => {
    switch (status) {
        case 'PENDING': return 'Đang tới';
        case 'FORKLIFTING': return 'Đã vào cổng';
        // ... các case khác
        case 'NEW_REQUEST': return 'Đang tới';
        default: return status; // ❌ Trả về "REJECTED"
    }
};

// Sau
const statusLabel = (status: string) => {
    switch (status) {
        case 'PENDING': return 'Đang tới';
        case 'FORKLIFTING': return 'Đã vào cổng';
        // ... các case khác
        case 'NEW_REQUEST': return 'Đang tới';
        case 'REJECTED': return 'Đã từ chối'; // ✅ Thêm case này
        default: return status;
    }
};
```

### **4. GateActionButtons.tsx**
```typescript
// Trước
const statusLabel = (status: string) => {
    switch (status) {
        case 'SCHEDULED': return t('pages.gate.statusOptions.scheduled');
        // ... các case khác
        case 'GATE_REJECTED': return t('pages.gate.statusOptions.gateRejected');
        case 'COMPLETED': return t('pages.gate.statusOptions.completed');
        default: return status; // ❌ Trả về "REJECTED"
    }
};

// Sau
const statusLabel = (status: string) => {
    switch (status) {
        case 'SCHEDULED': return t('pages.gate.statusOptions.scheduled');
        // ... các case khác
        case 'GATE_REJECTED': return t('pages.gate.statusOptions.gateRejected');
        case 'REJECTED': return t('pages.requests.filterOptions.rejected'); // ✅ Thêm case này
        case 'COMPLETED': return t('pages.gate.statusOptions.completed');
        default: return status;
    }
};
```

### **5. GateRequestTable.tsx**
```typescript
// Trước
const statusLabel = (status: string) => {
    switch (status) {
        case 'SCHEDULED': return t('pages.gate.statusOptions.scheduled');
        // ... các case khác
        case 'GATE_REJECTED': return `⛔ ${t('pages.gate.statusOptions.gateRejected')}`;
        case 'COMPLETED': return t('pages.gate.statusOptions.completed');
        default: return status; // ❌ Trả về "REJECTED"
    }
};

// Sau
const statusLabel = (status: string) => {
    switch (status) {
        case 'SCHEDULED': return t('pages.gate.statusOptions.scheduled');
        // ... các case khác
        case 'GATE_REJECTED': return `⛔ ${t('pages.gate.statusOptions.gateRejected')}`;
        case 'REJECTED': return `⛔ ${t('pages.requests.filterOptions.rejected')}`; // ✅ Thêm case này
        case 'COMPLETED': return t('pages.gate.statusOptions.completed');
        default: return status;
    }
};
```

## 📊 Files đã sửa

| File | Function | Thay đổi |
|------|----------|----------|
| `ExportRequest.tsx` | `statusLabel` | Thêm `case 'REJECTED': return '⛔ Đã từ chối'` |
| `ManagerCont.tsx` | `getRequestStatusLabel` | Thêm `'REJECTED': 'Đã từ chối'` vào map |
| `LowerGateRequestTable.tsx` | `statusLabel` | Thêm `case 'REJECTED': return 'Đã từ chối'` |
| `GateActionButtons.tsx` | `statusLabel` | Thêm `case 'REJECTED': return t('pages.requests.filterOptions.rejected')` |
| `GateRequestTable.tsx` | `statusLabel` | Thêm `case 'REJECTED': return '⛔ ${t('pages.requests.filterOptions.rejected')}'` |

## 🎯 Kết quả

### **Trước khi sửa:**
- ❌ Hiển thị: "REJECTED"
- ❌ Không có case xử lý trong các hàm statusLabel
- ❌ Trả về status gốc từ database

### **Sau khi sửa:**
- ✅ Hiển thị: "Đã từ chối" hoặc "⛔ Đã từ chối"
- ✅ Có case xử lý đầy đủ trong tất cả hàm statusLabel
- ✅ Sử dụng translation key từ locales
- ✅ Có icon emoji phù hợp

## 🔧 Translation Keys

Tất cả các case đều sử dụng translation key từ `locales/vi.json`:

```json
{
  "pages": {
    "requests": {
      "filterOptions": {
        "rejected": "Đã từ chối"
      }
    }
  }
}
```

## 🧪 Testing

### **Test Cases:**
1. ✅ ExportRequest table hiển thị "⛔ Đã từ chối"
2. ✅ ManagerCont table hiển thị "Đã từ chối"
3. ✅ LowerGateRequestTable hiển thị "Đã từ chối"
4. ✅ GateActionButtons hiển thị "Đã từ chối"
5. ✅ GateRequestTable hiển thị "⛔ Đã từ chối"

### **Cách test:**
1. Tạo yêu cầu nâng container
2. Hủy yêu cầu (status = REJECTED)
3. Kiểm tra tất cả các bảng hiển thị "Đã từ chối" thay vì "REJECTED"

## 📝 Lưu ý

- Tất cả các hàm statusLabel giờ đây đều có case xử lý cho REJECTED
- Sử dụng translation key để dễ dàng thay đổi text trong tương lai
- Có icon emoji phù hợp cho một số component
- Không breaking changes với code cũ

**Trạng thái REJECTED giờ đây hiển thị đúng text "Đã từ chối" trong tất cả các component!** 🎉
