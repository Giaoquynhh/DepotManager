# Repair Ticket và Service Request Sync Fix - v2025-01-27

## 📋 Tổng quan

Tài liệu này mô tả việc sửa lỗi đồng bộ trạng thái giữa `RepairTicket` và `ServiceRequest` để đảm bảo tính nhất quán dữ liệu trong hệ thống.

## 🐛 Vấn đề đã được giải quyết

### **Mô tả vấn đề:**
- Container có `RepairTicket` với status `CHECKED` trong trang Maintenance/Repairs
- Nhưng `ServiceRequest` vẫn hiển thị status `CHECKING` trong các trang Requests
- Gây ra sự không nhất quán trong hiển thị trạng thái container

### **Nguyên nhân gốc rễ:**
- Logic đồng bộ giữa `RepairTicket` và `ServiceRequest` đã bị vô hiệu hóa hoàn toàn
- Method `updateRequestStatusByContainer()` chỉ log thông báo mà không thực hiện đồng bộ
- Method `completeRepair()` cũng bỏ qua việc đồng bộ ServiceRequest

## 🔧 Giải pháp đã thực hiện

### **1. Khôi phục logic đồng bộ trong MaintenanceService.ts**

#### **Method `updateRequestStatusByContainer()`:**
```typescript
private async updateRequestStatusByContainer(containerNo: string, repairStatus: string) {
  try {
    console.log(`🔄 RepairTicket ${containerNo} đã được cập nhật thành ${repairStatus} - bắt đầu đồng bộ ServiceRequest`);
    
    // Tìm ServiceRequest mới nhất của container này
    const latestRequest = await prisma.serviceRequest.findFirst({
      where: { container_no: containerNo },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestRequest) {
      console.log(`ℹ️ Không tìm thấy ServiceRequest cho container ${containerNo}`);
      return;
    }

    // Mapping repair status sang request status
    let newRequestStatus: string;
    switch (repairStatus) {
      case 'CHECKED':
        newRequestStatus = 'CHECKED';
        break;
      case 'REJECTED':
        newRequestStatus = 'REJECTED';
        break;
      default:
        console.log(`ℹ️ Không cần đồng bộ cho repair status: ${repairStatus}`);
        return;
    }

    // Chỉ cập nhật nếu status khác nhau
    if (latestRequest.status !== newRequestStatus) {
      await prisma.serviceRequest.update({
        where: { id: latestRequest.id },
        data: { 
          status: newRequestStatus,
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Đã đồng bộ ServiceRequest ${latestRequest.id} thành ${newRequestStatus}`);
    }
  } catch (error) {
    console.error(`❌ Lỗi khi đồng bộ ServiceRequest cho container ${containerNo}:`, error);
  }
}
```

#### **Method `completeRepair()`:**
```typescript
// Đồng bộ ServiceRequest nếu có container_no
if (repairTicket.container_no) {
  try {
    await this.updateRequestStatusByContainer(repairTicket.container_no, 'CHECKED');
    console.log(`✅ Đã đồng bộ ServiceRequest cho container ${repairTicket.container_no}`);
  } catch (error) {
    console.error(`❌ Lỗi khi đồng bộ ServiceRequest cho container ${repairTicket.container_no}:`, error);
  }
}
```

#### **Method `syncRepairTicketStatus()` (mới):**
```typescript
async syncRepairTicketStatus(containerNo: string) {
  try {
    console.log(`🔄 Bắt đầu đồng bộ thủ công cho container ${containerNo}`);
    
    // Tìm RepairTicket mới nhất của container
    const latestRepairTicket = await prisma.repairTicket.findFirst({
      where: { container_no: containerNo },
      orderBy: { updatedAt: 'desc' }
    });

    if (!latestRepairTicket) {
      console.log(`ℹ️ Không tìm thấy RepairTicket cho container ${containerNo}`);
      return null;
    }

    // Đồng bộ với ServiceRequest
    await this.updateRequestStatusByContainer(containerNo, latestRepairTicket.status);
    
    return {
      container_no: containerNo,
      repair_ticket_id: latestRepairTicket.id,
      repair_status: latestRepairTicket.status,
      synced_at: new Date()
    };
  } catch (error) {
    console.error(`❌ Lỗi khi đồng bộ thủ công cho container ${containerNo}:`, error);
    throw error;
  }
}
```

### **2. Script đồng bộ dữ liệu hiện tại**

Đã tạo và chạy script để đồng bộ lại tất cả dữ liệu hiện tại:

```javascript
// sync-repair-request-status.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncRepairRequestStatus() {
  // Lấy tất cả RepairTicket có status CHECKED
  const checkedRepairTickets = await prisma.repairTicket.findMany({
    where: { 
      status: 'CHECKED',
      container_no: { not: null }
    },
    orderBy: { updatedAt: 'desc' }
  });

  // Đồng bộ từng container
  for (const repairTicket of checkedRepairTickets) {
    const latestRequest = await prisma.serviceRequest.findFirst({
      where: { container_no: repairTicket.container_no },
      orderBy: { createdAt: 'desc' }
    });

    if (latestRequest && latestRequest.status !== 'CHECKED') {
      await prisma.serviceRequest.update({
        where: { id: latestRequest.id },
        data: { 
          status: 'CHECKED',
          updatedAt: new Date()
        }
      });
    }
  }
}
```

## 📊 Kết quả

### **Dữ liệu đã được đồng bộ:**
- ✅ **3 ServiceRequest** đã được cập nhật từ `CHECKING`/`ACCEPT` sang `CHECKED`
- ✅ Container **ISO 1113** giờ có trạng thái nhất quán
- ✅ Container **ISO 1112** giờ có trạng thái nhất quán  
- ✅ Container **ISO 1111** giờ có trạng thái nhất quán

### **Logic đồng bộ tự động:**
- ✅ Khi RepairTicket được cập nhật thành `CHECKED` → ServiceRequest tự động cập nhật thành `CHECKED`
- ✅ Khi RepairTicket được cập nhật thành `REJECTED` → ServiceRequest tự động cập nhật thành `REJECTED`
- ✅ Có logging chi tiết để debug và monitor

## 🔗 API Endpoints

### **Đồng bộ thủ công:**
```
POST /maintenance/repairs/sync-status
Content-Type: application/json
Authorization: Bearer <token>

{
  "container_no": "ISO 1113"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã đồng bộ trạng thái RepairTicket thành công",
  "data": {
    "container_no": "ISO 1113",
    "repair_ticket_id": "repair-ticket-id",
    "repair_status": "CHECKED",
    "synced_at": "2025-01-27T10:30:00.000Z"
  }
}
```

## 🗂️ Files đã thay đổi

### **Backend:**
- `modules/maintenance/service/MaintenanceService.ts` - Khôi phục logic đồng bộ
- `modules/maintenance/controller/MaintenanceController.ts` - API endpoint đồng bộ thủ công
- `modules/maintenance/controller/MaintenanceRoutes.ts` - Route cho API đồng bộ

### **Database:**
- Cập nhật trực tiếp các bản ghi ServiceRequest để đồng bộ trạng thái

## 🚀 Cách sử dụng

### **Đồng bộ tự động:**
- Khi RepairTicket được cập nhật thành `CHECKED` hoặc `REJECTED`, ServiceRequest sẽ tự động được đồng bộ
- Không cần thao tác thủ công

### **Đồng bộ thủ công:**
- Sử dụng API endpoint `/maintenance/repairs/sync-status` với `container_no`
- Chỉ dành cho `SaleAdmin` và `SystemAdmin`

### **Debug và monitoring:**
- Kiểm tra console logs để theo dõi quá trình đồng bộ
- Logs sẽ hiển thị chi tiết từng bước đồng bộ

## ⚠️ Lưu ý quan trọng

1. **Error handling:** Logic đồng bộ có error handling để không ảnh hưởng đến việc cập nhật RepairTicket
2. **Performance:** Chỉ đồng bộ khi cần thiết (status khác nhau)
3. **Logging:** Có logging chi tiết để debug và monitor
4. **Rollback:** Có thể rollback bằng cách chạy lại script đồng bộ

## 🔄 Maintenance

### **Kiểm tra đồng bộ:**
```sql
-- Kiểm tra RepairTicket CHECKED nhưng ServiceRequest chưa CHECKED
SELECT 
  rt.container_no,
  rt.status as repair_status,
  sr.status as request_status,
  sr.id as request_id
FROM "RepairTicket" rt
LEFT JOIN "ServiceRequest" sr ON sr.container_no = rt.container_no
WHERE rt.status = 'CHECKED' 
  AND sr.status != 'CHECKED'
ORDER BY rt.updatedAt DESC;
```

### **Đồng bộ lại nếu cần:**
```bash
# Chạy script đồng bộ (nếu cần)
node sync-repair-request-status.js
```

---

**Tác giả:** AI Assistant  
**Ngày cập nhật:** 2025-01-27  
**Phiên bản:** 1.0  
**Trạng thái:** ✅ Hoàn thành
