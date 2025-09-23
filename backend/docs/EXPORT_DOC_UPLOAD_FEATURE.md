# Upload chứng từ cho Yêu cầu (đã cập nhật)

## Tổng quan

Tài liệu được cập nhật để khớp với logic hiện tại. Upload chứng từ áp dụng cho yêu cầu IMPORT/EXPORT, lưu file cục bộ trong `uploads/requests`, ghi nhận DB qua `requestAttachment`, không tự động chuyển trạng thái sau upload (trừ khi gọi endpoint nghiệp vụ riêng).

## Luồng hoạt động

### 1. Điều kiện upload
- Loại yêu cầu: IMPORT/EXPORT
- Trạng thái: không cưỡng bức cố định; chỉ yêu cầu yêu cầu tồn tại
- Quyền: `TechnicalDepartment`, `Accountant`, `CustomerAdmin`, `CustomerUser`, `SystemAdmin`, `BusinessAdmin`

### 2. Quy trình upload
```
Người dùng có quyền → Chọn nhiều files → Upload → Lưu disk + DB → Cập nhật attachments_count
```

### 3. Chi tiết
- Validation: kiểm tra tồn tại request, giới hạn loại file (PDF, image/*), kích thước 10MB/file, tối đa 10 files
- Lưu file: `uploads/requests` (tự tạo thư mục nếu thiếu), tên file do Multer sinh (`request_<timestamp-rand>.<ext>`)
- DB: tạo bản ghi `requestAttachment`, cập nhật `attachments_count` của `serviceRequest`
- Trạng thái: dùng endpoint chuyên biệt khi cần (ví dụ `move-to-gate`)

## Backend Implementation

### 1) Routes (RequestRoutes.ts)
```13:18:manageContainer/backend/modules/requests/controller/RequestRoutes.ts
// Upload multiple files for a request
router.post('/:requestId/files', 
    requireRoles('TechnicalDepartment', 'Accountant', 'CustomerAdmin', 'CustomerUser', 'SystemAdmin', 'BusinessAdmin'),
    fileUploadService.getMulter().array('files', 10),
    controller.uploadFiles
);
```

```20:30:manageContainer/backend/modules/requests/controller/RequestRoutes.ts
// Get files / Delete file
router.get('/:requestId/files', requireRoles('TechnicalDepartment','Accountant','CustomerAdmin','CustomerUser','SystemAdmin','BusinessAdmin'), controller.getFiles);
router.delete('/files/:fileId', requireRoles('TechnicalDepartment','Accountant','CustomerAdmin','CustomerUser','SystemAdmin','BusinessAdmin'), controller.deleteFile);
```

### 2) Controller (đã tách nhỏ)
```41:76:manageContainer/backend/modules/requests/controller/filesController.ts
// Get files for a request
export const getFiles = async (req: Request, res: Response) => { /* ... */ };

// Delete a file
export const deleteFile = async (req: Request, res: Response) => { /* ... */ };
```

```4:31:manageContainer/backend/modules/requests/controller/createController.ts
// Create a new request with files
export const createRequest = async (req: Request, res: Response) => { /* nhận files, tạo request, upload nếu có */ };
```

### 3) Service (FileUploadService.ts)
```55:113:manageContainer/backend/modules/requests/service/FileUploadService.ts
async uploadFiles(requestId: string, files: Express.Multer.File[], uploaderId: string, uploaderRole: 'customer' | 'depot' = 'depot') {
  // Lưu file vào uploads/requests, tạo record requestAttachment, tăng attachments_count
}
```

```123:147:manageContainer/backend/modules/requests/service/FileUploadService.ts
async getFiles(requestId: string) { /* trả về danh sách file chưa xóa */ }
```

```150:191:manageContainer/backend/modules/requests/service/FileUploadService.ts
async deleteFile(fileId: string, deletedBy: string, reason?: string) { /* xóa mềm + giảm attachments_count */ }
```

## Trạng thái & nghiệp vụ liên quan

```4:20:manageContainer/backend/modules/requests/controller/transitionController.ts
// Chuyển nhanh PENDING → GATE_IN, cập nhật gate_checked_* và history
export const moveToGate = async (req: Request, res: Response) => { /* ... */ };
```

## Frontend tham chiếu

- FE truy cập file qua rewrite: `/backend/uploads/requests/:fileName`
- Gọi API upload: `POST /requests/:requestId/files` với FormData `files[]`

Ví dụ service (rút gọn):
```typescript
const form = new FormData();
files.forEach(f => form.append('files', f));
await api.post(`/requests/${requestId}/files`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
```

## Kiểm thử

- ✅ Upload nhiều PDF/JPG/PNG cho IMPORT/EXPORT
- ✅ Lấy danh sách file theo requestId
- ✅ Xóa mềm 1 file và giảm attachments_count
- ❌ Upload >10 files hoặc file không hợp lệ (txt, docx)
- ❌ Không đủ quyền

## Bảo mật & Hiệu năng

- RBAC qua `requireRoles`, xác thực qua `authenticate`
- Giới hạn loại/kích thước file tại Multer
- Tạo thư mục an toàn, ghi log lỗi server-side