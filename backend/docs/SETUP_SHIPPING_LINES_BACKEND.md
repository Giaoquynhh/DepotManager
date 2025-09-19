# Setup Module - Backend Documentation

## Tổng quan
Module Setup quản lý thông tin các hãng tàu, nhà xe và loại container trong hệ thống Smartlog Depot Management. Module này cung cấp các API endpoints để thêm, sửa, xóa và quản lý dữ liệu các danh mục với hỗ trợ phân trang, upload Excel và xử lý lỗi thông minh.

## Cấu trúc Database

### Bảng ShippingLines
```sql
model ShippingLine {
  id        String   @id @default(cuid())
  code      String   @unique
  name      String
  eir       String
  note      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("shipping_lines")
}
```

### Bảng TransportCompanies
```sql
model TransportCompany {
  id        String   @id @default(cuid())
  code      String   @unique
  name      String
  address   String?
  mst       String?
  phone     String?
  note      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("transport_companies")
}
```

## API Endpoints

### 1. Lấy danh sách hãng tàu
```http
GET /api/setup/shipping-lines
```

### Bảng ContainerTypes
```sql
model ContainerType {
  id          String   @id @default(cuid())
  code        String   @unique
  description String
  note        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("container_types")
}
```

**Query Parameters:**
- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số lượng item per page (default: 10)
- `search` (optional): Tìm kiếm theo tên hoặc mã hãng tàu

**Response:**
```json
{
  "success": true,
  "data": {
    "shippingLines": [
      {
        "id": "cm1234567890",
        "code": "COSCO",
        "name": "COSCO SHIPPING Lines",
        "eir": "EIR_COSCO_2024.xlsx",
        "note": "Hãng tàu lớn nhất Trung Quốc",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### 2. Tạo hãng tàu mới
```http
POST /api/setup/shipping-lines
```

**Request Body:**
```json
{
  "code": "MSC",
  "name": "Mediterranean Shipping Company",
  "eir": "EIR_MSC_2024.xlsx",
  "note": "Hãng tàu lớn thứ 2 thế giới"
}
```

**Validation Rules:**
- `code`: Bắt buộc, duy nhất, tối đa 50 ký tự
- `name`: Bắt buộc, tối đa 200 ký tự
- `eir`: Bắt buộc, tối đa 100 ký tự
- `note`: Tùy chọn, tối đa 500 ký tự

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm1234567891",
    "code": "MSC",
    "name": "Mediterranean Shipping Company",
    "eir": "EIR_MSC_2024.xlsx",
    "note": "Hãng tàu lớn thứ 2 thế giới",
    "createdAt": "2024-01-15T10:35:00Z",
    "updatedAt": "2024-01-15T10:35:00Z"
  }
}
```

**Error Response (Duplicate Code):**
```json
{
  "success": false,
  "error": "DUPLICATE_CODE",
  "message": "Shipping line code already exists",
  "details": [
    {
      "field": "code",
      "message": "Code 'MSC' is already taken"
    }
  ]
}
```

**Error Response (Validation Error):**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    {
      "field": "code",
      "message": "Code is required"
    },
    {
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

### 3. Cập nhật hãng tàu
```http
PUT /api/setup/shipping-lines/:id
```

**Request Body:**
```json
{
  "code": "MSC_UPDATED",
  "name": "Mediterranean Shipping Company Updated",
  "eir": "EIR_MSC_2024_UPDATED.xlsx",
  "note": "Hãng tàu lớn thứ 2 thế giới - Updated"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm1234567891",
    "code": "MSC_UPDATED",
    "name": "Mediterranean Shipping Company Updated",
    "eir": "EIR_MSC_2024_UPDATED.xlsx",
    "note": "Hãng tàu lớn thứ 2 thế giới - Updated",
    "createdAt": "2024-01-15T10:35:00Z",
    "updatedAt": "2024-01-15T10:40:00Z"
  }
}
```

### 4. Xóa hãng tàu
```http
DELETE /api/setup/shipping-lines/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Shipping line deleted successfully"
}
```

### 5. Upload Excel file
```http
POST /api/setup/shipping-lines/upload
```

**Request:**
- Content-Type: `multipart/form-data`
- Body: Excel file (.xlsx, .xls)

**Response:**
```json
{
  "success": true,
  "data": {
    "imported": 5,
    "skipped": 1,
    "errors": [
      {
        "row": 3,
        "message": "Mã hãng tàu 'COSCO' đã tồn tại"
      }
    ]
  }
}
```

### 6. Tải mẫu Excel
```http
GET /api/setup/shipping-lines/template
```

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- File: Excel template với dữ liệu mẫu

## Transport Companies API Endpoints

### 1. Lấy danh sách nhà xe
```http
GET /api/setup/transport-companies
```

**Query Parameters:**
- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số lượng item per page (default: 10)
- `search` (optional): Tìm kiếm theo tên hoặc mã nhà xe

**Response:**
```json
{
  "success": true,
  "data": {
    "transportCompanies": [
      {
        "id": "cm1234567890",
        "code": "HH01",
        "name": "Công ty Vận tải Hoàng Huy",
        "address": "125 Phố Huế, Hai Bà Trưng, Hà Nội",
        "mst": "0101234567",
        "phone": "024-3936-1234",
        "note": "Chuyên tuyến Hà Nội – các tỉnh miền Bắc",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

## Container Types API Endpoints

### 1. Lấy danh sách loại container
```http
GET /api/setup/container-types
```

**Query Parameters:**
- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số lượng item per page (default: 10)
- `search` (optional): Tìm kiếm theo mã/mô tả

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "cmabc",
        "code": "20GP",
        "description": "20' General Purpose",
        "note": "",
        "createdAt": "2025-09-19T10:30:00Z",
        "updatedAt": "2025-09-19T10:30:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
  }
}
```

### 2. Tạo loại container
```http
POST /api/setup/container-types
```
**Request Body:**
```json
{ "code": "40HQ", "description": "40' High Cube", "note": "" }
```

### 3. Cập nhật loại container
```http
PUT /api/setup/container-types/:id
```

### 4. Xóa loại container
```http
DELETE /api/setup/container-types/:id
```

### 5. Upload Excel loại container
```http
POST /api/setup/container-types/upload-excel
```
**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (.xlsx/.xls)

**Excel Format:**
- Cột 1: Mã loại (required)
- Cột 2: Mô tả (required)
- Cột 3: Ghi chú (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": "cmxyz", "code": "20GP", "description": "20' GP" }
  ],
  "message": "Successfully uploaded 1 container types"
}
```

### 2. Tạo nhà xe mới
```http
POST /api/setup/transport-companies
```

**Request Body:**
```json
{
  "code": "TC02",
  "name": "Công ty Vận tải Thành Công",
  "address": "456 Điện Biên Phủ, Q. Bình Thạnh, TPHCM",
  "mst": "0301234568",
  "phone": "028-3844-5678",
  "note": "Vận tải container, đầu kéo rơ moóc"
}
```

**Validation Rules:**
- `code`: Bắt buộc, duy nhất, tối đa 50 ký tự
- `name`: Bắt buộc, tối đa 200 ký tự
- `address`: Tùy chọn, tối đa 500 ký tự
- `mst`: Tùy chọn, tối đa 20 ký tự
- `phone`: Tùy chọn, tối đa 20 ký tự
- `note`: Tùy chọn, tối đa 500 ký tự

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm1234567891",
    "code": "TC02",
    "name": "Công ty Vận tải Thành Công",
    "address": "456 Điện Biên Phủ, Q. Bình Thạnh, TPHCM",
    "mst": "0301234568",
    "phone": "028-3844-5678",
    "note": "Vận tải container, đầu kéo rơ moóc",
    "createdAt": "2024-01-15T10:35:00Z",
    "updatedAt": "2024-01-15T10:35:00Z"
  }
}
```

**Error Response (Duplicate Code):**
```json
{
  "success": false,
  "error": "DUPLICATE_CODE",
  "message": "Transport company code already exists",
  "details": [
    {
      "field": "code",
      "message": "Code 'TC02' is already taken"
    }
  ]
}
```

**Error Response (Validation Error):**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    {
      "field": "code",
      "message": "Code is required"
    },
    {
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

### 3. Cập nhật nhà xe
```http
PUT /api/setup/transport-companies/:id
```

**Request Body:**
```json
{
  "code": "TC02_UPDATED",
  "name": "Công ty Vận tải Thành Công Updated",
  "address": "456 Điện Biên Phủ, Q. Bình Thạnh, TPHCM Updated",
  "mst": "0301234568",
  "phone": "028-3844-5678",
  "note": "Vận tải container, đầu kéo rơ moóc - Updated"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm1234567891",
    "code": "TC02_UPDATED",
    "name": "Công ty Vận tải Thành Công Updated",
    "address": "456 Điện Biên Phủ, Q. Bình Thạnh, TPHCM Updated",
    "mst": "0301234568",
    "phone": "028-3844-5678",
    "note": "Vận tải container, đầu kéo rơ moóc - Updated",
    "createdAt": "2024-01-15T10:35:00Z",
    "updatedAt": "2024-01-15T10:40:00Z"
  }
}
```

### 4. Xóa nhà xe
```http
DELETE /api/setup/transport-companies/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Transport company deleted successfully"
}
```

### 5. Upload Excel file cho nhà xe
```http
POST /api/setup/transport-companies/upload-excel
```

**Request:**
- Content-Type: `multipart/form-data`
- Body: Excel file (.xlsx, .xls) với field name `file`

**Excel Format:**
- Cột 1: Mã nhà xe (required)
- Cột 2: Tên nhà xe (required)
- Cột 3: Địa chỉ (optional)
- Cột 4: MST (optional)
- Cột 5: SĐT (optional)
- Cột 6: Ghi chú (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cm1234567890",
      "code": "HH01",
      "name": "Công ty Vận tải Hoàng Huy",
      "address": "125 Phố Huế, Hai Bà Trưng, Hà Nội",
      "mst": "0101234567",
      "phone": "024-3936-1234",
      "note": "Chuyên tuyến Hà Nội – các tỉnh miền Bắc",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "message": "Successfully uploaded 1 transport companies"
}
```

## Error Handling

### Validation Errors
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    {
      "field": "code",
      "message": "Mã hãng tàu đã tồn tại"
    }
  ]
}
```

### Not Found Error
```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Shipping line not found"
}
```

### Server Error
```json
{
  "success": false,
  "error": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected error occurred"
}
```

## Business Logic

### 1. Duplicate Code Validation
- Mã hãng tàu phải duy nhất trong hệ thống
- Kiểm tra case-insensitive
- Không cho phép tạo/cập nhật nếu trùng mã

### 2. Excel Import Logic
- Hỗ trợ format .xlsx và .xls
- Cột bắt buộc: Mã hãng tàu, Tên hãng tàu, EIR
- Cột tùy chọn: Ghi chú
- Skip dòng trống hoặc không hợp lệ
- Báo lỗi chi tiết cho từng dòng

### 3. Soft Delete
- Không xóa thực sự dữ liệu khỏi database
- Đánh dấu `deletedAt` timestamp
- Ẩn khỏi danh sách nhưng vẫn lưu trữ

## Security & Permissions

### Required Permissions
- `setup.manage`: Quản lý thiết lập hệ thống
- `setup.shipping-lines.read`: Xem danh sách hãng tàu
- `setup.shipping-lines.create`: Tạo hãng tàu mới
- `setup.shipping-lines.update`: Cập nhật hãng tàu
- `setup.shipping-lines.delete`: Xóa hãng tàu
- `setup.shipping-lines.upload`: Upload Excel

### Role Access
- **SystemAdmin**: Full access
- **SaleAdmin**: Full access
- **Other roles**: Based on permissions

## File Mapping

### Backend Files
```
manageContainer/backend/
├── modules/setup/
│   ├── controller/
│   │   ├── SetupController.ts          # Main controller (đã thêm uploadContainerTypeExcel)
│   │   └── SetupRoutes.ts              # Route definitions (đã thêm POST /container-types/upload-excel)
│   ├── dto/
│   │   └── SetupDtos.ts                # Data transfer objects
│   ├── service/
│   │   └── SetupService.ts             # Business logic (đã thêm uploadContainerTypeExcel)
│   └── repository/
│       └── SetupRepository.ts          # Data access layer
├── prisma/schema.prisma                # Database schema
└── shared/middlewares/
    ├── auth.ts                         # Authentication
    └── rbac.ts                         # Role-based access control
```

### Key Functions

#### Shipping Lines
- `getShippingLines()`: Lấy danh sách hãng tàu
- `createShippingLine()`: Tạo hãng tàu mới
- `updateShippingLine()`: Cập nhật hãng tàu
- `deleteShippingLine()`: Xóa hãng tàu
- `uploadExcelFile()`: Upload và parse Excel
- `downloadTemplate()`: Tải mẫu Excel

#### Transport Companies
- `getTransportCompanies()`: Lấy danh sách nhà xe
- `createTransportCompany()`: Tạo nhà xe mới
- `updateTransportCompany()`: Cập nhật nhà xe
- `deleteTransportCompany()`: Xóa nhà xe
- `uploadTransportCompanyExcel()`: Upload và parse Excel cho nhà xe

#### Container Types
- `getContainerTypes()`: Lấy danh sách loại container
- `createContainerType()`: Tạo loại container
- `updateContainerType()`: Cập nhật loại container
- `deleteContainerType()`: Xóa loại container
- `uploadContainerTypeExcel()`: Upload và parse Excel loại container

## Error Handling

### 1. Duplicate Code Detection
```typescript
// Backend validation for duplicate codes
const existingShippingLine = await prisma.shippingLine.findUnique({
  where: { code: data.code }
});

if (existingShippingLine) {
  return {
    success: false,
    error: 'DUPLICATE_CODE',
    message: 'Shipping line code already exists',
    details: [
      {
        field: 'code',
        message: `Code '${data.code}' is already taken`
      }
    ]
  };
}
```

### 2. Validation Error Handling
```typescript
// Comprehensive validation
const validationErrors = [];

if (!data.code || data.code.trim().length === 0) {
  validationErrors.push({
    field: 'code',
    message: 'Code is required'
  });
}

if (data.code && data.code.length > 50) {
  validationErrors.push({
    field: 'code',
    message: 'Code must be less than 50 characters'
  });
}

if (validationErrors.length > 0) {
  return {
    success: false,
    error: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details: validationErrors
  };
}
```

### 3. Database Constraint Handling
```typescript
// Handle Prisma unique constraint errors
try {
  const result = await prisma.shippingLine.create({
    data: shippingLineData
  });
  return { success: true, data: result };
} catch (error) {
  if (error.code === 'P2002') {
    // Unique constraint violation
    return {
      success: false,
      error: 'DUPLICATE_CODE',
      message: 'Shipping line code already exists',
      details: [
        {
          field: 'code',
          message: `Code '${data.code}' is already taken`
        }
      ]
    };
  }
  
  // Other database errors
  return {
    success: false,
    error: 'DATABASE_ERROR',
    message: 'Database operation failed',
    details: [{ message: error.message }]
  };
}
```

### 4. Frontend Error Processing
```typescript
// Frontend error handling
const handleApiError = (response: any) => {
  const errorMessage = response.message || '';
  const errorDetails = response.details || [];
  
  // Check for duplicate code error
  const isDuplicateError = errorMessage.toLowerCase().includes('duplicate') || 
                          errorMessage.toLowerCase().includes('already exists') ||
                          errorMessage.toLowerCase().includes('unique') ||
                          errorMessage.toLowerCase().includes('constraint') ||
                          errorDetails.some((detail: any) => 
                            detail.message?.toLowerCase().includes('duplicate') ||
                            detail.message?.toLowerCase().includes('already exists') ||
                            detail.message?.toLowerCase().includes('unique')
                          );
  
  if (isDuplicateError) {
    return `Mã "${data.code}" đã tồn tại. Vui lòng chọn mã khác.`;
  }
  
  // Handle validation errors
  if (errorMessage.toLowerCase().includes('validation')) {
    return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
  }
  
  // Show detailed error message
  if (errorDetails && errorDetails.length > 0) {
    return errorDetails.map((d: any) => d.message).join(', ');
  }
  
  return errorMessage || 'Có lỗi xảy ra. Vui lòng thử lại.';
};
```

## Dependencies

### Required Packages
```json
{
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "multer": "^2.0.2",
    "xlsx": "^0.18.5",
    "express": "^4.18.0"
  },
  "devDependencies": {
    "@types/xlsx": "^0.0.36"
  }
}
```

### Database
- PostgreSQL với Prisma ORM
- Bảng `shipping_lines` với các trường đã định nghĩa
- Bảng `transport_companies` với các trường đã định nghĩa

## Testing

### Unit Tests
- Test validation logic
- Test duplicate code checking
- Test Excel parsing
- Test error handling

### Integration Tests
- Test API endpoints
- Test database operations
- Test file upload functionality

## Deployment Notes

### Environment Variables
```env
DATABASE_URL="postgresql://username:password@localhost:5432/smartlog"
UPLOAD_PATH="./uploads/setup"
MAX_FILE_SIZE="10485760"  # 10MB
```

### File Storage
- Excel files được lưu trong `uploads/setup/`
- Template files được generate động
- Cleanup old files định kỳ

## Changelog

### Version 1.2.0 (2024-01-25)
- **Pagination Support**: Added comprehensive pagination for both shipping lines and transport companies APIs
- **Smart Error Handling**: Implemented intelligent error detection and user-friendly error messages
- **Enhanced API Responses**: Updated API responses to include detailed error information with field-specific messages
- **Duplicate Code Detection**: Improved duplicate code detection with clear error messages
- **Validation Enhancement**: Enhanced validation with detailed field-specific error messages
- **Frontend Integration**: Updated frontend error handling to process backend error responses intelligently
- **Error Prevention**: Implemented proper error catching to prevent Next.js error overlay
- **Type Safety**: Improved TypeScript type safety for error handling
- **User Experience**: Enhanced user experience with clear, actionable error messages

### Version 1.1.0 (2024-01-20)
- Added Transport Companies management
- CRUD operations for transport companies
- Excel upload functionality for transport companies
- Updated multer to v2.0.2
- Added xlsx package for Excel processing
- Enhanced error handling for file uploads

### Version 1.0.0 (2024-01-15)
- Initial implementation
- CRUD operations for shipping lines
- Excel upload/download functionality
- Role-based access control
- Comprehensive error handling
