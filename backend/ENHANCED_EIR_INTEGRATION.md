# 🚀 Enhanced EIR Integration Guide

## 📋 Tổng quan

Đã tích hợp thành công logic tạo phiếu EIR hoàn chỉnh vào hệ thống DepotManager, thay thế logic cũ bằng logic mới với đầy đủ thông tin và định dạng.

## 🔧 Các thay đổi đã thực hiện

### 1. **EnhancedEIRService.js** - Service mới
- **Vị trí**: `DepotManager/backend/modules/gate/service/EnhancedEIRService.js`
- **Chức năng**: Tạo phiếu EIR hoàn chỉnh với logic từ script đã test
- **Đặc điểm**:
  - Sử dụng ExcelJS để giữ nguyên 100% định dạng gốc
  - Điền đầy đủ thông tin từ database
  - Giữ nguyên logo, hình ảnh, kích thước cột/hàng
  - Hỗ trợ tất cả các trường dữ liệu

### 2. **GateService.ts** - Cập nhật method generateEIR
- **Vị trí**: `DepotManager/backend/modules/gate/service/GateService.ts`
- **Thay đổi**: Method `generateEIR()` giờ sử dụng `EnhancedEIRService`
- **Lợi ích**: Logic cũ được thay thế hoàn toàn bằng logic mới

### 3. **Dependencies** - Thêm ExcelJS
- **Package**: `exceljs` đã được cài đặt
- **Mục đích**: Thay thế thư viện `xlsx` cũ để giữ nguyên định dạng

## 📊 Dữ liệu được điền

### ✅ Thông tin cơ bản:
- **C7:H7**: Tên khách hàng
- **C8:D8**: Hãng tàu (code)
- **G8:H8**: Loại tác nghiệp (Import/Export)
- **J8:L8**: Loại container
- **C9:D9**: Container No
- **G9:H9**: Booking (booking_bill)
- **J9:L9**: Số seal
- **C10:L10**: Ghi chú

### ✅ Thông tin xe và tài xế:
- **A11:F11**: Text "Số xe:"
- **G11:L11**: Text "Số điện thoại tài xế:"
- **A12:F12**: Số xe (license_plate)
- **G12:L12**: SĐT tài xế (driver_phone)

### ✅ Thông tin hóa đơn:
- **I7**: Text "Số hóa đơn:"
- **J7:L7**: Số hóa đơn (từ invoice)
- **K4:L4**: Số yêu cầu (request_no)

## 🎯 API Endpoints

### **POST** `/gate/requests/:id/generate-eir`
- **Mô tả**: Tạo phiếu EIR hoàn chỉnh cho container
- **Quyền**: YardManager, TechnicalDepartment, SystemAdmin
- **Response**: File Excel (.xlsx) với định dạng hoàn chỉnh

### **Frontend Integration**
- **LiftContainer**: `http://localhost:5002/LiftContainer`
- **LowerContainer**: `http://localhost:5002/LowerContainer`
- **Gate Dashboard**: `http://localhost:5002/Gate`

## 🔄 Quy trình hoạt động

1. **User click "In phiếu EIR"** trên trang LiftContainer/LowerContainer
2. **Frontend gọi API** `/gate/requests/:id/generate-eir`
3. **Backend sử dụng EnhancedEIRService** để tạo phiếu EIR
4. **Service đọc template** từ shipping line
5. **Điền đầy đủ thông tin** từ database
6. **Giữ nguyên định dạng** gốc (logo, kích thước, etc.)
7. **Trả về file Excel** hoàn chỉnh

## 📁 File Structure

```
DepotManager/backend/
├── modules/gate/service/
│   ├── GateService.ts (updated)
│   └── EnhancedEIRService.js (new)
├── uploads/
│   ├── shipping-lines-eir/ (templates)
│   └── generated-eir/ (output files)
└── test-enhanced-eir.js (test script)
```

## 🧪 Testing

### **Test Service trực tiếp:**
```bash
cd DepotManager/backend
node test-enhanced-eir.js
```

### **Test API endpoint:**
```bash
cd DepotManager/backend
node test-eir-api.js
```

### **Test từ Frontend:**
1. Truy cập `http://localhost:5002/LiftContainer`
2. Tìm container OO11
3. Click "In phiếu EIR"
4. Kiểm tra file được tải xuống

## ✅ Kết quả mong đợi

- **File EIR hoàn chỉnh** với tất cả thông tin
- **Giữ nguyên 100% định dạng** gốc
- **Logo và hình ảnh** được bảo toàn
- **Kích thước cột/hàng** chuẩn như template
- **Dữ liệu chính xác** từ database

## 🚀 Deployment

1. **Backend đã sẵn sàng** - không cần thay đổi gì thêm
2. **Frontend không cần thay đổi** - API endpoint giữ nguyên
3. **Database không cần migration** - sử dụng dữ liệu hiện có
4. **Templates EIR** đã có sẵn trong `uploads/shipping-lines-eir/`

## 🎉 Hoàn thành!

Enhanced EIR đã được tích hợp thành công vào hệ thống DepotManager. Tất cả chức năng in phiếu EIR trên các trang LiftContainer và LowerContainer giờ sẽ sử dụng logic mới với đầy đủ thông tin và định dạng hoàn chỉnh.

