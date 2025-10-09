# Container Quality Persistence Fix - v2025-01-27

## 📋 Tổng quan

Tài liệu này mô tả việc sửa lỗi **container quality bị reset khi F5** trong trang ManagerCont. Vấn đề xảy ra khi người dùng cập nhật container quality từ "Cần sửa chữa" → "Container tốt" nhưng sau khi refresh trang, trạng thái lại trở về "Cần sửa chữa".

## 🐛 Vấn đề gốc rễ

### **Nguyên nhân chính:**
1. **Backend không lưu `container_quality`** vào database
2. **Frontend tính toán lại `containerQuality`** từ RepairTicket status khi fetch data
3. **Logic bảo vệ RepairTicket** ngăn cập nhật RepairTicket khi ServiceRequest đã ở IN_YARD/GATE_OUT
4. **Kết quả**: Container quality được cập nhật local nhưng không persist, bị reset khi F5

### **Luồng lỗi:**
```mermaid
graph TD
    A[User cập nhật: Cần sửa chữa → Container tốt] --> B[Backend: Lưu container_quality vào Container table]
    B --> C[Backend: Bảo vệ RepairTicket - KHÔNG cập nhật]
    C --> D[Frontend: Cập nhật local state]
    D --> E[User F5 - Refresh trang]
    E --> F[Frontend: Fetch data từ server]
    F --> G[Frontend: Tính toán containerQuality từ RepairTicket]
    G --> H[RepairTicket vẫn COMPLETE_NEEDREPAIR]
    H --> I[Kết quả: Hiển thị lại "Cần sửa chữa"]
```

## 🔧 Giải pháp đã triển khai

### **1. Backend: Lưu container_quality vào database**

#### **ContainerController.updateContainerInfo():**
```typescript
// 🔄 LUU CONTAINER_QUALITY VÀO DATABASE
// Tìm hoặc tạo Container record để lưu container_quality
let containerRecord = await prisma.container.findFirst({
  where: { container_no }
});

if (!containerRecord) {
  // Tạo Container record mới nếu chưa có
  containerRecord = await prisma.container.create({
    data: {
      container_no,
      container_quality,
      created_by: req.user!._id,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
} else {
  // Cập nhật Container record hiện có
  await prisma.container.update({
    where: { id: containerRecord.id },
    data: { 
      container_quality,
      updatedAt: new Date()
    }
  });
}
```

### **2. Backend: Include container_quality trong API response**

#### **listController.ts:**
```typescript
// 🔄 BỔ SUNG: Lấy container_quality từ bảng Container cho mỗi request
const requestsWithContainerQuality = await Promise.all(
    requests.map(async (request) => {
        if (request.container_no) {
            const container = await prisma.container.findFirst({
                where: { container_no: request.container_no },
                select: { container_quality: true }
            });
            return {
                ...request,
                container_quality: container?.container_quality || null
            };
        }
        return request;
    })
);
```

### **3. Frontend: Ưu tiên container_quality từ database**

#### **ManagerCont.tsx - fetchImportRequests():**
```typescript
// 🔄 ƯU TIÊN: Sử dụng container_quality từ database nếu có
// Nếu không có, mới tính toán từ RepairTicket status
if (request.container_quality) {
  containerQuality = request.container_quality as 'GOOD' | 'NEED_REPAIR' | 'UNKNOWN';
  console.log(`📊 Sử dụng container_quality từ database cho ${request.container_no}: ${containerQuality}`);
} else {
  // Fallback: Tính toán từ RepairTicket status
  if (repairTicketStatus === 'COMPLETE') {
    containerQuality = 'GOOD';
  } else if (repairTicketStatus === 'COMPLETE_NEEDREPAIR' || repairTicketStatus === 'COMPLETE_NEED_REPAIR') {
    containerQuality = 'NEED_REPAIR';
  } else {
    containerQuality = 'UNKNOWN';
  }
  console.log(`📊 Tính toán container_quality từ RepairTicket cho ${request.container_no}: ${repairTicketStatus} → ${containerQuality}`);
}
```

### **4. Frontend: Cập nhật cả tableData và allData**

#### **ManagerCont.tsx - Modal save logic:**
```typescript
// 🔄 Cập nhật tableData để hiển thị ngay lập tức
const updatedTableData = tableData.map(item => {
  if (item.containerNumber === selectedRow.containerNumber) {
    const updatedItem = { ...item };
    
    // Cập nhật các trường tương tự như allData
    if (selectedStatus && selectedStatus !== '') {
      updatedItem.containerQuality = selectedStatus as "GOOD" | "NEED_REPAIR" | "UNKNOWN";
    }
    
    return updatedItem;
  }
  return item;
});
setTableData(updatedTableData);
```

## 📊 Luồng hoạt động mới

```mermaid
graph TD
    A[User cập nhật: Cần sửa chữa → Container tốt] --> B[Backend: Lưu container_quality vào Container table]
    B --> C[Backend: Bảo vệ RepairTicket - KHÔNG cập nhật]
    C --> D[Frontend: Cập nhật local state]
    D --> E[User F5 - Refresh trang]
    E --> F[Frontend: Fetch data từ server]
    F --> G[Backend: Trả về container_quality từ Container table]
    G --> H[Frontend: Ưu tiên sử dụng container_quality từ database]
    H --> I[Kết quả: Hiển thị "Container tốt" - PERSISTENT!]
```

## 🎯 Kết quả mong đợi

### **Container IM9996 - Test case:**

**Trước khi sửa:**
1. User cập nhật: "Cần sửa chữa" → "Container tốt"
2. Modal đóng, hiển thị "Container tốt" ✅
3. User F5 → Hiển thị lại "Cần sửa chữa" ❌

**Sau khi sửa:**
1. User cập nhật: "Cần sửa chữa" → "Container tốt"
2. Backend lưu `container_quality = 'GOOD'` vào Container table ✅
3. Modal đóng, hiển thị "Container tốt" ✅
4. User F5 → Fetch data từ server ✅
5. Backend trả về `container_quality = 'GOOD'` ✅
6. Frontend hiển thị "Container tốt" - PERSISTENT! ✅

## 🔍 Console Logs để debug

### **Backend logs:**
```
✅ Cập nhật Container record cho IM9996: NEED_REPAIR → GOOD
🔒 Bảo vệ RepairTicket cho container IM9996: ServiceRequest đã ở trạng thái IN_YARD, không cập nhật RepairTicket
ℹ️ Container quality được cập nhật thành GOOD nhưng RepairTicket giữ nguyên trạng thái COMPLETE_NEEDREPAIR
```

### **Frontend logs:**
```
📊 Sử dụng container_quality từ database cho IM9996: GOOD
```

## 🗂️ Files đã thay đổi

### **Backend:**
- `modules/containers/controller/ContainerController.ts` - Lưu container_quality vào database
- `modules/requests/controller/listController.ts` - Include container_quality trong API response

### **Frontend:**
- `pages/ManagerCont.tsx` - Ưu tiên container_quality từ database, cập nhật tableData

### **Documentation:**
- `docs/CONTAINER_QUALITY_PERSISTENCE_FIX.md` - Tài liệu này
- `docs/CONTAINER_QUALITY_UPDATE_PROTECTION.md` - Tài liệu bảo vệ RepairTicket

## 🚀 Cách test

1. **Chuẩn bị dữ liệu:**
   - Container có RepairTicket với status `COMPLETE_NEEDREPAIR`
   - ServiceRequest với status `IN_YARD` hoặc `GATE_OUT`

2. **Thực hiện test:**
   - Vào trang ManagerCont
   - Mở modal "Cập nhật thông tin container" cho container IM9996
   - Thay đổi trạng thái từ "Cần sửa chữa" → "Container tốt"
   - Lưu thay đổi

3. **Kiểm tra kết quả:**
   - ManagerCont: Hiển thị "CONTAINER TỐT" ✅
   - F5 trang → Vẫn hiển thị "CONTAINER TỐT" ✅
   - Maintenance/Repairs: Vẫn hiển thị "Chấp nhận - cần sửa" ✅
   - Console logs: Hiển thị thông báo sử dụng container_quality từ database ✅

## ✅ Lợi ích

1. **Persistence**: Container quality được lưu vào database, không bị mất khi refresh
2. **Bảo vệ dữ liệu**: RepairTicket status được bảo vệ khi ServiceRequest đã hoàn thành
3. **Tính nhất quán**: Hiển thị đúng trạng thái ở cả hai trang
4. **Backward compatibility**: Vẫn hoạt động với container chưa có container_quality (fallback về RepairTicket)
5. **Audit trail**: Có logging chi tiết để debug và monitor

