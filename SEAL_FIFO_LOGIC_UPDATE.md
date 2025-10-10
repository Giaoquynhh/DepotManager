# Cập nhật Logic FIFO cho Seal Management

## Tóm tắt thay đổi

Đã cập nhật logic quản lý seal theo yêu cầu:
1. **Bỏ ràng buộc mỗi hãng tàu chỉ có 1 seal** - Cho phép tạo nhiều seal cho cùng hãng tàu
2. **Implement logic FIFO (First In First Out)** - Trừ seal theo thứ tự ngày mua cũ nhất trước

## Chi tiết thay đổi

### 1. Frontend Changes (CreateSealModal.tsx)

#### Bỏ logic kiểm tra duplicate:
- Xóa function `isShippingLineUsed()`
- Xóa logic load existing seals để check duplicate
- Xóa validation "Hãng tàu này đã có seal, không thể tạo thêm"
- Xóa thông báo cảnh báo "Tất cả hãng tàu đã có seal"

#### Cập nhật UI:
- Cho phép chọn tất cả hãng tàu (không filter theo seal đã tồn tại)
- Bỏ disable button khi không có hãng tàu
- Đơn giản hóa logic hiển thị dropdown

### 2. Backend Changes (SealService.ts)

#### Cập nhật logic `incrementExportedQuantity()`:

**Trước:**
```typescript
orderBy: {
  createdAt: 'desc' // Lấy seal mới nhất
}
```

**Sau:**
```typescript
orderBy: [
  {
    purchase_date: 'asc' // Ngày mua cũ nhất trước
  },
  {
    createdAt: 'asc' // Nếu cùng ngày thì tạo cũ nhất trước
  }
]
```

#### Thêm điều kiện:
- Chỉ lấy seal còn số lượng: `quantity_remaining: { gt: 0 }`
- Cập nhật thông báo lỗi phù hợp

## Logic FIFO hoạt động như thế nào

### Thứ tự ưu tiên:
1. **Ngày mua cũ nhất trước** (`purchase_date ASC`)
2. **Nếu cùng ngày, tạo sớm nhất trước** (`createdAt ASC`)

### Ví dụ:
```
Hãng tàu MSC có 3 seal:
- Seal A: Ngày 10/10/2025, tạo lúc 11:00
- Seal B: Ngày 10/10/2025, tạo lúc 12:00  
- Seal C: Ngày 11/10/2025, tạo lúc 10:00

Thứ tự trừ: A → B → C
```

### Khi trừ seal:
1. Tìm seal có `purchase_date` cũ nhất và còn `quantity_remaining > 0`
2. Nếu có nhiều seal cùng ngày, lấy seal tạo sớm nhất
3. Trừ từ seal đó cho đến khi hết số lượng
4. Chuyển sang seal tiếp theo theo thứ tự FIFO

## Lợi ích

### 1. Tính linh hoạt:
- Có thể mua nhiều lần cho cùng hãng tàu
- Không bị giới hạn bởi ràng buộc "1 hãng tàu = 1 seal"

### 2. Quản lý kho hiệu quả:
- Seal cũ được sử dụng trước (tránh hết hạn)
- Logic FIFO đảm bảo tính nhất quán
- Dễ dàng theo dõi và kiểm soát

### 3. Không cần ràng buộc ngày:
- Có thể mua nhiều lần trong ngày
- Logic FIFO tự động xử lý thứ tự
- Tránh xung đột bằng cách sắp xếp theo thời gian tạo

## Test Case

Đã test với kịch bản:
- 3 seal cùng hãng tàu MSC
- 2 seal cùng ngày 10/10/2025, 1 seal ngày 11/10/2025
- Kết quả: Seal ngày 10/10 được trừ trước, trong cùng ngày thì tạo sớm hơn được trừ trước

## Migration Notes

- Không cần migration database
- Logic cũ vẫn tương thích
- Chỉ thay đổi cách query và validation
- Existing seals không bị ảnh hưởng

## Files Modified

1. `frontend/pages/SealManagement/components/CreateSealModal.tsx`
2. `backend/modules/seal/service/SealService.ts`

## Testing

- ✅ Tạo seal mới cho hãng tàu đã có seal
- ✅ Logic FIFO hoạt động đúng với multiple seals
- ✅ UI không còn hiển thị cảnh báo duplicate
- ✅ Backend query đúng thứ tự FIFO
