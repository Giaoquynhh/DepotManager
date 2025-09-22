# Container Search API Documentation

## Tổng quan
API `ContainerSearch` cung cấp tính năng gợi ý tìm kiếm container với autocomplete, giúp người dùng dễ dàng tìm và chọn container khi tạo yêu cầu nâng container.

## Endpoint
```
GET /yard/search-containers
```

## Query Parameters
- `q` (string, required): Từ khóa tìm kiếm (tối thiểu 2 ký tự)
- `limit` (number, optional): Số lượng kết quả tối đa (mặc định: 10)

## Response

### Thành công (200)
```json
{
  "containers": [
    {
      "container_no": "SA111",
      "location": "B - B1 - B1-1",
      "tier": 1,
      "status": "IN_YARD",
      "type": "yard"
    },
    {
      "container_no": "SB222",
      "location": "Chưa đặt vào bãi",
      "tier": null,
      "status": "COMPLETED",
      "type": "service"
    }
  ]
}
```

### Lỗi (400)
```json
{
  "message": "Query quá ngắn (tối thiểu 2 ký tự)"
}
```

## Logic tìm kiếm

### 1. Container trong bãi (YardPlacement)
- Tìm container có `status = 'OCCUPIED'` và `removed_at = null`
- Hiển thị vị trí: `Yard - Block - Slot`
- Hiển thị tier nếu có
- Status: `IN_YARD`

### 2. Container từ ServiceRequest
- Tìm container có status: `COMPLETED`, `POSITIONED`, `IN_CAR`
- Hiển thị vị trí: "Chưa đặt vào bãi"
- Status: Theo trạng thái của request

### 3. Ưu tiên hiển thị
- Container trong bãi được ưu tiên hiển thị trước
- Container từ service request chỉ hiển thị nếu chưa có trong bãi
- Sắp xếp theo thứ tự alphabet

## Frontend Integration

### ContainerSearchInput Component
```tsx
import { ContainerSearchInput } from '../../../components/ContainerSearchInput';

<ContainerSearchInput
  value={formData.containerNumber || ''}
  onChange={(value) => handleInputChange('containerNumber', value)}
  placeholder="Nhập số container"
  style={formInputStyle}
/>
```

### Tính năng
- **Debounce search**: Tìm kiếm sau 300ms khi người dùng ngừng gõ
- **Autocomplete**: Hiển thị dropdown với gợi ý
- **Status indicators**: Màu sắc khác nhau cho từng trạng thái
- **Click outside to close**: Đóng dropdown khi click bên ngoài
- **Keyboard navigation**: Hỗ trợ điều hướng bằng phím

## Ví dụ sử dụng

### JavaScript/Node.js
```javascript
const axios = require('axios');

const response = await axios.get('http://localhost:5002/yard/search-containers?q=SA&limit=10', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  }
});

console.log(response.data.containers);
```

### cURL
```bash
curl -X GET "http://localhost:5002/yard/search-containers?q=SA&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Status Colors & Meanings

| Status | Color | Meaning |
|--------|-------|---------|
| `IN_YARD` | Green (#10b981) | Container đang trong bãi |
| `COMPLETED` | Blue (#3b82f6) | Request đã hoàn thành |
| `POSITIONED` | Purple (#8b5cf6) | Container đã được đặt |
| `IN_CAR` | Orange (#f59e0b) | Container đang trên xe |

## Lưu ý quan trọng

1. **Minimum query length**: Query phải có ít nhất 2 ký tự
2. **Case insensitive**: Tìm kiếm không phân biệt hoa thường
3. **Real-time search**: Kết quả được cập nhật theo thời gian thực
4. **Performance**: Sử dụng limit để tránh trả về quá nhiều kết quả
5. **Authentication**: Yêu cầu xác thực để sử dụng API

## Liên quan đến UI

Tính năng này được tích hợp vào form "Tạo yêu cầu nâng container":
- Khi user gõ vào field "Số container"
- System sẽ gọi API search và hiển thị gợi ý
- User có thể click để chọn container từ danh sách gợi ý
- Hiển thị thông tin chi tiết về vị trí và trạng thái container
