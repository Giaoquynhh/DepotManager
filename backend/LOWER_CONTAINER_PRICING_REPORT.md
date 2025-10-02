# Báo Cáo Giá Tiền LowerContainer

## Tổng Quan
Báo cáo kiểm tra giá tiền của các container trong hệ thống LowerContainer (yêu cầu hạ container - IMPORT).

## 1. Bảng Giá Cơ Bản (PriceList)

### Dịch Vụ "Hạ" Container
| Mã Dịch Vụ | Tên Dịch Vụ | Giá (VND) |
|-------------|-------------|-----------|
| DV002 | Hạ container 40GP xuống bãi | 450.000 |
| DV010 | Lưu kho container rỗng | 80.000 |
| DV012 | Hạ container 20GP xuống sà lan | 320.000 |
| **Tổng** | **Giá cơ bản** | **850.000** |

## 2. Chi Tiết Các Container

### Container SA01 (GATE_OUT)
- **Request**: HA02102500005
- **Status**: GATE_OUT (Đã hoàn thành quy trình)
- **Customer**: Công ty CP Logistics Miền Trung (KH015)
- **Shipping Line**: Korea Marine Transport Co. (KMTU)
- **Container Type**: 40VH - 40' Ventilated Container

**Cấu Thành Giá:**
- Giá cơ bản: 850.000 VND
- Chi phí sửa chữa: 4.350.000 VND
- Chi phí seal: 0 VND
- **Tổng dự kiến: 5.200.000 VND**

### Container SM09 (PENDING)
- **Request**: HA02102500006
- **Status**: PENDING
- **Customer**: Công ty CP Logistics Miền Trung (KH015)
- **Shipping Line**: Korea Marine Transport Co. (KMTU)
- **Container Type**: 40VH - 40' Ventilated Container

**Cấu Thành Giá:**
- Giá cơ bản: 850.000 VND
- Chi phí sửa chữa: 0 VND
- Chi phí seal: 0 VND
- **Tổng dự kiến: 850.000 VND**

### Container mhgm3423 (PENDING)
- **Request**: HA02102500007
- **Status**: PENDING
- **Customer**: Công ty TNHH Thực phẩm Cầu Tre (KH014)
- **Shipping Line**: Hyundai Merchant Marine (HDMU)
- **Container Type**: 20VH - 20' Ventilated Container

**Cấu Thành Giá:**
- Giá cơ bản: 850.000 VND
- Chi phí sửa chữa: 0 VND
- Chi phí seal: 0 VND
- **Tổng dự kiến: 850.000 VND**

## 3. Thống Kê Tổng Quan

| Chỉ Số | Giá Trị |
|---------|---------|
| Tổng số yêu cầu IMPORT | 3 |
| Đã thanh toán | 0 |
| Chưa thanh toán | 3 |
| Tổng doanh thu đã thu | 0 VND |
| Tổng giá trị dự kiến | 6.900.000 VND |

## 4. Logic Tính Giá

### Công Thức Tính Giá
```
Tổng Giá = Giá Cơ Bản + Chi Phí Sửa Chữa + Chi Phí Seal
```

### Chi Tiết Các Thành Phần

#### 4.1 Giá Cơ Bản (PriceList)
- Lấy từ bảng `PriceList` với `type = 'Hạ'`
- Áp dụng cho tất cả yêu cầu IMPORT
- Hiện tại: 850.000 VND (cố định)

#### 4.2 Chi Phí Sửa Chữa (RepairCost)
- Lấy từ `RepairTicket` mới nhất của container
- Công thức: `estimated_cost + labor_cost`
- Chỉ áp dụng khi có RepairTicket

#### 4.3 Chi Phí Seal (SealCost)
- Lấy từ `SealUsageHistory` theo container hoặc booking
- Lấy `unit_price` từ bảng `Seal`
- Chỉ áp dụng khi có sử dụng seal

## 5. Trạng Thái Invoice

### Hiện Tại
- **Tất cả 3 container đều chưa có invoice**
- Cần tạo invoice để thu tiền

### Quy Trình Tạo Invoice
1. Khi ServiceRequest chuyển sang trạng thái cần thanh toán
2. Hệ thống tự động tạo invoice với:
   - Line items từ PriceList
   - Repair cost (nếu có)
   - Seal cost (nếu có)

## 6. Khuyến Nghị

### 6.1 Container SA01
- **Ưu tiên cao**: Có chi phí sửa chữa lớn (4.35M VND)
- Cần tạo invoice và thu tiền sớm
- Tổng giá trị: 5.200.000 VND

### 6.2 Container SM09 & mhgm3423
- Giá trị tiêu chuẩn: 850.000 VND mỗi container
- Có thể xử lý theo batch

### 6.3 Cải Thiện Hệ Thống
1. **Auto Invoice Generation**: Tự động tạo invoice khi status thay đổi
2. **Price Validation**: Kiểm tra giá trước khi tạo invoice
3. **Cost Tracking**: Theo dõi chi phí phát sinh realtime

## 7. Kết Luận

- **Tổng giá trị dự kiến**: 6.900.000 VND
- **Doanh thu chưa thu**: 6.900.000 VND (100%)
- **Container có chi phí cao nhất**: SA01 (5.200.000 VND)
- **Cần hành động**: Tạo invoice và thu tiền cho tất cả containers
