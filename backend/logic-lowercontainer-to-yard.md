# Logic từ LowerContainer (GATE_OUT) đến Yard

## 📋 **Luồng xử lý Container IMPORT (HẠ) từ LowerContainer đến Yard:**

### 1. **LowerContainer Interface (NewSubmenu)**
```
Trạng thái hiển thị: "Xe đã rời khỏi bãi" (GATE_OUT)
↓
Container có ServiceRequest với:
- type: 'IMPORT' 
- status: 'GATE_OUT'
- container_no: 'SM09'
```

### 2. **Logic Backend đã được sửa (YardService.ts)**
```
Khi container được hạ xuống Yard (hàm confirm):
↓
1. Kiểm tra ServiceRequest có GATE_OUT + IMPORT
2. Tự động chuyển: GATE_OUT → IN_YARD
3. Cập nhật YardSlot: EMPTY → OCCUPIED
4. Ghi lịch sử thay đổi
```

### 3. **Kết quả trong Yard Interface**
```
Container hiển thị với:
- Trạng thái: IN_YARD
- Vị trí: B1-10 (OCCUPIED)
- Có thể quản lý bình thường
```

## 🔄 **Chi tiết Logic:**

### **Trước khi sửa:**
- LowerContainer: "Xe đã rời khỏi bãi" (GATE_OUT)
- Yard: Container bị ẩn (slot EMPTY nhưng có YardPlacement)
- Vấn đề: Trạng thái không khớp

### **Sau khi sửa:**
- LowerContainer: "Xe đã rời khỏi bãi" (GATE_OUT) 
- Yard: Container tự động chuyển về "Đã hạ thành công" (IN_YARD)
- Kết quả: Hiển thị đúng, có thể quản lý

## 🎯 **Điểm quan trọng:**

1. **LowerContainer** hiển thị trạng thái xe (GATE_OUT = xe đã ra)
2. **Yard** hiển thị trạng thái container (IN_YARD = container ở lại)
3. **Logic tự động** chuyển đổi khi container được hạ xuống bãi
4. **Phân biệt IMPORT vs EXPORT** để xử lý đúng

## 📊 **Ví dụ cụ thể với SM09:**

```
LowerContainer: SM09 - "Xe đã rời khỏi bãi" (GATE_OUT)
↓ [Container được hạ xuống Yard]
Yard: SM09 - "Đã hạ thành công" (IN_YARD) tại B1-10
```

**Logic này đảm bảo:**
- LowerContainer phản ánh đúng trạng thái xe
- Yard phản ánh đúng trạng thái container
- Không có container bị ẩn
- Quy trình quản lý liền mạch

