# Logic Container IMPORT vs EXPORT sau khi sửa

## 🔄 **IMPORT (HẠ) - Container từ ngoài vào bãi**

### **Luồng trạng thái:**
```
PENDING → CHECKED → GATE_IN → FORKLIFTING → IN_YARD → [GATE_OUT] → IN_YARD
```

### **Chi tiết từng trạng thái:**

1. **PENDING** - "Thêm mới"
   - Container vừa được tạo yêu cầu hạ
   - Chưa được xử lý

2. **CHECKED** - "Chấp nhận" 
   - Container đã được kiểm tra và chấp nhận
   - Sẵn sàng để vào cổng

3. **GATE_IN** - "Đã vào cổng"
   - Xe đã vào cổng với container
   - Đang chờ hạ xuống bãi

4. **FORKLIFTING** - "Đang hạ container"
   - Container đang được hạ xuống bãi
   - Xe nâng đang thực hiện

5. **IN_YARD** - "Đã hạ thành công"
   - Container đã được hạ xuống bãi thành công
   - Container ở lại bãi, xe có thể ra

6. **[GATE_OUT]** - "Xe đã rời khỏi bãi" ⚠️
   - **TRẠNG THÁI TẠM THỜI** - chỉ tồn tại trong thời gian ngắn
   - Xe đã ra khỏi cổng nhưng container vẫn ở bãi
   - **Tự động chuyển về IN_YARD** khi container được hạ xuống

### **Hiển thị trong LowerContainer:**
- ✅ Hiển thị: PENDING, CHECKED, GATE_IN, FORKLIFTING, IN_YARD
- ❌ Không hiển thị: GATE_OUT (đã được lọc bỏ)

---

## 📤 **EXPORT (NÂNG) - Container từ bãi ra ngoài**

### **Luồng trạng thái:**
```
IN_YARD → FORKLIFTING → DONE_LIFTING → GATE_OUT
```

### **Chi tiết từng trạng thái:**

1. **IN_YARD** - "Đã hạ thành công"
   - Container đang ở trong bãi
   - Chờ được nâng ra

2. **FORKLIFTING** - "Đang nâng container"
   - Container đang được nâng lên xe
   - Xe nâng đang thực hiện

3. **DONE_LIFTING** - "Đã nâng xong"
   - Container đã được nâng lên xe
   - Sẵn sàng ra khỏi cổng

4. **GATE_OUT** - "Đã ra khỏi cổng"
   - Container đã ra khỏi bãi hoàn toàn
   - Không còn trong hệ thống quản lý

### **Hiển thị trong LiftContainer:**
- ✅ Hiển thị: IN_YARD, FORKLIFTING, DONE_LIFTING
- ❌ Không hiển thị: GATE_OUT (đã ra khỏi hệ thống)

---

## 🎯 **Điểm khác biệt quan trọng:**

### **IMPORT (HẠ):**
- **Mục đích**: Đưa container từ ngoài vào bãi
- **Kết quả**: Container ở lại bãi
- **GATE_OUT**: Chỉ là trạng thái tạm thời của xe, container vẫn ở bãi
- **Logic tự động**: GATE_OUT → IN_YARD khi container được hạ xuống

### **EXPORT (NÂNG):**
- **Mục đích**: Đưa container từ bãi ra ngoài  
- **Kết quả**: Container ra khỏi bãi hoàn toàn
- **GATE_OUT**: Trạng thái cuối cùng, container đã ra khỏi hệ thống
- **Không có logic tự động**: GATE_OUT là trạng thái cuối

---

## 📊 **Ví dụ cụ thể:**

### **IMPORT - Container SM09:**
```
SM09: IMPORT → GATE_OUT (xe ra) → IN_YARD (container ở lại B1-10)
```

### **EXPORT - Container SA111:**
```
SA111: EXPORT → GATE_OUT (container ra khỏi bãi hoàn toàn)
```

---

## 🔧 **Logic đã được sửa:**

1. **LowerContainer**: Lọc bỏ GATE_OUT và EMPTY_IN_YARD
2. **YardService**: Tự động chuyển IMPORT GATE_OUT → IN_YARD
3. **Phân biệt rõ**: IMPORT vs EXPORT trong logic xử lý
4. **Hiển thị đúng**: Mỗi trang chỉ hiển thị container phù hợp

**Kết quả: Logic rõ ràng, không nhầm lẫn, quản lý hiệu quả!** 🎯

