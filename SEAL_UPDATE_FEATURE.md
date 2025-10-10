# Tính Năng Cập Nhật Số Seal trong ManagerCont

## Vấn đề đã giải quyết

Trước đây, khi user cập nhật số seal mới trong ManagerCont, hệ thống chỉ tạo record mới trong lịch sử seal mà không cập nhật lại số seal cũ. Điều này dẫn đến:
- Lịch sử seal có nhiều record trùng lặp
- Không thể theo dõi được việc thay đổi số seal
- Dữ liệu không chính xác

## Giải pháp đã implement

### **1. Backend - SealService.ts**

#### **Method mới: `updateSealUsageHistory`**
```typescript
async updateSealUsageHistory(
  shippingCompany: string, 
  userId: string, 
  oldSealNumber: string, 
  newSealNumber: string, 
  containerNumber?: string, 
  requestId?: string
)
```

#### **Logic xử lý:**
1. **Tìm seal theo hãng tàu** với logic FIFO
2. **Lấy booking number** từ ServiceRequest
3. **Tìm record cũ** trong lịch sử sử dụng:
   - Nếu tìm thấy → **Cập nhật record cũ**
   - Nếu không tìm thấy → **Tạo record mới** và trừ seal quantity

### **2. Backend - SealController.ts**

#### **Endpoint mới: `updateSealUsageHistory`**
```typescript
POST /seals/update-usage-history
```

#### **Request body:**
```json
{
  "shipping_company": "MSC",
  "old_seal_number": "SEAL123",
  "new_seal_number": "SEAL456", 
  "container_number": "ABC123",
  "request_id": "req_123"
}
```

### **3. Frontend - seals.ts**

#### **API method mới:**
```typescript
updateSealUsageHistory: async (
  shippingCompany: string,
  oldSealNumber: string,
  newSealNumber: string,
  containerNumber?: string,
  requestId?: string
): Promise<SealUsageHistoryItem>
```

### **4. Frontend - ManagerCont.tsx**

#### **Logic cập nhật thông minh:**
```typescript
if (selectedRow.sealNumber && selectedRow.sealNumber.trim() !== '') {
  // Có số seal cũ - cập nhật lịch sử
  await sealsApi.updateSealUsageHistory(
    shippingCompanyName,
    selectedRow.sealNumber,    // Số seal cũ
    selectedSealNumber,        // Số seal mới
    selectedRow.containerNumber,
    selectedRow.id
  );
} else {
  // Không có số seal cũ - tạo mới
  await sealsApi.incrementExportedQuantity(
    shippingCompanyName,
    selectedSealNumber,
    selectedRow.containerNumber,
    selectedRow.id
  );
}
```

## Các trường hợp được xử lý

### **Trường hợp 1: Container chưa có số seal**
- **Input**: Container chưa có số seal, user nhập số seal mới
- **Process**: Tạo record mới trong lịch sử seal
- **Output**: Record mới với số seal vừa nhập

### **Trường hợp 2: Container đã có số seal**
- **Input**: Container có số seal cũ "SEAL123", user cập nhật thành "SEAL456"
- **Process**: Tìm và cập nhật record cũ trong lịch sử
- **Output**: Record cũ được cập nhật với số seal mới

### **Trường hợp 3: Container có số seal, user xóa số seal**
- **Input**: Container có số seal, user xóa trường số seal
- **Process**: Không thay đổi gì (giữ nguyên số seal cũ)
- **Output**: Số seal cũ vẫn được giữ nguyên

## Lợi ích

### **1. Dữ liệu chính xác:**
- Không có record trùng lặp trong lịch sử seal
- Theo dõi được việc thay đổi số seal
- Lịch sử seal phản ánh đúng trạng thái hiện tại

### **2. Trải nghiệm người dùng tốt hơn:**
- User có thể cập nhật số seal mà không lo tạo duplicate
- Lịch sử seal sạch sẽ, dễ theo dõi
- Không cần xóa record cũ thủ công

### **3. Tính nhất quán:**
- Logic xử lý thống nhất cho tất cả trường hợp
- Audit log đầy đủ cho mọi thay đổi
- Tương thích với logic FIFO hiện có

## Audit & Logging

### **Audit Log:**
```typescript
await audit(userId, 'SEAL_USAGE_UPDATED', 'SEAL_USAGE', result.id, {
  shipping_company,
  old_seal_number,
  new_seal_number,
  container_number
});
```

### **Console Logs:**
- `✅ Updated existing seal usage history: SEAL123 → SEAL456`
- `✅ Created new seal usage history: SEAL456`

## Files Modified

1. **Backend:**
   - `modules/seal/service/SealService.ts` - Thêm method `updateSealUsageHistory`
   - `modules/seal/controller/SealController.ts` - Thêm controller method
   - `modules/seal/controller/SealRoutes.ts` - Thêm route mới

2. **Frontend:**
   - `services/seals.ts` - Thêm API method
   - `pages/ManagerCont.tsx` - Cập nhật logic xử lý

## Testing Scenarios

### **Scenario 1: Cập nhật số seal lần đầu**
1. Container chưa có số seal
2. User nhập số seal "SEAL123"
3. Hệ thống tạo record mới trong lịch sử seal
4. Seal quantity được trừ đi 1

### **Scenario 2: Cập nhật số seal đã có**
1. Container có số seal "SEAL123"
2. User cập nhật thành "SEAL456"
3. Hệ thống tìm và cập nhật record cũ
4. Số seal trong lịch sử thay đổi từ "SEAL123" → "SEAL456"
5. Seal quantity không thay đổi (vì chỉ cập nhật, không tạo mới)

### **Scenario 3: Cập nhật nhiều lần**
1. Container có số seal "SEAL123"
2. User cập nhật thành "SEAL456"
3. User cập nhật thành "SEAL789"
4. Hệ thống luôn cập nhật cùng 1 record
5. Lịch sử seal chỉ có 1 record với số seal cuối cùng

## Kết luận

Tính năng này giúp:
- **Quản lý seal chính xác hơn**
- **Lịch sử seal sạch sẽ, không duplicate**
- **Theo dõi được việc thay đổi số seal**
- **Trải nghiệm người dùng tốt hơn**

Bây giờ user có thể cập nhật số seal trong ManagerCont một cách linh hoạt mà không lo về việc tạo duplicate records! 🚀
