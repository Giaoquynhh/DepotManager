# Fix Logic Cập Nhật Seal cho Trường Hợp Hãng Tàu Đã Hết Seal

## Vấn đề đã phát hiện

Khi hãng tàu đã hết seal, logic cũ sẽ không tìm thấy seal nào để cập nhật (vì điều kiện `quantity_remaining > 0`), dẫn đến việc tạo record mới thay vì cập nhật record cũ.

### **Ví dụ vấn đề:**
1. Container ABC123 có số seal "SEAL123" từ hãng tàu MSC
2. Hãng tàu MSC đã hết seal (quantity_remaining = 0)
3. User cập nhật số seal thành "SEAL456"
4. **Logic cũ**: Không tìm thấy seal MSC còn số lượng → Tạo record mới
5. **Kết quả**: Lịch sử seal có 2 records thay vì cập nhật 1 record

## Giải pháp đã implement

### **Logic mới (SealService.ts):**

```typescript
async updateSealUsageHistory(
  shippingCompany: string, 
  userId: string, 
  oldSealNumber: string, 
  newSealNumber: string, 
  containerNumber?: string, 
  requestId?: string
) {
  // 1. Lấy booking từ ServiceRequest (không thay đổi)
  
  // 2. Tìm record cũ trong lịch sử sử dụng dựa trên container number và seal number cũ
  const existingHistory = await prisma.sealUsageHistory.findFirst({
    where: {
      container_number: containerNumber,
      seal_number: oldSealNumber
    },
    include: {
      seal: {
        select: {
          shipping_company: true,
          id: true
        }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  if (existingHistory) {
    // 3. Kiểm tra xem seal có thuộc hãng tàu đúng không
    if (existingHistory.seal.shipping_company.toLowerCase().includes(shippingCompany.toLowerCase())) {
      // 4. Cập nhật record cũ (KHÔNG phụ thuộc vào việc seal còn hay hết)
      const updatedHistory = await prisma.sealUsageHistory.update({
        where: { id: existingHistory.id },
        data: {
          seal_number: newSealNumber,
          booking_number: bookingNumber
        }
      });
      return updatedHistory;
    }
  }

  // 5. Nếu không tìm thấy record cũ, tìm seal để tạo mới (với điều kiện còn seal)
  const seal = await prisma.seal.findFirst({
    where: {
      shipping_company: { contains: shippingCompany, mode: 'insensitive' },
      status: 'ACTIVE',
      quantity_remaining: { gt: 0 }  // Chỉ tạo mới khi còn seal
    }
  });

  if (!seal) {
    throw new Error(`Không tìm thấy seal còn số lượng cho hãng tàu: ${shippingCompany}`);
  }

  // 6. Tạo record mới và trừ seal quantity
  // ...
}
```

## Các trường hợp được xử lý

### **Trường hợp 1: Hãng tàu còn seal, có record cũ**
- **Input**: Container ABC123 có seal "SEAL123", user cập nhật thành "SEAL456"
- **Process**: Tìm record cũ → Cập nhật record cũ
- **Output**: Record cũ được cập nhật, seal quantity không thay đổi

### **Trường hợp 2: Hãng tàu đã hết seal, có record cũ**
- **Input**: Container ABC123 có seal "SEAL123", hãng tàu hết seal, user cập nhật thành "SEAL456"
- **Process**: Tìm record cũ → Cập nhật record cũ (KHÔNG cần seal còn)
- **Output**: Record cũ được cập nhật, không tạo record mới

### **Trường hợp 3: Hãng tàu còn seal, không có record cũ**
- **Input**: Container ABC123 chưa có seal, user nhập "SEAL456"
- **Process**: Không tìm thấy record cũ → Tìm seal → Tạo record mới
- **Output**: Record mới được tạo, seal quantity trừ đi 1

### **Trường hợp 4: Hãng tàu đã hết seal, không có record cũ**
- **Input**: Container ABC123 chưa có seal, hãng tàu hết seal, user nhập "SEAL456"
- **Process**: Không tìm thấy record cũ → Tìm seal → Không tìm thấy seal còn → Error
- **Output**: Lỗi "Không tìm thấy seal còn số lượng"

### **Trường hợp 5: Seal thuộc hãng tàu khác**
- **Input**: Container ABC123 có seal "SEAL123" từ hãng tàu MSC, user cập nhật với hãng tàu CMA CGM
- **Process**: Tìm thấy record cũ nhưng seal thuộc hãng tàu khác → Tìm seal CMA CGM → Tạo record mới
- **Output**: Record mới được tạo cho hãng tàu CMA CGM

## So sánh Logic Cũ vs Mới

### **Logic Cũ:**
```
1. Tìm seal theo hãng tàu (quantity_remaining > 0)
2. Nếu không tìm thấy → Error
3. Tìm record cũ dựa trên seal_id
4. Cập nhật hoặc tạo mới
```

**Vấn đề**: Khi hãng tàu hết seal → Không tìm thấy seal → Error hoặc tạo mới

### **Logic Mới:**
```
1. Tìm record cũ dựa trên container_number + seal_number
2. Nếu tìm thấy và đúng hãng tàu → Cập nhật record cũ
3. Nếu không tìm thấy → Tìm seal để tạo mới (quantity_remaining > 0)
4. Tạo record mới và trừ seal quantity
```

**Ưu điểm**: Luôn ưu tiên cập nhật record cũ, chỉ tạo mới khi thực sự cần

## Lợi ích

### **1. Xử lý đúng trường hợp hãng tàu hết seal:**
- Không tạo duplicate records
- Cập nhật đúng record cũ
- Lịch sử seal chính xác

### **2. Logic thông minh hơn:**
- Ưu tiên cập nhật record cũ
- Chỉ tạo mới khi thực sự cần
- Xử lý đúng trường hợp seal thuộc hãng tàu khác

### **3. Dữ liệu nhất quán:**
- Lịch sử seal sạch sẽ
- Không có record trùng lặp
- Theo dõi được việc thay đổi seal

## Testing Scenarios

### **Scenario 1: Hãng tàu hết seal, cập nhật số seal**
1. Container ABC123 có seal "SEAL123" từ MSC
2. MSC đã hết seal (quantity_remaining = 0)
3. User cập nhật seal thành "SEAL456"
4. **Expected**: Record cũ được cập nhật, không tạo record mới
5. **Result**: ✅ Record cũ được cập nhật thành công

### **Scenario 2: Hãng tàu còn seal, cập nhật số seal**
1. Container ABC123 có seal "SEAL123" từ MSC
2. MSC còn seal (quantity_remaining > 0)
3. User cập nhật seal thành "SEAL456"
4. **Expected**: Record cũ được cập nhật, seal quantity không thay đổi
5. **Result**: ✅ Record cũ được cập nhật thành công

### **Scenario 3: Hãng tàu hết seal, tạo seal mới**
1. Container ABC123 chưa có seal
2. MSC đã hết seal (quantity_remaining = 0)
3. User nhập seal "SEAL456"
4. **Expected**: Error "Không tìm thấy seal còn số lượng"
5. **Result**: ✅ Error được throw đúng

## Kết luận

Fix này giải quyết vấn đề:
- **Hãng tàu hết seal vẫn có thể cập nhật số seal**
- **Không tạo duplicate records**
- **Lịch sử seal chính xác và sạch sẽ**
- **Logic xử lý thông minh và nhất quán**

Bây giờ user có thể cập nhật số seal ngay cả khi hãng tàu đã hết seal! 🚀
