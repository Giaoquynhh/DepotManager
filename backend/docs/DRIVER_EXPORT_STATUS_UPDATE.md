# Driver Export Status Update - GATE_IN → FORKLIFTING

## 🎯 Tổng quan

Tài liệu này mô tả thay đổi logic trong DriverDashboard để khi tài xế click nút "Bắt đầu" trên export request, trạng thái của ServiceRequest sẽ chuyển từ `GATE_IN` → `FORKLIFTING`, trong khi import request vẫn giữ nguyên logic hiện tại.

## 🔄 Logic mới

### **Trước đây (Logic cũ)**
- **Tất cả requests**: Chỉ có thể chuyển từ `POSITIONED` → `FORKLIFTING`
- **Import requests**: `POSITIONED` → `FORKLIFTING` (giữ nguyên)
- **Export requests**: Không có logic chuyển trạng thái khi tài xế bắt đầu

### **Bây giờ (Logic mới)**
- **Import requests**: `POSITIONED` → `FORKLIFTING` (giữ nguyên logic cũ)
- **Export requests**: `GATE_IN` → `FORKLIFTING` (logic mới)
- **Các trường hợp khác**: Không thay đổi trạng thái

## 📍 Vị trí thay đổi

### **Backend Service**
```typescript
// File: modules/driver-dashboard/service/DriverDashboardService.ts
// Method: updateTaskStatus()

// Logic mới: Phân biệt giữa IMPORT và EXPORT
if (latestRequest.type === 'EXPORT' && latestRequest.status === 'GATE_IN') {
    // Export request: GATE_IN → FORKLIFTING
    newStatus = 'FORKLIFTING';
} else if (latestRequest.type === 'IMPORT' && latestRequest.status === 'POSITIONED') {
    // Import request: POSITIONED → FORKLIFTING (giữ nguyên logic cũ)
    newStatus = 'FORKLIFTING';
} else {
    // Các trường hợp khác: không thay đổi
    return updatedForkliftTask;
}
```

### **State Machine**
```typescript
// File: modules/requests/service/RequestStateMachine.ts
// Transition mới được thêm vào

{
  from: 'GATE_IN',
  to: 'FORKLIFTING',
  allowedRoles: ['Driver', 'SaleAdmin', 'SystemAdmin'],
  description: 'Tài xế bắt đầu nâng/hạ container (Export requests)'
}
```

## 🚀 Quy trình hoạt động

### **1. Tài xế click "Bắt đầu" trên DriverDashboard**
- URL: `http://localhost:5002/DriverDashboard`
- Action: Click nút "Bắt đầu" trên export request

### **2. Backend xử lý**
- `DriverDashboardService.updateTaskStatus()` được gọi
- ForkliftTask status: `PENDING` → `IN_PROGRESS`
- ServiceRequest status: `GATE_IN` → `FORKLIFTING` (chỉ cho EXPORT)

### **3. Database update**
- Cập nhật `forkliftTask.status`
- Cập nhật `serviceRequest.status`
- Ghi audit log cho cả hai thay đổi

### **4. Kết quả**
- Export request chuyển từ `GATE_IN` → `FORKLIFTING`
- Import request vẫn giữ nguyên logic: `POSITIONED` → `FORKLIFTING`

## 🔧 Cấu hình và quyền

### **Roles được phép**
- `Driver`: Thực hiện transition
- `SaleAdmin`: Có thể thực hiện transition
- `SystemAdmin`: Có thể thực hiện transition

### **Điều kiện áp dụng**
- Chỉ áp dụng khi forklift task chuyển từ `PENDING` → `IN_PROGRESS`
- Phải có `container_no` hợp lệ
- Phải tìm được `ServiceRequest` tương ứng

## 📊 Audit Logging

### **Log khi thay đổi ForkliftTask**
```typescript
{
  action: 'TASK_STATUS_UPDATED',
  entity: 'ForkliftTask',
  meta: {
    oldStatus: 'PENDING',
    newStatus: 'IN_PROGRESS',
    notes: 'Tài xế bắt đầu thực hiện task'
  }
}
```

### **Log khi thay đổi ServiceRequest**
```typescript
{
  action: 'REQUEST_STATUS_UPDATED',
  entity: 'ServiceRequest',
  meta: {
    oldStatus: 'GATE_IN',
    newStatus: 'FORKLIFTING',
    containerNo: 'ABCD1234567',
    requestType: 'EXPORT'
  }
}
```

## 🧪 Testing

### **Test Script**
```bash
# Chạy test để kiểm tra logic mới
node test-driver-export-status.js
```

### **Test Cases**
1. **Export Request**: `GATE_IN` → `FORKLIFTING` ✅
2. **Import Request**: `POSITIONED` → `FORKLIFTING` ✅ (giữ nguyên)
3. **Invalid Status**: Không thay đổi nếu status không phù hợp ✅
4. **Audit Logging**: Ghi log đầy đủ cho cả hai thay đổi ✅

## 📝 Ghi chú

- Logic mới chỉ áp dụng cho export requests
- Import requests vẫn giữ nguyên workflow hiện tại
- Không ảnh hưởng đến các logic khác trong hệ thống
- Đã được test và validate đầy đủ

## 🔗 Liên quan

- **Frontend**: `pages/DriverDashboard/index.tsx`
- **Backend**: `modules/driver-dashboard/service/DriverDashboardService.ts`
- **State Machine**: `modules/requests/service/RequestStateMachine.ts`
- **Database**: `ServiceRequest.status`, `ForkliftTask.status`
