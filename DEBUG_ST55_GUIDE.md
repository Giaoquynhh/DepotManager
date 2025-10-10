# 🔍 Hướng dẫn Debug Container ST55

## 📋 **Vấn đề**
Container ST55 được cập nhật thành `NEED_REPAIR` nhưng khi F5 lại hiển thị `GOOD`.

## 🚀 **Các bước debug**

### **Bước 1: Khởi động Backend Server**
```bash
cd DepotManager/backend
npm run dev
# Server sẽ chạy trên http://localhost:1000
```

### **Bước 2: Kiểm tra Database trực tiếp**
Mở PostgreSQL client (pgAdmin, DBeaver, etc.) và chạy query:

```sql
-- Kiểm tra Container table
SELECT container_no, container_quality, status, "createdAt", "updatedAt"
FROM "Container" 
WHERE container_no = 'ST55';

-- Kiểm tra ServiceRequest table
SELECT container_no, type, status, "createdAt", "updatedAt"
FROM "ServiceRequest" 
WHERE container_no = 'ST55'
ORDER BY "createdAt" DESC
LIMIT 3;

-- Kiểm tra RepairTicket table
SELECT container_no, status, "createdAt", "updatedAt"
FROM "RepairTicket" 
WHERE container_no = 'ST55'
ORDER BY "createdAt" DESC
LIMIT 3;
```

### **Bước 3: Test API Response**
Sau khi backend chạy, mở browser và test:

```bash
# Test 1: Containers API
http://localhost:1000/containers?q=ST55

# Test 2: Reports API  
http://localhost:1000/reports/containers?q=ST55
```

Hoặc chạy script:
```bash
node test_st55_simple.js
```

### **Bước 4: Kiểm tra Backend Logs**
1. Cập nhật container ST55 trong ManagerCont
2. Xem console logs backend, tìm:
   ```
   🔍 [DEBUG] updateContainerInfo called for ST55: { container_quality: 'NEED_REPAIR' }
   ✅ Cập nhật Container record cho ST55: quality → NEED_REPAIR
   🔍 [DEBUG] Verified update for ST55: { container_quality: 'NEED_REPAIR' }
   ```

### **Bước 5: Kiểm tra Frontend Logs**
1. Mở Developer Console (F12)
2. F5 trang ManagerCont
3. Tìm logs:
   ```
   🔍 [DEBUG] API response sample: [{ container_no: 'ST55', container_quality: 'NEED_REPAIR' }]
   📊 Sử dụng container_quality từ Container data cho ST55: NEED_REPAIR
   ```

## 🎯 **Kết quả mong đợi**

### **Database Query:**
```
container_no | container_quality | status
ST55         | NEED_REPAIR      | EMPTY_IN_YARD
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

### **Frontend Display:**
- Trạng thái hiển thị: "Cần sửa chữa"
- Console log: `container_quality: 'NEED_REPAIR'`

## 🚨 **Troubleshooting**

### **Nếu database query trả về NULL:**
- Backend không được gọi
- Kiểm tra network tab trong DevTools
- Kiểm tra authentication

### **Nếu API response trả về NULL:**
- Query SQL thiếu trường `container_quality`
- Restart backend server
- Kiểm tra `ReportsRepository.ts`

### **Nếu frontend vẫn hiển thị sai:**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Kiểm tra `containerQualityMap` trong console

## 📝 **Báo cáo kết quả**

Hãy chạy các bước trên và báo cáo:

1. **Database query result** cho ST55
2. **API response** từ browser/script
3. **Backend logs** khi update
4. **Frontend console logs** khi F5
5. **Trạng thái hiển thị** cuối cùng

Với thông tin này, tôi có thể giúp bạn tìm ra nguyên nhân chính xác! 🚀


