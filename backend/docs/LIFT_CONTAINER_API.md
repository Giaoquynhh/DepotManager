# LiftContainer API Documentation

## Tổng quan
API `LiftContainer` cho phép nâng (remove) container khỏi bãi (yard) sau khi kiểm tra container có tồn tại và đang ở trạng thái phù hợp.

## Endpoint
```
POST /yard/lift-container
```

## Request Body
```json
{
  "container_no": "SA111"
}
```

## Response

### Thành công (200)
```json
{
  "message": "Container SA111 đã được nâng thành công",
  "container_no": "SA111",
  "slot_id": "slot_id_here",
  "tier": 1,
  "removed_at": "2024-01-15T10:30:00.000Z"
}
```

### Lỗi (400)
```json
{
  "message": "Container SA111 không tồn tại trong bãi"
}
```

```json
{
  "message": "Container SA111 không ở trạng thái OCCUPIED (hiện tại: HOLD)"
}
```

```json
{
  "message": "Vi phạm LIFO: Tồn tại container ở tier cao hơn, không thể nâng container này"
}
```

## Logic hoạt động

1. **Kiểm tra container tồn tại**: API sẽ tìm kiếm container trong bãi sử dụng `findContainerLocation()`
2. **Kiểm tra trạng thái**: Container phải ở trạng thái `OCCUPIED` và `removed_at` phải là `null`
3. **Kiểm tra LIFO constraint**: Không thể nâng container nếu có container khác ở tier cao hơn
4. **Thực hiện nâng container**:
   - Cập nhật `YardPlacement` thành `REMOVED`
   - Cập nhật `YardSlot.occupant_container_no` cho container ở tier cao nhất còn lại
   - Nếu không còn container nào, đặt slot thành `EMPTY`

## Quyền truy cập
- Yêu cầu: `TechnicalDepartment` hoặc `SystemAdmin`
- Cần xác thực (authentication)

## Ví dụ sử dụng

### JavaScript/Node.js
```javascript
const axios = require('axios');

const response = await axios.post('http://localhost:5002/yard/lift-container', {
  container_no: 'SA111'
}, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  }
});

console.log(response.data);
```

### cURL
```bash
curl -X POST http://localhost:5002/yard/lift-container \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"container_no": "SA111"}'
```

## Lưu ý quan trọng

1. **LIFO Constraint**: Container chỉ có thể được nâng nếu nó ở tier cao nhất trong stack
2. **Trạng thái container**: Container phải ở trạng thái `OCCUPIED` và chưa bị remove
3. **Audit logging**: Mọi thao tác nâng container đều được ghi log với action `YARD.LIFT_CONTAINER`
4. **Transaction safety**: Tất cả thao tác được thực hiện trong transaction để đảm bảo tính nhất quán

## Liên quan đến UI

API này tương ứng với nút "Gỡ bỏ" (Remove) trong UI "Chi tiết ngăn xếp" như trong hình ảnh:
- Khi user click nút "Gỡ bỏ" cho container SA111
- System sẽ gọi API này để thực hiện thao tác nâng container
- Container sẽ được remove khỏi stack và slot sẽ được cập nhật tương ứng
