# Request ID Unique Logic - Documentation Overview

## 📋 Tổng quan
Tài liệu này tổng hợp toàn bộ documentation về **Request ID Unique Logic** - tính năng đảm bảo mỗi request có ID duy nhất và có thể tạo request mới cho container đã bị reject.

## 🎯 Vấn đề đã giải quyết
- **Vấn đề:** Khi tạo request cho container 1234, nếu request đó bị reject (REJECTED), sau một thời gian request status tự động chuyển từ REJECTED → CHECKING, gây nhầm lẫn khi user tạo request mới cho cùng container.
- **Giải pháp:** Mỗi request có ID duy nhất, có thể tạo request mới cho container đã bị reject mà không gây conflict.

## 📚 Documentation Structure

### 1. Backend Documentation
- **File:** `manageContainer/backend/docs/REQUEST_ID_UNIQUE_LOGIC.md`
- **Nội dung:**
  - Logic validation container
  - Database schema
  - API endpoints
  - Test cases
  - Error handling
  - Performance considerations

### 2. Frontend Documentation  
- **File:** `manageContainer/frontend/docs/REQUEST_ID_UNIQUE_LOGIC_FRONTEND.md`
- **Nội dung:**
  - Request list display
  - Request creation flow
  - Request details view
  - Error handling & user feedback
  - State management
  - UI/UX improvements
  - Testing
  - Performance optimization
  - Accessibility
  - Internationalization

### 3. Updated Existing Docs
- **Backend:** `manageContainer/backend/docs/MODULE_3_REQUESTS.md`
  - Thêm section "Request ID Unique Logic" vào đầu file
  - Cập nhật tính năng mới và test cases
  
- **Frontend:** `manageContainer/frontend/docs/UI_REFACTOR_DOCUMENTATION.md`
  - Thêm tính năng mới vào mục tiêu đã đạt được

## 🔧 Technical Implementation

### Backend Changes
1. **RequestBaseService.ts** - Logic validation container
   ```typescript
   // Cho phép tạo request mới cho container đã bị reject
   if (['REJECTED', 'GATE_REJECTED'].includes(container.service_status)) {
     console.log(`Cho phép tạo request mới cho container ${container_no} (request cũ ID: ${container.request_id} đã bị ${container.service_status})`);
     return; // Cho phép tạo request mới
   }
   ```

2. **MaintenanceService.ts** - Fix logic cập nhật status
   ```typescript
   // Chỉ cập nhật request ACTIVE (không phải REJECTED, COMPLETED, GATE_REJECTED)
   await prisma.serviceRequest.updateMany({
     where: { 
       container_no: repairTicket.container_no,
       status: { 
         notIn: ['COMPLETED', 'REJECTED', 'GATE_REJECTED'] // Chỉ cập nhật request active
       }
     },
     data: { status: 'PENDING_ACCEPT' }
   });
   ```

### Frontend Changes
1. **RequestTable.tsx** - Hiển thị request với ID duy nhất
2. **RequestForm.tsx** - Form tạo request mới
3. **RequestDetailModal.tsx** - Modal chi tiết request
4. **Error handling** - Xử lý lỗi validation container

## 🧪 Test Results

### Test 1: Request ID Generation
```
✅ Request đầu tiên: cmfc4twz40000hdsu0w5iqjbk (Status: PENDING → REJECTED)
✅ Request thứ hai: cmfc4twzh0001hdsu5xbvjprp (Status: PENDING)
✅ ID khác nhau: CÓ
✅ Cùng container: CÓ
```

### Test 2: Rejected Request Fix
```
✅ Request cũ (REJECTED): REJECTED ✅
✅ Request mới (PENDING_ACCEPT): PENDING_ACCEPT ✅
✅ Không có conflict giữa các request
```

## 📊 Database Schema

### ServiceRequest Model
```prisma
model ServiceRequest {
  id            String   @id @default(cuid())  // ID duy nhất tự động tạo
  container_no  String?  // Container number
  status        String   // PENDING | REJECTED | PENDING_ACCEPT | ...
  created_by    String
  rejected_at   DateTime?
  rejected_by   String?
  rejected_reason String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## 🚀 API Endpoints

### Tạo Request Mới
```http
POST /requests
Content-Type: application/json

{
  "type": "IMPORT",
  "container_no": "1234",
  "eta": "2025-09-09T12:00:00Z"
}
```

### Reject Request
```http
PATCH /requests/{id}/reject
Content-Type: application/json

{
  "reason": "Container không đạt tiêu chuẩn"
}
```

## 🔍 Key Features

### 1. Unique Request ID
- Mỗi request có ID duy nhất sử dụng Prisma `@default(cuid())`
- ID được tạo tự động khi tạo record mới

### 2. Container Validation
- Cho phép tạo request mới cho container đã bị REJECTED
- Không cho phép tạo request mới cho container đang ACTIVE
- Validation logic rõ ràng và dễ hiểu

### 3. Status Management
- Request REJECTED không bị "sống lại" khi có repair invoice
- Chỉ cập nhật request ACTIVE thành PENDING_ACCEPT
- Mỗi request hoạt động độc lập

### 4. Error Handling
- Thông báo lỗi rõ ràng cho user
- Validation container trước khi tạo request
- Graceful error handling

## 📈 Performance

### Database Indexes
```sql
-- Index cho container_no để tối ưu query
CREATE INDEX "ServiceRequest_container_no_idx" ON "ServiceRequest"("container_no");

-- Index cho status để tối ưu filter
CREATE INDEX "ServiceRequest_status_idx" ON "ServiceRequest"("status");
```

### Query Optimization
- Sử dụng `DISTINCT ON` để lấy request mới nhất cho mỗi container
- Sử dụng `notIn` thay vì `not` để tối ưu performance
- Proper error handling và logging

## 🎯 Benefits

### For Users
- ✅ Có thể tạo request mới cho container đã bị reject
- ✅ Mỗi request có ID duy nhất, dễ theo dõi
- ✅ Không bị nhầm lẫn giữa các request
- ✅ UI/UX rõ ràng, dễ hiểu

### For Developers
- ✅ Code rõ ràng, dễ maintain
- ✅ Test coverage đầy đủ
- ✅ Documentation chi tiết
- ✅ Performance tối ưu

### For System
- ✅ Tránh conflict giữa các request
- ✅ Data integrity được đảm bảo
- ✅ Scalable và maintainable
- ✅ Audit trail đầy đủ

## 🔄 Migration Guide

### Existing Data
- Không cần migration cho existing data
- Logic mới tương thích với data cũ
- Chỉ cần deploy code mới

### Rollback Plan
- Revert code về version cũ
- Logic cũ vẫn hoạt động bình thường
- Không ảnh hưởng đến data

## 📝 Changelog

### v2025-09-09
- ✅ Implement Request ID Unique Logic
- ✅ Fix container validation logic
- ✅ Fix repair invoice status update logic
- ✅ Add comprehensive test cases
- ✅ Update documentation
- ✅ Performance optimization

## 🤝 Contributing

### Code Review Checklist
- [ ] Logic validation container đúng
- [ ] Error handling đầy đủ
- [ ] Test cases pass
- [ ] Documentation cập nhật
- [ ] Performance tối ưu

### Testing
- [ ] Unit tests cho validation logic
- [ ] Integration tests cho end-to-end flow
- [ ] Performance tests cho large datasets
- [ ] Manual testing trên UI

## 📞 Support

### Issues
- Tạo issue trên GitHub với label `request-id-unique-logic`
- Mô tả chi tiết vấn đề và steps to reproduce
- Attach logs và screenshots nếu có

### Questions
- Tham khảo documentation chi tiết
- Check test cases để hiểu expected behavior
- Contact team lead nếu cần hỗ trợ

---

**Tài liệu này được cập nhật lần cuối:** 2025-09-09  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
