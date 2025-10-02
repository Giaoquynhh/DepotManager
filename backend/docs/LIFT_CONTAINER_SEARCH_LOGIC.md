# Logic Tìm Kiếm Container Cho Lift Request

## Tổng Quan

Khi tạo yêu cầu nâng container (Lift Request), hệ thống chỉ cho phép chọn các container đang ở trong yard và thỏa mãn các điều kiện cụ thể.

## Điều Kiện Container Có Thể Nâng

Chỉ có **2 loại container** được phép nâng:

### 1. EMPTY_IN_YARD (SystemAdmin thêm)
- **Mô tả**: Container rỗng được SystemAdmin thêm trực tiếp vào hệ thống
- **Đặc điểm**:
  - Không có ServiceRequest tương ứng
  - Được lưu trong bảng `Container` với `shipping_line_id`
  - Trạng thái: `EMPTY_IN_YARD`
  - Nguồn: `SYSTEM_ADMIN_ADDED`

### 2. IMPORT Containers (IN_YARD hoặc GATE_OUT) với Quality GOOD
- **Mô tả**: Container từ yêu cầu IMPORT đã hoàn thành quy trình hạ và có chất lượng tốt
- **Đặc điểm**:
  - Có ServiceRequest với `type = 'IMPORT'`
  - Trạng thái ServiceRequest: `IN_YARD` hoặc `GATE_OUT`
  - **Có RepairTicket với `status = 'COMPLETE'` (Container quality GOOD)**
  - Đã hoàn thành quy trình import và sẵn sàng để nâng

## API Endpoint

```
GET /containers/yard/by-shipping-line/:shipping_line_id?q=search_query
```

### Parameters
- `shipping_line_id` (required): ID của hãng tàu
- `q` (optional): Từ khóa tìm kiếm container number

### Response Format
```json
{
  "success": true,
  "data": [
    {
      "container_no": "CONT123456",
      "slot_code": "A01",
      "block_code": "B1",
      "yard_name": "Yard A",
      "tier": 1,
      "placed_at": "2024-01-01T00:00:00Z",
      "shipping_line": {
        "id": "sl-id",
        "name": "Shipping Line Name",
        "code": "SL"
      },
      "container_type": {
        "id": "ct-id",
        "code": "20GP",
        "description": "20ft General Purpose"
      },
      "customer": {
        "id": "customer-id",
        "name": "Customer Name",
        "code": "CUST"
      },
      "seal_number": "SEAL123",
      "dem_det": "DEM/DET info",
      "service_status": "EMPTY_IN_YARD", // hoặc "IN_YARD" hoặc "GATE_OUT"
      "request_type": "SYSTEM_ADMIN_ADDED", // hoặc "IMPORT"
      "container_quality": "GOOD" // Chỉ cho IMPORT containers
    }
  ],
  "total": 1
}
```

## SQL Logic

API sử dụng query phức tạp với các CTE:

1. **latest_sr**: Lấy ServiceRequest mới nhất cho mỗi container
2. **yard_containers**: Lấy tất cả containers đang trong yard (YardPlacement)
3. **Main Query**: Join và filter theo điều kiện

### Điều Kiện Filter Chính

```sql
WHERE (
  -- Điều kiện 1: EMPTY_IN_YARD (SystemAdmin thêm)
  (ls.container_no IS NULL AND c.shipping_line_id = :shipping_line_id)
  OR
  -- Điều kiện 2: IMPORT containers (IN_YARD hoặc GATE_OUT) với quality GOOD
  (ls.type = 'IMPORT' AND ls.shipping_line_id = :shipping_line_id 
   AND (ls.service_status = 'IN_YARD' OR ls.service_status = 'GATE_OUT')
   AND EXISTS (
     SELECT 1 FROM "RepairTicket" rt 
     WHERE rt.container_no = ls.container_no 
     AND rt.status = 'COMPLETE'
   ))
)
```

## Frontend Integration

### Thay Đổi Chính
- Thay thế `containersApi.list()` + client-side filter
- Sử dụng `containersApi.getContainersInYardByShippingLine()`
- Hiển thị badge trạng thái container (EMPTY_IN_YARD vs GATE_OUT-IMPORT)

### UI Improvements
- Badge màu xanh cho EMPTY_IN_YARD
- Badge màu xanh lá cho IN_YARD (IMPORT) với quality GOOD
- Badge màu đỏ cho GATE_OUT (IMPORT) với quality GOOD
- Badge tím cho containers do SystemAdmin thêm
- **Badge vàng cho quality GOOD** (chỉ hiển thị với IMPORT containers)
- Thông báo số lượng containers tìm thấy

## Lợi Ích

1. **Performance**: Chỉ query containers cần thiết thay vì lấy tất cả rồi filter
2. **Accuracy**: Đảm bảo chỉ containers đúng điều kiện được hiển thị
3. **Quality Control**: Chỉ cho phép nâng containers có chất lượng tốt (GOOD)
4. **User Experience**: Hiển thị rõ ràng loại container, nguồn gốc và chất lượng
5. **Maintainability**: Logic tập trung ở backend, dễ bảo trì

## Testing

Sử dụng script test: `test-yard-containers-api.js`

```bash
node test-yard-containers-api.js
```

Cần cập nhật:
- `TEST_SHIPPING_LINE_ID`: ID hãng tàu thực tế
- Authorization token trong headers
