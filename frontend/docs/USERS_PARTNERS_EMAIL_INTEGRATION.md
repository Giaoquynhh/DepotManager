# UsersPartners Page - Email Integration

## Tổng quan

Trang UsersPartners đã được tích hợp với hệ thống email để gửi lời mời kích hoạt tài khoản qua email thực tế khi tạo user mới.

## Cấu trúc trang

### File chính
- **Component**: `pages/UsersPartners/index.tsx`
- **RBAC**: `utils/rbac.ts`
- **API Client**: `services/api.ts`

### Chức năng chính

#### 1. **Tạo nhân sự nội bộ**
- **Quyền**: `SystemAdmin`, `BusinessAdmin`, `HRManager`
- **Modal form** với các trường:
  - Họ tên (full_name)
  - Email
  - Role: `SystemAdmin`, `BusinessAdmin`, `HRManager`, `SaleAdmin`, `Driver`
- **API**: `POST /users` với payload `{full_name, email, role}`
- **Email**: Tự động gửi email mời sau khi tạo thành công

#### 2. **Tạo user khách hàng**
- **Quyền**: `SystemAdmin`, `BusinessAdmin`, `CustomerAdmin`
- **Modal form** với các trường:
  - Họ tên (full_name)
  - Email
  - Role: `CustomerAdmin`, `CustomerUser`
  - tenant_id (ID khách hàng)
- **API**: `POST /users` với payload `{full_name, email, role, tenant_id}`
- **Email**: Tự động gửi email mời sau khi tạo thành công

#### 3. **Quản lý trạng thái user**
- **Vô hiệu hóa/Bật lại**: `PATCH /users/{id}/disable` hoặc `enable`
- **Khóa/Mở khóa**: `PATCH /users/{id}/lock` hoặc `unlock`
- **Gửi lại lời mời**: `POST /users/{id}/send-invite` (tạo token mới + gửi email)
- **Xóa**: `DELETE /users/{id}` (chỉ cho user đã DISABLED)

## Email Integration

### Thông báo thành công
```typescript
// Khi tạo user thành công
employeeCreated: 'Tạo nhân sự nội bộ thành công. Email mời đã được gửi!'
customerCreated: 'Tạo user khách hàng thành công. Email mời đã được gửi!'

// Khi gửi lại lời mời
emailSent: 'Email mời đã được gửi!'
```

### Hiển thị token
- Sau khi gửi lại lời mời, hiển thị token kích hoạt
- Link trực tiếp đến trang Register: `/Register?token={token}`
- Thông báo: "Mở /Register để kích hoạt"

### Xử lý lỗi
- **Email lỗi không làm fail việc tạo user**
- Hiển thị thông báo thành công tạo user
- Log lỗi email ở backend console

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
- `BusinessAdmin`: Tím (#7c3aed)
- `HRManager`: Xanh lá (#059669)
- `SaleAdmin`: Cam (#ea580c)
- `Driver`: Xanh dương (#0891b2)
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

### Quyền tạo user
```typescript
// Tạo nhân sự nội bộ
showInternalForm(role): boolean {
  return ['SystemAdmin','BusinessAdmin','HRManager'].includes(String(role));
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

### Gửi lại lời mời
```typescript
const userAction = async (id: string, action: 'disable'|'enable'|'lock'|'unlock'|'invite'|'delete') => {
  try {
    if (action === 'invite') {
      const res = await api.post(`/users/${id}/send-invite`);
      setLastInviteToken(res.data?.invite_token || '');
      setMessage(t[language].emailSent); // "Email mời đã được gửi!"
    }
    // ... other actions
    mutate(['/users?role=&page=1&limit=50']); // Refresh danh sách
  } catch(e: any) { 
    setMessage(e?.response?.data?.message || t[language].userActionError.replace('{action}', action)); 
  }
};
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
3. **Gửi lại lời mời** cho user đã tồn tại
4. **Kiểm tra email** được gửi đến địa chỉ đúng
5. **Kiểm tra token** trong email và link kích hoạt
6. **Test validation** với email không hợp lệ
7. **Test RBAC** với các role khác nhau

### Manual testing
1. Mở trang UsersPartners
2. Tạo user mới với email thật
3. Kiểm tra email inbox
4. Click link kích hoạt trong email
5. Verify user được tạo với status INVITED

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
1. Kiểm tra SWR cache
2. Kiểm tra API response
3. Kiểm tra error handling
4. Refresh trang nếu cần
