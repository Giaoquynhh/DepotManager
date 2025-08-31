# Gate Dashboard Update - Thêm tính năng GATE_OUT

## 🎯 Tổng quan

Tài liệu này mô tả việc cập nhật Gate Dashboard để hiển thị và xử lý các container có trạng thái `IN_YARD` và `IN_CAR`, cho phép chuyển chúng sang trạng thái `GATE_OUT` khi xe rời kho.

## 🔄 Tính năng mới: GATE_OUT

### **Ý nghĩa nghiệp vụ**
- **IN_YARD**: Container đã được đặt trong bãi (Import request) - xe sẽ ra cổng để về
- **IN_CAR**: Container đã được đặt lên xe (Export request) - xe sẽ ra cổng để về
- **GATE_OUT**: Xe đã rời kho thành công

### **Workflow mới**
```
1. Import Request: IN_YARD → GATE_OUT (Xe rời kho sau khi đặt container)
2. Export Request: IN_CAR → GATE_OUT (Xe rời kho sau khi lấy container)
```

## 🏗️ Thay đổi kỹ thuật

### **1. Frontend Updates**

#### **GateDashboard.tsx**
- Thêm filter `statuses` để lấy requests có trạng thái `IN_YARD` và `IN_CAR`
- Default: Hiển thị tất cả requests có trạng thái `IN_YARD,IN_CAR`

#### **GateSearchBar.tsx**
- Thêm options cho trạng thái `IN_YARD` và `IN_CAR` trong dropdown filter
- Hiển thị mô tả rõ ràng: "IN_YARD (Import - Đã ở bãi)", "IN_CAR (Export - Đã lên xe)"

#### **GateRequestTable.tsx**
- Hiển thị danh sách container có trạng thái `IN_YARD` và `IN_CAR`
- Hiển thị thông tin: Container, Loại, Trạng thái, ETA, Tên tài xế, Biển số xe, Chứng từ

#### **GateActionButtons.tsx**
- Thêm action button `GATE_OUT - Xe rời kho` cho các trạng thái `IN_YARD` và `IN_CAR`
- Button có màu xanh lá (`action-btn-success`) để phân biệt với các action khác
- Hiển thị text mô tả rõ ràng cho từng trạng thái

### **2. Backend Updates**

#### **GateService.ts**
- Thêm method `gateOut()` để xử lý việc chuyển trạng thái sang `GATE_OUT`
- Validation: Chỉ cho phép chuyển từ `IN_YARD` hoặc `IN_CAR`
- Cập nhật `history` với thông tin `gate_out`
- Ghi audit log tự động

#### **GateController.ts**
- Thêm method `gateOut()` để xử lý endpoint `/gate/requests/:id/gate-out`
- Response message rõ ràng: "Đã chuyển trạng thái sang GATE_OUT - Xe rời kho thành công"

#### **GateRoutes.ts**
- Thêm route `PATCH /gate/requests/:id/gate-out`
- Role requirement: `YardManager`, `SaleAdmin`

#### **GateDtos.ts**
- Cập nhật `gateSearchSchema` để hỗ trợ `statuses` (comma-separated)
- Thêm validation cho trạng thái `IN_YARD` và `IN_CAR`
- Cập nhật `GateSearchParams` interface

### **3. API Endpoints**

#### **Search Requests với statuses**
```http
GET /gate/requests/search?statuses=IN_YARD,IN_CAR
```

#### **Gate OUT**
```http
PATCH /gate/requests/:id/gate-out
Authorization: Bearer <token>
Role: YardManager, SaleAdmin
```

## 🚀 Quy trình hoạt động

### **1. Hiển thị danh sách container**
- Gate Dashboard tự động fetch requests có trạng thái `IN_YARD` và `IN_CAR`
- Hiển thị thông tin đầy đủ: container, loại, trạng thái, tài xế, biển số xe
- Có thể filter theo trạng thái cụ thể hoặc loại request

### **2. Action GATE_OUT**
- Người dùng click button "GATE_OUT - Xe rời kho"
- Hệ thống validate trạng thái hiện tại
- Chuyển trạng thái sang `GATE_OUT`
- Ghi audit log và cập nhật history
- Hiển thị thông báo thành công

### **3. Kết quả**
- Container được đánh dấu là đã rời kho
- Có thể sử dụng để thống kê và báo cáo
- Audit trail đầy đủ cho compliance

## 🎯 Business Logic

### **Khi nào sử dụng GATE_OUT:**
- **Import requests**: Sau khi container đã được đặt trong bãi và xe rời kho
- **Export requests**: Sau khi container đã lên xe và xe rời kho

### **Validation rules:**
- Chỉ cho phép chuyển từ `IN_YARD` hoặc `IN_CAR`
- Không cho phép chuyển từ các trạng thái khác
- Role requirement: `YardManager` hoặc `SaleAdmin`

## 📊 Tác động hệ thống

### **Frontend:**
- Gate Dashboard hiển thị thêm các container `IN_YARD` và `IN_CAR`
- Action button `GATE_OUT` cho phép xử lý xe rời kho
- Filter options mở rộng để hỗ trợ các trạng thái mới

### **Backend:**
- API endpoint mới cho GATE_OUT
- Validation logic cho trạng thái chuyển đổi
- Audit logging tự động
- History tracking đầy đủ

## 🔧 Testing

### **Test Cases:**
1. **Search với statuses**: `?statuses=IN_YARD,IN_CAR` ✅
2. **Gate OUT từ IN_YARD**: Import request → GATE_OUT ✅
3. **Gate OUT từ IN_CAR**: Export request → GATE_OUT ✅
4. **Invalid transitions**: Không cho phép chuyển từ trạng thái khác ✅
5. **Role permissions**: Chỉ YardManager và SaleAdmin có thể thực hiện ✅

## 📚 Tài liệu liên quan

- [GATE_OUT_STATUS_UPDATE.md](./GATE_OUT_STATUS_UPDATE.md) - Thêm trạng thái GATE_OUT
- [REQUEST_STATE_MACHINE_IMPLEMENTATION.md](./REQUEST_STATE_MACHINE_IMPLEMENTATION.md) - State Machine
- [MODULE_4_GATE.md](./MODULE_4_GATE.md) - Module Gate

## 🚀 Future Enhancements

### **Có thể mở rộng:**
- Thêm confirmation dialog trước khi GATE_OUT
- Thêm lý do GATE_OUT (nếu cần)
- Thêm timestamp và location tracking
- Thêm notification cho các bên liên quan
- Thêm báo cáo thống kê xe rời kho theo ngày/tháng
