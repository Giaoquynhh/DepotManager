# Chức Năng Filter "Container Rỗng Có Trong Bãi"

## Tổng Quan

Chức năng này cho phép SystemAdmin nhập container tùy ý vào bãi mà không cần tạo đơn Forklift. Container được nhập sẽ có trạng thái "Container rỗng có trong bãi" và có thể được lọc riêng biệt.

## Tính Năng Chính

### 1. Filter "Container rỗng có trong bãi"
- **Vị trí**: Trang ContainersPage (`http://localhost:5002/ContainersPage_2_hiden`)
- **Dropdown**: Thêm option "Container rỗng có trong bãi" vào filter trạng thái
- **Logic**: Hiển thị container có `derived_status = 'EMPTY_IN_YARD'`

### 2. Quyền SystemAdmin
- **Vị trí**: Trang Yard (`http://localhost:5002/Yard`)
- **Chức năng**: Có thể nhập container number tùy ý
- **Validation**: Bỏ qua validation container có trong danh sách available
- **ForkliftTask**: Không tạo task, container được đặt trực tiếp vào bãi

## Luồng Hoạt Động

### Bước 1: SystemAdmin nhập container
1. Đăng nhập với tài khoản SystemAdmin
2. Vào trang Yard
3. Click vào slot và bấm "HOLD tier kế tiếp"
4. Nhập container number tùy ý
5. Bấm "Confirm"

### Bước 2: Container được đặt vào bãi
- Container được đặt trực tiếp vào slot đã HOLD
- Không tạo ForkliftTask
- Không cập nhật ServiceRequest status

### Bước 3: Hiển thị trong ContainersPage
- Container có trạng thái "Container rỗng có trong bãi"
- Có thể filter riêng biệt
- Hiển thị vị trí trong bãi

## Cấu Trúc Dữ Liệu

### Derived Status
```typescript
enum DerivedStatus {
  WAITING = 'WAITING',           // Đang chờ sắp xếp
  ASSIGNED = 'ASSIGNED',         // Đã xếp chỗ trong bãi
  EMPTY_IN_YARD = 'EMPTY_IN_YARD', // Container rỗng có trong bãi
  IN_YARD = 'IN_YARD'           // Đã ở trong bãi (duyệt Forklift)
}
```

### Logic Phân Loại
```typescript
if (it.service_status === 'CHECKED' || it.repair_checked === true) {
  const inYard = !!it.slot_code;
  if (inYard) {
    if (!it.service_gate_checked_at && !it.repair_checked) {
      return { ...it, derived_status: 'EMPTY_IN_YARD' }; // Container rỗng
    } else {
      return { ...it, derived_status: 'ASSIGNED' }; // Container bình thường
    }
  } else {
    return { ...it, derived_status: 'WAITING' }; // Chờ sắp xếp
  }
}
```

## Backend Changes

### YardService.confirm()
```typescript
async confirm(actor: any, slot_id: string, tier: number, container_no: string) {
  // SystemAdmin có thể nhập container tùy ý
  const isSystemAdmin = actor.role === 'SystemAdmin';
  
  // Kiểm tra validation (chỉ cho non-SystemAdmin)
  if (!isSystemAdmin) {
    const containerStatus = await this.validateContainerForYardPlacement(container_no);
    if (!containerStatus.canPlace) {
      throw new Error(containerStatus.reason);
    }
  }
  
  // Tạo ForkliftTask (chỉ cho non-SystemAdmin)
  if (!isSystemAdmin) {
    await tx.forkliftTask.create({...});
    // Cập nhật ServiceRequest status
  } else {
    // SystemAdmin: Container rỗng có trong bãi
  }
}
```

## Frontend Changes

### ContainersPage
- Thêm filter "Container rỗng có trong bãi"
- Cập nhật logic hiển thị trạng thái
- Thêm màu sắc riêng cho trạng thái mới

### StackDetailsModal
- Kiểm tra role SystemAdmin
- Bỏ qua validation cho SystemAdmin
- Ẩn container filter cho SystemAdmin
- Hiển thị thông báo đặc biệt

## UI/UX

### Màu Sắc
- **EMPTY_IN_YARD**: `#fef3c7` (vàng nhạt) với text `#92400e`
- **ASSIGNED**: `#e0f2fe` (xanh nhạt) với text `#0c4a6e`
- **WAITING**: `#fff7e6` (cam nhạt) với text `#664d03`

### Thông Báo
- **SystemAdmin**: "🔑 SystemAdmin: Có thể nhập container tùy ý"
- **Thường**: "ℹ️ Chỉ nhận container có trạng thái 'Đang chờ sắp xếp' (CHECKED)"

## Test Cases

### Test 1: SystemAdmin nhập container
1. Login SystemAdmin
2. Yard page → HOLD tier → Nhập container tùy ý → Confirm
3. ContainersPage → Filter "Container rỗng có trong bãi"
4. Kiểm tra container hiển thị với trạng thái đúng

### Test 2: Non-SystemAdmin
1. Login SaleAdmin
2. Yard page → HOLD tier → Nhập container không có trong danh sách
3. Kiểm tra validation error

### Test 3: Filter hoạt động
1. ContainersPage → Chọn các filter khác nhau
2. Kiểm tra số lượng container hiển thị
3. Kiểm tra trạng thái hiển thị đúng

## Lưu Ý

- Chức năng chỉ dành cho SystemAdmin
- Container rỗng không tạo ForkliftTask
- Không ảnh hưởng đến workflow bình thường
- Có thể mở rộng cho các role khác trong tương lai
