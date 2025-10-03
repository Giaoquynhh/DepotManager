# 🎯 HƯỚNG DẪN MAPPING CHÍNH XÁC CHO PHIẾU EIR

## 📋 Cách chỉnh sửa mapping

Trong file `fill-eir-with-mapping.js`, bạn có thể chỉnh sửa phần `FIELD_MAPPING` để điền chính xác vào từng ô:

```javascript
const FIELD_MAPPING = {
  // Format: 'field_name': { row: số_hàng, col: số_cột, description: 'mô tả' }
  'customer_name': { row: 6, col: 3, description: 'Tên khách hàng' },
  'shipping_line': { row: 7, col: 3, description: 'Hãng tàu' },
  'container_no': { row: 8, col: 3, description: 'Số container' },
  'seal_number': { row: 8, col: 9, description: 'Số seal' },
  'vehicle_plate': { row: 10, col: 3, description: 'Số xe' },
  'driver_name': { row: 11, col: 1, description: 'Tài xế' },
  'driver_phone': { row: 11, col: 7, description: 'CMND/SĐT tài xế' },
  'date': { row: 5, col: 8, description: 'Ngày' }
};
```

## 🔍 Cách tìm vị trí chính xác

1. **Mở file Excel mẫu** `EIR_KMTU_1759508813838.xlsx`
2. **Xem số hàng và cột** trong Excel (hiển thị ở góc dưới bên trái)
3. **Ghi lại vị trí** của từng trường cần điền
4. **Cập nhật mapping** trong script

## 📊 Mapping hiện tại (có thể cần chỉnh sửa)

| Trường | Hàng | Cột | Mô tả | Dữ liệu từ OO11 |
|--------|------|-----|-------|-----------------|
| customer_name | 6 | 3 | Tên khách hàng | Tổng công ty Logistics Việt Nam |
| shipping_line | 7 | 3 | Hãng tàu | KMTU |
| container_no | 8 | 3 | Số container | OO11 |
| seal_number | 8 | 9 | Số seal | 03 |
| vehicle_plate | 10 | 3 | Số xe | 88A-45423 |
| driver_name | 11 | 1 | Tài xế | Tài xế: HHA |
| driver_phone | 11 | 7 | CMND/SĐT tài xế | CMND: 050150512 |
| date | 5 | 8 | Ngày | Ngày 3 tháng 10 năm 2025 |

## 🎯 Các trường có thể thêm

Bạn có thể thêm các trường khác nếu cần:

```javascript
// Thêm vào FIELD_MAPPING
'booking_number': { row: X, col: Y, description: 'Số Booking/Bill' },
'dem_det': { row: X, col: Y, description: 'DEM/DET' },
'container_type': { row: X, col: Y, description: 'Loại container' },
'notes': { row: X, col: Y, description: 'Ghi chú' }
```

## ✅ Ưu điểm của phương pháp này

- **100% chính xác**: Điền đúng vị trí bạn chỉ định
- **Dễ chỉnh sửa**: Chỉ cần thay đổi số hàng/cột
- **Linh hoạt**: Có thể thêm/bớt trường
- **Giữ nguyên định dạng**: Logo, kích thước, layout
- **Không lặp lại**: Chỉ điền vào đúng vị trí cần thiết

## 🚀 Cách sử dụng

1. **Chỉnh sửa mapping** trong file `fill-eir-with-mapping.js`
2. **Chạy script**: `node fill-eir-with-mapping.js`
3. **Kiểm tra kết quả** trong thư mục `uploads/generated-eir/`

## 📝 Ghi chú

- **Hàng và cột** bắt đầu từ 1 (không phải 0)
- **Kiểm tra kỹ** vị trí trước khi chạy script
- **Backup file gốc** trước khi chỉnh sửa
- **Test với container khác** để đảm bảo mapping đúng
