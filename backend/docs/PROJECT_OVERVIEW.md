# PROJECT OVERVIEW - Container Management System

## Tổng quan dự án
Hệ thống quản lý container toàn diện với các module chính: Auth, Requests, Gate, Yard, Forklift, Maintenance, Finance, Reports và Chat. Hệ thống đã được cập nhật với **Request State Machine** và **logic phân biệt IMPORT/EXPORT** để quản lý workflow trạng thái một cách nhất quán.

## 🚀 Tính năng mới: Phân biệt IMPORT/EXPORT với trạng thái IN_CAR

### **Workflow mới với trạng thái IN_CAR**

#### 1. **Import Request Workflow (Giữ nguyên):**
```
1. CHECKED → POSITIONED (Yard confirm)
2. POSITIONED → FORKLIFTING (Driver click "Bắt đầu")
3. FORKLIFTING → IN_YARD (Forklift approval)
```

#### 2. **Export Request Workflow (MỚI):**
```
1. GATE_IN → FORKLIFTING (Driver click "Bắt đầu")
2. FORKLIFTING → IN_CAR (Forklift approval) ⭐ MỚI
3. Container tự động ẩn khỏi Yard và ContainersPage
```

### **Logic mới khi approve forklift job:**
- **IMPORT requests**: `FORKLIFTING` → `IN_YARD` (giữ nguyên logic cũ)
- **EXPORT requests**: `FORKLIFTING` → `IN_CAR` (logic mới)

### **Ẩn container IN_CAR:**
- Container có trạng thái `IN_CAR` sẽ tự động ẩn khỏi:
  - `http://localhost:5002/Yard` - Không hiển thị trong bản đồ bãi
  - `http://localhost:5002/ContainersPage` - Không hiển thị trong danh sách container

## 🔐 Tính năng mới: ViewQuote cho RepairTicket (v2025-09-09)

### **Mô tả**
Tính năng `viewquote` kiểm soát quyền xem hóa đơn sửa chữa ở các trang khác nhau trong hệ thống.

### **Luồng hoạt động**
```
1. Maintenance/Repairs (viewquote = 0)
   ↓ Click "Gửi yêu cầu xác nhận"
2. Depot có thể xem hóa đơn (viewquote = 1)
   ↓ Click "Gửi xác nhận"
3. Customer có thể xem hóa đơn và quyết định (viewquote = 2)
```

### **Các giá trị viewquote**
- **`viewquote = 0`**: Chỉ Maintenance/Repairs xem được hóa đơn
- **`viewquote = 1`**: Depot có thể xem hóa đơn và gửi xác nhận
- **`viewquote = 2`**: Customer có thể xem hóa đơn và quyết định (chấp nhận/từ chối)

### **API Endpoints mới**
- `POST /maintenance/repairs/:id/confirmation-request` - Gửi yêu cầu xác nhận
- `POST /requests/:id/send-customer-confirmation` - Gửi xác nhận cho khách hàng

## 🏗️ Kiến trúc hệ thống

### **Backend Architecture:**
```
manageContainer/backend/
├── modules/
│   ├── auth/           # Xác thực và phân quyền
│   ├── requests/       # Quản lý yêu cầu dịch vụ + State Machine
│   ├── gate/           # Quản lý cổng ra/vào
│   ├── yard/           # Quản lý bãi container + Lọc bỏ container IN_CAR
│   ├── forklift/       # Quản lý xe nâng + Logic phân biệt IMPORT/EXPORT
│   ├── maintenance/    # Quản lý bảo trì
│   ├── finance/        # Quản lý tài chính
│   ├── reports/        # Báo cáo và thống kê
│   └── chat/           # Hệ thống chat
├── shared/
│   ├── config/         # Cấu hình database và app
│   ├── middlewares/    # Middleware chung
│   └── utils/          # Utility functions
└── prisma/             # Database schema và migrations
```

### **Frontend Architecture:**
```
manageContainer/frontend/
├── pages/
│   ├── Requests/       # Quản lý yêu cầu dịch vụ
│   ├── Yard/           # Quản lý bãi container + Ẩn container IN_CAR
│   ├── Forklift/       # Quản lý xe nâng + Hiển thị trạng thái mới
│   ├── ContainersPage/ # Danh sách container + Logic ẩn container IN_CAR
│   └── ...             # Các trang khác
├── components/
│   ├── RequestTable.tsx        # Hiển thị trạng thái IN_CAR
│   ├── DepotRequestTable.tsx   # Hiển thị trạng thái IN_CAR
│   ├── SimpleChatBox.tsx       # Hiển thị trạng thái IN_CAR
│   └── ...                     # Các component khác
└── services/            # API calls
```

## 📊 Module Overview

### **1. MODULE 2: AUTH** ✅
- **File:** `docs/MODULE_2_AUTH.md`
- **Chức năng:** Xác thực, phân quyền, quản lý user/partner
- **Trạng thái:** Hoàn thành

### **2. MODULE 3: REQUESTS** ✅ + 🆕
- **File:** `docs/MODULE_3_REQUESTS.md`
- **Chức năng:** Quản lý yêu cầu dịch vụ với State Machine
- **Tính năng mới:** 
  - Logic phân biệt IMPORT/EXPORT khi approve forklift job
  - Trạng thái IN_CAR cho container đã lên xe
  - Ẩn container IN_CAR khỏi Yard và ContainersPage
- **Trạng thái:** Hoàn thành + Tính năng mới

### **3. MODULE 4: GATE** ✅
- **File:** `docs/MODULE_4_GATE.md`
- **Chức năng:** Quản lý cổng ra/vào container
- **Trạng thái:** Hoàn thành

### **4. MODULE 4: YARD** ✅ + 🆕
- **File:** `docs/MODULE_4_YARD.md`
- **Chức năng:** Quản lý bãi container, xếp chỗ, stacking
- **Tính năng mới:** 
  - Lọc bỏ container IN_CAR khỏi yard operations
  - Không hiển thị container IN_CAR trong bản đồ bãi
- **Trạng thái:** Hoàn thành + Tính năng mới

### **5. MODULE 5: ContainerManager** ✅
- **File:** `docs/MODULE_5_ContainerManager.md`
- **Chức năng:** Quản lý container, kiểm tra, sửa chữa
- **Trạng thái:** Hoàn thành

### **6. MODULE 6: MAINTENANCE** ✅
- **File:** `docs/MAINTENANCE_MODULE.md`
- **Chức năng:** Quản lý bảo trì container
- **Trạng thái:** Hoàn thành

### **7. MODULE 7: FINANCE** ✅
- **File:** `docs/MODULE_7_FINANCE.md`
- **Chức năng:** Quản lý tài chính, hóa đơn, thanh toán
- **Trạng thái:** Hoàn thành

### **8. MODULE 8: REPORTS** ✅
- **File:** `docs/MODULE_8_REPORTS.md`
- **Chức năng:** Báo cáo và thống kê
- **Trạng thái:** Hoàn thành

### **9. CHAT SYSTEM** ✅
- **File:** `docs/CHAT_SYSTEM.md`
- **Chức năng:** Hệ thống chat real-time
- **Trạng thái:** Hoàn thành

## 🔄 Workflow Integration

### **Container Yard Workflow Integration mới:**

#### **Import Request Workflow:**
```
1. CHECKED → POSITIONED (Yard confirm)
2. POSITIONED → FORKLIFTING (Driver click "Bắt đầu")
3. FORKLIFTING → IN_YARD (Forklift approval)
```

#### **Export Request Workflow (MỚI):**
```
1. GATE_IN → FORKLIFTING (Driver click "Bắt đầu")
2. FORKLIFTING → IN_CAR (Forklift approval) ⭐ MỚI
3. Container tự động ẩn khỏi Yard và ContainersPage
```

### **State Machine Integration:**
- **RequestStateMachine** quản lý tất cả transitions
- **Phân biệt IMPORT/EXPORT** khi approve forklift job
- **Tự động ẩn container IN_CAR** khỏi giao diện quản lý bãi

## 🎯 Business Logic mới

### **Khi approve forklift job:**
- **IMPORT requests**: Container được đặt vào vị trí trong bãi → Hiển thị trong Yard và ContainersPage
- **EXPORT requests**: Container được đặt lên xe → Tự động ẩn khỏi Yard và ContainersPage

### **Lý do logic mới:**
- Container EXPORT đã lên xe không còn ở depot
- Cần ẩn khỏi giao diện quản lý bãi
- Logic phân biệt rõ ràng giữa nhập và xuất

## 🔧 Technical Implementation

### **Backend Changes:**
1. **ForkliftController.approveJob()**: Logic phân biệt IMPORT/EXPORT
2. **RequestStateMachine**: Thêm trạng thái IN_CAR và transitions
3. **YardService**: Lọc bỏ container IN_CAR khỏi yard operations

### **Frontend Changes:**
1. **ContainersPage**: Logic ẩn container IN_CAR
2. **Status Display**: Thêm hiển thị cho trạng thái IN_CAR
3. **Filter Options**: Loại bỏ option IN_CAR (vì không hiển thị)

## 📈 Performance Impact

### **Database Queries:**
- Thêm filter để loại bỏ container IN_CAR trong yard operations
- Không ảnh hưởng đến performance vì chỉ filter thêm điều kiện

### **Frontend Rendering:**
- Container IN_CAR được ẩn hoàn toàn
- Giảm số lượng item hiển thị
- Cải thiện UX cho người dùng

## 🚀 Future Enhancements

### **Short-term:**
- [ ] Add export status tracking cho container IN_CAR
- [ ] Implement container departure workflow
- [ ] Add notifications khi container chuyển sang IN_CAR

### **Long-term:**
- [ ] Add workflow engine cho complex business rules
- [ ] Implement state machine visualization
- [ ] Add bulk operations cho Depot
- [ ] Implement auto-completion rules

## 📝 Documentation Files

### **Core Documentation:**
- `PROJECT_OVERVIEW.md` - This file (Tổng quan dự án)
- `README.md` - Hướng dẫn sử dụng chung

### **Module Documentation:**
- `MODULE_2_AUTH.md` - Xác thực và phân quyền
- `MODULE_3_REQUESTS.md` - Quản lý yêu cầu dịch vụ + State Machine
- `MODULE_4_GATE.md` - Quản lý cổng ra/vào
- `MODULE_4_YARD.md` - Quản lý bãi container
- `MODULE_5_ContainerManager.md` - Quản lý container
- `MAINTENANCE_MODULE.md` - Quản lý bảo trì
- `MODULE_7_FINANCE.md` - Quản lý tài chính
- `MODULE_8_REPORTS.md` - Báo cáo và thống kê

### **Feature Documentation:**
- `CHAT_SYSTEM.md` - Hệ thống chat
- `FORKLIFT_STATUS_UPDATE.md` - Cập nhật trạng thái forklift + Logic mới
- `REQUEST_STATE_MACHINE_IMPLEMENTATION.md` - Implementation State Machine + Logic mới
- `FORKLIFT_ACTION_MAPPING.md` - Mapping hành động forklift
- `FORKLIFT_ISSUE_ANALYSIS.md` - Phân tích vấn đề forklift

## 🔗 Related Files

### **Backend Implementation:**
- `modules/forklift/controller/ForkliftController.ts` - Logic approve job mới
- `modules/requests/service/RequestStateMachine.ts` - Thêm trạng thái IN_CAR
- `modules/yard/service/YardService.ts` - Lọc bỏ container IN_CAR

### **Frontend Implementation:**
- `pages/Forklift/index.tsx` - Hiển thị trạng thái mới
- `pages/ContainersPage/index.tsx` - Ẩn container IN_CAR
- `components/RequestTable.tsx` - Hiển thị trạng thái IN_CAR
- `components/DepotRequestTable.tsx` - Hiển thị trạng thái IN_CAR
- `components/SimpleChatBox.tsx` - Hiển thị trạng thái IN_CAR

---

**Ngày tạo:** 2024-08-16  
**Phiên bản:** 4.0.0 - Container Yard Workflow Integration + Logic phân biệt IMPORT/EXPORT  
**Tác giả:** Development Team  
**Trạng thái:** ✅ Hoàn thành implementation và debug + Container Yard Workflow + Logic phân biệt IMPORT/EXPORT + Ẩn container IN_CAR
