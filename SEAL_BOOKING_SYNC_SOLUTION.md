# 🔄 Giải pháp đồng bộ Booking giữa ServiceRequest và SealUsageHistory

## 📋 **Vấn đề**

Khi có seal trước ở ManagerCont, số booking không cập nhật theo trong lịch sử seal vì:

1. **Logic hiện tại chỉ ĐỌC booking** từ ServiceRequest khi gán seal
2. **KHÔNG có logic cập nhật ngược lại** `booking_number` trong `SealUsageHistory` khi ServiceRequest được cập nhật
3. **Lịch sử seal được ghi với booking hiện tại** (có thể null), nhưng không được cập nhật khi booking thay đổi sau đó

## 🎯 **Giải pháp đã implement**

### **Option 1: Cập nhật SealUsageHistory khi ServiceRequest được cập nhật booking**

#### **1. Sửa `updateController.ts`**

Thêm logic đồng bộ trong `updateRequest` function:

```typescript
// Kiểm tra xem booking_bill và container_no có thay đổi không
const newBookingBill = booking_bill || existingRequest.booking_bill;
const newContainerNo = container_no || existingRequest.container_no;
const bookingBillChanged = booking_bill && booking_bill !== existingRequest.booking_bill;
const containerNoChanged = container_no && container_no !== existingRequest.container_no;

// Nếu booking_bill hoặc container_no được cập nhật, đồng bộ với SealUsageHistory
if ((bookingBillChanged && newBookingBill) || containerNoChanged) {
    try {
        if (bookingBillChanged && newBookingBill) {
            // Cập nhật booking_number trong SealUsageHistory
            const updatedSealHistory = await prisma.sealUsageHistory.updateMany({
                where: {
                    container_number: existingRequest.container_no,
                    booking_number: null // Chỉ cập nhật những record chưa có booking_number
                },
                data: {
                    booking_number: newBookingBill
                }
            });
        }

        if (containerNoChanged && newContainerNo) {
            // Cập nhật container_number trong SealUsageHistory nếu có booking_bill
            if (newBookingBill) {
                const updatedSealHistory = await prisma.sealUsageHistory.updateMany({
                    where: {
                        container_number: existingRequest.container_no,
                        booking_number: newBookingBill
                    },
                    data: {
                        container_number: newContainerNo
                    }
                });
            }
        }
    } catch (sealUpdateError) {
        console.error('❌ Lỗi khi cập nhật SealUsageHistory:', sealUpdateError);
        // Không throw error để không ảnh hưởng đến việc cập nhật ServiceRequest
    }
}
```

#### **2. Tạo API đồng bộ thủ công**

**File**: `syncSealBookingController.ts`

**API Endpoints**:
- `POST /requests/:requestId/sync-seal-booking` - Đồng bộ booking cho một request cụ thể
- `POST /requests/sync-all-seal-bookings` - Đồng bộ booking cho tất cả requests

**Routes**: Đã thêm vào `RequestRoutes.ts`

## 🔄 **Quy trình hoạt động mới**

### **Trường hợp 1: Cập nhật booking sau khi đã gán seal**

```
1. Tạo ServiceRequest (booking_bill = null)
2. Gán seal → Lịch sử ghi: booking_number = null
3. Cập nhật booking_bill vào ServiceRequest
4. ✅ TỰ ĐỘNG cập nhật booking_number trong SealUsageHistory
5. Xem lịch sử seal → Hiển thị booking mới
```

### **Trường hợp 2: Cập nhật container sau khi đã gán seal**

```
1. Tạo ServiceRequest với container_no = "ABC123"
2. Gán seal → Lịch sử ghi: container_number = "ABC123"
3. Cập nhật container_no = "XYZ789" và booking_bill = "BOOKING001"
4. ✅ TỰ ĐỘNG cập nhật container_number trong SealUsageHistory
5. Xem lịch sử seal → Hiển thị container và booking mới
```

## 🧪 **Test giải pháp**

### **Test Script**: `test-seal-booking-sync.js`

```bash
node test-seal-booking-sync.js
```

**Quy trình test**:
1. Tạo ServiceRequest (không có booking_bill)
2. Gán seal cho container
3. Cập nhật booking_bill vào ServiceRequest
4. Kiểm tra SealUsageHistory đã được cập nhật booking_number chưa

### **Test thủ công**

1. **Tạo request** không có booking
2. **Gán seal** trong ManagerCont
3. **Cập nhật booking** trong request
4. **Kiểm tra lịch sử seal** → Booking phải xuất hiện

## 📊 **API Endpoints mới**

### **1. Đồng bộ booking cho request cụ thể**

```http
POST /requests/:requestId/sync-seal-booking
Content-Type: application/json

{
  "forceUpdate": false  // Optional: Có cập nhật cả record đã có booking_number không
}
```

**Response**:
```json
{
  "success": true,
  "message": "Đã đồng bộ thành công 2 record",
  "data": {
    "requestId": "req_123",
    "containerNo": "ABC123",
    "bookingBill": "BOOKING001",
    "updatedCount": 2,
    "updatedRecords": [...]
  }
}
```

### **2. Đồng bộ booking cho tất cả requests**

```http
POST /requests/sync-all-seal-bookings
```

**Response**:
```json
{
  "success": true,
  "message": "Đã đồng bộ thành công 15 record từ 10 ServiceRequest",
  "data": {
    "totalRequests": 10,
    "totalUpdated": 15,
    "results": [...]
  }
}
```

## 🔧 **Cách sử dụng**

### **Tự động (Mặc định)**
- Khi cập nhật `booking_bill` hoặc `container_no` trong ServiceRequest
- Hệ thống sẽ **tự động** đồng bộ với SealUsageHistory

### **Thủ công (Khi cần)**
```javascript
// Đồng bộ cho một request cụ thể
await axios.post('/requests/req_123/sync-seal-booking');

// Đồng bộ cho tất cả requests
await axios.post('/requests/sync-all-seal-bookings');
```

## ⚠️ **Lưu ý**

1. **Chỉ cập nhật record chưa có booking_number** (trừ khi `forceUpdate = true`)
2. **Không throw error** nếu cập nhật SealUsageHistory thất bại để không ảnh hưởng đến ServiceRequest
3. **Log chi tiết** để debug khi cần
4. **Cần quyền** `TechnicalDepartment`, `SystemAdmin`, hoặc `BusinessAdmin` để sử dụng API đồng bộ

## 🎉 **Kết quả**

✅ **Vấn đề đã được giải quyết**: Khi có seal trước ở ManagerCont, số booking sẽ được cập nhật theo khi ServiceRequest được cập nhật booking_bill

✅ **Tự động đồng bộ**: Không cần can thiệp thủ công trong hầu hết trường hợp

✅ **API đồng bộ thủ công**: Có sẵn khi cần thiết

✅ **Backward compatible**: Không ảnh hưởng đến logic hiện tại
