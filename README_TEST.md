# Hướng dẫn Test Request ID Generation

## Mô tả
Test này kiểm tra xem khi tạo request mới cho container đã bị reject thì có tạo ID khác không.

## Các file test

### 1. `test-request-id.js`
Test cơ bản để kiểm tra:
- Tạo request đầu tiên cho container 1234
- Reject request đó
- Tạo request mới cho cùng container 1234
- Kiểm tra ID có khác nhau không

### 2. `test-validation-logic.js`
Test logic validation trong RequestBaseService:
- Test validation khi container đang PENDING
- Test validation khi container đã REJECTED
- Test với container không tồn tại

## Cách chạy test

### Bước 1: Cài đặt dependencies (nếu chưa có)
```bash
cd manageContainer/backend
npm install @prisma/client
```

### Bước 2: Chạy test Request ID
```bash
cd manageContainer
node test-request-id.js
```

### Bước 3: Chạy test Validation Logic
```bash
cd manageContainer
node test-validation-logic.js
```

## Kết quả mong đợi

### Test Request ID (`test-request-id.js`)
```
🧪 Bắt đầu test Request ID Generation...

1️⃣ Tạo request đầu tiên cho container 1234...
✅ Request đầu tiên được tạo với ID: clx1234567890
   Container: 1234
   Status: PENDING

2️⃣ Reject request đầu tiên...
✅ Request đã bị reject với ID: clx1234567890
   Status: REJECTED

3️⃣ Tạo request thứ hai cho container 1234...
✅ Request thứ hai được tạo với ID: clx0987654321
   Container: 1234
   Status: PENDING

4️⃣ Kiểm tra kết quả...
📊 Kết quả:
   - Request đầu tiên ID: clx1234567890
   - Request thứ hai ID: clx0987654321
   - ID khác nhau: ✅ CÓ
   - Cùng container: ✅ CÓ

🎉 TEST THÀNH CÔNG! Logic hoạt động đúng:
   - Có thể tạo request mới cho container đã bị reject
   - Mỗi request có ID duy nhất
   - Tránh được conflict khi status tự động chuyển
```

### Test Validation Logic (`test-validation-logic.js`)
```
🧪 Bắt đầu test Validation Logic...

1️⃣ Tạo request đầu tiên cho container 5678...
✅ Request đầu tiên: clx1111111111 (Status: PENDING)

2️⃣ Test validation khi container đang PENDING...
🔍 Kiểm tra container 5678...
📋 Container 5678 tồn tại:
   - Source: SERVICE_REQUEST
   - Status: PENDING
   - Request ID: clx1111111111
❌ Container 5678 đang active với status PENDING - KHÔNG cho phép tạo request mới
Kết quả: ❌ Từ chối

3️⃣ Reject request...
✅ Request đã bị reject

4️⃣ Test validation khi container đã REJECTED...
🔍 Kiểm tra container 5678...
📋 Container 5678 tồn tại:
   - Source: SERVICE_REQUEST
   - Status: REJECTED
   - Request ID: clx1111111111
✅ Container 5678 đã bị REJECTED - CHO PHÉP tạo request mới
Kết quả: ✅ Cho phép

5️⃣ Tạo request mới...
✅ Request mới: clx2222222222
   ID khác nhau: ✅ CÓ
```

## Lưu ý
- Test sẽ tự động dọn dẹp data sau khi chạy xong
- Nếu có lỗi, kiểm tra kết nối database và Prisma schema
- Test sử dụng container numbers: 1234, 5678, 9999
