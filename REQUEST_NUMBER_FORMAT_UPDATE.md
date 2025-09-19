# Request Number Format Update

## Tổng quan
Cập nhật định dạng số yêu cầu cho export requests (hạ container) từ `EXddmmyyy00000` thành `HAddmmyyy00000`.

## Thay đổi chi tiết

### Trước khi cập nhật
- **Import requests (nâng container)**: `NAddmmyyy00000`
- **Export requests (hạ container)**: `EXddmmyyy00000`

### Sau khi cập nhật  
- **Import requests (nâng container)**: `NAddmmyyy00000` (không đổi)
- **Export requests (hạ container)**: `HAddmmyyy00000` (thay đổi từ EX → HA)

## Ví dụ
- Import request thứ 1 ngày 20/09/2025: `NA20092500001`
- Export request thứ 1 ngày 20/09/2025: `HA20092500001` (trước đây là `EX20092500001`)

## Files đã cập nhật

### Frontend
- `manageContainer/frontend/utils/requestNumberGenerator.ts`
  - Cập nhật `generateExportRequestNumber()` để sử dụng prefix "HA"
  - Cập nhật `parseRequestNumber()` để nhận diện prefix "HA"
  - Cập nhật comments và documentation

### Impact
- Tất cả export requests mới sẽ có prefix "HA"
- Existing requests với prefix "EX" vẫn có thể được parse (backward compatibility)
- UI hiển thị số yêu cầu mới sẽ theo format mới

## Lý do thay đổi
- "HA" phù hợp hơn với ngữ cảnh "Hạ container" (Lower Container)
- Tạo sự nhất quán trong naming convention
- Dễ phân biệt giữa các loại request

## Testing
- [x] Generate new export request number với prefix "HA"
- [x] Parse existing "EX" format (backward compatibility)
- [x] Parse new "HA" format
- [x] UI hiển thị đúng format mới
