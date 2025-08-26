# Module 6 — Quản lý Bảo trì & Vật Tư

## 1) Scope & Roles
- Role: SaleAdmin (tạo/duyệt/từ chối phiếu; quản lý tồn kho)

## 2) Data model (Prisma)
- Enums: `EquipmentType (CONTAINER|EQUIPMENT)`, `InventoryMoveType (IN|OUT)`, `RepairStatus (CHECKING|PENDING_ACCEPT|REPAIRING|CHECKED|REJECTED)`
- Tables: `Equipment`, `InventoryItem`, `InventoryMovement`, `RepairTicket`, `RepairTicketItem`
- File: `prisma/schema.prisma`

### Cập nhật InventoryItem (v2025-08-25)
- Thêm trường `unit_price: Int @default(0)` - Đơn giá vật tư (VND)
- Migration: `20250825102150_add_unit_price_to_inventory`

## 3) State machine
- `CHECKING → PENDING_ACCEPT | REJECTED` (phase sau: REPAIRING → CHECKED)
- **Cập nhật v2025-01-27**: Thêm trạng thái `ACCEPT` vào `RepairStatus` enum
- Workflow hoàn chỉnh: `CHECKING → PENDING_ACCEPT → ACCEPT → REPAIRING → CHECKED`

## 4) API
- Repairs
  - `POST /maintenance/repairs`
  - `GET /maintenance/repairs?status=`
  - `POST /maintenance/repairs/:id/approve`
  - `POST /maintenance/repairs/:id/reject`
  - `PATCH /maintenance/repairs/:id/status`
  - `POST /maintenance/repairs/:id/complete-check`
  - `POST /maintenance/repairs/:id/invoice` ⭐ **MỚI**: Tạo hóa đơn sửa chữa
  - `GET /maintenance/repairs/:id/invoice` ⭐ **MỚI**: Xem hóa đơn sửa chữa
  - `POST /maintenance/repairs/:id/confirmation-request` ⭐ **MỚI v2025-01-27**: Gửi yêu cầu xác nhận từ khách hàng
  - `POST /maintenance/repairs/:id/start-repair` ⭐ **MỚI v2025-01-27**: Tiến hành sửa chữa
  - `POST /maintenance/repairs/:id/complete-repair` ⭐ **MỚI v2025-01-27**: Hoàn thành sửa chữa
- Inventory
  - `GET /maintenance/inventory/items`
  - `POST /maintenance/inventory/items` ⭐ **MỚI**
  - `PUT /maintenance/inventory/items/:id`

## 5) Validation
- `estimated_cost ≥ 0`, item `quantity > 0`
- `unit_price ≥ 0` (đơn giá không âm)
- Approve cần đủ tồn kho cho toàn bộ vật tư

## 6) Transaction
- Approve chạy trong transaction, trừ kho + ghi `InventoryMovement`

## 7) RBAC
- Yêu cầu role `SaleAdmin` hoặc `SystemAdmin` cho tất cả route

## 8) Code map (Module 6)
- DTO: `modules/maintenance/dto/MaintenanceDtos.ts`
- Service: `modules/maintenance/service/MaintenanceService.ts`
- Controller: `modules/maintenance/controller/MaintenanceController.ts`
- Routes: `modules/maintenance/controller/MaintenanceRoutes.ts`
- Mount: `main.ts` (`app.use('/maintenance', maintenanceRoutes)`)
- Seed mẫu: `prisma/seed.ts` (Equipment & InventoryItem)

### Cập nhật DTO (v2025-08-25)
```typescript
export const createInventorySchema = Joi.object({
  name: Joi.string().required(),
  uom: Joi.string().required(),
  qty_on_hand: Joi.number().integer().min(0).default(0),
  reorder_point: Joi.number().integer().min(0).default(0),
  unit_price: Joi.number().integer().min(0).default(0)
});
```

### Cập nhật Service (v2025-08-25)
```typescript
async createInventory(actor: any, payload: { 
  name: string; uom: string; qty_on_hand: number; 
  reorder_point: number; unit_price: number 
}) {
  // Validation và tạo mới inventory item
}

async createRepairInvoice(actor: any, payload: { 
  repair_ticket_id: string; labor_cost: number; 
  selected_parts: Array<{ inventory_item_id: string; quantity: number }> 
}) {
  // Tạo hóa đơn sửa chữa với chi phí phụ tùng và công sửa chữa
}

async getRepairInvoice(repairTicketId: string) {
  // Lấy thông tin hóa đơn sửa chữa với chi tiết chi phí
}
```

## 9) Liên kết module
- Module 5 (Yard): Khi container/thiết bị ở trạng thái `UNDER_MAINTENANCE` (rule tương lai) sẽ tạo `RepairTicket`
- Module 3 (Requests): Gợi ý tạo phiếu sau Gate IN nếu có lỗi bất thường
- Module 2 (Auth): RBAC kiểm soát role SaleAdmin

## 10) UI gợi ý
- Trang tạo/duyệt phiếu + trang quản lý vật tư
- **Tính năng mới**: Form thêm sản phẩm mới với các trường: Tên, ĐVT, Tồn kho, Điểm đặt hàng, Đơn giá

## 11) Tính năng mới (v2025-08-25)

### Thêm sản phẩm mới
- **Frontend**: Form thêm sản phẩm với validation
- **Backend**: API `POST /maintenance/inventory/items` 
- **Validation**: Tên và ĐVT là bắt buộc, các trường số không âm
- **Audit**: Ghi log `INVENTORY.CREATED` khi tạo mới

## 12) Tính năng mới (v2025-01-27)

### Cập nhật RepairStatus enum
- **Thêm trạng thái**: `ACCEPT` vào `RepairStatus` enum
- **Vị trí**: Ngay sau `PENDING_ACCEPT` và trước `REPAIRING`
- **Migration**: Chạy `prisma migrate dev` để cập nhật database

### Workflow sửa chữa hoàn chỉnh
1. **CHECKING** → "Đạt chuẩn" → **CHECKED**
2. **CHECKING** → "Không đạt chuẩn" → Tạo hóa đơn → **PENDING_ACCEPT**
3. **PENDING_ACCEPT** → Customer chấp nhận → **ACCEPT**
4. **ACCEPT** → "🔧 Tiến hành sửa chữa" → **REPAIRING**
5. **REPAIRING** → "✅ Hoàn thành" → **CHECKED**

### API endpoints mới
- **`POST /maintenance/repairs/:id/confirmation-request`**: Gửi yêu cầu xác nhận từ khách hàng
- **`POST /maintenance/repairs/:id/start-repair`**: Tiến hành sửa chữa (ACCEPT → REPAIRING)
- **`POST /maintenance/repairs/:id/complete-repair`**: Hoàn thành sửa chữa (REPAIRING → CHECKED)

### Service methods mới
```typescript
// Gửi yêu cầu xác nhận
async sendConfirmationRequest(actor: any, repairTicketId: string)

// Tiến hành sửa chữa
async startRepair(actor: any, repairTicketId: string)

// Hoàn thành sửa chữa
async completeRepair(actor: any, repairTicketId: string)

// Đồng bộ trạng thái RepairTicket với ServiceRequest
async syncRepairTicketStatus(containerNo: string)
```

### Validation và Security
- **Role-based access**: Chỉ `SaleAdmin` và `SystemAdmin` mới có thể thực hiện các action
- **Status validation**: Kiểm tra trạng thái hiện tại trước khi cho phép chuyển đổi
- **Audit logging**: Ghi lại tất cả các thay đổi trạng thái với thông tin chi tiết

### Tích hợp với ServiceRequest
- **Đồng bộ trạng thái**: Khi `ServiceRequest` được accept, `RepairTicket` tương ứng cũng được cập nhật thành `ACCEPT`
- **Logic đồng bộ**: Tự động tìm và cập nhật `RepairTicket` dựa trên `container_no`
- **Error handling**: Xử lý lỗi gracefully để không ảnh hưởng đến flow chính

## 12) Trạng thái PENDING_ACCEPT (v2025-08-26)

### Mô tả trạng thái
- **Trạng thái mới**: `PENDING_ACCEPT` (Chờ chấp nhận)
- **Áp dụng cho**: Cả `RepairTicket` và `ServiceRequest`
- **Điều kiện**: Khi tạo hóa đơn sửa chữa

### Logic hoạt động
1. **User tạo hóa đơn** → Bấm "Tạo hóa đơn & PDF"
2. **Backend `createRepairInvoice`** → Cập nhật phiếu thành `PENDING_ACCEPT`
3. **Tự động cập nhật request** → Tìm request theo `container_no` và set `PENDING_ACCEPT`
4. **Kết quả**: Cả phiếu sửa chữa và request đều có trạng thái `PENDING_ACCEPT`

### Cập nhật Database Schema
```prisma
model ServiceRequest {
  // ... existing fields
  status        String   // PENDING | SCHEDULED | FORWARDED | GATE_IN | CHECKING | GATE_REJECTED | REJECTED | COMPLETED | EXPORTED | IN_YARD | LEFT_YARD | PENDING_ACCEPT
}
```

### Cập nhật Backend Service
```typescript
async createRepairInvoice(actor: any, payload: { 
  repair_ticket_id: string; labor_cost: number; 
  selected_parts: Array<{ inventory_item_id: string; quantity: number }> 
}) {
  // ... existing logic
  
  // Cập nhật phiếu sửa chữa thành PENDING_ACCEPT
  const updatedTicket = await prisma.repairTicket.update({
    where: { id: payload.repair_ticket_id },
    data: {
      estimated_cost: totalCost,
      labor_cost: payload.labor_cost,
      status: 'PENDING_ACCEPT', // Thay đổi từ REPAIRING
      items: { /* ... */ }
    }
  });

  // Tự động cập nhật trạng thái request thành PENDING_ACCEPT
  if (repairTicket.container_no) {
    await prisma.serviceRequest.updateMany({
      where: { 
        container_no: repairTicket.container_no,
        status: { not: 'COMPLETED' }
      },
      data: { status: 'PENDING_ACCEPT' }
    });
  }
}
```

### Frontend Display
- **Màu sắc**: Cam (`#f59e0b`)
- **Label**: "Chờ chấp nhận"
- **Vị trí**: Cột "Trạng thái" trong bảng phiếu sửa chữa

### Migration
```bash
npx prisma migrate dev --name add_pending_accept_status
```

### Cập nhật trường đơn giá
- **Database**: Thêm cột `unit_price` vào bảng `InventoryItem`
- **Frontend**: Hiển thị và cho phép chỉnh sửa đơn giá
- **Backend**: Validation và cập nhật đơn giá trong API update

### Hóa đơn sửa chữa ⭐ **MỚI**
- **Frontend**: Component `RepairInvoiceModal` với form tạo hóa đơn
- **Backend**: API `POST /maintenance/repairs/:id/invoice` và `GET /maintenance/repairs/:id/invoice`
- **Tính năng**:
  - Hiển thị thông tin phiếu: Mã phiếu, Mã container, Thời gian tạo, Mô tả lỗi
  - Nhập chi phí công sửa chữa (chỉ số nguyên không âm)
  - Chọn phụ tùng từ inventory với số lượng (chỉ số nguyên không âm)
  - **Table phụ tùng đã sử dụng**: Hiển thị tên, đơn giá, số lượng, thành tiền
  - Tính toán tự động: Chi phí phụ tùng + Chi phí công = Tổng chi phí sửa chữa
- **Validation**: 
  - Chi phí công ≥ 0 (chỉ số nguyên)
  - Số lượng phụ tùng > 0 (chỉ số nguyên)
  - Phải chọn ít nhất 1 phụ tùng
- **UI/UX**: 
  - Input validation real-time (chỉ cho phép nhập số nguyên)
  - Table hiển thị rõ ràng với border và màu sắc
  - Tổng kết chi phí được highlight
- **Audit**: Ghi log `REPAIR.INVOICE_CREATED` khi tạo hóa đơn

### Seed data mẫu
```typescript
// Cập nhật seed với đơn giá
{ name: 'Sơn chống rỉ', uom: 'lit', qty_on_hand: 50, reorder_point: 10, unit_price: 150000 },
{ name: 'Đinh tán', uom: 'pcs', qty_on_hand: 1000, reorder_point: 200, unit_price: 500 },
{ name: 'Ron cao su', uom: 'pcs', qty_on_hand: 500, reorder_point: 100, unit_price: 2500 }
```

