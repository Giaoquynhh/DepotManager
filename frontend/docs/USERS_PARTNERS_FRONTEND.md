# Frontend UsersPartners Module

## Tổng quan
Module quản lý người dùng và đối tác với giao diện đa ngôn ngữ (Tiếng Việt/Tiếng Anh) và phân quyền RBAC.

## URL
- **Production**: `http://localhost:5002/UsersPartners`
- **Route**: `/pages/UsersPartners/index.tsx`

## Cấu trúc thư mục
```
pages/UsersPartners/
├── index.tsx                 # Component chính
├── types.ts                  # TypeScript interfaces
├── constants.ts              # Constants (màu sắc, roles)
├── translations.ts           # Bản dịch đa ngôn ngữ
├── utils/roleUtils.ts        # Utility functions cho roles
├── hooks/useUsersPartners.ts # Custom hook quản lý state
└── components/
    ├── TabNavigation.tsx     # Tab chuyển đổi Users/Partners
    ├── UserTable.tsx         # Bảng hiển thị users
    ├── ActionButtons.tsx     # Các nút hành động
    ├── CreateEmployeeModal.tsx # Modal tạo nhân viên
    └── CreatePartnerModal.tsx  # Modal tạo đối tác
```

## Phân quyền (RBAC)

### Quyền truy cập
- **SystemAdmin/Admin**: Toàn quyền quản lý users và partners
- **SaleAdmin**: Chỉ quản lý users nội bộ
- **Các role khác**: Không có quyền truy cập (hiển thị thông báo "Access Denied")

### Quyền hành động
- **Disable/Enable**: SystemAdmin, SaleAdmin
- **Lock/Unlock**: Chỉ SystemAdmin
- **Delete**: Chỉ SystemAdmin (chỉ user đã DISABLED)
- **Create Employee**: SystemAdmin, SaleAdmin
- **Create Partner**: SystemAdmin, Admin

## Quản lý Users

### Các role được hỗ trợ
- `SystemAdmin` - Quản trị hệ thống (màu đỏ)
- `SaleAdmin` - Quản lý bán hàng (màu cam)
- `Driver` - Tài xế (màu xanh dương)
- `Security` - Nhân viên bảo vệ (màu xám)
- `Dispatcher` - Nhân viên điều độ (màu xanh nhạt)

### Trạng thái tài khoản
- `ACTIVE` - Hoạt động (màu xanh lá)
- `INVITED` - Đã mời (màu cam)
- `DISABLED` - Vô hiệu hóa (màu đỏ)
- `LOCKED` - Đã khóa (màu nâu)

### Các hành động
- **Disable/Enable**: Chặn/mở quyền đăng nhập
- **Lock/Unlock**: Khóa tạm thời (chỉ SystemAdmin)
- **Delete**: Xóa vĩnh viễn (chỉ tài khoản đã disabled)

## Quản lý Partners

### Trạng thái hiện tại
- **Tính năng tạm thời bị vô hiệu hóa** (chỉ hiển thị UI local)
- Dữ liệu được lưu local, chưa kết nối backend
- Có modal tạo đối tác với các trường: mã, tên, địa chỉ, MST, SĐT, ghi chú

### Các trường thông tin
- **Mã đối tác** (bắt buộc)
- **Tên đối tác** (bắt buộc)
- **Địa chỉ** (tùy chọn)
- **MST** (tùy chọn)
- **SĐT** (tùy chọn)
- **Ghi chú** (tùy chọn)

## Giao diện người dùng

### Tab Navigation
- **Users Tab**: Hiển thị danh sách người dùng
- **Partners Tab**: Hiển thị danh sách đối tác (chỉ SystemAdmin/Admin)

### Bảng dữ liệu Users
- **Email**: Hiển thị với màu xanh dương
- **Họ tên**: Tên đầy đủ của user
- **Vai trò**: Badge màu sắc theo role
- **Trạng thái**: Badge màu sắc theo status
- **Hành động**: Các nút disable/enable, lock/unlock, delete

### Modal tạo nhân viên
- **Họ tên** (bắt buộc)
- **Email** (bắt buộc, định dạng email)
- **Mật khẩu** (bắt buộc, tối thiểu 6 ký tự)
- **Vai trò**: Dropdown chọn role

### Modal tạo đối tác
- Form với các trường thông tin cơ bản
- Validation: Mã và tên đối tác là bắt buộc
- Hỗ trợ chỉnh sửa và xóa đối tác

## Tính năng kỹ thuật

### State Management
- **SWR**: Quản lý data fetching và caching
- **Custom hooks**: Tách logic phức tạp ra khỏi component
- **Local state**: Quản lý form states và UI states

### API Integration
- **GET /auth/me**: Lấy thông tin user hiện tại
- **GET /users**: Lấy danh sách users với pagination
- **POST /users**: Tạo nhân viên mới
- **PATCH /users/:id/disable|enable|lock|unlock**: Thay đổi trạng thái
- **DELETE /users/:id**: Xóa user

### Error Handling
- **Form validation**: Kiểm tra dữ liệu đầu vào
- **API errors**: Hiển thị thông báo lỗi từ server
- **Success messages**: Thông báo thành công

### Responsive Design
- **CSS Grid**: Layout linh hoạt
- **Flexbox**: Căn chỉnh elements
- **Mobile-friendly**: Tương thích mobile

## Đa ngôn ngữ

### Hỗ trợ ngôn ngữ
- **Tiếng Việt** (vi): Ngôn ngữ mặc định
- **Tiếng Anh** (en): Ngôn ngữ phụ

### Các phần được dịch
- Tiêu đề trang và tab
- Headers bảng dữ liệu
- Labels form
- Thông báo lỗi và thành công
- Tooltips và placeholders
- Nút hành động

## Validation Rules

### Tạo nhân viên
- **Họ tên**: Bắt buộc, không được để trống
- **Email**: Bắt buộc, định dạng email hợp lệ
- **Mật khẩu**: Bắt buộc, tối thiểu 6 ký tự
- **Vai trò**: Bắt buộc, phải chọn từ danh sách có sẵn

### Tạo đối tác
- **Mã đối tác**: Bắt buộc, không được để trống
- **Tên đối tác**: Bắt buộc, không được để trống
- **Các trường khác**: Tùy chọn

## Styling

### Màu sắc
- **Primary**: #0b2b6d (xanh navy)
- **Success**: #059669 (xanh lá)
- **Warning**: #d97706 (cam)
- **Danger**: #dc2626 (đỏ)
- **Info**: #0891b2 (xanh dương)

### Components
- **Cards**: Container chính với shadow
- **Tables**: Bảng dữ liệu với hover effects
- **Buttons**: Nút hành động với màu sắc phân biệt
- **Badges**: Hiển thị role và status
- **Modals**: Popup forms với overlay

## Performance

### Optimization
- **SWR caching**: Giảm số lần gọi API
- **Component splitting**: Tách component nhỏ
- **Lazy loading**: Load components khi cần
- **Memoization**: Tối ưu re-render

### Bundle Size
- **Tree shaking**: Loại bỏ code không dùng
- **Code splitting**: Chia nhỏ bundle
- **Dynamic imports**: Import động components

## Testing

### Test Cases
- **Unit tests**: Test individual components
- **Integration tests**: Test API integration
- **E2E tests**: Test user workflows
- **Accessibility tests**: Test a11y compliance

### Test Coverage
- Component rendering
- User interactions
- Form validation
- API calls
- Error handling

## Deployment

### Build Process
- **Next.js build**: Optimized production build
- **TypeScript compilation**: Type checking
- **CSS optimization**: Minified styles
- **Asset optimization**: Compressed images

### Environment Variables
- **API_BASE_URL**: Backend API endpoint
- **NODE_ENV**: Environment mode
- **NEXT_PUBLIC_APP_URL**: Frontend URL

## Troubleshooting

### Common Issues
- **Permission denied**: Kiểm tra role user
- **API errors**: Kiểm tra network và server
- **Form validation**: Kiểm tra input data
- **Translation missing**: Kiểm tra translation keys

### Debug Tools
- **React DevTools**: Component inspection
- **Network tab**: API call monitoring
- **Console logs**: Error tracking
- **SWR DevTools**: Cache inspection

## Future Enhancements

### Planned Features
- **Bulk operations**: Thao tác hàng loạt
- **Advanced filtering**: Lọc nâng cao
- **Export functionality**: Xuất dữ liệu
- **Real-time updates**: Cập nhật real-time
- **Mobile app**: Ứng dụng mobile

### Technical Improvements
- **GraphQL**: Thay thế REST API
- **State management**: Redux/Zustand
- **Testing**: Jest/Cypress
- **Monitoring**: Error tracking
- **Analytics**: User behavior tracking
