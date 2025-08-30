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
- Kiểm tra file type và size

#### **Bước 2: File Processing**
- Lưu file vào thư mục `uploads/`
- Tạo document record trong database với type `EXPORT_DOC`
- Tăng version number tự động

#### **Bước 3: Auto-Status Change Logic**
```typescript
// Pre-check transition possibility
const canTransition = RequestStateMachine.canTransition(req.status, 'SCHEDULED', actor.role);

if (!canTransition) {
  console.warn(`Cannot transition from ${req.status} to SCHEDULED for role ${actor.role}`);
  return doc; // Upload thành công nhưng không chuyển trạng thái
}

// Execute state machine transition
await RequestStateMachine.executeTransition(
  actor,
  request_id,
  req.status,
  'SCHEDULED',
  'Tự động chuyển trạng thái sau khi upload chứng từ xuất'
);
```

#### **Bước 4: Database Update**
```typescript
const updatedRequest = await repo.update(request_id, {
  status: 'SCHEDULED',
  scheduled_at: new Date(),
  scheduled_by: actor._id,
  history: [
    ...req.history,
    {
      at: new Date().toISOString(),
      by: actor._id,
      action: 'SCHEDULED',
      reason: 'Tự động chuyển trạng thái sau khi upload chứng từ xuất',
      document_id: doc.id,
      document_type: 'EXPORT_DOC'
    }
  ]
});
```

## API Endpoint

### Upload Document
```
POST /requests/:id/docs
Content-Type: multipart/form-data

Body:
- file: File (PDF, JPG, JPEG, PNG, tối đa 10MB)
- type: "EXPORT_DOC"
```

### Response
```json
{
  "id": "document_id",
  "request_id": "request_id",
  "type": "EXPORT_DOC",
  "name": "original_filename.pdf",
  "size": 1024000,
  "version": 1,
  "uploader_id": "user_id",
  "storage_key": "timestamp_request_id_EXPORT_DOC.pdf",
  "created_at": "2025-01-06T10:30:00.000Z"
}
```

## Frontend Implementation

### Component: DepotRequestTable
- Hiển thị nút "Thêm chứng từ" khi:
  - `item.type === 'EXPORT'`
  - `item.status === 'PICK_CONTAINER'`
  - `onAddDocument` prop được truyền

### Hook: useDepotActions
- `handleAddDocument`: Xử lý việc upload chứng từ
- Tạo file input element
- Validate file type và size
- Gọi API upload
- Refresh data sau khi thành công

## State Machine Transitions

### PICK_CONTAINER → SCHEDULED
```typescript
{
  from: 'PICK_CONTAINER',
  to: 'SCHEDULED',
  allowedRoles: ['CustomerAdmin', 'CustomerUser', 'SaleAdmin', 'SystemAdmin'],
  description: 'Đã chọn container, chuyển sang đặt lịch hẹn'
}
```

## Error Handling

### Validation Errors
- File quá lớn (> 10MB)
- File type không được hỗ trợ
- Request không ở trạng thái `PICK_CONTAINER`
- Request không phải loại `EXPORT`
- Không có quyền upload

### State Machine Errors
- Không thể chuyển trạng thái
- Transition không được phép
- Lỗi trong quá trình cập nhật database

## Audit Logging

### Actions được log
- `DOC.UPLOADED_EXPORT_DOC`: Upload chứng từ xuất thành công
- `REQUEST.SCHEDULED`: Tự động chuyển trạng thái

### Thông tin được log
- Actor ID và role
- Request ID
- Document ID
- File type và version
- Timestamp

## Testing

### Test File
```bash
node test-export-doc-upload.js
```

### Test Cases
1. Upload thành công với file hợp lệ
2. Upload thất bại với file quá lớn
3. Upload thất bại với file type không hợp lệ
4. Upload thất bại khi request không ở trạng thái `PICK_CONTAINER`
5. Upload thất bại khi request không phải loại `EXPORT`
6. Upload thất bại khi không có quyền

## Security Considerations

### File Upload Security
- Validate file type (MIME type + extension)
- Limit file size (10MB)
- Sanitize filename
- Store files outside web root

### Authorization
- Role-based access control
- Tenant isolation (nếu cần)
- Audit logging cho tất cả actions

### Input Validation
- Validate request ID
- Validate document type
- Sanitize user input

## Performance Considerations

### File Processing
- Asynchronous file processing
- Progress tracking
- Error handling không block upload

### Database Operations
- Transaction cho status change
- Optimistic locking nếu cần
- Index cho document queries

## Monitoring và Logging

### Metrics
- Upload success rate
- File size distribution
- Processing time
- Error rates

### Logs
- Upload attempts
- Success/failure reasons
- State transitions
- Performance metrics

## Troubleshooting

### Common Issues
1. **File không upload được**
   - Kiểm tra file size
   - Kiểm tra file type
   - Kiểm tra quyền

2. **Trạng thái không chuyển**
   - Kiểm tra state machine rules
   - Kiểm tra actor role
   - Kiểm tra request status

3. **Lỗi database**
   - Kiểm tra connection
   - Kiểm tra transaction
   - Kiểm tra constraints

### Debug Commands
```bash
# Kiểm tra logs
tail -f logs/app.log | grep "EXPORT_DOC"

# Kiểm tra database
db.requests.findOne({_id: "request_id"})
db.documents.find({request_id: "request_id", type: "EXPORT_DOC"})
```
