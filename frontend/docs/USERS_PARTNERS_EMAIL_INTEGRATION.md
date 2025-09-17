# UsersPartners – Trạng thái mục Đối tác (UI-only)

Tài liệu này cập nhật trạng thái mới cho tab Đối tác sau khi gỡ API cũ. Hiện tại tab Đối tác hoạt động ở chế độ UI-only để demo luồng tạo/cập nhật dữ liệu tức thời trên client.

## Cấu trúc trang

### File chính FE
- Page: `frontend/pages/UsersPartners/index.tsx`
- Modal tạo nhân sự: `frontend/pages/UsersPartners/components/CreateEmployeeModal.tsx`
- Modal tạo/cập nhật đối tác: `frontend/pages/UsersPartners/components/CreatePartnerModal.tsx`
- Hook nghiệp vụ: `frontend/pages/UsersPartners/hooks/useUsersPartners.ts`
- Bảng Users: `frontend/pages/UsersPartners/components/UserTable.tsx`
- Button actions: `frontend/pages/UsersPartners/components/ActionButtons.tsx`
- Utils hiển thị role: `frontend/pages/UsersPartners/utils/roleUtils.ts`
- Constants màu & role: `frontend/pages/UsersPartners/constants.ts`
- Translations: `frontend/pages/UsersPartners/translations.ts`

### Chức năng chính

#### 1. **Tạo nhân sự nội bộ (mới)**
- **Quyền**: `SystemAdmin`
- **Modal form** với các trường bắt buộc:
  - Họ tên (full_name)
  - Email
  - Mật khẩu (password)
  - Role: `SystemAdmin`, `SaleAdmin`, `Driver`
- **API**: `POST /users` với payload `{full_name, email, password, role}`
- **Kết quả**: Tài khoản được tạo ở trạng thái `ACTIVE` (không sử dụng email invite)

 Code mapping (Create Internal Staff):
 - UI modal: `components/CreateEmployeeModal.tsx`
 - Form state & gọi API: `hooks/useUsersPartners.ts` (hàm `createEmployee` – gửi kèm `password`)
 - Wire modal từ page: `index.tsx` (props `empPassword`, `setEmpPassword`, ...)

#### 2. **Đối tác (UI-only)**
- Bảng cột: Mã đối tác | Tên đối tác | Hành động
- Nút "Tạo đối tác": mở modal tạo. Trường bắt buộc: Mã đối tác, Tên đối tác (hiển thị dấu * đỏ). Các trường còn lại optional.
- Sau khi Tạo: dữ liệu được thêm ngay vào bảng từ state `partnersLocal` (không gọi API).
- Nút "Cập nhật" ở từng dòng: mở modal với dữ liệu hiện tại, chỉnh sửa xong nhấn Tạo để lưu vào state.
- Nút "Xóa": loại dòng khỏi bảng (state client).

 Code mapping (Partners UI):
 - UI modal: `components/CreatePartnerModal.tsx`
 - Quản lý state/local list: `index.tsx` (state partnersLocal / editIndex)

#### 3. **Quản lý trạng thái user**
- **Vô hiệu hóa/Bật lại**: `PATCH /users/{id}/disable` hoặc `enable`
- **Khóa/Mở khóa**: `PATCH /users/{id}/lock` hoặc `unlock`
- **Xóa**: `DELETE /users/{id}` (chỉ cho user đã DISABLED)

> Không còn API/GUI cho thao tác "Gửi lại lời mời". Nếu cần mời lại, quản trị viên có thể xóa user rồi tạo lại để sinh token mới.

## Hiển thị token
- Hệ thống có thể hiển thị `invite_token` trong UI sau khi tạo user thành công (tùy thiết kế).
- Người dùng có thể vào trang `/Register?token={token}` để kích hoạt tài khoản.

### Ghi chú
- Phần email/invite của Users giữ nguyên theo mô tả bên dưới; riêng Partners hiện không dùng email/invite.

## Bộ lọc và hiển thị

### Filter theo loại user
```typescript
const filterType = useState<'all'|'internal'|'customer'>('all');

// Logic lọc
const filteredUsers = (users?.data || []).filter((u: any) => {
  if (filterType === 'all') return true;
  if (filterType === 'customer') return isCustomerRole(u.role);
  return !isCustomerRole(u.role);
});
```

### Màu sắc role badges
- `SystemAdmin`: Đỏ (#dc2626)
- `SaleAdmin`: Cam (#ea580c)
- `Driver`: Xanh dương (#0891b2)
- `Security`: Xám đậm (#334155)
- `Dispatcher`: Xanh nước (#0ea5e9)
- `CustomerAdmin`: Xanh dương (#0891b2)
- `CustomerUser`: Xám (#6b7280)

### Màu sắc status badges
- `ACTIVE`: Xanh lá (#059669)
- `INVITED`: Cam (#d97706)
- `DISABLED`: Đỏ (#dc2626)
- `LOCKED`: Nâu (#7c2d12)

## RBAC (Role-Based Access Control)

### Quyền truy cập trang
```typescript
// Chỉ các role sau mới được truy cập
canViewUsersPartners(role): boolean {
  return ['SystemAdmin','BusinessAdmin','HRManager'].includes(String(role));
}
```

 Code mapping (RBAC FE helpers):
 - Helpers check role: `frontend/utils/rbac.ts` (được page import)

### Quyền tạo user
```typescript
// Tạo nhân sự nội bộ
showInternalForm(role): boolean {
  return ['SystemAdmin'].includes(String(role));
}

// Tạo user khách hàng
showCustomerForm(role): boolean {
  return ['SystemAdmin','BusinessAdmin','CustomerAdmin'].includes(String(role));
}
```

## API Integration

### Fetch users
```typescript
const { data: users } = useSWR(
  canViewUsersPartners(role) ? ['/users?role=&page=1&limit=50'] : null, 
  ([u]) => fetcher(u)
);
```

### Tạo user với email
```typescript
const createEmployee = async () => {
  // Validation
  if (!empFullName.trim()) {
    setMessage(t[language].pleaseEnterName);
    return;
  }
  if (!empEmail.trim() || !empEmail.includes('@')) {
    setMessage(t[language].pleaseEnterValidEmail);
    return;
  }
  
  try {
    await api.post('/users', { 
      full_name: empFullName.trim(), 
      email: empEmail.trim().toLowerCase(), 
      role: empRole 
    });
    setMessage(t[language].employeeCreated); // "Email mời đã được gửi!"
    // Reset form và đóng modal
    setEmpFullName(''); 
    setEmpEmail('');
    setShowEmpForm(false);
    mutate(['/users?role=&page=1&limit=50']); // Refresh danh sách
  } catch(e: any) { 
    setMessage(e?.response?.data?.message || t[language].createEmployeeError); 
  }
};
```

### User actions hỗ trợ
```typescript
type UserAction = 'disable' | 'enable' | 'lock' | 'unlock' | 'delete';
```

## Đa ngôn ngữ

### Hỗ trợ ngôn ngữ
- **Tiếng Việt** (vi): Mặc định
- **Tiếng Anh** (en): Toggle qua Header

### Translation keys
```typescript
const t = {
  vi: {
    employeeCreated: 'Tạo nhân sự nội bộ thành công. Email mời đã được gửi!',
    customerCreated: 'Tạo user khách hàng thành công. Email mời đã được gửi!',
    emailSent: 'Email mời đã được gửi!',
    // ... other translations
  },
  en: {
    employeeCreated: 'Internal staff created successfully. Invitation email sent!',
    customerCreated: 'Customer user created successfully. Invitation email sent!',
    emailSent: 'Invitation email sent!',
    // ... other translations
  }
};
```

## UI/UX Features

### Modal forms
- **Responsive design** tương thích mobile
- **Validation** real-time
- **Loading states** khi submit
- **Error handling** với thông báo rõ ràng

### Table design
- **Responsive table** với horizontal scroll
- **Action buttons** với tooltips
- **Status badges** với màu sắc phân biệt
- **Role badges** với màu sắc theo hierarchy

### Notifications
- **Success messages** với background xanh
- **Error messages** với background đỏ
- **Token display** với background vàng
- **Auto-dismiss** sau 5 giây

## Testing

### Test cases
1. **Tạo nhân sự nội bộ** với email hợp lệ
2. **Tạo user khách hàng** với tenant_id
3. **Test RBAC** với các role khác nhau
4. **Kiểm tra token** và luồng kích hoạt `/Register`

### Manual testing (Partners UI-only)
1. Mở trang UsersPartners > Đối tác
2. Bấm "Tạo đối tác" và nhập Mã đối tác, Tên đối tác → Tạo
3. Kiểm tra dòng mới xuất hiện ngay
4. Bấm "Cập nhật" để sửa, "Xóa" để xóa

## Troubleshooting

### Email không được gửi
1. Kiểm tra cấu hình SMTP trong backend `.env`
2. Kiểm tra App Password cho Gmail
3. Kiểm tra console log backend
4. Kiểm tra network/firewall

### Token không hoạt động
1. Kiểm tra FRONTEND_URL trong backend `.env`
2. Kiểm tra route `/Register` có tồn tại
3. Kiểm tra token expiration (7 ngày)
4. Kiểm tra token format trong database

### UI không cập nhật
1. Kiểm tra state `partnersLocal` trong `index.tsx`
2. Đảm bảo không reload trang giữa chừng
3. Kiểm tra logic set/reset `editIndex`
