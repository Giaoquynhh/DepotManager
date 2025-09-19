# MODULE 3: REQUESTS - Quản lý yêu cầu dịch vụ

## ✅ TRẠNG THÁI HIỆN TẠI: HOẠT ĐỘNG BÌNH THƯỜNG

**Ngày cập nhật:** 2025-09-19  
**Trạng thái:** Module đã được tái cấu trúc và hoạt động đầy đủ

### 🔄 Thay đổi gần đây (v2025-09-19):
- **Đã tái cấu trúc** từ `/Requests/Depot` thành Container submenus
- **Đã tích hợp** yêu cầu hạ/nâng container trực tiếp vào Container submenus
- **Đã tạo** pages mới: `LowerContainer.tsx` và `LiftContainer.tsx`
- **Đã tái sử dụng** components: `ImportRequest` và `ExportRequest`
- **Đã cập nhật** navigation structure với Container submenus
- **Đã thêm** auto-generation request numbers (NA/HAddmmyyy00000)
- **Đã thêm** relations với ShippingLine, ContainerType, Customer, TransportCompany
- **Đã sửa** lỗi Foreign key constraint và data transmission

### 📁 Cấu trúc hiện tại:
```
backend/modules/requests/
├── controller/
│   ├── RequestController.ts             # Xử lý CRUD operations
│   └── RequestRoutes.ts                 # API routes
└── (các file khác)

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
- **Tạo yêu cầu**: Auto-generate request numbers (NA/HAddmmyyy00000)
- **Quản lý yêu cầu**: CRUD operations cho import/export requests
- **Relations**: Liên kết với ShippingLine, ContainerType, Customer, TransportCompany
- **File uploads**: Hỗ trợ upload chứng từ (PDF, JPG, PNG)
- **Status tracking**: Theo dõi trạng thái yêu cầu (PENDING, SCHEDULED, etc.)

## 🗄️ Database Schema

### ServiceRequest Model:
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
    status        String   // PENDING, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    appointment_time DateTime?
    appointment_note String?
    driver_name   String?
    license_plate String?
    // Relations
    shipping_line    ShippingLine? @relation(fields: [shipping_line_id], references: [id])
    container_type   ContainerType? @relation(fields: [container_type_id], references: [id])
    customer         Customer? @relation(fields: [customer_id], references: [id])
    vehicle_company  TransportCompany? @relation(fields: [vehicle_company_id], references: [id])
    // ... other fields
}
```

## 🔌 API Endpoints

### POST /requests/create
Tạo yêu cầu mới với auto-generated request number
```typescript
// Request body
{
    type: 'IMPORT' | 'EXPORT',
    request_no: string, // Auto-generated
    container_no: string,
    shipping_line_id: string,
    container_type_id: string,
    customer_id?: string,
    vehicle_company_id?: string,
    vehicle_number?: string,
    driver_name?: string,
    driver_phone?: string,
    appointment_time?: string,
    notes?: string,
    files?: File[]
}
```

### GET /requests
Lấy danh sách yêu cầu với relations
```typescript
// Query params
{
    type?: 'IMPORT' | 'EXPORT',
    status?: string,
    page?: number,
    limit?: number
}

// Response
{
    success: boolean,
    data: ServiceRequest[],
    pagination: {
        page: number,
        limit: number,
        total: number,
        pages: number
    }
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
- `ImportRequest` → `LiftContainer.tsx`
- `ExportRequest` → `LowerContainer.tsx`
- `RequestTabNavigation` → **Đã xóa**
- `CreateLiftRequestModal` → Tái sử dụng trong `LiftContainer.tsx`
- `CreateLowerRequestModal` → Tái sử dụng trong `LowerContainer.tsx`

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

**Lưu ý:** Module Requests đã được thay thế hoàn toàn bằng Container submenus. Không cần phát triển lại module này.