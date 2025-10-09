# 🔧 Sửa Lỗi Container Suggestion cho Trạng Thái REJECTED

## 📋 Vấn đề

Khi tạo yêu cầu nâng container, hệ thống không hiển thị container trong dropdown gợi ý nếu container đó có yêu cầu nâng trước đó bị từ chối (REJECTED).

## 🔍 Nguyên nhân

1. **Logic gợi ý container** trong API `getContainersInYardByShippingLine` đã có xử lý cho container REJECTED
2. **Thiếu kiểm tra shipping_line_id** trong logic xử lý container REJECTED
3. **Debug log không đầy đủ** để theo dõi quá trình xử lý

## ✅ Giải pháp đã thực hiện

### 1. **Sửa Logic Kiểm Tra Shipping Line ID**

**File**: `DepotManager/backend/modules/containers/controller/ContainerController.ts`

**Trước**:
```typescript
if (importRequest) {
  // Xử lý container REJECTED
}
```

**Sau**:
```typescript
if (importRequest && importRequest.shipping_line_id === shipping_line_id) {
  // Xử lý container REJECTED với kiểm tra shipping_line_id
}
```

### 2. **Cải thiện Debug Logging**

Thêm debug log chi tiết để theo dõi quá trình xử lý:

```typescript
console.log(`🔍 [Container Suggestion] Container ${container_no} - EXPORT REJECTED request details:`, {
  request_id: latestServiceRequest.id,
  status: latestServiceRequest.status,
  type: latestServiceRequest.type,
  shipping_line_id: latestServiceRequest.shipping_line_id,
  requested_shipping_line_id: shipping_line_id
});
```

### 3. **Cải thiện Error Handling**

Thêm thông báo lỗi chi tiết khi shipping_line_id không khớp:

```typescript
} else {
  if (!importRequest) {
    console.log(`⚠️ [Container Suggestion] Container ${container_no} không tìm thấy ServiceRequest IMPORT hợp lệ`);
  } else {
    console.log(`⚠️ [Container Suggestion] Container ${container_no} có ServiceRequest IMPORT nhưng shipping_line_id không khớp (${importRequest.shipping_line_id} vs ${shipping_line_id})`);
  }
}
```

## 🔄 Logic Xử Lý Container REJECTED

### **Điều kiện để container REJECTED xuất hiện trong gợi ý:**

1. **Container có ServiceRequest EXPORT với status = 'REJECTED'**
2. **Container có ServiceRequest IMPORT với shipping_line_id khớp**
3. **Container có quality = 'GOOD'** (từ bảng Container hoặc RepairTicket COMPLETE)
4. **Container vẫn ở trong yard** (YardPlacement status = 'OCCUPIED')

### **Flow xử lý:**

```
Container trong Yard
    ↓
Tìm ServiceRequest mới nhất
    ↓
Kiểm tra: type = 'EXPORT' && status = 'REJECTED'
    ↓
Tìm ServiceRequest IMPORT gần nhất
    ↓
Kiểm tra: shipping_line_id khớp
    ↓
Kiểm tra: container_quality = 'GOOD'
    ↓
Thêm vào danh sách gợi ý với note: "Có thể nâng lại sau khi hủy yêu cầu trước đó"
```

## 🧪 Test Script

Tạo file `test-container-suggestion-rejected.js` để test logic:

```javascript
// Test API endpoint
GET /containers/yard/by-shipping-line/{shipping_line_id}?q={search_query}

// Kiểm tra containers có note về REJECTED
const rejectedContainers = containers.filter(container => 
    container.note && container.note.includes('hủy yêu cầu')
);
```

## 📊 Kết quả mong đợi

Sau khi sửa, container có trạng thái REJECTED sẽ:

1. **Xuất hiện trong dropdown gợi ý** khi tạo yêu cầu nâng mới
2. **Hiển thị ghi chú** "Có thể nâng lại sau khi hủy yêu cầu trước đó"
3. **Có đầy đủ thông tin** về vị trí, customer, container type
4. **Được log chi tiết** trong console để debug

## 🔧 Cách test

1. **Tạo yêu cầu nâng container** và hủy nó (status = REJECTED)
2. **Mở form tạo yêu cầu nâng mới**
3. **Chọn shipping line** tương ứng
4. **Kiểm tra dropdown container** - container REJECTED sẽ xuất hiện
5. **Chạy test script** để kiểm tra API response

## 🐛 Vấn đề đã phát hiện và sửa

### **Debug Log cho thấy:**
```
🔄 [Container Suggestion] Container SA11 có yêu cầu nâng bị hủy, kiểm tra khả năng nâng lại
⚠️ [Container Suggestion] Container SA11 không tìm thấy ServiceRequest IMPORT hợp lệ
```

### **Nguyên nhân:**
- Container SA11 có **ServiceRequest EXPORT REJECTED** ✅
- Nhưng **KHÔNG có ServiceRequest IMPORT** tương ứng ❌
- Container này là **EMPTY_IN_YARD** (SystemAdmin thêm) có EXPORT REJECTED

### **Giải pháp đã bổ sung:**
Thêm logic xử lý cho trường hợp **container EMPTY_IN_YARD có EXPORT REJECTED**:

```typescript
// Xử lý container EMPTY_IN_YARD có EXPORT REJECTED
if (container && container.shipping_line_id === shipping_line_id) {
  // Kiểm tra container_quality và thêm vào danh sách gợi ý
  result.push({
    // ... container details
    service_status: 'EMPTY_IN_YARD',
    request_type: 'SYSTEM_ADMIN_ADDED',
    note: 'Có thể nâng lại sau khi hủy yêu cầu trước đó (EMPTY_IN_YARD)'
  });
}
```

## 📝 Lưu ý

- Logic này chỉ áp dụng cho container có **ServiceRequest EXPORT bị REJECTED**
- Container phải có **ServiceRequest IMPORT** với shipping_line_id khớp
- Container phải có **quality = 'GOOD'** để đảm bảo an toàn
- Debug logs sẽ giúp theo dõi quá trình xử lý trong console
