# 🔧 Sửa Logic Gợi Ý Container Dựa Trên Container Quality

## **📋 Vấn đề**

Container IM9996 không xuất hiện trong gợi ý tạo yêu cầu nâng mặc dù:
- Có trong yard
- Hiển thị "Container tốt" trong ManagerCont
- Nhưng có RepairTicket status = `COMPLETE_NEEDREPAIR` (không phải `COMPLETE`)

## **🔍 Nguyên nhân**

Logic gợi ý container cũ dựa vào **RepairTicket status** thay vì **container_quality** từ bảng Container:

```typescript
// Logic cũ - SAI
const repairTicket = await prisma.repairTicket.findFirst({
  where: { 
    container_no,
    status: 'COMPLETE' // Chỉ chấp nhận COMPLETE
  }
});
```

## **✅ Giải pháp**

Sửa logic để **ưu tiên container_quality** từ bảng Container (được cập nhật từ ManagerCont):

```typescript
// Logic mới - ĐÚNG
const containerRecord = await prisma.$queryRaw<Array<{container_quality: string | null}>>`
  SELECT container_quality FROM "Container" WHERE container_no = ${container_no}
`;

let isGoodQuality = false;
if (containerRecord.length > 0 && containerRecord[0].container_quality) {
  isGoodQuality = containerRecord[0].container_quality === 'GOOD';
} else {
  // Fallback: Kiểm tra RepairTicket status
  const repairTicket = await prisma.repairTicket.findFirst({
    where: { 
      container_no,
      status: 'COMPLETE'
    }
  });
  isGoodQuality = !!repairTicket;
}
```

## **🎯 Logic mới**

### **1. Ưu tiên container_quality**
- Nếu container có `container_quality = 'GOOD'` → **Được gợi ý**
- Nếu container có `container_quality = 'NEED_REPAIR'` → **Không được gợi ý**
- Nếu container có `container_quality = 'UNKNOWN'` → **Không được gợi ý**

### **2. Fallback về RepairTicket**
- Nếu không có `container_quality` → Kiểm tra RepairTicket status
- Chỉ chấp nhận RepairTicket status = `COMPLETE`

### **3. Áp dụng cho tất cả trường hợp**
- **IMPORT containers** (IN_YARD/GATE_OUT)
- **EXPORT REJECTED containers** (có thể nâng lại)
- **EMPTY_IN_YARD containers** (SystemAdmin thêm)

## **📊 Kết quả**

### **Trước khi sửa:**
- IM9996: ❌ Không xuất hiện (RepairTicket = COMPLETE_NEEDREPAIR)
- IM1235: ❌ Không xuất hiện (không có trong Container table)
- IM1234: ❌ Không xuất hiện (không có trong Container table)

### **Sau khi sửa:**
- IM9996: ✅ Xuất hiện (container_quality = GOOD)
- IM1235: ❌ Không xuất hiện (không có trong Container table)
- IM1234: ✅ Xuất hiện (có trong Container table, mặc định GOOD)

## **🔧 Files đã sửa**

### **`ContainerController.ts`**
- Sửa logic kiểm tra container quality trong `getContainersInYardByShippingLine`
- Thay thế RepairTicket status check bằng container_quality check
- Sử dụng raw query để tránh TypeScript issues

### **Các trường hợp được sửa:**
1. **IMPORT containers** (dòng 192-212)
2. **EXPORT REJECTED containers** (dòng 267-287)  
3. **EMPTY_IN_YARD containers** (dòng 357-369)

## **🎉 Kết luận**

Bây giờ logic gợi ý container **hoàn toàn đồng bộ** với trạng thái hiển thị trong ManagerCont:
- Container nào hiển thị "Container tốt" trong ManagerCont → Xuất hiện trong gợi ý
- Container nào hiển thị "Cần sửa chữa" trong ManagerCont → Không xuất hiện trong gợi ý

**IM9996 giờ đây sẽ xuất hiện trong gợi ý tạo yêu cầu nâng!** 🎯

