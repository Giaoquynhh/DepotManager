# Module 5 — Quản lý Container

## 1) Scope & Roles
- Role: TechnicalDepartment (điều độ), SystemAdmin (quản trị)

## 2) State Machines
- Container slot: `EMPTY → RESERVED → OCCUPIED → UNDER_MAINTENANCE → OCCUPIED → EXPORT`
- Forklift task: `PENDING → IN_PROGRESS → COMPLETED` và `→ CANCELLED`

## 3) API
- Yard Map:
  - GET `/yard/map`
  - GET `/yard/container/:container_no`
  - GET `/yard/suggest-position?container_no=...`
  - PATCH `/yard/assign-position` `{ container_no, slot_id }`
- Forklift:
  - GET `/forklift/tasks?status=`
  - POST `/forklift/assign`
  - PATCH `/forklift/task/:id/status` `{ status, reason? }`
- Container info:
  - GET `/containers/:container_no`
  - GET `/containers/alerts`
- Reports (Containers list):
  - GET `/reports/containers`
  - Query params:
    - `q?: string` — tìm theo `container_no` (ILIKE)
    - `status?: string` — lọc theo trạng thái slot bãi. Sử dụng `OCCUPIED` để tương ứng với IN_YARD; để trống để bao gồm cả WAITING.
    - `service_status?: string` — trạng thái ServiceRequest (ví dụ: `CHECKED`). Tùy chọn; FE hiện không gửi mặc định.
    - `page?: number`, `pageSize?: number`
  - Response: `{ items: any[]; total: number; page: number; pageSize: number }`
  - Trường dữ liệu chính trong `items`:
    - `container_no`, `yard_name`, `block_code`, `slot_code`
    - `service_status`, `service_gate_checked_at`, `service_driver_name`, `service_license_plate`
    - `repair_checked` (true nếu có RepairTicket.status=CHECKED)
    - `dem_date`, `det_date`
  - Diễn giải FE: `derived_status = IN_YARD` nếu có `slot_code`, ngược lại `WAITING`.

## 4) Thuật toán gợi ý (demo)
- Điểm = 0.4*near_gate + 0.3*cùng_loại + 0.2*(1-avoid_main) + 0.1*slot_lẻ

## 5) Realtime
- WebSocket (todo): `POSITION_ASSIGNED`, `POSITION_RELEASED`, `CONTAINER_MOVED`, `TASK.*`

## 6) Liên kết module
- M4 Gate: `IN_YARD` → gọi suggest-position/assign-position
- M3 Requests: nguồn container, lịch sử
- M6 Maintenance: khi sửa chữa → `UNDER_MAINTENANCE`
- M2 Auth: RBAC TechnicalDepartment/SystemAdmin

## 7) Notes
- RESERVED auto-expire (todo)
- Cảnh báo DEM/DET từ `ContainerMeta`
- FE trang `ContainersPage` (quản lý container):
  - Bộ lọc hiện tại: ô tìm theo `container_no` và dropdown "Tất cả trạng thái" (WAITING/IN_YARD). Đã bỏ 2 dropdown "Chỉ container đã kiểm tra" và "Nguồn kiểm tra" (27-08-2025).
  - Hiển thị rõ trạng thái lỗi/đang tải khi gọi API.
- BE `ReportsRepository.containerList()` hợp nhất dữ liệu:
  - `latest_sr`: ServiceRequest mới nhất cho mỗi `container_no`.
  - `rt_checked`: RepairTicket có `status=CHECKED`.
  - Truy vấn sử dụng CTE `params` ép kiểu TEXT và `CROSS JOIN params p` để tránh lỗi Postgres `42P18` (unknown parameter type) khi tham số rỗng; xem `backend/modules/reports/repository/ReportsRepository.ts`.
- Phân quyền: toàn bộ `/reports/*` yêu cầu `authenticate` + `requireRoles('SystemAdmin','BusinessAdmin','TechnicalDepartment','Accountant')` (`backend/modules/reports/controller/ReportsRoutes.ts`).
- FE API base URL: `NEXT_PUBLIC_API_BASE_URL` trong `frontend/services/api.ts` (mặc định `http://localhost:1000`).
- Seed demo nhanh cho kiểm thử danh sách container:
  - Biến môi trường: `SEED_DEMO=true`.
  - Lệnh: `npm run prisma:seed` tại `manageContainer/backend`.
  - Tạo 1 ServiceRequest (ví dụ `TGHU1234567`) và 1 RepairTicket CHECKED (ví dụ `MSCU7654321`).
  - Dùng để test nhanh API `/reports/containers`.

## 8) Bản đồ mã nguồn (Code map)
- Prisma
  - Models: `Yard`, `YardBlock`, `YardSlot`, `ContainerMeta`, `ForkliftTask` trong `prisma/schema.prisma`
  - Seed dữ liệu demo: `prisma/seed.ts`
- Backend
  - Yard
    - Service: `modules/yard/service/YardService.ts`
    - Controller: `modules/yard/controller/YardController.ts`
    - Routes: `modules/yard/controller/YardRoutes.ts` (requireRoles TechnicalDepartment/SystemAdmin)
  - Forklift
    - Service: `modules/forklift/service/ForkliftService.ts`
    - Controller: `modules/forklift/controller/ForkliftController.ts`
    - Routes: `modules/forklift/controller/ForkliftRoutes.ts`
  - Container Info
    - Service: `modules/containers/service/ContainerService.ts`
    - Controller: `modules/containers/controller/ContainerController.ts`
    - Routes: `modules/containers/controller/ContainerRoutes.ts`
  - Reports (Containers list)
    - Routes: `modules/reports/controller/ReportsRoutes.ts` (`GET /reports/containers`)
    - Repository: `modules/reports/repository/ReportsRepository.ts`
  - Mount routes: `main.ts` (`/yard`, `/forklift`, `/containers`, `/reports`)
- Frontend
  - Trang điều độ: `frontend/pages/Yard/index.tsx`
  - Trang quản lý container: `frontend/pages/ContainersPage/index.tsx`
  - API client: `frontend/services/yard.ts`, `frontend/services/forklift.ts`, `frontend/services/reports.ts`
  - Component giao diện: `frontend/components/Card.tsx` (hỗ trợ `subtitle`)
  - Dashboard entry: `frontend/pages/Dashboard/index.tsx` (card “Điều độ bãi”)

---

### Changelog (27-08-2025)
- Thêm trang FE `ContainersPage` và bỏ 2 bộ lọc “Chỉ container đã kiểm tra” và “Nguồn kiểm tra” — chỉ còn tìm theo số container và trạng thái.
- Thêm hiển thị lỗi/đang tải trên FE khi gọi API.
- Bổ sung `Card.subtitle` để mô tả ngữ cảnh thẻ.
- Fix lỗi Postgres `42P18` trong truy vấn container bằng CTE `params` (ép TEXT) ở `ReportsRepository.containerList()`.
- Bổ sung tài liệu API `/reports/containers` và cập nhật Code map, phân quyền.
