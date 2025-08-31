# Forklift Management Module - Optimized Version

## Overview
Module quản lý xe nâng đã được tối ưu để hiển thị thông tin vị trí container một cách chi tiết và rõ ràng hơn trong bãi yard.

## Key Improvements

### 1. Enhanced Location Display
- **Vị trí nguồn**: Hiển thị chi tiết yard/block/slot + tier hiện tại
- **Vị trí đích**: Hiển thị chi tiết yard/block/slot + tier có thể đặt
- **Tọa độ**: Hiển thị row/column coordinates nếu có
- **Capacity**: Hiển thị số tầng tối đa của slot

### 2. Backend Optimizations

#### ForkliftService.ts
```typescript
// Enhanced include với placements
from_slot: { 
  include: { 
    block: { include: { yard: true } },
    placements: {
      where: {
        container_no: { not: null },
        status: { in: ['OCCUPIED', 'HOLD'] }
      },
      orderBy: { tier: 'desc' }
    }
  } 
}
```

#### New API Endpoint
- `GET /forklift/location/:slotId` - Lấy thông tin chi tiết vị trí

### 3. Frontend Enhancements

#### Location Details Component
```typescript
const renderLocationDetails = (slot: any, isDestination: boolean = false) => {
  // Hiển thị thông tin chi tiết:
  // - Yard/Block/Slot hierarchy
  // - Tier information với status colors
  // - Coordinates (nếu có)
  // - Capacity information
}
```

#### Visual Improvements
- **Color coding**: 
  - 🟢 Green: Slot trống (EMPTY)
  - 🟡 Yellow: Slot đã đặt trước (RESERVED)
  - 🔵 Blue: Slot đang sử dụng (OCCUPIED)
- **Icons**: 📍 cho coordinates
- **Typography**: Phân cấp rõ ràng thông tin

### 4. Database Schema Utilization

#### YardSlot Model
```prisma
model YardSlot {
  id          String   @id @default(cuid())
  code        String
  row_label   String?  // Row label (A, B, C...)
  row_index   Int?     // Row number
  col_index   Int?     // Column number
  tier_capacity Int    @default(5)  // Max tiers
  // ... other fields
}
```

#### YardPlacement Model
```prisma
model YardPlacement {
  id            String   @id @default(cuid())
  slot_id       String
  tier          Int      // Tier level
  container_no  String?  // Container in this tier
  status        String   // HOLD | OCCUPIED | REMOVED
  // ... other fields
}
```

## API Endpoints

### GET /forklift/tasks
Lấy danh sách tasks với thông tin vị trí chi tiết
```typescript
// Query params
status?: string  // Filter theo trạng thái

// Response includes
{
  id: string
  container_no: string
  status: string
  from_slot: {
    code: string
    block: { code: string, yard: { name: string } }
    placements: Array<{ tier: number, status: string }>
    row_label?: string
    row_index?: number
    col_index?: number
    tier_capacity?: number
  }
  to_slot: { /* same structure */ }
}
```

### GET /forklift/location/:slotId
Lấy thông tin chi tiết của một vị trí cụ thể

### POST /forklift/assign
Tạo task mới

### PATCH /forklift/task/:id/status
Cập nhật trạng thái task

### DELETE /forklift/task/:id
Xóa task

## Action Management

### Available Actions by Status
```typescript
// TRẠNG THÁI PENDING
actions: ['cancel', 'assign_driver', 'update_cost']
// ❌ REMOVED: 'start' action
// ❌ REMOVED: 'complete' action

// TRẠNG THÁI IN_PROGRESS  
actions: ['assign_driver', 'update_cost']
// ❌ REMOVED: 'complete' action

// TRẠNG THÁI COMPLETED
actions: ['assign_driver', 'update_cost']

// TRẠNG THÁI CANCELLED
actions: ['assign_driver', 'update_cost']
```

### Action Flow
```typescript
// Trước đây: PENDING → IN_PROGRESS → COMPLETED
// Bây giờ: PENDING → CANCELLED (chỉ có thể hủy)

// Không còn action "Hoàn thành" trong giao diện
// Chỉ có thể hủy công việc từ PENDING
```

## Usage Examples

### 1. Hiển thị vị trí nguồn
```typescript
// Container STA1120 từ vị trí bên ngoài
renderLocationDetails(null, false)
// Output: "Bên ngoài"
```

### 2. Hiển thị vị trí đích chi tiết
```typescript
// Container đến Yard A, Block B1, Slot S01, Tầng 2
renderLocationDetails(slotData, true)
// Output: 
// "Yard A / B1 / S01"
// "Tầng 2" (với màu xanh nếu trống)
// "📍 A1, 01" (nếu có coordinates)
// "Tối đa: 5 tầng"
```

## CSS Classes

### Location Styling
```css
.location-details          /* Container chính */
.location-main            /* Thông tin chính */
.location-tier            /* Thông tin tầng */
.location-coordinates     /* Tọa độ */
```

### Color Schemes
```css
.bg-green-50  /* Slot trống */
.bg-yellow-50 /* Slot đặt trước */
.bg-blue-50   /* Slot đang sử dụng */
```

## Testing

Chạy test API:
```bash
cd manageContainer/backend
node test-forklift-api.js
```

## Future Enhancements

1. **Real-time Updates**: WebSocket cho cập nhật trạng thái real-time
2. **Map Visualization**: Hiển thị vị trí trên bản đồ yard
3. **Route Optimization**: Tối ưu đường đi cho xe nâng
4. **Capacity Planning**: Dự đoán và quản lý capacity
5. **Mobile Support**: Responsive design cho mobile devices

## Dependencies

- **Backend**: Prisma ORM, Express.js, TypeScript
- **Frontend**: Next.js, React, Tailwind CSS
- **Database**: PostgreSQL (recommended) hoặc MySQL
