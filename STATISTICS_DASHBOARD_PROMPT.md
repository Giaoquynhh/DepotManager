Y# 📊 PROMPT HOÀN CHỈNH: Tạo Statistics Dashboard

## 📋 **Tổng quan dự án**

Tạo một **Statistics Dashboard** (Dashboard thống kê tổng quan) cho hệ thống Container Management, hiển thị các chỉ số thống kê quan trọng về container, khách hàng, sửa chữa, tài chính và vận hành. Dashboard này sẽ phù hợp với tất cả các role trong hệ thống (trừ Partner, Driver, Security).

## 🎨 **Thiết kế giao diện**

### **Layout tổng thể:**
```
┌─────────────────────────────────────────────────────────┐
│                    HEADER                               │
│  📊 Thống kê tổng quan    [Hôm nay▼] [Export] [Refresh] │
├─────────────────────────────────────────────────────────┤
│  QUICK STATS (4 cards ngang)                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │Container│ │Khách hàng│ │Doanh thu│ │Sửa chữa│      │
│  │   1,234 │ │    45   │ │ 2.5M VND│ │   89   │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
├─────────────────────────────────────────────────────────┤
│  MAIN CONTENT (2 cột)                                  │
│  ┌─────────────────┐ ┌─────────────────┐              │
│  │ Container Status│ │ Financial Overview│              │
│  │     Chart       │ │                 │              │
│  │                 │ │                 │              │
│  ├─────────────────┤ ├─────────────────┤              │
│  │ Customer Stats  │ │ Maintenance     │              │
│  │                 │ │ Summary         │              │
│  └─────────────────┘ └─────────────────┘              │
├─────────────────────────────────────────────────────────┤
│  BOTTOM TABLES (3 bảng)                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │Recent Act.  │ │Top Customers│ │Pending Rep.│      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘
```

## 📈 **Các chỉ số thống kê cần hiển thị**

### **1. Container Statistics**
- **Tổng số container**: 1,234
- **Container theo trạng thái**: 
  - PENDING: 45
  - SCHEDULED: 23
  - GATE_IN: 12
  - IN_YARD: 156
  - IN_CAR: 8
  - GATE_OUT: 34
  - COMPLETED: 956
- **Container theo loại**:
  - IMPORT: 789
  - EXPORT: 445
- **Container hôm nay**: 67
- **Container tuần này**: 234
- **Container tháng này**: 1,123

### **2. Customer Statistics**
- **Tổng số khách hàng**: 45
- **Khách hàng hoạt động**: 38
- **Khách hàng mới tháng này**: 3
- **Top 5 khách hàng**:
  1. Công ty A - 234 requests - 15.2M VND
  2. Công ty B - 189 requests - 12.8M VND
  3. Công ty C - 156 requests - 9.5M VND
  4. Công ty D - 134 requests - 8.2M VND
  5. Công ty E - 98 requests - 6.1M VND

### **3. Maintenance Statistics**
- **Tổng số phiếu sửa chữa**: 89
- **Phiếu theo trạng thái**:
  - PENDING: 12
  - APPROVED: 23
  - IN_PROGRESS: 15
  - COMPLETED: 35
  - CANCELLED: 4
- **Thời gian sửa chữa trung bình**: 2.5 ngày
- **Tổng chi phí sửa chữa**: 45.2M VND
- **Vấn đề thường gặp**:
  1. Hư hỏng cửa container - 23 lần
  2. Lỗi khóa container - 18 lần
  3. Hư hỏng đáy container - 15 lần

### **4. Financial Statistics**
- **Tổng doanh thu**: 125.6M VND
- **Doanh thu tháng này**: 23.4M VND
- **Doanh thu năm này**: 125.6M VND
- **Thanh toán chưa thu**: 8.9M VND
- **Thanh toán quá hạn**: 2.1M VND
- **Giá trị hóa đơn trung bình**: 1.2M VND
- **Doanh thu theo dịch vụ**:
  - Phí nâng/hạ: 45.2M VND
  - Phí lưu kho: 32.1M VND
  - Phí sửa chữa: 28.3M VND
  - Phí khác: 20.0M VND

### **5. Operational Statistics**
- **Gate In/Out hôm nay**:
  - Gate In: 34
  - Gate Out: 28
- **Tỷ lệ sử dụng xe nâng**: 78%
- **Tỷ lệ sử dụng bãi**: 65%
- **Thời gian xử lý trung bình**: 1.2 ngày
- **Tỷ lệ hoàn thành**: 94%

## 🏗️ **Cấu trúc file cần tạo**

### **Backend:**
```
manageContainer/backend/modules/statistics/
├── controller/
│   ├── StatisticsController.ts
│   └── StatisticsRoutes.ts
├── service/
│   └── StatisticsService.ts
├── dto/
│   └── StatisticsDtos.ts
└── README.md
```

### **Frontend:**
```
manageContainer/frontend/
├── pages/
│   └── Statistics/
│       └── index.tsx
├── components/statistics/
│   ├── StatisticsDashboard.tsx
│   ├── StatCard.tsx
│   ├── ContainerStatusChart.tsx
│   ├── CustomerStatsCard.tsx
│   ├── FinancialOverview.tsx
│   ├── MaintenanceSummary.tsx
│   ├── RecentActivities.tsx
│   ├── TopCustomers.tsx
│   └── PendingRepairs.tsx
├── services/
│   └── statistics.ts
└── styles/
    └── statistics.css
```

## 🔐 **Phân quyền theo role**

| Role | Quyền xem | Ghi chú |
|------|-----------|---------|
| **SystemAdmin, BusinessAdmin** | ✅ Tất cả thống kê | Xem toàn bộ hệ thống |
| **SaleAdmin, YardManager** | ✅ Container + Customer + Operational | Không xem Financial |
| **Accountant** | ✅ Tất cả thống kê | Xem toàn bộ + Export |
| **MaintenanceManager** | ✅ Container + Maintenance + Operational | Chuyên về bảo trì |
| **CustomerAdmin, CustomerUser** | ⚠️ Chỉ thống kê công ty mình | Hạn chế theo company |
| **PartnerAdmin, Driver, Security** | ❌ Không cần | Không cần dashboard |

## 🎯 **Tính năng chính**

### **1. Quick Stats (4 cards ngang)**
- Container tổng
- Khách hàng
- Doanh thu tháng
- Sửa chữa

### **2. Container Status Chart**
- Biểu đồ tròn hiển thị container theo trạng thái
- Màu sắc phân biệt: PENDING (vàng), IN_PROGRESS (xanh), COMPLETED (xanh lá)

### **3. Customer Stats Card**
- Tổng khách hàng
- Khách hàng mới tháng này
- Top 3 khách hàng

### **4. Financial Overview**
- Doanh thu tháng này
- Thanh toán chưa thu
- Biểu đồ doanh thu theo dịch vụ

### **5. Maintenance Summary**
- Tổng phiếu sửa chữa
- Thời gian sửa chữa trung bình
- Vấn đề thường gặp

### **6. Bottom Tables**
- **Recent Activities**: Hoạt động gần đây
- **Top Customers**: Top khách hàng
- **Pending Repairs**: Phiếu sửa chữa chờ xử lý

## 📱 **Responsive Design**

- **Desktop**: Layout 2 cột, hiển thị đầy đủ
- **Tablet**: Layout 1 cột, cards xếp chồng
- **Mobile**: Cards nhỏ gọn, scroll dọc

## 🚀 **API Endpoints cần tạo**

```typescript
// Backend API
GET /statistics/overview?timeRange=today|week|month|year
GET /statistics/containers?timeRange=today|week|month|year
GET /statistics/customers?timeRange=today|week|month|year
GET /statistics/maintenance?timeRange=today|week|month|year
GET /statistics/financial?timeRange=today|week|month|year
GET /statistics/operational?timeRange=today|week|month|year
```

## 🎨 **Styling**

- Sử dụng CSS Grid và Flexbox
- Màu sắc nhất quán với hệ thống hiện tại
- Icons từ Heroicons hoặc Lucide
- Animations nhẹ nhàng
- Dark mode support

## 📊 **Data Sources**

- **Container data**: Từ `ServiceRequest` table
- **Customer data**: Từ `Customer` table
- **Maintenance data**: Từ `RepairTicket` table
- **Financial data**: Từ `Invoice` table
- **Operational data**: Từ `YardPlacement`, `ForkliftJob` tables

## 🔄 **Real-time Updates**

- Sử dụng WebSocket để cập nhật real-time
- Auto-refresh mỗi 30 giây
- Manual refresh button
- Loading states

## 📤 **Export Features**

- Export Excel cho các role có quyền
- Export PDF cho báo cáo
- Filter theo thời gian
- Custom date range

## 🛠️ **Implementation Steps**

### **Bước 1: Backend Development**
1. Tạo module `statistics` trong backend
2. Implement các API endpoints
3. Tích hợp với database queries
4. Thêm authentication và authorization

### **Bước 2: Frontend Development**
1. Tạo trang `Statistics` mới
2. Implement các components
3. Tích hợp với API
4. Responsive design

### **Bước 3: Integration & Testing**
1. Tích hợp với hệ thống phân quyền
2. Test trên các role khác nhau
3. Performance optimization
4. User acceptance testing

## 📝 **Technical Requirements**

### **Backend Technologies:**
- Node.js + TypeScript
- Prisma ORM
- PostgreSQL
- Express.js

### **Frontend Technologies:**
- Next.js + TypeScript
- React Hooks
- CSS Grid/Flexbox
- Chart.js hoặc Recharts

### **Database Queries:**
- Aggregate functions cho thống kê
- JOIN queries cho data liên quan
- Indexing cho performance
- Caching cho real-time data

## 🎯 **Success Criteria**

1. ✅ Dashboard load trong < 2 giây
2. ✅ Real-time updates hoạt động
3. ✅ Responsive trên tất cả devices
4. ✅ Phân quyền chính xác theo role
5. ✅ Export data thành công
6. ✅ UI/UX nhất quán với hệ thống

---

**Ngày tạo:** 2024-12-19  
**Phiên bản:** 1.0  
**Tác giả:** Development Team  
**Trạng thái:** 📋 Ready for Implementation
