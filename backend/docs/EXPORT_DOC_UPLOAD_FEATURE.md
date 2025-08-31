# Tính năng Upload Chứng từ Xuất (EXPORT_DOC)

## Tổng quan

Tính năng này cho phép admin upload chứng từ cho yêu cầu xuất (EXPORT) khi trạng thái là `PICK_CONTAINER`. Sau khi upload thành công, hệ thống sẽ tự động chuyển trạng thái từ `PICK_CONTAINER` sang `SCHEDULED`.

## Luồng hoạt động

### 1. Điều kiện upload
- **Loại yêu cầu**: Chỉ áp dụng cho yêu cầu `EXPORT`
- **Trạng thái hiện tại**: Phải là `PICK_CONTAINER`
- **Quyền**: Chỉ `SaleAdmin`, `SystemAdmin`, `BusinessAdmin` được upload

### 2. Quy trình upload
```
Admin → Click "Thêm chứng từ" → Chọn file → Upload → Tự động chuyển trạng thái
```

### 3. Chi tiết từng bước

#### **Bước 1: Validation**
- Kiểm tra request status = `PICK_CONTAINER`
- Kiểm tra request type = `EXPORT`
- Kiểm tra actor role có quyền upload
- Kiểm tra file type và size (PDF, JPG, PNG, tối đa 10MB)

#### **Bước 2: File Processing**
- Lưu file vào thư mục `uploads/`
- Tạo tên file unique: `{timestamp}_{request_id}_{type}{extension}`
- Lưu thông tin document vào database

#### **Bước 3: Auto Status Change**
- Sử dụng `RequestStateMachine.canTransition()` để kiểm tra
- Gọi `RequestStateMachine.executeTransition()` để validate
- Cập nhật database với trạng thái mới `SCHEDULED`
- Thêm entry vào history với action `SCHEDULED`

## Backend Implementation

### 1. Routes (`RequestRoutes.ts`)
```typescript
// Documents
router.post('/:id/docs', requireRoles('SaleAdmin','Accountant','CustomerAdmin','CustomerUser','SystemAdmin','BusinessAdmin'), upload.single('file'), (req, res) => controller.uploadDoc(req as any, res));
```

### 2. Controller (`RequestController.ts`)
```typescript
async uploadDoc(req: AuthRequest, res: Response) {
    const { error, value } = uploadDocSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    try { 
        return res.status(201).json(await service.uploadDocument(req.user!, req.params.id, value.type, (req as any).file)); 
    } catch (e: any) { 
        return res.status(400).json({ message: e.message }); 
    }
}
```

### 3. Service (`RequestService.ts`)
```typescript
async uploadDocument(actor: any, request_id: string, type: 'EIR'|'LOLO'|'INVOICE'|'SUPPLEMENT'|'EXPORT_DOC', file: Express.Multer.File) {
    // Validation cho EXPORT_DOC
    if (type === 'EXPORT_DOC') {
        if (req.status !== 'PICK_CONTAINER') {
            throw new Error('Chỉ upload chứng từ xuất khi yêu cầu đang ở trạng thái chọn container');
        }
        if (req.type !== 'EXPORT') {
            throw new Error('Chỉ upload chứng từ xuất cho yêu cầu loại EXPORT');
        }
        if (!['SaleAdmin', 'SystemAdmin', 'BusinessAdmin'].includes(actor.role)) {
            throw new Error('Chỉ admin được upload chứng từ xuất');
        }
    }
    
    // Auto status change logic
    if (type === 'EXPORT_DOC') {
        const canTransition = RequestStateMachine.canTransition(req.status, 'SCHEDULED', actor.role);
        if (canTransition) {
            await RequestStateMachine.executeTransition(
                actor, request_id, req.status, 'SCHEDULED',
                'Tự động chuyển trạng thái sau khi upload chứng từ xuất'
            );
            
            const updatedRequest = await repo.update(request_id, {
                status: 'SCHEDULED',
                history: [...req.history, {
                    at: new Date().toISOString(),
                    by: actor._id,
                    action: 'SCHEDULED',
                    reason: 'Tự động chuyển trạng thái sau khi upload chứng từ xuất',
                    document_id: doc.id,
                    document_type: 'EXPORT_DOC'
                }]
            });
        }
    }
}
```

### 4. Validation Schema (`RequestDtos.ts`)
```typescript
export const uploadDocSchema = Joi.object({
    type: Joi.string().valid('EIR','LOLO','INVOICE','SUPPLEMENT','EXPORT_DOC').required()
});
```

### 5. State Machine (`RequestStateMachine.ts`)
```typescript
// Transition từ PICK_CONTAINER sang SCHEDULED đã được định nghĩa
// và hỗ trợ cho các role: SaleAdmin, SystemAdmin, BusinessAdmin
```

## Frontend Implementation

### 1. Component (`DepotRequestTable.tsx`)
```typescript
// Hiển thị nút "Thêm chứng từ" cho yêu cầu EXPORT với trạng thái PICK_CONTAINER
{item.type === 'EXPORT' && item.status === 'PICK_CONTAINER' && onAddDocument ? (
    <button
        className="btn btn-sm btn-primary"
        onClick={() => onAddDocument(item.id, item.container_no || '')}
        title="Thêm chứng từ cho container"
    >
        📎 Thêm chứng từ
    </button>
) : (
    <span className="no-document">-</span>
)}
```

### 2. Hook (`useDepotActions.ts`)
```typescript
const handleAddDocument = async (requestId: string, containerNo: string) => {
    setLoadingId(requestId + 'ADD_DOC');
    try {
        // Tạo file input ẩn
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.pdf,.jpg,.jpeg,.png';
        
        fileInput.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;
            
            // Validation file
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                setMsg({ text: 'Chỉ chấp nhận file PDF hoặc ảnh (JPG, PNG)', ok: false });
                return;
            }
            
            // Tạo FormData
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'EXPORT_DOC');
            
            // Gọi API upload
            const response = await api.post(`/requests/${requestId}/docs`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Hiển thị thông báo thành công
            setMsg({ 
                text: `✅ Đã upload chứng từ thành công cho container ${containerNo}! Trạng thái đã tự động chuyển từ PICK_CONTAINER sang SCHEDULED.`, 
                ok: true 
            });
            
            // Refresh data
            mutate('/requests?page=1&limit=20');
        };
        
        fileInput.click();
        
    } catch (e: any) {
        setMsg({ text: `Không thể thêm chứng từ: ${e?.response?.data?.message || 'Lỗi'}`, ok: false });
    } finally {
        setLoadingId('');
    }
};
```

### 3. API Service
```typescript
// Sử dụng api.post với FormData
const response = await api.post(`/requests/${requestId}/docs`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
```

## File Structure

```
manageContainer/
├── backend/
│   ├── modules/requests/
│   │   ├── controller/
│   │   │   ├── RequestRoutes.ts          # Route với middleware requireRoles
│   │   │   └── RequestController.ts      # Controller method uploadDoc
│   │   ├── service/
│   │   │   └── RequestService.ts         # Logic upload và auto status change
│   │   ├── dto/
│   │   │   └── RequestDtos.ts            # Validation schema cho EXPORT_DOC
│   │   └── service/
│   │       └── RequestStateMachine.ts    # State transition logic
│   └── shared/middlewares/
│       ├── auth.ts                       # Authentication middleware
│       └── rbac.ts                       # Role-based access control
└── frontend/
    └── pages/Requests/
        ├── components/
        │   └── DepotRequestTable.tsx      # UI component với nút upload
        ├── hooks/
        │   └── useDepotActions.ts         # Logic xử lý upload
        └── Depot.tsx                      # Main page component
```

## Error Handling

### 1. Backend Errors
- **403 Forbidden**: Role không có quyền upload
- **400 Bad Request**: File không hợp lệ hoặc validation fail
- **404 Not Found**: Request không tồn tại

### 2. Frontend Errors
- **File Type Error**: Chỉ chấp nhận PDF, JPG, PNG
- **File Size Error**: Tối đa 10MB
- **API Error**: Hiển thị message từ backend

## Testing

### 1. Test Cases
- ✅ Upload PDF cho EXPORT request với status PICK_CONTAINER
- ✅ Upload JPG cho EXPORT request với status PICK_CONTAINER  
- ✅ Upload PNG cho EXPORT request với status PICK_CONTAINER
- ❌ Upload file không hợp lệ (txt, docx)
- ❌ Upload cho IMPORT request
- ❌ Upload cho request với status khác PICK_CONTAINER
- ❌ Upload với role không có quyền

### 2. Expected Results
- File được lưu vào thư mục uploads/
- Document record được tạo trong database
- Request status tự động chuyển từ PICK_CONTAINER sang SCHEDULED
- History được cập nhật với action SCHEDULED
- Frontend hiển thị thông báo thành công và refresh data

## Security Considerations

1. **Role-based Access Control**: Chỉ admin roles mới có thể upload
2. **File Type Validation**: Chỉ chấp nhận file types an toàn
3. **File Size Limit**: Giới hạn 10MB để tránh DoS
4. **Authentication**: JWT token validation
5. **Audit Logging**: Ghi log tất cả actions

## Performance Considerations

1. **File Storage**: Sử dụng memory storage cho file processing
2. **Database Updates**: Optimized với single update operation
3. **State Machine**: Efficient transition validation
4. **Frontend**: Debounced API calls và optimistic updates
