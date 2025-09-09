# Real-time Notification Badge System

## Tổng quan
Hệ thống notification badge real-time được tích hợp vào trang Maintenance/Repairs để hiển thị số container đang chờ kiểm tra, tương tự như thông báo Facebook.

## Tính năng chính

### 1. Real-time Counter
- **Auto-refresh**: Cập nhật số lượng container mỗi 5 giây
- **Live data**: Lấy dữ liệu trực tiếp từ API `/backend/gate/requests/search?status=GATE_IN`
- **Smart filtering**: Chỉ đếm container có type = 'IMPORT'

### 2. Visual Notification Badge
- **Badge đỏ**: Hiển thị số container đang chờ với màu đỏ nổi bật
- **Animation pulse**: Hiệu ứng nhấp nháy giống Facebook notification
- **Loading indicator**: Hiển thị spinner khi đang tải dữ liệu
- **Responsive**: Tự động điều chỉnh kích thước trên mobile

### 3. User Experience
- **Hover effects**: Animation bounce khi hover
- **Smooth transitions**: Chuyển đổi mượt mà giữa các trạng thái
- **Auto-hide**: Badge ẩn khi không có container đang chờ
- **99+ display**: Hiển thị "99+" khi số lượng > 99

## Cấu trúc Code

### Hook: `usePendingContainersCount`
```typescript
// File: hooks/usePendingContainersCount.ts
export const usePendingContainersCount = (refreshInterval: number = 5000) => {
  // SWR configuration với auto-refresh
  // Error handling và loading states
  // Return: { count, isLoading, error, refresh }
}
```

### Component Integration
```typescript
// File: pages/Maintenance/Repairs.tsx
const { count: pendingContainersCount, isLoading } = usePendingContainersCount(5000);

// Badge hiển thị
{pendingContainersCount > 0 && (
  <span className="notification-badge">
    {pendingContainersCount > 99 ? '99+' : pendingContainersCount}
  </span>
)}
```

### CSS Animations
```css
/* File: styles/notification-badge.css */
@keyframes pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% { transform: translate3d(0, 0, 0); }
  40%, 43% { transform: translate3d(0, -8px, 0); }
  70% { transform: translate3d(0, -4px, 0); }
  90% { transform: translate3d(0, -2px, 0); }
}
```

## Cấu hình

### Auto-refresh Interval
- **Default**: 5 giây
- **Configurable**: Có thể thay đổi trong hook
- **Smart refresh**: Revalidate khi focus tab hoặc reconnect

### API Endpoints
- **Primary**: `/backend/gate/requests/search?status=GATE_IN&limit=100`
- **Filter**: Chỉ lấy container có `type === 'IMPORT'`
- **Authentication**: Sử dụng Bearer token từ localStorage

### Error Handling
- **Network errors**: Hiển thị loading indicator
- **Auth errors**: Tự động retry khi có token mới
- **API errors**: Log error và tiếp tục hoạt động

## Responsive Design

### Mobile (< 768px)
- Badge size: 18px thay vì 20px
- Font size: 10px thay vì 12px
- Touch-friendly hover effects

### Desktop (>= 768px)
- Full size badge với đầy đủ animations
- Hover effects với bounce animation
- Smooth transitions

## Performance

### Optimization
- **SWR caching**: Tránh gọi API không cần thiết
- **Debounced updates**: Chỉ cập nhật khi có thay đổi
- **Memory efficient**: Cleanup khi component unmount

### Monitoring
- Console logs cho debugging
- Error tracking cho production
- Performance metrics

## Tương lai

### Planned Features
- **Sound notifications**: Âm thanh khi có container mới
- **Push notifications**: Browser notifications
- **Custom intervals**: User có thể set refresh time
- **Multiple counters**: Hiển thị nhiều loại notification

### Extensibility
- **Reusable hook**: Có thể dùng cho các module khác
- **Theme support**: Dark/light mode
- **Custom animations**: User-defined effects

## Troubleshooting

### Common Issues
1. **Badge không hiển thị**: Kiểm tra API response và filter logic
2. **Animation không chạy**: Kiểm tra CSS import trong _app.tsx
3. **Performance issues**: Giảm refresh interval hoặc optimize API

### Debug Tools
- Browser DevTools Network tab
- Console logs trong hook
- SWR DevTools extension

## Changelog

### v1.0.0 (2024-01-XX)
- ✅ Initial implementation
- ✅ Real-time counter với SWR
- ✅ Facebook-style notification badge
- ✅ Responsive design
- ✅ Error handling và loading states
