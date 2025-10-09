# 🔍 Debug Container ST55 - v2025-01-27

## 📋 **Vấn đề**

Container ST55 được cập nhật thành `NEED_REPAIR` nhưng khi F5 lại hiển thị `GOOD`.

## 🛠️ **Files Debug đã tạo**

### **1. `check_st55_simple.js`**
- Tạo SQL query để kiểm tra database
- Chạy: `node check_st55_simple.js`
- Tạo file `query_st55.sql` để chạy trong PostgreSQL

### **2. `test_update_st55.js`**
- Test API update container
- Chạy: `node test_update_st55.js`
- Cần authentication token

### **3. `test_api_response_st55.js`**
- Test API response cho ST55
- Chạy: `node test_api_response_st55.js`
- Kiểm tra cả `/containers` và `/reports/containers`

## 🔍 **Các bước debug**

### **Bước 1: Kiểm tra Database**
```sql
-- Chạy query trong PostgreSQL
SELECT 'Container' as table_name, container_no, container_quality, status, "createdAt", "updatedAt"
FROM "Container" 
WHERE container_no = 'ST55';
```

### **Bước 2: Kiểm tra Backend Logs**
1. Mở terminal backend
2. Cập nhật container ST55 trong ManagerCont
3. Xem console logs:
   ```
   🔍 [DEBUG] updateContainerInfo called for ST55: { container_quality: 'NEED_REPAIR' }
   🔍 [DEBUG] Updating Container record for ST55: { currentQuality: 'GOOD', newQuality: 'NEED_REPAIR' }
   ✅ Cập nhật Container record cho ST55: quality → NEED_REPAIR
   🔍 [DEBUG] Verified update for ST55: { container_quality: 'NEED_REPAIR' }
   ```

### **Bước 3: Kiểm tra API Response**
```bash
# Chạy test API
node test_api_response_st55.js
```

### **Bước 4: Kiểm tra Frontend Logs**
1. Mở Developer Console
2. F5 trang ManagerCont
3. Xem logs:
   ```
   🔍 [DEBUG] API response sample: [{ container_no: 'ST55', container_quality: 'NEED_REPAIR' }]
   🔍 [DEBUG] ServiceRequest processing ST55: { container_quality_from_map: 'NEED_REPAIR' }
   📊 Sử dụng container_quality từ Container data cho ST55: NEED_REPAIR
   ```

## 🎯 **Các trường hợp có thể xảy ra**

### **Trường hợp 1: Database không được cập nhật**
- **Triệu chứng**: Backend logs không hiển thị update
- **Nguyên nhân**: API không được gọi hoặc lỗi authentication
- **Giải pháp**: Kiểm tra network tab trong DevTools

### **Trường hợp 2: Database được cập nhật nhưng API không trả về**
- **Triệu chứng**: Database có `NEED_REPAIR` nhưng API response là `NULL`
- **Nguyên nhân**: Query SQL thiếu trường `container_quality`
- **Giải pháp**: Đã sửa trong `ReportsRepository.ts`

### **Trường hợp 3: API trả về đúng nhưng frontend không sử dụng**
- **Triệu chứng**: API response có `NEED_REPAIR` nhưng frontend hiển thị `GOOD`
- **Nguyên nhân**: Logic frontend không ưu tiên `container_quality`
- **Giải pháp**: Đã sửa trong `ManagerCont.tsx`

### **Trường hợp 4: Cache hoặc timing issue**
- **Triệu chứng**: Thỉnh thoảng hiển thị đúng, thỉnh thoảng sai
- **Nguyên nhân**: Race condition hoặc cache
- **Giải pháp**: Thêm delay hoặc force refresh

## 📊 **Expected Results**

### **Database Query Result:**
```
table_name   | container_no | container_quality | status      | createdAt | updatedAt
Container    | ST55         | NEED_REPAIR       | EMPTY_IN_YARD | ...      | ...
```

### **API Response:**
```json
{
  "items": [
    {
      "container_no": "ST55",
      "container_quality": "NEED_REPAIR",
      "service_status": "IN_YARD"
    }
  ]
}
```

### **Frontend Console Logs:**
```
🔍 [DEBUG] API response sample: [{ container_no: 'ST55', container_quality: 'NEED_REPAIR' }]
📊 Sử dụng container_quality từ Container data cho ST55: NEED_REPAIR
```

## 🚨 **Troubleshooting**

### **Nếu database query trả về NULL:**
1. Kiểm tra backend logs khi update
2. Kiểm tra authentication
3. Kiểm tra API endpoint

### **Nếu API response trả về NULL:**
1. Kiểm tra `ReportsRepository.ts` có `c.container_quality` không
2. Restart backend server
3. Kiểm tra database connection

### **Nếu frontend vẫn hiển thị sai:**
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Kiểm tra console logs
4. Kiểm tra `containerQualityMap` có data không

## 📝 **Next Steps**

1. **Chạy database query** để xác nhận data
2. **Kiểm tra backend logs** khi update
3. **Test API response** với scripts
4. **Kiểm tra frontend logs** khi F5
5. **Báo cáo kết quả** để tiếp tục debug
