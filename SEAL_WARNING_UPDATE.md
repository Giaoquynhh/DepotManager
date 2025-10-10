# Cập nhật Logic Cảnh Báo Seal cho Trường Hợp Hãng Tàu Đã Có Sẵn

## Vấn đề đã giải quyết

Trước đây, logic cảnh báo seal chỉ hoạt động khi user chọn hãng tàu mới trong dropdown. Khi hãng tàu đã được cập nhật sẵn (như "Korea Marine Transport Co."), hệ thống không kiểm tra seal availability.

## Giải pháp đã implement

### **1. Kiểm tra seal availability khi mở modal**

```typescript
const handleUpdateInfo = async (row: TableData) => {
  setSelectedRow(row);
  setIsUpdateModalOpen(true);
  
  // Check seal availability for existing shipping line if available
  if (row.shippingLine && row.shippingLine.trim() !== '') {
    setCheckingSealAvailability(true);
    try {
      const isAvailable = await checkSealAvailability(row.shippingLine);
      setSealAvailability(prev => ({
        ...prev,
        [row.shippingLine]: isAvailable
      }));
    } catch (error) {
      console.error('Error checking seal availability for existing shipping line:', error);
    } finally {
      setCheckingSealAvailability(false);
    }
  }
}
```

### **2. Cập nhật logic hiển thị cảnh báo**

```typescript
{/* Seal availability warning */}
{((selectedShippingLineId && !(selectedRow.shippingLine && selectedRow.shippingLine.trim() !== '')) || 
  (selectedRow.shippingLine && selectedRow.shippingLine.trim() !== '')) && (
  // Hiển thị cảnh báo cho cả 2 trường hợp:
  // 1. Hãng tàu mới được chọn
  // 2. Hãng tàu đã có sẵn
)}
```

### **3. Logic xác định hãng tàu để kiểm tra**

```typescript
// Determine which shipping line to check
let shippingLineName = '';
if (selectedShippingLineId) {
  const shippingLine = shippingLines.find(sl => sl.id === selectedShippingLineId);
  shippingLineName = shippingLine?.name || '';
} else if (selectedRow.shippingLine && selectedRow.shippingLine.trim() !== '') {
  shippingLineName = selectedRow.shippingLine;
}

const isAvailable = shippingLineName ? sealAvailability[shippingLineName] : true;
```

### **4. Cập nhật logic disable button**

```typescript
disabled={(() => {
  // Disable button if seal is not available for shipping line
  let shippingLineName = '';
  if (selectedShippingLineId) {
    const shippingLine = shippingLines.find(sl => sl.id === selectedShippingLineId);
    shippingLineName = shippingLine?.name || '';
  } else if (selectedRow.shippingLine && selectedRow.shippingLine.trim() !== '') {
    shippingLineName = selectedRow.shippingLine;
  }
  
  if (shippingLineName && sealAvailability[shippingLineName] === false) {
    return true;
  }
  return false;
})()}
```

## Các trường hợp được xử lý

### **Trường hợp 1: Hãng tàu đã có sẵn**
- **Input**: Container có sẵn hãng tàu "Korea Marine Transport Co."
- **Process**: 
  1. Mở modal → Tự động kiểm tra seal availability cho "Korea Marine Transport Co."
  2. Hiển thị loading "Đang kiểm tra seal..."
  3. Hiển thị kết quả: ✅ hoặc ⚠️
- **Output**: Cảnh báo seal availability ngay khi mở modal

### **Trường hợp 2: Chọn hãng tàu mới**
- **Input**: User chọn hãng tàu mới từ dropdown
- **Process**: 
  1. Chọn hãng tàu → Kiểm tra seal availability
  2. Hiển thị kết quả tương ứng
- **Output**: Cảnh báo seal availability khi chọn hãng tàu

### **Trường hợp 3: Seal hết**
- **Input**: Hãng tàu không còn seal available
- **Process**: 
  1. Kiểm tra seal → Phát hiện hết seal
  2. Hiển thị cảnh báo đỏ
  3. Disable button "Lưu"
- **Output**: Không cho phép lưu, yêu cầu tạo seal mới

## UI/UX Improvements

### **Loading State**
```
🔄 Đang kiểm tra seal...
```

### **Success State**
```
✅ Seal còn sẵn sàng cho hãng tàu này
```

### **Warning State**
```
⚠️ Cảnh báo: Hãng tàu này đã hết seal! Vui lòng tạo seal mới trước khi cập nhật.
```

### **Button States**
- **Enabled**: Opacity 1, có thể click
- **Disabled**: Opacity 0.5, không thể click khi seal hết

## Files Modified

1. `DepotManager/frontend/pages/ManagerCont.tsx`
   - Thêm logic kiểm tra seal khi mở modal
   - Cập nhật UI hiển thị cảnh báo
   - Cập nhật logic disable button
   - Xử lý cả 2 trường hợp: hãng tàu mới và hãng tàu có sẵn

## Testing Scenarios

### **Scenario 1: Container có hãng tàu, seal còn**
1. Mở modal cập nhật container có hãng tàu "MSC"
2. Hệ thống tự động kiểm tra seal
3. Hiển thị "✅ Seal còn sẵn sàng"
4. Button "Lưu" enabled

### **Scenario 2: Container có hãng tàu, seal hết**
1. Mở modal cập nhật container có hãng tàu "CMA CGM"
2. Hệ thống kiểm tra seal → Phát hiện hết
3. Hiển thị "⚠️ Cảnh báo: Hãng tàu này đã hết seal!"
4. Button "Lưu" disabled

### **Scenario 3: Chọn hãng tàu mới**
1. Mở modal, chọn hãng tàu mới từ dropdown
2. Hệ thống kiểm tra seal cho hãng tàu mới
3. Hiển thị kết quả tương ứng
4. Button "Lưu" enabled/disabled tùy theo seal availability

## Benefits

1. **Proactive Warning**: Cảnh báo ngay khi mở modal, không cần chờ user chọn hãng tàu
2. **Consistent UX**: Xử lý đồng nhất cho cả hãng tàu có sẵn và hãng tàu mới
3. **Prevent Errors**: Ngăn chặn việc tạo container khi seal hết
4. **Clear Feedback**: Thông báo rõ ràng về trạng thái seal
5. **Better UX**: Loading state và visual feedback tốt hơn
