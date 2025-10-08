# 🔍 Hướng dẫn Debug IM1235 - Tại sao vẫn hiển thị 2/0

## 📋 Tóm tắt vấn đề
- **IM1235** hiển thị: 2 ảnh kiểm tra + 0 chứng từ (sai)
- **Maintenance/Repairs** hiển thị: 2 ảnh kiểm tra + 2 ảnh chứng từ (đúng)

## 🔧 Đã sửa gì
1. ✅ Thêm API endpoint mới: `GET /requests/:requestId/attachments-all`
2. ✅ Thêm method `getAllFiles()` trong `FileUploadService`
3. ✅ Sửa logic trong `ManagerCont.tsx` để gọi API mới
4. ✅ Thêm fallback logic để đảm bảo tính ổn định

## 🧪 Test đã chạy
- ✅ Database có 2 attachments cho IM1235
- ✅ API endpoint sẽ trả về đúng 2 attachments
- ✅ Logic mới hoạt động chính xác

## 🚨 Có thể vấn đề là gì

### 1. Backend chưa được restart
```bash
# Restart backend server
cd DepotManager/backend
npm run dev
# hoặc
npm start
```

### 2. Frontend đang cache kết quả cũ
- Hard refresh browser (Ctrl+F5)
- Clear browser cache
- Restart frontend dev server

### 3. API endpoint có lỗi
- Kiểm tra console.log trong browser
- Kiểm tra network tab trong DevTools
- Kiểm tra backend logs

## 🔍 Cách kiểm tra

### Bước 1: Kiểm tra console.log
Mở browser DevTools (F12) và xem console, tìm các log:
```
🔍 DEBUG: Gọi API /requests/xxx/attachments-all cho IM1235
🔍 DEBUG: API response: {...}
📄 ✅ Lấy 2 attachments (tất cả) cho IM1235
```

### Bước 2: Kiểm tra Network tab
1. Mở DevTools → Network tab
2. Refresh trang ManagerCont
3. Tìm request: `/requests/xxx/attachments-all`
4. Kiểm tra response status và data

### Bước 3: Kiểm tra backend logs
Xem backend console có log lỗi gì không

## 🎯 Kết quả mong đợi
Sau khi fix, IM1235 sẽ hiển thị:
- **2 ảnh kiểm tra** ✅
- **2 chứng từ** ✅ (thay vì 0)

## 📞 Nếu vẫn không hoạt động
1. Kiểm tra console.log trong browser
2. Kiểm tra network requests
3. Restart cả frontend và backend
4. Clear browser cache hoàn toàn
