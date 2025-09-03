# Email Integration - User Invitation System

## Tổng quan

Hệ thống đã được tích hợp email service để gửi lời mời kích hoạt tài khoản qua email thực tế khi tạo user mới.

## Cấu hình Email

### 1. Biến môi trường (.env)

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL (để tạo link kích hoạt)
FRONTEND_URL=http://localhost:5002
```

### 2. Cấu hình cho các nhà cung cấp email phổ biến

#### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Lưu ý**: Cần tạo App Password trong Google Account Settings.

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

## Chức năng Email

### 1. Gửi email khi tạo user mới

- **Tự động gửi**: Khi tạo nhân sự nội bộ hoặc user khách hàng
- **Template đa ngôn ngữ**: Hỗ trợ tiếng Việt và tiếng Anh
- **Nội dung email**:
  - Lời chào cá nhân hóa
  - Thông tin vai trò được gán
  - Link kích hoạt tài khoản
  - Token kích hoạt
  - Thời gian hết hạn (7 ngày)
  - Hướng dẫn sử dụng

### 2. Gửi lại email mời

- **Chức năng**: Gửi lại email mời cho user đã tồn tại
- **Trigger**: Nhấn nút "Gửi lại lời mời" trong danh sách user
- **Token mới**: Tạo token mới mỗi lần gửi lại

## Cấu trúc Email Template

### HTML Template
- **Responsive design**: Tương thích với các client email
- **Branding**: Logo và màu sắc của Smartlog Container Manager
- **Call-to-action button**: Nút kích hoạt tài khoản nổi bật
- **Thông tin chi tiết**: Token, link, thời gian hết hạn

### Text Template
- **Fallback**: Phiên bản text cho client không hỗ trợ HTML
- **Thông tin đầy đủ**: Tất cả thông tin cần thiết

## API Endpoints

### Tạo user với email
```
POST /users
Content-Type: application/json

{
  "full_name": "Nguyễn Văn A",
  "email": "user@example.com",
  "role": "HRManager"
}
```

**Response**: User được tạo + email được gửi tự động

### Gửi lại email mời
```
POST /users/{id}/send-invite
```

**Response**: 
```json
{
  "invite_token": "abc123...",
  "invite_expires_at": "2024-01-15T10:00:00Z"
}
```

## Xử lý lỗi

### 1. Email gửi thất bại
- **Không làm fail việc tạo user**: User vẫn được tạo thành công
- **Log lỗi**: Ghi log chi tiết lỗi email
- **Thông báo**: Frontend hiển thị thông báo thành công tạo user

### 2. Cấu hình email sai
- **Verify connection**: Kiểm tra kết nối SMTP khi khởi động
- **Log warning**: Cảnh báo nếu không thể kết nối email service

## Bảo mật

### 1. Token bảo mật
- **Random token**: 24 bytes hex string
- **Thời gian hết hạn**: 7 ngày
- **One-time use**: Token chỉ dùng được một lần

### 2. Email validation
- **Format check**: Kiểm tra format email hợp lệ
- **Unique check**: Đảm bảo email không trùng lặp

## Monitoring & Logging

### 1. Logs
```javascript
// Thành công
console.log(`Invitation email sent to ${email}`);

// Thất bại
console.error('Failed to send invitation email:', error);
```

### 2. Audit Trail
- **Event**: `USER.INVITED`
- **Details**: Email, role, timestamp
- **Actor**: Người tạo user

## Testing

### 1. Test email service
```javascript
// Verify SMTP connection
await emailService.verifyConnection();
```

### 2. Test gửi email
```javascript
// Test gửi email invitation
await emailService.sendUserInvitation(
  'test@example.com',
  'Test User',
  'HRManager',
  'test-token',
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  'vi'
);
```

## Troubleshooting

### 1. Email không được gửi
- Kiểm tra cấu hình SMTP
- Kiểm tra App Password (Gmail)
- Kiểm tra firewall/network
- Kiểm tra log lỗi

### 2. Email vào spam
- Cấu hình SPF/DKIM records
- Sử dụng email domain chính thức
- Tránh nội dung spam-like

### 3. Link không hoạt động
- Kiểm tra FRONTEND_URL
- Kiểm tra route /Register
- Kiểm tra token expiration
