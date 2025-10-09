# 🔍 Debug Container ST44 - SystemAdmin Added

## 📋 **Vấn đề**
Container ST44 do SystemAdmin thêm vào với trạng thái `EMPTY_IN_YARD` không xuất hiện trong API response.

## 🔍 **Phân tích nguyên nhân**

### **Container ST44 đặc điểm:**
- Do SystemAdmin thêm vào
- Trạng thái: `EMPTY_IN_YARD`
- Không có ServiceRequest
- Có thể có YardPlacement record

### **API Query Logic:**
```sql
-- Query chỉ lấy YardPlacement với điều kiện:
WHERE yp.status = 'OCCUPIED' 
  AND yp.removed_at IS NULL
  AND yp.container_no IS NOT NULL
```

### **Vấn đề có thể:**
1. **YardPlacement status không phải 'OCCUPIED'**
2. **YardPlacement đã bị removed (removed_at IS NOT NULL)**
3. **Container ST44 không có YardPlacement record**
4. **Database connection issue**

## 🛠️ **Các bước debug**

### **Bước 1: Kiểm tra Database trực tiếp**
Chạy file `check_st44_database.sql` trong PostgreSQL client:

```sql
-- Kiểm tra ST44 trong tất cả bảng
SELECT 'Container' as table_name, container_no, container_quality, status
FROM "Container" WHERE container_no = 'ST44';

SELECT 'YardPlacement' as table_name, container_no, status, removed_at
FROM "YardPlacement" WHERE container_no = 'ST44';

-- Kiểm tra YardPlacement với điều kiện API
SELECT container_no, status, removed_at
FROM "YardPlacement" 
WHERE status = 'OCCUPIED' 
  AND removed_at IS NULL
  AND container_no = 'ST44';
```

### **Bước 2: Kiểm tra ManagerCont Page**
1. Mở trang ManagerCont trong browser
2. Tìm kiếm "ST44"
3. Xem có hiển thị không
4. Kiểm tra Developer Console có lỗi gì không

### **Bước 3: Kiểm tra Backend Logs**
1. Mở terminal backend
2. Xem console logs có lỗi gì không
3. Kiểm tra database connection

### **Bước 4: Test API với filter khác**
```bash
# Test với filter rộng hơn
http://localhost:1000/containers?page=1&pageSize=100
http://localhost:1000/reports/containers?page=1&pageSize=100
```

## 🎯 **Kết quả mong đợi**

### **Nếu ST44 tồn tại trong database:**
```sql
-- Container table
container_no | container_quality | status
ST44         | NULL/GOOD/NEED_REPAIR | EMPTY_IN_YARD

-- YardPlacement table  
container_no | status    | removed_at
ST44         | OCCUPIED  | NULL
```

### **Nếu ST44 không tồn tại:**
- Tất cả queries trả về 0 rows
- Cần tạo lại container ST44

## 🚨 **Troubleshooting**

### **Nếu YardPlacement status không phải 'OCCUPIED':**
- Cập nhật status thành 'OCCUPIED'
- Hoặc sửa query API để include status khác

### **Nếu YardPlacement đã bị removed:**
- Set `removed_at = NULL`
- Hoặc tạo YardPlacement mới

### **Nếu không có YardPlacement record:**
- Tạo YardPlacement record mới cho ST44
- Set status = 'OCCUPIED', removed_at = NULL

## 📝 **Next Steps**

1. **Chạy SQL queries** để kiểm tra database
2. **Kiểm tra ManagerCont page** có hiển thị ST44 không
3. **Báo cáo kết quả** để tiếp tục debug
4. **Sửa database** nếu cần thiết

## 🔧 **Files đã tạo**

1. **`check_st44_database.sql`** - SQL queries để kiểm tra database
2. **`test_st44_detailed.js`** - Test API với các filter khác nhau
3. **`DEBUG_ST44_SUMMARY.md`** - Tài liệu này

**Hãy chạy SQL queries và kiểm tra ManagerCont page, sau đó báo cáo kết quả!** 🚀
