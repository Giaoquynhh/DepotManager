# Custom Dropdown Scrollbar Feature - Backend Documentation

## Tổng quan
Tài liệu này mô tả các API endpoints hỗ trợ cho tính năng Custom Dropdown với Scrollbar trong module Requests.

## API Endpoints

### 1. Shipping Lines API
**Endpoint:** `GET /api/setup/shipping-lines`

**Mô tả:** Lấy danh sách hãng tàu để hiển thị trong dropdown "Hãng tàu"

**Request Parameters:**
```json
{
  "page": 1,
  "limit": 100
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "string",
        "code": "string",
        "name": "string",
        "createdAt": "datetime",
        "updatedAt": "datetime"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 100,
      "total": 50,
      "totalPages": 1
    }
  }
}
```

**File liên quan:** `modules/setup/shipping-lines.controller.ts`

### 2. Container Types API
**Endpoint:** `GET /api/setup/container-types`

**Mô tả:** Lấy danh sách loại container để hiển thị trong dropdown "Loại container"

**Request Parameters:**
```json
{
  "page": 1,
  "limit": 100
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "string",
        "code": "string",
        "description": "string",
        "createdAt": "datetime",
        "updatedAt": "datetime"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 100,
      "total": 25,
      "totalPages": 1
    }
  }
}
```

**File liên quan:** `modules/setup/container-types.controller.ts`

### 3. Transport Companies API
**Endpoint:** `GET /api/setup/transport-companies`

**Mô tả:** Lấy danh sách nhà xe để hiển thị trong dropdown "Nhà xe"

**Request Parameters:**
```json
{
  "page": 1,
  "limit": 100
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "string",
        "code": "string",
        "name": "string",
        "createdAt": "datetime",
        "updatedAt": "datetime"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 100,
      "total": 30,
      "totalPages": 1
    }
  }
}
```

**File liên quan:** `modules/setup/transport-companies.controller.ts`

## Database Schema

### Shipping Lines Table
```sql
CREATE TABLE shipping_lines (
  id VARCHAR(255) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Container Types Table
```sql
CREATE TABLE container_types (
  id VARCHAR(255) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Transport Companies Table
```sql
CREATE TABLE transport_companies (
  id VARCHAR(255) PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Service Layer

### SetupService
**File:** `modules/setup/setup.service.ts`

**Methods:**
- `getShippingLines(params: PaginationParams): Promise<ApiResponse<ShippingLine[]>>`
- `getContainerTypes(params: PaginationParams): Promise<ApiResponse<ContainerType[]>>`
- `getTransportCompanies(params: PaginationParams): Promise<ApiResponse<TransportCompany[]>>`

## Type Definitions

### ShippingLine Interface
```typescript
interface ShippingLine {
  id: string;
  code: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### ContainerType Interface
```typescript
interface ContainerType {
  id: string;
  code: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### TransportCompany Interface
```typescript
interface TransportCompany {
  id: string;
  code: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Performance Considerations

### 1. Pagination
- Mặc định limit = 100 để đảm bảo hiệu suất
- Có thể tăng limit nếu cần thiết cho dropdown

### 2. Caching
- Có thể implement Redis cache cho các danh sách ít thay đổi
- Cache key: `shipping-lines:all`, `container-types:all`, `transport-companies:all`

### 3. Database Indexing
```sql
-- Indexes for better performance
CREATE INDEX idx_shipping_lines_code ON shipping_lines(code);
CREATE INDEX idx_container_types_code ON container_types(code);
CREATE INDEX idx_transport_companies_code ON transport_companies(code);
```

## Error Handling

### Common Error Responses
```json
{
  "success": false,
  "message": "Error message",
  "error": "ERROR_CODE",
  "statusCode": 400
}
```

### Error Codes
- `SETUP_001`: Shipping lines not found
- `SETUP_002`: Container types not found  
- `SETUP_003`: Transport companies not found
- `SETUP_004`: Invalid pagination parameters

## Testing

### Unit Tests
**File:** `modules/setup/setup.service.spec.ts`

### Integration Tests
**File:** `modules/setup/setup.controller.spec.ts`

### Test Cases
1. Test successful data retrieval
2. Test pagination functionality
3. Test error handling for invalid parameters
4. Test empty data scenarios

## Deployment Notes

### Environment Variables
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

### Dependencies
- Prisma ORM
- Express.js
- TypeScript
- PostgreSQL

## Monitoring

### Metrics to Track
- API response times
- Database query performance
- Error rates
- Cache hit rates

### Logging
- Request/response logging
- Error logging
- Performance logging

---

## Phần bổ sung: Upload nhiều chứng từ (PDF/Ảnh) cho Request

Ánh xạ thay đổi mã nguồn và API phục vụ tính năng upload nhiều file chứng từ trực tiếp lưu DB.

### 1) Endpoints (backend/main.ts => `app.use('/requests', requestRoutes)`)
- `POST /requests/create` — tạo request kèm nhiều file
- `POST /requests/:requestId/files` — upload nhiều file cho request đã tồn tại
- `GET /requests/:requestId/files` — lấy danh sách file của request
- `DELETE /requests/files/:fileId` — xóa 1 file (soft-delete)

### 2) File/Thư mục mã nguồn
- Router: `backend/modules/requests/controller/RequestRoutes.ts`
- Controller (barrel): `backend/modules/requests/controller/RequestController.ts`
- Controllers con: `createController.ts`, `listController.ts`, `detailController.ts`, `updateController.ts`, `updateLegacyController.ts`, `cancelController.ts`, `deleteController.ts`, `filesController.ts`, `transitionController.ts`
- Service: `backend/modules/requests/service/FileUploadService.ts`
- Tích hợp route: `backend/main.ts` (đăng ký routes `/requests`)

### 3) Lưu trữ & CSDL
- Vị trí lưu file: `backend/uploads/requests/`
- Bảng: Prisma model `RequestAttachment` (schema.prisma)
- Trường liên quan: `ServiceRequest.attachments_count`

### 4) Ràng buộc & kiểm tra
- Kích thước tối đa: 10MB/file
- Định dạng cho phép: `application/pdf`, `image/*`
- Số file/req tối đa tại API demo: 10 (multer array)

### 5) Dòng chảy xử lý
1. Frontend gửi `multipart/form-data` (`files`)
2. Multer lưu file vào `uploads/requests/`
3. Ghi metadata vào bảng `RequestAttachment`
4. Tăng `attachments_count` trên `ServiceRequest`

### 6) Lưu ý triển khai
- Cần restart backend sau khi thêm routes
- Nếu DB chưa có bảng/fields: chạy `npx prisma migrate deploy`

