# MODULE 3: REQUESTS - Quản lý yêu cầu dịch vụ

## ⚠️ TRẠNG THÁI HIỆN TẠI: ĐÃ XÓA TẤT CẢ TRẠNG THÁI VÀ STATE MACHINE

**Ngày cập nhật:** 2025-01-19  
**Trạng thái:** Module đã được reset hoàn toàn về trạng thái ban đầu

### 🔄 Thay đổi gần đây:
- **Đã xóa toàn bộ logic backend** liên quan đến requests
- **Đã xóa toàn bộ logic frontend** của page `/Requests/Depot`
- **Đã xóa tất cả trạng thái cũ** (PENDING, SCHEDULED, FORWARDED, GATE_IN, CHECKING, REJECTED, COMPLETED, EXPORTED, IN_YARD, POSITIONED, FORKLIFTING, IN_CAR, v.v.)
- **Đã xóa tất cả state machine** và workflow cũ
- **Đã xóa tất cả tài liệu** liên quan đến trạng thái cũ
- **Chỉ giữ lại khung UI cơ bản** như hiển thị trong ảnh
- **Sẵn sàng để định nghĩa lại từ đầu** với trạng thái và state machine hoàn toàn mới

### 📁 Cấu trúc hiện tại:
```
backend/modules/requests/
├── service/
│   ├── AttachmentService.ts
│   ├── RequestBaseService.ts
│   └── RequestService.ts.backup
└── (các thư mục khác đã bị xóa)

frontend/pages/Requests/
├── Depot.tsx (chỉ có khung UI cơ bản)
└── (các components và hooks đã bị xóa)
```

## Tổng quan
Module này sẽ được phát triển lại từ đầu để quản lý toàn bộ lifecycle của các yêu cầu dịch vụ container.

## 🚀 Kế hoạch phát triển mới

### **Bước 1: Định nghĩa Trạng thái và State Machine mới**
- Xác định các trạng thái cần thiết (hoàn toàn mới)
- Định nghĩa các chuyển đổi trạng thái hợp lệ
- Thiết kế workflow cho từng loại request
- Cập nhật database schema với trạng thái mới

### **Bước 2: Backend Implementation**
- Tạo lại RequestService với state machine
- Implement các API endpoints cần thiết
- Xây dựng validation và business logic

### **Bước 3: Frontend Implementation**
- Tích hợp với backend APIs
- Xây dựng UI components cho quản lý requests
- Implement real-time updates

### **Bước 4: Testing & Documentation**
- Unit tests cho business logic
- Integration tests cho APIs
- User documentation

## 📋 TODO List

- [ ] Định nghĩa state machine mới
- [ ] Tạo RequestService mới
- [ ] Implement API endpoints
- [ ] Xây dựng frontend components
- [ ] Testing và documentation

---

**Lưu ý:** Tài liệu này sẽ được cập nhật khi có tiến độ phát triển mới.