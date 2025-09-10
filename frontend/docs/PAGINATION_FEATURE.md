# 📄 Tính năng Phân trang cho Container Filter

## 🎯 Tổng quan

Tính năng phân trang được thêm vào `FuturisticStackDetailsModal` để giải quyết vấn đề không thể xem hết tất cả container khi có quá nhiều container trong hàng đợi sắp xếp.

## ✨ Tính năng chính

### 🔢 Phân trang thông minh
- **Hiển thị 5 container mỗi trang** để tối ưu hiệu suất
- **Tự động tính toán số trang** dựa trên tổng số container
- **Reset về trang 1** khi mở filter mới

### 🎮 Điều khiển phân trang
- **Prev/Next buttons** với trạng thái disabled thông minh
- **Page numbers** (hiển thị khi ≤ 5 trang) để chuyển trang nhanh
- **Thông tin trang hiện tại** và tổng số container

### 📊 Thông tin chi tiết
- **Header thông tin**: Hiển thị số container hiện tại / tổng số
- **Page indicator**: Trang hiện tại / tổng số trang
- **Container count**: Tổng số container trong hệ thống

## 🛠️ Cách sử dụng

### 1. Mở Container Filter
- Click vào nút 🔍 bên cạnh input container
- Hệ thống tự động load trang 1 với 5 container đầu tiên

### 2. Điều hướng trang
- **Prev button**: Chuyển về trang trước (disabled ở trang 1)
- **Next button**: Chuyển đến trang tiếp theo (disabled ở trang cuối)
- **Page numbers**: Click trực tiếp vào số trang (chỉ hiển thị khi ≤ 5 trang)

### 3. Chọn container
- Click vào container trong danh sách để tự động điền vào input
- Container được chọn sẽ được validate theo quyền SystemAdmin

## 🎨 Giao diện

### Container List Header
```
┌─────────────────────────────────────────┐
│ Hiển thị 5 / 23 container    Trang 1/5  │
└─────────────────────────────────────────┘
```

### Pagination Controls
```
┌─────────────────────────────────────────────────────────┐
│ ← Prev    Trang 1/5 (23 container) [1][2][3][4][5] Next → │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Cấu hình

### State Management
```typescript
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [totalContainers, setTotalContainers] = useState(0);
const [pageSize] = useState(5); // 5 container mỗi trang
```

### API Integration
```typescript
const fetchAvailableContainers = async (page: number = currentPage) => {
  const data = await containersApi.list({
    service_status: 'CHECKED',
    page: page,
    pageSize: pageSize
  });
  // Xử lý dữ liệu và cập nhật state
};
```

## 📱 Responsive Design

- **Desktop**: Hiển thị đầy đủ controls và page numbers
- **Mobile**: Stack controls theo chiều dọc để tối ưu không gian
- **Tablet**: Giữ nguyên layout nhưng điều chỉnh kích thước

## 🚀 Tối ưu hiệu suất

### Lazy Loading
- Chỉ load dữ liệu khi cần thiết
- Reset state khi đóng modal
- Cache thông tin trang hiện tại

### Memory Management
- Clear container list khi đóng modal
- Reset pagination state
- Optimize re-renders với useCallback

## 🐛 Xử lý lỗi

### Loading States
- Hiển thị spinner khi đang load
- Disable buttons khi đang xử lý
- Error handling cho API calls

### Edge Cases
- Không có container: Hiển thị thông báo "Không có container đang chờ"
- Lỗi API: Hiển thị thông báo lỗi và retry option
- Empty pages: Tự động chuyển về trang hợp lệ

## 🔮 Tính năng tương lai

### Có thể mở rộng
- **Search trong pagination**: Tìm kiếm container trong danh sách
- **Sort options**: Sắp xếp theo ngày, container number
- **Bulk selection**: Chọn nhiều container cùng lúc
- **Export filtered**: Xuất danh sách container đã lọc

### Performance Improvements
- **Virtual scrolling**: Cho danh sách rất dài
- **Infinite scroll**: Load thêm khi scroll xuống
- **Caching**: Cache dữ liệu đã load

## 📝 Changelog

### v1.0.0 (2024-01-XX)
- ✅ Thêm pagination cho container filter
- ✅ UI controls cho prev/next navigation
- ✅ Page numbers cho quick navigation
- ✅ Responsive design
- ✅ Loading states và error handling
- ✅ CSS styling với glassmorphic effects

## 🎯 Kết luận

Tính năng phân trang giúp người dùng dễ dàng quản lý và tìm kiếm container trong danh sách dài, cải thiện đáng kể trải nghiệm sử dụng hệ thống quản lý bãi container.
