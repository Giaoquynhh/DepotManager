# Tài liệu kỹ thuật: Chức năng Phân quyền (Roles & Permissions)

Tài liệu mô tả toàn bộ logic BE/FE đã triển khai cho chức năng Phân quyền, bao gồm: schema DB, middleware, validation, service, routes, UI, payload API, RBAC, kiểm thử và cách khắc phục lỗi thường gặp.

---

## 1) Tổng quan & mục tiêu

- __Mục tiêu__: Cho phép Admin (SystemAdmin/BusinessAdmin) quản lý vai trò (role) và danh sách chức năng (permissions) cho từng người dùng; cập nhật thành công và phản ánh ngay trên Sidebar/UI.
- __Phạm vi__: Backend (Node/Express + Prisma) và Frontend (Next.js/React). 

---

## 2) Lộ trình dữ liệu (E2E)

1. FE trang `frontend/pages/Permissions/index.tsx` hiển thị danh sách user, cho phép chọn vai trò hoặc các checkbox chức năng (theo `frontend/utils/permissionsCatalog.ts`).
2. Khi bấm "Cập nhật vai trò" hoặc "Lưu chức năng", FE gọi `PATCH /users/:id` với payload `{ role }` hoặc `{ permissions }`.
3. BE `backend/modules/users/controller/UserController.ts` xác thực dữ liệu theo `updateUserSchema`, sau đó gọi `UserService.update()`.
4. `UserService.update()` enforce RBAC, chặn tự sửa, chuẩn hóa dữ liệu, gọi `UserRepository.updateById()` để ghi DB, và `audit()`.
5. Trả về 200 cùng user đã cập nhật. FE gọi `mutate()` để refresh danh sách; `Header.tsx` refetch `/auth/me` để Sidebar cập nhật quyền mới.

---

## 3) Backend chi tiết

### 3.1. Schema & Prisma
- File: `backend/prisma/schema.prisma`
  - Model `User`: `id String @id @default(cuid())`, có trường `permissions Json?` để lưu mảng các key chức năng.
- __Yêu cầu migrate__: cần áp dụng migration để DB có cột `permissions` tương ứng (xem mục 8).

### 3.2. Xác thực & JWT & RBAC
- File: `backend/shared/middlewares/auth.ts`
  - Interface `AuthUser` dùng trường `_id` (chuỗi) làm định danh user trong JWT.
- File: `backend/modules/auth/service/AuthService.ts`
  - `login()` & `refresh()` tạo JWT payload với `_id: String(user.id)` để đồng bộ `_id` (JWT) và `id` (Prisma).
- File: `backend/shared/middlewares/rbac.ts`
  - `requireRoles(...roles)`: chặn truy cập nếu `req.user.role` không thuộc danh sách.
  - `enforceTenantScope()`/`enforcePartnerScope()`: ép phạm vi truy vấn list/search theo `tenant_id`/`partner_id` cho vai trò tương ứng.
- File: `backend/shared/middlewares/audit.ts`
  - `audit()` ghi log thao tác; `withAudit()` tự động audit nếu response < 400.

### 3.3. DTO Validation
- File: `backend/modules/users/dto/UserDtos.ts`
  - `updateUserSchema`:
    - `role`: cho phép các role: `SystemAdmin`, `BusinessAdmin`, `HRManager`, `SaleAdmin`, `CustomerAdmin`, `CustomerUser`, `PartnerAdmin`, `Security`, `YardManager`, `MaintenanceManager`, `Accountant`.
    - `permissions`: mảng chuỗi, tối đa 50, regex an toàn (chỉ chữ, số, dấu gạch ngang/ghạch dưới/chấm, không khoảng trắng), cho phép rỗng.

### 3.4. Routes
- File: `backend/modules/users/controller/userRoutes.ts`
  - `PATCH /users/:id` __chỉ cho__ `SystemAdmin` và `BusinessAdmin` bằng `requireRoles('SystemAdmin','BusinessAdmin')`.

### 3.5. Service
- File: `backend/modules/users/service/UserService.ts`
  - `update(actor, id, data)`:
    - __Chặn tự sửa__: nếu `String(actor._id) === String(id)` và payload có `role` hoặc `permissions` → ném lỗi: "Không thể tự đổi vai trò/chức năng của chính mình".
    - __Chuẩn hóa permissions__: nếu là mảng, `trim`, loại trùng (Set), giới hạn 50.
    - __RBAC__: chỉ `SystemAdmin`/`BusinessAdmin` được phép thay đổi role/permissions; enforce boundary cho `CustomerAdmin` khi áp dụng nơi cần.
    - __Lưu DB__: gọi `repo.updateById(id, data)`; ghi `audit`.

### 3.6. Repository
- File: `backend/modules/users/repository/UserRepository.ts`
  - Dùng Prisma `where: { id }` cho `findById`, `updateById`, `deleteById`.
  - Lưu `permissions` vào cột `User.permissions (Json?)`.

### 3.7. Lỗi & xử lý
- Controller hiện trả về `res.status(400).json({ message: e.message })` khi lỗi (bao gồm thông điệp gốc Prisma).
  - Khuyến nghị: map lỗi kỹ thuật thành thông báo thân thiện, log chi tiết server-side.

---

## 4) Frontend chi tiết

### 4.1. Trang Permissions UI
- File: `frontend/pages/Permissions/index.tsx`
  - Liệt kê user, tìm kiếm, đổi vai trò, chọn chức năng theo catalog.
  - __Role presets__: khi đổi vai trò, tự áp preset mặc định; có thể chỉnh tay trước khi lưu.
  - __Giới hạn__: tối đa 50 permissions, chỉ key hợp lệ theo `frontend/utils/permissionsCatalog.ts`.
  - __Chặn tự sửa__: không cho chỉnh vai trò/quyền của chính người đang đăng nhập.
  - __API__: `PATCH /users/:id` với `{ role }` hoặc `{ permissions }`. Dùng SWR `mutate()` để refresh danh sách sau khi lưu.
  - __Hiển thị thông báo__: hiển thị `message` trả về từ BE. (Có thể rút gọn nếu lỗi kỹ thuật quá dài.)

### 4.2. Header & Sidebar cập nhật ngay
- File: `frontend/components/Header.tsx`
  - Hiển thị mục Sidebar "Phân quyền" chỉ cho `SystemAdmin`/`BusinessAdmin`.
  - Tự refetch `/auth/me` khi tab focus, visibility change, route change, và có polling ~15s → đảm bảo Sidebar/role/permissions cập nhật gần như ngay.
  - (Tuỳ chọn) Có thể lắng nghe custom event `user-permissions-updated` để refetch lập tức sau khi lưu.

---

## 5) RBAC tóm tắt

- __Xem & chỉnh quyền__:
  - Chỉ `SystemAdmin` và `BusinessAdmin` được gọi `PATCH /users/:id`.
- __Tự sửa__: Bị chặn nếu user cố update vai trò/chức năng của chính họ.
- __Phạm vi tenant/partner__: được enforce ở middleware/service cho các role phù hợp khi list/search.

---

## 6) API Contracts

- `PATCH /users/:id`
  - Headers: `Authorization: Bearer <access_token>`
  - Body:
    - Đổi vai trò: `{ "role": "BusinessAdmin" }`
    - Đổi chức năng: `{ "permissions": ["reports.view","users_partners.view"] }`
  - Response: `200 OK` với user object (ẩn thông tin nhạy cảm), hoặc `400` kèm thông điệp lỗi validation/RBAC.

---

## 7) Kiểm thử đề xuất

- __Thành công__ (Admin cập nhật user khác): 200, DB lưu `permissions`, FE refresh danh sách, Header refetch `/auth/me`.
- __Chặn tự sửa__: PATCH vào `:myId` với `{ permissions }` → 400 + thông báo chặn.
- __Payload không hợp lệ__: >50 keys, key sai pattern, role không hợp lệ → 400 từ Joi.
- __Không đủ quyền__: actor không phải `SystemAdmin/BusinessAdmin` → 403 từ `requireRoles`.

---

## 8) Migration & Prisma Client

- Nếu DB chưa có cột `User.permissions`, mọi `update({ data: { permissions } })` sẽ lỗi Prisma. Cần áp dụng migration:

```bash
# Kiểm tra trạng thái migration
npx prisma migrate status

# Tạo và áp dụng migration theo schema hiện tại (thêm cột permissions nếu thiếu)
npx prisma migrate dev --name add_permissions_to_user

# Cập nhật Prisma Client
npx prisma generate

# Trên môi trường triển khai (không dev):
npx prisma migrate deploy
```

> Lưu ý: `schema.prisma` đã định nghĩa `permissions Json?`. Migration đảm bảo DB khớp với schema.

---

## 9) Bảo mật, an toàn, hiệu năng

- __Bảo mật__:
  - RBAC chặt chẽ ở route và service.
  - Chặn tự sửa, kiểm soát boundary theo tenant/partner.
  - Validation Joi chống payload bẩn; regex giới hạn key an toàn.
- __An toàn dữ liệu__:
  - Chuẩn hóa permissions: `trim`, loại trùng, cắt 50 để chống phình dữ liệu.
  - Audit đầy đủ thay đổi.
- __Hiệu năng__:
  - SWR `mutate` và Header refetch theo sự kiện/polling giảm reload toàn trang.

---

## 10) Triệu chứng lỗi 400 thường gặp & cách xử lý

- __Triệu chứng__: thông báo rất dài từ Prisma xuất hiện ở UI khi lưu quyền.
- __Nguyên nhân__: DB chưa có cột `permissions` nhưng BE gửi `data: { permissions }` vào Prisma.
- __Khắc phục__: chạy migration + generate theo mục 8. Khuyến nghị làm gọn thông báo lỗi ở BE/FE.

---

## 11) Đồng bộ `id` (Prisma) vs `_id` (JWT)

- JWT payload dùng `_id` để gắn với `User.id` bên Prisma. Service/Controller so sánh bằng `String(actor._id) === String(id)` để chặn tự sửa. Bảo đảm đồng bộ này để tránh sai lệch quyền.

---

## 12) Checklist triển khai

- [ ] Đảm bảo `schema.prisma` có `User.permissions Json?`.
- [ ] Chạy `npx prisma migrate dev --name add_permissions_to_user` (hoặc `migrate deploy` trên môi trường thật).
- [ ] Kiểm thử các case ở mục 7.
- [ ] Xem lại log `audit` sau các thay đổi.
- [ ] (Tùy chọn) Làm gọn thông báo lỗi trả ra cho FE.

---

## 13) Tài liệu tham chiếu (đường dẫn mã)

- Backend
  - `backend/shared/middlewares/auth.ts`
  - `backend/shared/middlewares/rbac.ts`
  - `backend/shared/middlewares/audit.ts`
  - `backend/modules/auth/service/AuthService.ts`
  - `backend/modules/users/dto/UserDtos.ts`
  - `backend/modules/users/controller/userRoutes.ts`
  - `backend/modules/users/controller/UserController.ts`
  - `backend/modules/users/service/UserService.ts`
  - `backend/modules/users/repository/UserRepository.ts`
  - `backend/prisma/schema.prisma`
- Frontend
  - `frontend/pages/Permissions/index.tsx`
  - `frontend/components/Header.tsx`
  - `frontend/utils/permissionsCatalog.ts`
