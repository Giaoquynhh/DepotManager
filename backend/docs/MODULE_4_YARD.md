# Module 4 — Quản lý Bãi Container (Yard Management)

## Tổng quan
Module Yard Management cung cấp các chức năng quản lý sơ đồ bãi, gợi ý vị trí tối ưu và gán/stack container theo nhiều tầng (multi-tier). Hệ thống hỗ trợ quy trình Gate In → Yard Assignment hiệu quả, kèm các tiện ích UI/UX: toolbar thống kê, badge O/H theo block, auto-scroll tới slot được chọn, skeleton loading, và làm mới thủ công.

## Chức năng chính

### 1. Sơ đồ bãi (Yard Map)
- **Hiển thị sơ đồ bãi dạng grid** với các block và slot.
- **Toolbar thống kê**: tổng số Blocks, Slots, tổng OCCUPIED (O) và HOLD (H); có nút Refresh và Deselect.
- **Badge O/H theo block**: hiển thị tổng số container đang chiếm (O) và đang giữ chỗ (H) đã được tổng hợp từ các slot trong block.
- **Auto-scroll tới slot đang chọn** để hỗ trợ điều hướng nhanh.
- **Skeleton loading** với hiệu ứng shimmer khi tải dữ liệu bản đồ bãi.
- **Màu sắc phân biệt trạng thái slot**:
  - Trống (EMPTY): Xám nhạt
  - Gợi ý (SUGGESTED): Xanh dương nhạt + border highlight
  - Đã chọn (SELECTED): Xanh dương đậm + border đậm
  - Đã chiếm (OCCUPIED): Xám đậm
  - Bảo trì (UNDER_MAINTENANCE): Cam (kèm biểu tượng cờ lê)
  - Xuất khẩu (EXPORT): Xanh lá

### 2. Gợi ý vị trí tự động
- **API gợi ý vị trí**: `/yard/suggest-position?container_no=...`
- **Thuật toán tối ưu**: Gần gate, cùng loại, tránh khu bảo trì
- **Hiển thị 3-5 vị trí gợi ý** với điểm số và khoảng cách
- **Highlight vị trí gợi ý** trên sơ đồ bãi

### 3. Chọn vị trí thủ công
- **Click chọn slot trống** trên sơ đồ bãi
- **Tooltip thông tin**: Block code, trạng thái, khoảng cách từ gate
- **Fallback option** khi gợi ý tự động không phù hợp

### 4. Xác nhận vị trí
- **Modal xác nhận** với thông tin chi tiết (StackDetailsModal có phím tắt, nút Refresh, đếm ngược TTL cho HOLD và xác nhận thao tác destructive).
- **API gán vị trí (legacy)**: `PATCH /yard/assign-position` — giữ tương thích ngược.
- **In phiếu hướng dẫn** cho tài xế (nếu quy trình Gate yêu cầu).
- **Realtime (todo)** qua WebSocket.

### 5. Stacking (multi-tier)
- **Giữ chỗ (HOLD)** theo từng tier với TTL tự động hết hạn.
- **Xác nhận xếp (CONFIRM)** container vào tier đã HOLD, tôn trọng ràng buộc stacking (LIFO, không chồng lên khi tier trên còn vật cản, yêu cầu liên tục từ dưới lên).
- **Giải phóng (RELEASE)** một HOLD.
- **Gỡ container (REMOVE)** theo LIFO khi không có vật cản ở tier cao hơn.

## API Endpoints

### GET /yard/stack/map
Lấy sơ đồ bãi hiện tại kèm số liệu stacking theo slot.
Ví dụ (rút gọn):
```json
[
  {
    "id": "yard_001",
    "name": "Depot A",
    "blocks": [
      {
        "id": "block_b1",
        "code": "B1",
        "slots": [
          {
            "id": "slot_b1_01",
            "code": "B1-01",
            "status": "EMPTY",
            "tier_capacity": 5,
            "occupied_count": 1,
            "hold_count": 0
          }
        ]
      }
    ]
  }
]
```

### GET /yard/stack/slot/:slot_id
Chi tiết một slot và toàn bộ placements (theo tier, asc) để hiển thị trong StackDetailsModal.

### GET /yard/map
Trả về dữ liệu bản đồ bãi thô (Yard → Blocks → Slots) không kèm tổng hợp O/H theo slot. Phục vụ tương thích ngược và một số trang quản trị nội bộ.

### GET /yard/stack/container/:container_no
Tra cứu vị trí container (nếu đang HOLD/OCCUPIED) kèm thông tin Yard/Block/Slot.

### POST /yard/stack/hold
Body: `{ slot_id: string, tier?: number }` — nếu không truyền tier, hệ thống sẽ chọn tier hợp lệ tiếp theo theo ràng buộc stacking.

### POST /yard/stack/confirm
Body: `{ slot_id: string, tier: number, container_no: string }` — xác nhận OCCUPIED container tại tier đã HOLD (còn hạn).

### POST /yard/stack/release
Body: `{ slot_id: string, tier: number }` — đặt trạng thái placement về REMOVED (giải phóng HOLD).

### POST /yard/stack/remove-by-container
Body: `{ container_no: string }` — gỡ container đang OCCUPIED theo LIFO; chặn nếu có vật cản ở tier cao hơn.

### (Legacy) GET /yard/suggest-position?container_no=ABC1234567

### (Legacy) PATCH /yard/assign-position
Gán container vào vị trí đã chọn
```json
{
  "container_no": "ABC1234567",
  "slot_id": "slot_a1_01"
}
```

### GET /yard/configuration
Lấy cấu hình hiện tại của bãi (chỉ SystemAdmin).
Trả về:
```json
{
  "depotCount": 2,
  "slotsPerDepot": 20,
  "tiersPerSlot": 5
}
```

### POST /yard/configure
Cấu hình lại layout bãi (chỉ SystemAdmin).
Body:
```json
{
  "depotCount": 3,
  "slotsPerDepot": 25,
  "tiersPerSlot": 6
}
```
**Lưu ý**: API này sẽ xóa toàn bộ dữ liệu bãi hiện tại và tạo lại từ đầu.

### POST /yard/reset
Reset bãi về cấu hình mặc định (chỉ SystemAdmin).
Cấu hình mặc định: 2 depot (B1, B2), 20 ô/depot, 5 tầng/ô.

## Luồng xử lý (User Flow)

### 1. Gate In
1) Nhân viên cổng quét booking/phiếu hẹn và nhập Container No.
2) Nếu dùng cơ chế legacy: gọi gợi ý vị trí; nếu dùng stacking: tra cứu slot rồi HOLD.

### 2. Stacking Flow (khuyến nghị)
1) Chọn slot → HOLD tier hợp lệ (TTL đếm ngược).
2) Khi container sẵn sàng xếp: CONFIRM với `slot_id`, `tier`, `container_no`.
3) Khi cần hủy giữ chỗ: RELEASE.
4) Khi cần di dời: REMOVE theo LIFO (chỉ khi không có vật cản ở tier cao hơn).

### 3. UI/UX hỗ trợ
- Toolbar thống kê, nút Refresh và Deselect.
- Badge O/H theo block, auto-scroll tới slot đang chọn.
- Skeleton loading khi tải bản đồ bãi.

### 4. Cấu hình bãi (SystemAdmin)
1) Click nút Settings (⚙️) trên giao diện Yard
2) Modal cấu hình hiển thị với form nhập:
   - Số lượng depot (1-50)
   - Số lượng ô trong mỗi depot (1-100)  
   - Số lượng tầng trong mỗi ô (1-20)
3) Preview real-time hiển thị tổng số depot, ô, tầng
4) Click "💾 Cập nhật" để áp dụng cấu hình mới
5) Click "🔄 Cài đặt mặc định" để reset về mặc định
6) Hệ thống tự động làm mới sơ đồ bãi sau khi cấu hình

## Quyền hạn (RBAC)

### SaleAdmin
- ✅ Xem sơ đồ bãi
- ✅ Gợi ý vị trí
- ✅ Chọn vị trí thủ công
- ✅ Xác nhận vị trí
- ✅ In phiếu hướng dẫn

### YardManager
- ✅ Xem sơ đồ bãi
- ✅ Gợi ý vị trí
- ✅ Chọn vị trí thủ công
- ✅ Xác nhận vị trí
- ✅ In phiếu hướng dẫn

### SystemAdmin
- ✅ Tất cả quyền của SaleAdmin
- ✅ Quản lý cấu hình bãi
- ✅ Cấu hình layout bãi (số depot, số ô, số tầng)
- ✅ Reset cấu hình về mặc định
- ✅ Xem logs và báo cáo

### Security
- ❌ Không thể chọn vị trí
- ✅ Chỉ in phiếu tại Gate

## Cấu trúc Database
Tham chiếu chuẩn tại `backend/prisma/schema.prisma`:
- `Yard { id, name, blocks }`
- `YardBlock { id, yard_id, code, slots }`
- `YardSlot { id, block_id, code, status, near_gate, avoid_main, is_odd, tier_capacity, occupant_container_no?, reserved_expire_at?, placements[] }`
- `YardPlacement { id, slot_id, tier, container_no?, status /* HOLD | OCCUPIED | REMOVED */, hold_expires_at?, placed_at, removed_at?, created_by }`

Ràng buộc nổi bật:
- Unique: `@@unique([slot_id, tier], name: "slot_tier_unique")` trên `YardPlacement`.
- Chỉ số (index) phục vụ tra cứu: `status`, `container_no`, `hold_expires_at`.

Ghi chú:
- `status` dùng chuỗi thay vì enum cứng để linh hoạt mở rộng.
  - `tier_capacity` mặc định 5, có thể cấu hình theo slot.

## CLI Import Layout Yard/Block/Slot

*__Vị trí công cụ__*: `backend/modules/yard/tools/importLayout.ts`
*__Script__*: thêm sẵn trong `backend/package.json` → `yard:import`

### Cách chạy

```bash
npm run yard:import -- --file <path-to-json-or-csv> [--format json|csv] [--dry-run] [--preserve-status] [--tier-capacity-default 5]
```

### Định dạng input

- JSON nested
```json
[
  {
    "name": "Depot A",
    "blocks": [
      {
        "code": "B1",
        "slots": [
          { "code": "B1-01", "tier_capacity": 5, "near_gate": 10, "avoid_main": 0, "is_odd": false }
        ]
      }
    ]
  }
]
```

- JSON flat
```json
[
  {
    "yard_name": "Depot A", "block_code": "B1", "slot_code": "B1-01",
    "tier_capacity": 5, "near_gate": 10, "avoid_main": 0, "is_odd": false
  }
]
```

- CSV (có header)
```
yard_name,block_code,slot_code,status,tier_capacity,near_gate,avoid_main,is_odd,row_label,row_index,col_index
Depot A,B1,B1-01,EMPTY,5,10,0,false,,,
```

### Hành vi & an toàn

- Idempotent upsert theo bộ khóa lô-gic: `yard name` + `block code` + `slot code`.
- Tạo mới khi chưa có; nếu đã tồn tại slot sẽ cập nhật các field cấu hình (`tier_capacity`, `near_gate`, `avoid_main`, `is_odd`, `row_label`, `row_index`, `col_index`).
- Trạng thái `status` chỉ bị ghi đè nếu KHÔNG truyền `--preserve-status` và slot hiện tại không phải đang `OCCUPIED` kèm `occupant_container_no`.
- Cờ `--dry-run` để xem trước (không ghi DB).
- `--tier-capacity-default` (mặc định 5) dùng khi input không nêu rõ.

### Ghi chú vận hành

- Khuyến nghị chạy với `--dry-run` trước để kiểm tra số lượng Yard/Block/Slot sẽ tác động.
- Trên môi trường production, nên dùng thêm `--preserve-status` để tránh vô tình đổi trạng thái slot.
- File lớn: có thể mất thời gian do upsert theo từng slot; nếu cần tối ưu, xem xét chuẩn hóa unique index cho `(block_id, code)` để hỗ trợ upsert dạng bulk.

## Tính năng nâng cao

### Real-time Updates
- **WebSocket connection** để cập nhật trạng thái slot real-time
- **Auto-refresh** sơ đồ bãi khi có thay đổi
- **Notification** khi slot được gán hoặc giải phóng

### Hiệu năng & dữ liệu
- Frontend dùng SWR với `revalidateOnFocus=false`, `dedupingInterval=3000` để hạn chế gọi API trùng lặp.
- Batch groupBy OCCUPIED/HOLD ở backend để tổng hợp nhanh O/H theo slot.

## Tích hợp với các Module khác

### Module 3 - Requests
- **Container info** từ yêu cầu dịch vụ
- **Booking details** để gợi ý vị trí phù hợp
- **Status tracking** từ Gate In đến Yard Assignment

### Module 5 - Forklift
- **Công việc xe nâng** tự động tạo khi gán vị trí
- **Route optimization** cho xe nâng di chuyển
- **Task assignment** dựa trên vị trí container

### Module 6 - Maintenance
- **Slot maintenance** khi cần bảo trì
- **Equipment tracking** trong khu bảo trì
- **Preventive maintenance** scheduling

## Troubleshooting

### Vấn đề thường gặp
0. **Sơ đồ bãi trống trên DB mới**
   - Nguyên nhân: DB vừa reset chưa có `Yard/Block/Slot`.
   - Cách khắc phục: chạy `npx prisma db seed` để khởi tạo layout chuẩn (ví dụ: Depot A, B1-B2, 20 slot/block) hoặc import layout từ file.

1. **Slot không hiển thị đúng trạng thái**
   - Kiểm tra database connection
   - Verify WebSocket connection
   - Clear browser cache

2. **Gợi ý vị trí không chính xác**
   - Kiểm tra thuật toán scoring
   - Verify slot availability
   - Check maintenance schedule

3. **Modal xác nhận không hiển thị**
   - Kiểm tra JavaScript console
   - Verify component state
   - Check CSS loading

### Logs & Monitoring
- **API access logs** trong `/logs/api/`
- **Error tracking** với Sentry integration
- **Performance metrics** với New Relic
- **Database query logs** với Prisma logging

## Tài liệu tham khảo

- [Module 3 - Requests](./MODULE_3_REQUESTS.md)
- [Module 5 - Forklift](./MODULE_5_FORKLIFT.md)
- [Module 6 - Maintenance](./MODULE_6_MAINTENANCE.md)
- [API Documentation](../api/README.md)
- [Database Schema](../database/schema.md)
