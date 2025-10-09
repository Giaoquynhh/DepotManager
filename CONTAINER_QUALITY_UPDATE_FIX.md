# Sửa lỗi tự động tạo RepairTicket khi cập nhật container_quality

## 🐛 Vấn đề
Khi cập nhật trạng thái container từ "Container tốt" sang "Cần sửa chữa" ở trang ManagerCont, hệ thống tự động tạo RepairTicket mới với mã RT lạ, điều này không mong muốn.

## 🔍 Nguyên nhân
Trong file `ContainerController.ts`, method `updateContainerInfo()` có logic tự động tạo RepairTicket mới khi:
1. Container chưa có RepairTicket và `container_quality` được cập nhật thành `NEED_REPAIR`
2. Cập nhật trạng thái RepairTicket hiện có khi thay đổi `container_quality`

## ✅ Giải pháp
Đã sửa logic trong `ContainerController.ts` để:

### 1. Không tự động tạo RepairTicket mới
```typescript
// TRƯỚC (có vấn đề):
} else if (container_quality === 'NEED_REPAIR') {
  // Tạo RepairTicket mới nếu chưa có và cần sửa chữa
  const code = `RT-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}-${Math.floor(Math.random()*1000)}`;
  await prisma.repairTicket.create({
    data: {
      container_no,
      status: 'COMPLETE_NEEDREPAIR',
      problem_description: 'Container cần sửa chữa - Manual creation',
      code,
      created_by: req.user!._id,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
}

// SAU (đã sửa):
} else {
  // 🔒 BẢO VỆ: KHÔNG tự động tạo RepairTicket mới khi cập nhật container_quality
  // RepairTicket chỉ nên được tạo thông qua quy trình kiểm tra container thực tế
  // Không phải thông qua việc cập nhật trạng thái từ ManagerCont
  console.log(`🔒 Bảo vệ: Không tự động tạo RepairTicket mới cho container ${container_no} khi cập nhật container_quality thành ${container_quality}`);
  console.log(`ℹ️ Container quality được cập nhật thành ${container_quality} nhưng không tạo RepairTicket mới`);
}
```

### 2. Không cập nhật RepairTicket hiện có
```typescript
// TRƯỚC (có vấn đề):
if (serviceRequest && (serviceRequest.status === 'IN_YARD' || serviceRequest.status === 'GATE_OUT')) {
  // Không cập nhật RepairTicket
} else {
  // Cập nhật RepairTicket
  let repairStatus: 'COMPLETE' | 'COMPLETE_NEEDREPAIR' | 'PENDING' = 'PENDING';
  if (container_quality === 'GOOD') {
    repairStatus = 'COMPLETE';
  } else if (container_quality === 'NEED_REPAIR') {
    repairStatus = 'COMPLETE_NEEDREPAIR';
  }
  await prisma.repairTicket.update({
    where: { id: latestRepairTicket.id },
    data: { 
      status: repairStatus,
      updatedAt: new Date()
    }
  });
}

// SAU (đã sửa):
// 🔒 BẢO VỆ: KHÔNG cập nhật RepairTicket khi thay đổi container_quality từ ManagerCont
// RepairTicket chỉ nên được cập nhật thông qua quy trình kiểm tra container thực tế
// Không phải thông qua việc cập nhật trạng thái từ ManagerCont
console.log(`🔒 Bảo vệ RepairTicket cho container ${container_no}: Không cập nhật RepairTicket khi thay đổi container_quality từ ManagerCont`);
console.log(`ℹ️ Container quality được cập nhật thành ${container_quality} nhưng RepairTicket giữ nguyên trạng thái ${latestRepairTicket.status}`);
console.log(`ℹ️ RepairTicket chỉ nên được cập nhật thông qua quy trình kiểm tra container thực tế, không phải từ ManagerCont`);
```

## 🎯 Kết quả
- ✅ Cập nhật `container_quality` từ ManagerCont sẽ **KHÔNG** tạo RepairTicket mới
- ✅ Cập nhật `container_quality` từ ManagerCont sẽ **KHÔNG** thay đổi trạng thái RepairTicket hiện có
- ✅ `container_quality` vẫn được lưu vào database để hiển thị đúng trạng thái
- ✅ RepairTicket chỉ được tạo/cập nhật thông qua quy trình kiểm tra container thực tế

## 📁 Files đã thay đổi
- `DepotManager/backend/modules/containers/controller/ContainerController.ts`

## 🧪 Cách test
1. Vào trang ManagerCont
2. Chọn một container có trạng thái "Container tốt"
3. Click "Cập nhật thông tin" và thay đổi trạng thái thành "Cần sửa chữa"
4. Lưu thay đổi
5. Kiểm tra trang Maintenance/Repairs - **KHÔNG** nên có RepairTicket mới xuất hiện
6. Kiểm tra trạng thái container trong ManagerCont - vẫn hiển thị "Cần sửa chữa"

## 📝 Lưu ý
- RepairTicket chỉ nên được tạo thông qua quy trình kiểm tra container thực tế (từ trang Maintenance/Repairs)
- Việc cập nhật `container_quality` từ ManagerCont chỉ để quản lý trạng thái hiển thị, không ảnh hưởng đến RepairTicket
- Logic này đảm bảo tính nhất quán và tránh tạo ra dữ liệu không mong muốn
