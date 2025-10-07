# 🔒 Container Validation - Export Request Conflict

## Tổng quan

Tài liệu này mô tả logic validation mới để ngăn chặn tạo IMPORT request khi container đang có EXPORT request với trạng thái khác GATE_OUT.

## 🎯 Mục đích

- **Ngăn chặn xung đột**: Không cho phép tạo IMPORT request khi container đang trong quy trình EXPORT
- **Đảm bảo tính nhất quán**: Container chỉ có thể ở một trạng thái tại một thời điểm
- **Cải thiện UX**: Hiển thị thông báo lỗi rõ ràng cho người dùng

## 🔧 Logic Validation Mới

### Backend Validation

**File:** `modules/requests/controller/createController.ts` và `checkContainerController.ts`

#### 1. Kiểm tra EXPORT Request với trạng thái khác GATE_OUT

```typescript
// BỔ SUNG: Kiểm tra container có EXPORT request với trạng thái khác GATE_OUT không
const activeExportRequest = await prisma.serviceRequest.findFirst({
    where: {
        container_no: container_no,
        type: 'EXPORT',
        status: {
            notIn: ['COMPLETED', 'REJECTED', 'GATE_REJECTED', 'GATE_OUT']
        }
    },
    orderBy: { createdAt: 'desc' }
});

// Nếu có EXPORT request với trạng thái khác GATE_OUT, không cho phép tạo IMPORT request
if (activeExportRequest) {
    return res.status(400).json({ 
        success: false, 
        message: `Container ${container_no} đang có EXPORT request với trạng thái ${activeExportRequest.status} (khác GATE_OUT). Không thể tạo IMPORT request mới. Chỉ có thể tạo IMPORT request khi container có EXPORT request với trạng thái GATE_OUT hoặc không có EXPORT request nào.` 
    });
}
```

#### 2. Kiểm tra IMPORT Request đang active

```typescript
// Tìm container IMPORT đang active
const activeImportRequest = await prisma.serviceRequest.findFirst({
    where: {
        container_no: container_no,
        type: 'IMPORT',
        status: {
            notIn: ['COMPLETED', 'REJECTED', 'GATE_REJECTED']
        }
    },
    orderBy: { createdAt: 'desc' }
});

// Nếu có container IMPORT đang active, không cho phép tạo IMPORT request mới
if (activeImportRequest) {
    return res.status(400).json({ 
        success: false, 
        message: `Container ${container_no} đã tồn tại trong hệ thống với trạng thái ${activeImportRequest.status} (IMPORT). Chỉ có thể tạo request mới khi container không còn trong hệ thống.` 
    });
}
```

### Frontend Validation

**File:** `frontend/pages/Requests/components/CreateLowerRequestModal.tsx`

#### 1. Re-enable Container Validation

```typescript
// Check if container number already exists - Re-enabled with new validation logic
const checkContainerExists = React.useCallback(async (containerNo: string) => {
    if (!containerNo.trim()) {
        setContainerValidationError('');
        setIsCheckingContainer(false);
        return;
    }

    setIsCheckingContainer(true);
    setContainerValidationError('');

    try {
        const response = await requestService.checkContainerExists(containerNo);
        
        if (response.data.success && response.data.exists) {
            setContainerValidationError(response.data.message);
        } else if (response.data.success && !response.data.exists) {
            // Container có thể tạo request mới - clear error
            setContainerValidationError('');
        } else {
            setContainerValidationError('');
        }
    } catch (error: any) {
        console.error('Error checking container:', error);
        setContainerValidationError('Lỗi khi kiểm tra container. Vui lòng thử lại.');
    } finally {
        setIsCheckingContainer(false);
    }
}, []);
```

#### 2. Hiển thị Validation Error

```typescript
{/* Container validation error display */}
{containerValidationError && (
    <div style={{
        marginTop: '6px',
        padding: '8px 12px',
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#dc2626',
        lineHeight: '1.4'
    }}>
        <div style={{ fontWeight: '500', marginBottom: '2px' }}>
            ⚠️ Container không hợp lệ
        </div>
        <div style={{ fontSize: '11px' }}>{containerValidationError}</div>
    </div>
)}
```

## 📋 Các Trường Hợp Validation

### ✅ Cho phép tạo IMPORT request:

1. **Container không tồn tại** trong hệ thống
2. **Container có EXPORT request** với trạng thái `GATE_OUT`
3. **Container có EXPORT request** với trạng thái `COMPLETED`, `REJECTED`, `GATE_REJECTED`

### ❌ Không cho phép tạo IMPORT request:

1. **Container có EXPORT request** với trạng thái khác `GATE_OUT`:
   - `PENDING`
   - `SCHEDULED`
   - `FORWARDED`
   - `FORKLIFTING`
   - `GATE_IN`
   - `DONE_LIFTING`
   - `IN_CAR`
   - `IN_YARD`

2. **Container đã có IMPORT request** đang active (trạng thái khác `COMPLETED`, `REJECTED`, `GATE_REJECTED`)

## 🧪 Test Cases

### Test Case 1: Container không tồn tại
- **Input**: Container `TEST123` không có trong hệ thống
- **Expected**: ✅ Cho phép tạo IMPORT request

### Test Case 2: Container có EXPORT với status IN_CAR
- **Input**: Container `TEST123` có EXPORT request với status `IN_CAR`
- **Expected**: ❌ Không cho phép tạo IMPORT request
- **Message**: `Container TEST123 đang có EXPORT request với trạng thái IN_CAR (khác GATE_OUT). Không thể tạo IMPORT request mới.`

### Test Case 3: Container có EXPORT với status GATE_OUT
- **Input**: Container `TEST123` có EXPORT request với status `GATE_OUT`
- **Expected**: ✅ Cho phép tạo IMPORT request

### Test Case 4: Container đã có IMPORT request active
- **Input**: Container `TEST123` đã có IMPORT request với status `PENDING`
- **Expected**: ❌ Không cho phép tạo IMPORT request thứ 2
- **Message**: `Container TEST123 đã tồn tại trong hệ thống với trạng thái PENDING (IMPORT). Chỉ có thể tạo request mới khi container không còn trong hệ thống.`

## 🎯 Lợi Ích

### 1. **Ngăn chặn xung đột**
- Không cho phép container ở nhiều trạng thái cùng lúc
- Đảm bảo tính nhất quán của dữ liệu

### 2. **Cải thiện UX**
- Hiển thị thông báo lỗi rõ ràng
- Validation real-time khi nhập container number
- Hướng dẫn người dùng cách khắc phục

### 3. **Đồng bộ Frontend-Backend**
- Frontend validation sử dụng cùng logic với backend
- Giảm thiểu lỗi validation không đồng bộ

## 🔄 Workflow

1. **User nhập container number** trong modal tạo yêu cầu hạ container
2. **Frontend gọi API** `/requests/check-container` để kiểm tra
3. **Backend kiểm tra** tất cả trường hợp validation
4. **Hiển thị kết quả** cho user:
   - ✅ Container hợp lệ → Cho phép submit
   - ❌ Container không hợp lệ → Hiển thị lỗi và chặn submit

## 📝 Thông báo lỗi

### EXPORT Request Conflict
```
Container {container_no} đang có EXPORT request với trạng thái {status} (khác GATE_OUT). 
Không thể tạo IMPORT request mới. Chỉ có thể tạo IMPORT request khi container có EXPORT request với trạng thái GATE_OUT hoặc không có EXPORT request nào.
```

### IMPORT Request Duplicate
```
Container {container_no} đã tồn tại trong hệ thống với trạng thái {status} (IMPORT). 
Chỉ có thể tạo request mới khi container không còn trong hệ thống.
```

## 🚀 Triển khai

1. **Backend**: Logic validation đã được cập nhật trong `createController.ts` và `checkContainerController.ts`
2. **Frontend**: Modal `CreateLowerRequestModal` đã được cập nhật để hiển thị validation
3. **Test**: File test `test-container-validation.js` để verify logic

## 📊 Kết quả Test

```
🧪 TEST CONTAINER VALIDATION LOGIC MỚI
============================================================

1. Test Case: Container không tồn tại
   Container TEST123: ✅ Cho phép

2. Test Case: Container có EXPORT request với status IN_CAR
   Container TEST123: ❌ Không cho phép
   Lý do: Container TEST123 đang có EXPORT request với trạng thái IN_CAR (khác GATE_OUT)

3. Test Case: Cập nhật EXPORT request thành GATE_OUT
   Container TEST123: ✅ Cho phép

4. Test Case: Tạo IMPORT request
   ✅ Đã tạo thành công IMPORT request

5. Test Case: Thử tạo IMPORT request thứ 2
   Container TEST123: ❌ Không cho phép
   Lý do: Container TEST123 đã tồn tại trong hệ thống với trạng thái PENDING (IMPORT)

✅ Test hoàn thành!
```
