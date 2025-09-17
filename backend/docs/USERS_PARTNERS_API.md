## Module Quản lý Người dùng & Đối tác

Tài liệu này mô tả rõ kiến trúc, RBAC, scope dữ liệu, state machine tài khoản, audit, và hợp đồng API cho các module: Auth & Account, Users (nhân sự nội bộ), Customers, Partners, Audit.

### 0) Nguyên tắc kiến trúc & phạm vi
- RBAC theo vai: SystemAdmin, SaleAdmin, Security, Dispatcher, Driver, YardManager, MaintenanceManager, Accountant.
- Scope dữ liệu:
  - SystemAdmin: Toàn quyền truy cập tất cả dữ liệu
  - SaleAdmin: Chỉ quản lý users nội bộ
  - Các role khác: Không có quyền truy cập module này
- State machine tài khoản: ACTIVE ↔ DISABLED; ACTIVE ↔ LOCKED (unlock về ACTIVE).
- Audit: mọi thao tác create/update/disable/enable/lock/unlock/delete đều ghi log.

### 1) Auth & Account (US 2.1–2.3)
- Login chặn DISABLED/LOCKED; cấp JWT; cập nhật last_login_at; audit LOGIN_SUCCESS.
- Account profile: cập nhật trường cho phép; role/username là read-only (API chỉ cho phép full_name/phone/address).
- Change password: kiểm tra mật khẩu cũ, enforce policy (độ dài, ký tự, không trùng cũ).
- Đăng ký/khởi tạo tài khoản:
  - Không cho đăng ký trực tiếp (POST /auth/register trả 403)
  - Cho phép kích hoạt qua link mời: POST `/auth/accept-invite { token, password, confirm }`
  - Các role có thể được mời và tự kích hoạt: Partner Admin (user gắn `partner_id`), và nhân sự nội bộ khi Sys mời.
  - Các role chỉ có thể tạo qua hệ thống (không tự kích hoạt nếu chưa được mời): `SystemAdmin`, `SaleAdmin`.

#### Endpoints
- POST /auth/login
  - Body: { "username": string, "password": string }
  - 200: { token, user: { _id, email, role, tenant_id?, partner_id?, status } }
  - 400: { message }
- GET /auth/me (JWT)
  - 200: user (ẩn password_hash)
- PATCH /auth/me (JWT)
  - Body: { full_name?, phone?, address? }
  - 200: user cập nhật
- POST /auth/me/change-password (JWT)
  - Body: { old, new, confirm }
  - 200: { success: true }

### 2) Users (US 1.1, 1.3)
- SystemAdmin: CRUD tất cả user; có toàn quyền.
- SaleAdmin: CRUD user nội bộ; có quyền disable/enable.
- State: ACTIVE/DISABLED/LOCKED; tạo user trực tiếp với trạng thái ACTIVE.

#### Endpoints
- GET /users?role=&tenant_id=&partner_id=&page=&limit= (JWT + RBAC: SystemAdmin, SaleAdmin)
  - Quy tắc scope: SystemAdmin xem tất cả, SaleAdmin chỉ xem users nội bộ
- POST /users (JWT + RBAC: SystemAdmin, SaleAdmin)
  - Tạo nhân sự nội bộ (role ∈ {SystemAdmin, SaleAdmin, Driver, Security, Dispatcher}) với mật khẩu bắt buộc.
    - Body: { full_name, email, password, role }
    - Kết quả: user trạng thái ACTIVE + audit USER.CREATED
  
  Code mapping (Users API):
  - Routes: `backend/modules/users/controller/userRoutes.ts`
  - Controller: `backend/modules/users/controller/userController.ts` (method `create`, `update`, `disable`, `enable`, `lock`, `unlock`, `delete`)
  - DTO: `backend/modules/users/dto/UserDtos.ts` (`createEmployeeSchema`, `updateUserSchema`)
  - Service: `backend/modules/users/service/UserService.ts` (`createByHR` tạo user ACTIVE với `password_hash`, `disable/enable/lock/unlock/delete`)
  - Auth types: `backend/shared/middlewares/auth.ts` (kiểu `AppRole` — gồm `Security`, `Dispatcher`)
- PATCH /users/:id (JWT + RBAC: SystemAdmin)
  - Cập nhật: { full_name?, role? } (đổi role chỉ cho SystemAdmin)
  - Không cho đổi tenant_id/partner_id nếu không phải SystemAdmin
- PATCH /users/:id/disable | /enable (JWT + RBAC: SystemAdmin, SaleAdmin)
  - Chuyển DISABLED hoặc ACTIVE; audit USER.DISABLED/USER.ENABLED
- PATCH /users/:id/lock | /unlock (JWT + RBAC: SystemAdmin)
  - Chuyển LOCKED hoặc ACTIVE; audit USER.LOCKED/USER.UNLOCKED
- DELETE /users/:id (JWT + RBAC: SystemAdmin)
  - Xóa user (chỉ user đã DISABLED); audit USER.DELETED

### 3) Customers (US 1.2)
- SystemAdmin: tạo/sửa/disable khách hàng.
- SaleAdmin: tạo/sửa/disable khách hàng.
- Unique: tax_code không trùng.
- Disable: chuyển INACTIVE, không xóa (giữ lịch sử).

#### Endpoints
- GET /customers?status=&page=&limit= (JWT + RBAC: SystemAdmin/SaleAdmin)
- POST /customers (JWT + RBAC: SystemAdmin/SaleAdmin)
  - Body: { name, tax_code, address?, contact_email? }
  - 201: customer; audit CUSTOMER.CREATED
- PATCH /customers/:id (JWT + RBAC)
  - Body: { name?, address?, contact_email? }
  - audit CUSTOMER.UPDATED
- PATCH /customers/:id/disable (JWT + RBAC)
  - audit CUSTOMER.DISABLED
  
  Code mapping (Customers):
  - Routes: `backend/modules/customers/controller/customerRoutes.ts`
  - Controller: `backend/modules/customers/controller/customerController.ts`
  - Service: `backend/modules/customers/service/CustomerService.ts`

### 4) Partners (US 9.2)
- Lifecycle: DRAFT → ACTIVE → INACTIVE
- Unique: name không trùng.
- **LƯU Ý**: Tính năng tạo primary admin đã bị vô hiệu hóa.

#### Endpoints
- GET /partners?type=&status=&page=&limit= (JWT + RBAC: SystemAdmin/SaleAdmin)
- POST /partners (JWT + RBAC: SystemAdmin/SaleAdmin)
  - Body: { type, name, tax_code?, contact_email? }
  - 201: partner DRAFT; audit PARTNER.CREATED
- PATCH /partners/:id (JWT + RBAC: SystemAdmin)
  - audit PARTNER.UPDATED
- POST /partners/:id/activate (JWT + RBAC: SystemAdmin)
  - audit PARTNER.ACTIVATED
- POST /partners/:id/deactivate (JWT + RBAC: SystemAdmin)
  - audit PARTNER.DEACTIVATED
  
  Code mapping (Partners API):
  - Routes: `backend/modules/partners/controller/partnerRoutes.ts`
  - Controller: `backend/modules/partners/controller/partnerController.ts`
  - Service: `backend/modules/partners/service/PartnerService.ts`
  - DTO: `backend/modules/partners/dto/PartnerDtos.ts`

### 5) Audit (US 8.5)
- Ghi log cho: USER.CREATED|DISABLED|ENABLED|LOCKED|UNLOCKED|ROLE_CHANGED|DELETED, CUSTOMER.CREATED|UPDATED|DISABLED, PARTNER.CREATED|ACTIVATED|DEACTIVATED, LOGIN_SUCCESS.
- Export CSV theo bộ lọc.

#### Endpoint
- GET /audit?entity=&entity_id=&actor=&date_from=&date_to=&export_type=csv
  - export_type=csv → trả file CSV; ngược lại trả JSON.

### 6) Validation & Rule chặn
- email unique; customers.tax_code unique; partners.name unique.
- Không cho chọn role ngoài nhóm hợp lệ theo người tạo.
- Không đổi tenant_id/partner_id nếu không có quyền System Admin.
- DISABLED/LOCKED không login.
- Disable customer: chuyển INACTIVE, không xóa.
- Chỉ có thể xóa user đã bị DISABLED.

### 7) Ví dụ payload
- POST /users (tạo nhân sự nội bộ)
```json
{ "full_name": "Nguyễn Văn A", "email": "nguyenvana@company.com", "password": "password123", "role": "Driver" }
```

- POST /customers
```json
{ "name": "ACME Logistics", "tax_code": "0312345678", "address": "Q1, HCMC", "contact_email": "ops@acme.com" }
```
 
- POST /partners
```json
{ "type": "TRUCKING", "name": "XYZ Transport", "tax_code": "0400123456", "contact_email": "hello@xyz.com" }
```

### 8) Mapping code
- Cấu trúc thư mục: `backend/modules/{auth,users,customers,partners,audit}/...`
- Middlewares: `shared/middlewares/auth.ts`, `rbac.ts`, `audit.ts`
- Server: `backend/main.ts` mount routes: `/auth`, `/users`, `/customers`, `/partners`, `/audit`.


### 9) Checklist QA
- SystemAdmin: CRUD tất cả user và partners; có toàn quyền.
- SaleAdmin: tạo khách (MST không trùng); disable khách giữ lịch sử; tạo partners; disable/enable users.
- Auth: login/change password đúng policy và chặn DISABLED/LOCKED.
- Partners: lifecycle (không có primary admin invite).
- Audit: có log và export CSV.
- User management: tạo user với trạng thái ACTIVE, disable/enable/lock/unlock/delete.
