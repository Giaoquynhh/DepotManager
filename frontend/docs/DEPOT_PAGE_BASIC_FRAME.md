# Depot Page - Khung Cơ Bản với 2 Tabs

## Tổng quan

Page `/Requests/Depot` hiện tại có khung UI cơ bản với 2 tabs tương tự như page `/UsersPartners`, sẵn sàng để phát triển logic mới từ đầu.

## Tính năng mới: 2 Tabs với Request Types

### **Tab 1: Yêu cầu nâng container (Import Request)**
- Icon: 📦⬆️ (container + mũi tên lên)
- Loại request: `IMPORT`
- Mô tả: Quản lý các yêu cầu nhập khẩu container (nâng container từ xe vào bãi)
- Empty state: "Chưa có yêu cầu nâng container nào"
- Filter: Chỉ hiển thị Import Request

### **Tab 2: Yêu cầu hạ container (Export Request)**
- Icon: 📦⬇️ (container + mũi tên xuống)
- Loại request: `EXPORT`
- Mô tả: Quản lý các yêu cầu xuất khẩu container (hạ container từ bãi lên xe)
- Empty state: "Chưa có yêu cầu hạ container nào"
- Filter: Chỉ hiển thị Export Request

## Cấu trúc hiện tại

### File: `pages/Requests/Depot.tsx`

```typescript
import React from 'react';
import Header from '@components/Header';
import { useTranslation } from '../../hooks/useTranslation';
import { RequestTabNavigation, ImportRequest, ExportRequest } from './components';

type ActiveTab = 'lift' | 'lower';

export default function DepotRequests() {
    const { t } = useTranslation();
    const [localSearch, setLocalSearch] = React.useState('');
    const [localType, setLocalType] = React.useState('all');
    const [localStatus, setLocalStatus] = React.useState('all');
    const [activeTab, setActiveTab] = React.useState<ActiveTab>('lift');

    // Helper functions
    const getRequestType = (tab: ActiveTab) => {
        return tab === 'lift' ? 'IMPORT' : 'EXPORT';
    };

    const getRequestTypeLabel = (tab: ActiveTab) => {
        return tab === 'lift' ? 'Yêu cầu nâng container' : 'Yêu cầu hạ container';
    };

    const getRequestTypeDescription = (tab: ActiveTab) => {
        return tab === 'lift' 
            ? 'Quản lý các yêu cầu nhập khẩu container (nâng container từ xe vào bãi)'
            : 'Quản lý các yêu cầu xuất khẩu container (hạ container từ bãi lên xe)';
    };

    return (
        <>
            <Header />
            <main className="container depot-requests">
                {/* Header với title động */}
                <div className="page-header modern-header">
                    <h1>{getRequestTypeLabel(activeTab)}</h1>
                    <p>{getRequestTypeDescription(activeTab)}</p>
                    <button className="btn btn-success">
                        {activeTab === 'lift' ? 'Tạo yêu cầu nâng container' : 'Tạo yêu cầu hạ container'}
                    </button>
                </div>

                {/* Tab Navigation */}
                <RequestTabNavigation 
                    activeTab={activeTab} 
                    setActiveTab={setActiveTab} 
                />

                {/* Render component tương ứng */}
                {activeTab === 'lift' ? (
                    <ImportRequest
                        localSearch={localSearch}
                        setLocalSearch={setLocalSearch}
                        localType={localType}
                        setLocalType={setLocalType}
                        localStatus={localStatus}
                        setLocalStatus={setLocalStatus}
                    />
                ) : (
                    <ExportRequest
                        localSearch={localSearch}
                        setLocalSearch={setLocalSearch}
                        localType={localType}
                        setLocalType={setLocalType}
                        localStatus={localStatus}
                        setLocalStatus={setLocalStatus}
                    />
                )}
            </main>
        </>
    );
}
```

## Tính năng hiện có

### 1. **Header Section**
- **Tiêu đề động**: "Yêu cầu nâng container" hoặc "Yêu cầu hạ container" tùy theo tab
- **Mô tả động**: Mô tả chi tiết cho từng loại request
- **Button động**: "Tạo yêu cầu nâng container" hoặc "Tạo yêu cầu hạ container" (có chức năng mở modal)
- Gradient background với class `gradient-ultimate`

### 2. **Tab Navigation**
- **Tab 1**: "Yêu cầu nâng container" với icon 📦⬆️
- **Tab 2**: "Yêu cầu hạ container" với icon 📦⬇️
- Animation và hover effects
- Background indicator di chuyển theo tab được chọn

### 3. **Search & Filter Section** (riêng cho từng tab)
- **Search Input**: Tìm kiếm theo mã container
- **Type Filter**: Dropdown với options:
  - Tất cả loại
  - Yêu cầu nâng container (IMPORT) - chỉ hiển thị ở tab 1
  - Yêu cầu hạ container (EXPORT) - chỉ hiển thị ở tab 2
- **Status Filter**: Dropdown với các options:
  - Tất cả trạng thái
  - PENDING (Chờ xử lý)
  - SCHEDULED (Đã lên lịch)
  - IN_PROGRESS (Đang thực hiện)
  - COMPLETED (Hoàn thành)
  - CANCELLED (Đã hủy)

### 4. **Empty State** (riêng cho từng tab)
- **Tab 1**: Icon 📦⬆️, "Chưa có yêu cầu nâng container nào"
- **Tab 2**: Icon 📦⬇️, "Chưa có yêu cầu hạ container nào"
- Subtitle tương ứng cho từng loại request

### 5. **Create Request Modals** (Hoàn thành)

#### **Create Lift Request Modal** (Nâng container)
- **File**: `pages/Requests/components/CreateLiftRequestModal.tsx`
- **Trigger**: Click button "Tạo yêu cầu nâng container" ở tab "Yêu cầu nâng container"
- **Form Fields**:
  - **Required**: Hãng tàu, Số Booking/Bill, Loại container, Khách hàng
  - **Optional**: Số container, Nhà xe, Số xe, Tài xế, SĐT Tài xế, Thời gian hẹn, Chứng từ, Ghi chú
  - **Default**: Loại dịch vụ = "Nâng container" (readonly)
- **Data Integration**:
  - **Hãng tàu**: Dropdown với dữ liệu từ `setupService.getShippingLines()`
  - **Nhà xe**: Dropdown với dữ liệu từ `setupService.getTransportCompanies()`
  - **Loại container**: Dropdown với dữ liệu từ `setupService.getContainerTypes()`
  - **Display Format**: "Mã - Tên" trong dropdown, hiển thị tên đầy đủ bên dưới

#### **Create Lower Request Modal** (Hạ container)
- **File**: `pages/Requests/components/CreateLowerRequestModal.tsx`
- **Trigger**: Click button "Tạo yêu cầu hạ container" ở tab "Yêu cầu hạ container"
- **Form Fields**:
  - **Required**: Hãng tàu, Số container, Loại container, Khách hàng
  - **Optional**: Nhà xe, Số xe, Tài xế, SĐT Tài xế, Thời gian hẹn, Chứng từ, Ghi chú
  - **Default**: Loại dịch vụ = "Hạ container" (readonly)
- **Data Integration**:
  - **Hãng tàu**: Dropdown với dữ liệu từ `setupService.getShippingLines()`
  - **Nhà xe**: Dropdown với dữ liệu từ `setupService.getTransportCompanies()`
  - **Loại container**: Dropdown với dữ liệu từ `setupService.getContainerTypes()`
  - **Display Format**: "Mã - Tên" trong dropdown, hiển thị tên đầy đủ bên dưới

#### **Common Features**:
- **Form Layout**: 2 cột responsive, form fields được sắp xếp theo thứ tự logic
- **Validation**: 
  - Real-time validation cho các trường required
  - Error messages hiển thị dưới mỗi field
  - Styling đỏ cho input có lỗi
- **UI Features**:
  - Modal overlay với backdrop blur
  - Header với title và close button
  - Form 2 cột responsive (1 cột trên mobile)
  - Action buttons: Hủy (secondary), Tạo yêu cầu (primary)
- **Styling**: Inline styles để tránh CSS import conflicts

## Responsive Design

```css
@media (max-width: 768px) {
    body { 
        overflow-y: auto !important; 
        overflow-x: hidden !important; 
        -webkit-overflow-scrolling: touch; 
    }
    .container.depot-requests { 
        overflow: visible !important; 
        padding-bottom: 2rem; 
    }
}
```

## State Management

### **Local State:**
- `localSearch`: Chuỗi tìm kiếm
- `localType`: Loại request được chọn
- `localStatus`: Trạng thái được chọn
- `activeTab`: Tab hiện tại ('lift' | 'lower')

### **Helper Functions:**
- `getRequestType(tab)`: Trả về 'IMPORT' hoặc 'EXPORT' dựa trên tab
- `getRequestTypeLabel(tab)`: Trả về 'Yêu cầu nâng container' hoặc 'Yêu cầu hạ container'
- `getRequestTypeDescription(tab)`: Trả về mô tả chi tiết cho từng loại request

### **Component Structure:**

#### **Depot.tsx** (Component chính)
- Quản lý state chung cho toàn bộ page
- Render logic dựa trên `activeTab`
- Import và sử dụng các component con
- **Modal Integration**: 
  - State `isCreateModalOpen` để control modal visibility
  - Handler `handleCreateRequest()` để mở modal khi click button
  - Handler `handleSubmitLiftRequest()` để xử lý form submission
  - Conditional rendering của `CreateLiftRequestModal`

#### **RequestTabNavigation.tsx** (Tab Navigation)
- **Props**: `activeTab`, `setActiveTab`
- **Tính năng**: Animation, hover effects, responsive design
- **UI**: 2 tabs với background indicator di chuyển

#### **ImportRequest.tsx** (Import Request Handler)
- **Props**: `localSearch`, `setLocalSearch`, `localType`, `setLocalType`, `localStatus`, `setLocalStatus`
- **Tính năng**: Search, filter, empty state cho Import Request
- **UI**: Icon 📦⬆️, "Yêu cầu nâng container"

#### **ExportRequest.tsx** (Export Request Handler)
- **Props**: `localSearch`, `setLocalSearch`, `localType`, `setLocalType`, `localStatus`, `setLocalStatus`
- **Tính năng**: Search, filter, empty state cho Export Request
- **UI**: Icon 📦⬇️, "Yêu cầu hạ container"

#### **CreateLiftRequestModal.tsx** (Create Lift Request Modal)
- **File**: `pages/Requests/components/CreateLiftRequestModal.tsx`
- **Props**: `isOpen`, `onClose`, `onSubmit`
- **Tính năng**: Form tạo yêu cầu nâng container với validation real-time
- **UI**: Modal popup với form 2 cột, inline styles, responsive design
- **Fields**: 
  - **Required**: Hãng tàu, Số Booking/Bill, Loại container, Khách hàng
  - **Optional**: Số container, Nhà xe, Số xe, Tài xế, SĐT Tài xế, Thời gian hẹn, Chứng từ, Ghi chú
  - **Default**: Loại dịch vụ = "Nâng container" (readonly)
- **Data Integration**:
  - **Hãng tàu**: `setupService.getShippingLines()` - hiển thị "Mã - Tên", submit ID
  - **Nhà xe**: `setupService.getTransportCompanies()` - hiển thị "Mã - Tên", submit ID  
  - **Loại container**: `setupService.getContainerTypes()` - hiển thị "Mã - Mô tả", submit ID
- **Validation**: Real-time validation với error messages và styling
- **Styling**: Inline styles để tránh CSS import conflicts

#### **CreateLowerRequestModal.tsx** (Create Lower Request Modal)
- **File**: `pages/Requests/components/CreateLowerRequestModal.tsx`
- **Props**: `isOpen`, `onClose`, `onSubmit`
- **Tính năng**: Form tạo yêu cầu hạ container với validation real-time
- **UI**: Modal popup với form 2 cột, inline styles, responsive design
- **Fields**: 
  - **Required**: Hãng tàu, Số container, Loại container, Khách hàng
  - **Optional**: Nhà xe, Số xe, Tài xế, SĐT Tài xế, Thời gian hẹn, Chứng từ, Ghi chú
  - **Default**: Loại dịch vụ = "Hạ container" (readonly)
- **Data Integration**:
  - **Hãng tàu**: `setupService.getShippingLines()` - hiển thị "Mã - Tên", submit ID
  - **Nhà xe**: `setupService.getTransportCompanies()` - hiển thị "Mã - Tên", submit ID
  - **Loại container**: `setupService.getContainerTypes()` - hiển thị "Mã - Mô tả", submit ID
- **Validation**: Real-time validation với error messages và styling
- **Styling**: Inline styles để tránh CSS import conflicts
- **Form Layout** (CreateLiftRequestModal):
  ```typescript
  // Cột trái
  - Hãng tàu* (select dropdown - setupService.getShippingLines())
  - Số container (text input) 
  - Loại dịch vụ* (readonly input)
  - Nhà xe (select dropdown - setupService.getTransportCompanies())
  - Tài xế (text input)
  - Thời gian hẹn (datetime-local input)
  - Chứng từ (file input)
  
  // Cột phải  
  - Số Booking/Bill* (text input)
  - Loại container* (select dropdown - setupService.getContainerTypes())
  - Khách hàng* (text input)
  - Số xe (text input)
  - SĐT Tài xế (tel input)
  
  // Full width
  - Ghi chú (textarea)
  ```

- **Form Layout** (CreateLowerRequestModal):
  ```typescript
  // Cột trái
  - Hãng tàu* (select dropdown - setupService.getShippingLines())
  - Loại container* (select dropdown - setupService.getContainerTypes())
  - Khách hàng* (text input)
  - Nhà xe (select dropdown - setupService.getTransportCompanies())
  - Tài xế (text input)
  - Thời gian hẹn (datetime-local input)
  - Chứng từ (file input)
  
  // Cột phải  
  - Số container* (text input)
  - Loại dịch vụ* (readonly input)
  - Số xe (text input)
  - SĐT Tài xế (tel input)
  
  // Full width
  - Ghi chú (textarea)
  ```
- **Error Handling**: 
  - Required field validation
  - Real-time error clearing
  - Visual error indicators (red border, error messages)
- **TypeScript Interfaces**:
  ```typescript
  // Lift Request (Nâng container)
  interface LiftRequestData {
    shippingLine: string;        // Required
    bookingBill: string;         // Required  
    containerNumber?: string;    // Optional
    containerType: string;       // Required
    serviceType: string;         // Default: "Nâng container"
    customer: string;            // Required
    vehicleCompany?: string;     // Optional
    vehicleNumber?: string;      // Optional
    driver?: string;             // Optional
    driverPhone?: string;        // Optional
    appointmentTime?: string;    // Optional
    documents?: string;          // Optional
    notes?: string;              // Optional
  }

  // Lower Request (Hạ container)
  interface LowerRequestData {
    shippingLine: string;        // Required
    containerNumber: string;     // Required
    containerType: string;       // Required
    serviceType: string;         // Default: "Hạ container"
    customer: string;            // Required
    vehicleCompany?: string;     // Optional
    vehicleNumber?: string;      // Optional
    driver?: string;             // Optional
    driverPhone?: string;        // Optional
    appointmentTime?: string;    // Optional
    documents?: string;          // Optional
    notes?: string;              // Optional
  }
  ```

## Kế hoạch phát triển

### **Bước 1: Data Fetching**
- Tích hợp SWR để fetch dữ liệu từ API cho từng loại request (IMPORT/EXPORT)
- Implement loading states
- Error handling

### **Bước 2: Table Component**
- Tạo component hiển thị danh sách requests cho từng loại
- Implement pagination
- Sorting và filtering riêng cho Import/Export Request

### **Bước 3: Actions**
- Implement các actions cơ bản cho từng loại request
- State management với custom hooks
- API integration riêng cho Import/Export Request

### **Bước 4: Advanced Features**
- Real-time updates
- Chat integration
- Document management
- Workflow khác nhau cho Import/Export Request

## Cấu trúc thư mục

```
pages/Requests/
├── Depot.tsx (component chính với modal integration)
├── components/
│   ├── RequestTabNavigation.tsx (tab navigation với animation)
│   ├── ImportRequest.tsx (xử lý Import Request)
│   ├── ExportRequest.tsx (xử lý Export Request)
│   ├── CreateLiftRequestModal.tsx (modal tạo yêu cầu nâng container)
│   ├── CreateLowerRequestModal.tsx (modal tạo yêu cầu hạ container)
│   └── index.ts (export components và types)
└── (các hooks và utils sẽ được tạo mới)
```

## CSS Classes sử dụng

### **Depot.tsx & Components:**
- `.container.depot-requests`: Container chính
- `.page-header.modern-header`: Header section
- `.gate-search-section`: Search và filter section
- `.search-row`: Row chứa search và filters
- `.search-section`: Section chứa search input
- `.filter-group`: Group chứa filter dropdown
- `.gate-table-container`: Container cho table
- `.table-empty.modern-empty`: Empty state styling

### **CreateLiftRequestModal.tsx & CreateLowerRequestModal.tsx:**
- **Styling**: Inline styles (không sử dụng CSS classes)
- **Lý do**: Tránh CSS import conflicts trong Next.js
- **Features**: 
  - Modal overlay với backdrop blur
  - Form 2 cột responsive
  - Error states với red styling
  - Hover effects cho buttons
  - Animation cho modal appearance
  - Data integration với setupService
  - Dropdown với display format "Mã - Tên"
  - Real-time validation

---

## Trạng thái hiện tại

### ✅ **Đã hoàn thành:**
- **UI Framework**: 2 tabs với navigation animation
- **Modal System**: 
  - Create Lift Request Modal (nâng container)
  - Create Lower Request Modal (hạ container)
  - Đầy đủ form fields cho cả 2 loại request
- **Data Integration**: 
  - Hãng tàu: Dropdown với dữ liệu từ `setupService.getShippingLines()`
  - Nhà xe: Dropdown với dữ liệu từ `setupService.getTransportCompanies()`
  - Loại container: Dropdown với dữ liệu từ `setupService.getContainerTypes()`
  - Display format: "Mã - Tên" trong dropdown, hiển thị tên đầy đủ bên dưới
- **Validation**: Real-time validation cho required fields
- **Responsive Design**: Mobile-friendly layout
- **TypeScript**: Type-safe interfaces và props cho cả 2 modals
- **Error Handling**: User-friendly error messages
- **Form Layout**: 2 cột responsive với sắp xếp fields logic

### 🚧 **Đang phát triển:**
- **API Integration**: Submit form data to backend cho cả 2 loại request
- **Data Fetching**: Load existing requests và hiển thị trong table

### 📋 **Sẵn sàng cho:**
- Backend API development
- Database schema design
- Advanced features (drag-drop, real-time updates)
- Testing và deployment

**Lưu ý:** Page này đã có đầy đủ UI framework và sẵn sàng để tích hợp backend logic.
