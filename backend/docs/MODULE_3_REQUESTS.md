# MODULE 3: REQUESTS - Quản lý yêu cầu dịch vụ

## ✅ TRẠNG THÁI HIỆN TẠI: HOẠT ĐỘNG BÌNH THƯỜNG

**Ngày cập nhật:** 2025-09-19  
**Trạng thái:** Module đã được tái cấu trúc và hoạt động đầy đủ

### 🔄 Thay đổi gần đây (v2025-09-23):
- **Bổ sung API upload chứng từ theo yêu cầu** (đa file, xóa file, lấy danh sách file)
- **Chuẩn hóa quyền truy cập** cho toàn bộ endpoints thông qua `authenticate` + `requireRoles`
- **Bổ sung hàm chuyển trạng thái nhanh** từ `PENDING` → `GATE_IN` cho nghiệp vụ cổng
- **Lưu trữ file cục bộ** tại `uploads/requests` với đường dẫn truy cập qua FE: `/backend/uploads/requests/:file`
 - **Chuẩn hóa xử lý hủy yêu cầu**: lý do hủy được lưu vào trường `rejected_reason` (KHÔNG ghi vào `appointment_note/notes`); FE hiển thị lý do qua modal riêng "Xem lý do".

### 📁 Cấu trúc hiện tại:
```
backend/modules/requests/
├── controller/
│   ├── RequestController.ts             # Barrel re-export các handlers
│   ├── RequestRoutes.ts                 # Định nghĩa API routes + middlewares
│   ├── createController.ts              # Tạo yêu cầu + upload file ban đầu
│   ├── listController.ts                # Danh sách yêu cầu
│   ├── detailController.ts              # Chi tiết yêu cầu
│   ├── updateController.ts              # Cập nhật yêu cầu + upload file mới
│   ├── updateLegacyController.ts        # Cập nhật legacy (generic)
│   ├── cancelController.ts              # Hủy yêu cầu
│   ├── deleteController.ts              # Xóa mềm yêu cầu
│   └── filesController.ts               # Upload/Lấy/Xóa file đính kèm
└── service/
    └── FileUploadService.ts             # Dịch vụ xử lý upload, lưu DB, xóa mềm

frontend/pages/
├── LowerContainer.tsx                   # Trang quản lý yêu cầu hạ container
├── LiftContainer.tsx                    # Trang quản lý yêu cầu nâng container
└── Requests/components/                 # Shared components
    ├── ImportRequest.tsx                # Component hiển thị yêu cầu nâng
    ├── ExportRequest.tsx                # Component hiển thị yêu cầu hạ
    ├── CreateLiftRequestModal.tsx       # Modal tạo yêu cầu nâng
    ├── CreateLowerRequestModal.tsx      # Modal tạo yêu cầu hạ
    └── index.ts                         # Export components

frontend/components/
├── ContainerSubmenu.tsx                 # Submenu cho Container
└── Header.tsx                           # Navigation với Container submenus

frontend/services/
└── requests.ts                          # API service cho requests

frontend/utils/
└── requestNumberGenerator.ts            # Auto-generate request numbers
```

## Tổng quan
Module Requests quản lý các yêu cầu dịch vụ container (nâng/hạ container). Module đã được tái cấu trúc từ tab-based navigation sang submenu-based navigation, tích hợp trực tiếp vào Container management.

### Chức năng chính:
- **Tạo yêu cầu**: Nhận `request_no` từ FE (đã hỗ trợ auto-gen phía FE)
- **Quản lý yêu cầu**: CRUD operations cho IMPORT/EXPORT
- **Relations**: ShippingLine, ContainerType, Customer, TransportCompany
- **File uploads**: Upload nhiều file (PDF/Images), lấy danh sách, xóa mềm
- **Status tracking**: Theo dõi và cập nhật trạng thái; bổ sung chuyển nhanh `PENDING → GATE_IN`

## 🗄️ Database Schema

### ServiceRequest Model (trích yếu):
```prisma
model ServiceRequest {
    id            String   @id @default(cuid())
    tenant_id     String?
    created_by    String
    type          String   // IMPORT | EXPORT | CONVERT
    request_no    String?  // Auto-generated (NA/HAddmmyyy00000)
    container_no  String?
    shipping_line_id String? // FK to ShippingLine
    container_type_id String? // FK to ContainerType
    customer_id   String?  // FK to Customer
    vehicle_company_id String? // FK to TransportCompany
    eta           DateTime?
    status        String   // PENDING, GATE_IN, SCHEDULED, COMPLETED, REJECTED, ...
    appointment_time DateTime?
    appointment_note String?
    driver_name   String?
    license_plate String?
    // Relations
    shipping_line    ShippingLine? @relation(fields: [shipping_line_id], references: [id])
    container_type   ContainerType? @relation(fields: [container_type_id], references: [id])
    customer         Customer? @relation(fields: [customer_id], references: [id])
    vehicle_company  TransportCompany? @relation(fields: [vehicle_company_id], references: [id])
    attachments_count Int      @default(0)
    locked_attachments Boolean @default(false)
    has_invoice      Boolean   @default(false)
    is_paid          Boolean   @default(false)
    is_pick          Boolean   @default(false)
    gate_checked_at  DateTime?
    gate_checked_by  String?
    depot_deleted_at DateTime?
    // ... other fields/relations
}
```

## 🔌 API Endpoints (đã triển khai)

Tất cả routes đều kèm `authenticate` và `requireRoles`.

- `POST /requests/:requestId/files` → Upload nhiều file (tối đa 10)
- `GET /requests/:requestId/files` → Lấy danh sách file chưa xóa
- `DELETE /requests/files/:fileId` → Xóa mềm 1 file đính kèm
- `POST /requests/create` → Tạo mới yêu cầu (có thể kèm files)
- `GET /requests` → Danh sách yêu cầu + quan hệ + phân trang
- `GET /requests/:id` → Chi tiết 1 yêu cầu + attachments
- `PATCH /requests/:id/cancel` → Hủy yêu cầu (đặt `REJECTED`)
- `PATCH /requests/:id` → Cập nhật yêu cầu (có thể kèm files mới)
- `DELETE /requests/:id` → Xóa mềm yêu cầu (đặt `depot_deleted_at`)
- `PATCH /requests/:id/move-to-gate` → Chuyển `PENDING` → `GATE_IN`

Ánh xạ mã nguồn:

```13:31:manageContainer/backend/modules/requests/controller/RequestRoutes.ts
// Upload multiple files for a request
router.post('/:requestId/files', 
    requireRoles('TechnicalDepartment', 'Accountant', 'CustomerAdmin', 'CustomerUser', 'SystemAdmin', 'BusinessAdmin'),
    fileUploadService.getMulter().array('files', 10),
    controller.uploadFiles
);
```

```45:61:manageContainer/backend/modules/requests/controller/RequestRoutes.ts
// Get single request details
router.get('/:id', 
    requireRoles('TechnicalDepartment', 'Accountant', 'CustomerAdmin', 'CustomerUser', 'SystemAdmin', 'BusinessAdmin'),
    controller.getRequest
);
// Update request
router.patch('/:id', 
    requireRoles('TechnicalDepartment', 'Accountant', 'CustomerAdmin', 'CustomerUser', 'SystemAdmin', 'BusinessAdmin'),
    controller.updateRequest
);
```

### Chi tiết endpoint: Hủy yêu cầu

- Method: `PATCH`
- Path: `/requests/:id/cancel`
- Quyền: `TechnicalDepartment | Accountant | CustomerAdmin | CustomerUser | SystemAdmin | BusinessAdmin`
- Body:

```
{
  "reason": "string | optional"  // Lý do hủy do người thao tác nhập
}
```

- Hành vi trên server:
  - Cập nhật `status = 'REJECTED'`
  - Ghi trường `rejected_reason = reason || null`
  - Ghi `rejected_by`, `rejected_at`
  - Không tác động đến `appointment_note` hoặc các trường ghi chú khác

- Response mẫu (rút gọn):

```
{
  "success": true,
  "message": "Hủy yêu cầu thành công",
  "data": {
    "id": "...",
    "status": "REJECTED",
    "rejected_reason": "Hàng không đạt chuẩn",
    "rejected_by": "...",
    "rejected_at": "2025-09-23T07:20:00.000Z"
  }
}
```

- Lưu ý tích hợp FE:
  - Không hiển thị `rejected_reason` trong cột hoặc trường ghi chú (notes/appointment_note)
  - Cung cấp nút "Xem lý do" khi `status === 'REJECTED'` để mở modal hiển thị nội dung từ `rejected_reason`

```4:20:manageContainer/backend/modules/requests/controller/transitionController.ts
// Move from PENDING to GATE_IN
export const moveToGate = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as any).user;
        if (!user) {
            return res.status(401).json({ success: false, message: 'Người dùng chưa đăng nhập' });
        }
        const request = await prisma.serviceRequest.findUnique({ where: { id } });
        if (!request) {
            return res.status(404).json({ success: false, message: 'Yêu cầu không tồn tại' });
        }
```
```

Service upload/xóa file:

```55:92:manageContainer/backend/modules/requests/service/FileUploadService.ts
async uploadFiles(requestId: string, files: Express.Multer.File[], uploaderId: string, uploaderRole: 'customer' | 'depot' = 'depot') {
  // Lưu file vào uploads/requests, tạo record requestAttachment, cập nhật attachments_count
}
```

```150:191:manageContainer/backend/modules/requests/service/FileUploadService.ts
async deleteFile(fileId: string, deletedBy: string, reason?: string) {
  // Xóa mềm file và giảm attachments_count
}
```

## 🔄 Migration Path

### **Từ Requests/Depot sang Container Submenus:**
- **Trước:** `/Requests/Depot` với tab navigation
- **Sau:** `/LowerContainer` và `/LiftContainer` với submenu navigation
- **Lợi ích:**
  - Navigation trực quan hơn
  - Phân loại rõ ràng theo chức năng
  - Loại bỏ menu trung gian không cần thiết
  - Truy cập nhanh đến các chức năng container

### **Component Migration:**
- `ImportRequest`/`ExportRequest` hiện được tái sử dụng trong luồng mới; trang `LowerContainer.tsx` và `LiftContainer.tsx` là entry points.
- `RequestTabNavigation` → Đã loại bỏ.

### **Navigation Migration:**
- Sidebar "Yêu cầu" → **Đã xóa**
- Sidebar "Hạ container" → Submenu với "Yêu cầu hạ container"
- Sidebar "Nâng container" → Submenu với "Yêu cầu nâng container"

## 📋 Migration Checklist

- [x] Xóa `/Requests/Depot` page
- [x] Xóa `RequestTabNavigation` component
- [x] Xóa option "Yêu cầu" khỏi sidebar
- [x] Tạo `ContainerSubmenu` component
- [x] Tạo `LowerContainer.tsx` page
- [x] Tạo `LiftContainer.tsx` page
- [x] Tích hợp `ImportRequest` và `ExportRequest`
- [x] Cập nhật `Header.tsx` với submenu mới
- [x] Cập nhật translations
- [x] Cập nhật documentation

---

**Lưu ý:** Module Requests hoạt động dưới Container submenus; endpoints ở trên là nguồn sự thật hiện tại.