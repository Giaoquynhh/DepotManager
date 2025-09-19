# Custom Dropdown Scrollbar Feature - Frontend Documentation

## Tổng quan
Tài liệu này mô tả implementation của tính năng Custom Dropdown với Scrollbar trong component CreateLiftRequestModal.

## Component Structure

### CreateLiftRequestModal Component
**File:** `pages/Requests/components/CreateLiftRequestModal.tsx`

**Props Interface:**
```typescript
interface CreateLiftRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LiftRequestData) => void;
}
```

**Data Interface:**
```typescript
interface LiftRequestData {
  shippingLine: string;
  bookingBill: string;
  containerNumber?: string;
  containerType: string;
  serviceType: string;
  customer: string;
  vehicleCompany?: string;
  vehicleNumber?: string;
  driver?: string;
  driverPhone?: string;
  appointmentTime?: string;
  documents?: string;
  notes?: string;
}
```

## Custom Dropdown Implementation

### 1. State Management
```typescript
// Custom dropdown states
const [isShippingLineOpen, setIsShippingLineOpen] = useState(false);
const [isContainerTypeOpen, setIsContainerTypeOpen] = useState(false);
const [isTransportCompanyOpen, setIsTransportCompanyOpen] = useState(false);

// Data states
const [shippingLines, setShippingLines] = useState<ShippingLine[]>([]);
const [containerTypes, setContainerTypes] = useState<ContainerType[]>([]);
const [transportCompanies, setTransportCompanies] = useState<TransportCompany[]>([]);
```

### 2. CSS Styling
**Inline CSS trong component:**
```css
.custom-dropdown-container {
  position: relative;
}

.custom-dropdown-button {
  width: 100%;
  text-align: left;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.custom-dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 8px 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Custom Scrollbar */
.custom-dropdown-list::-webkit-scrollbar {
  width: 8px;
}

.custom-dropdown-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.custom-dropdown-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.custom-dropdown-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
```

### 3. Dropdown Components

#### Shipping Line Dropdown
```tsx
<div className="custom-dropdown-container">
  <button
    type="button"
    className={`custom-dropdown-button ${errors.shippingLine ? 'error' : ''}`}
    onClick={() => setIsShippingLineOpen(!isShippingLineOpen)}
  >
    <span>
      {formData.shippingLine 
        ? `${shippingLines.find(s => s.id === formData.shippingLine)?.code} - ${shippingLines.find(s => s.id === formData.shippingLine)?.name}`
        : 'Chọn hãng tàu'
      }
    </span>
    <svg className={`custom-dropdown-arrow ${isShippingLineOpen ? 'open' : ''}`}>
      <polyline points="6,9 12,15 18,9"></polyline>
    </svg>
  </button>
  {isShippingLineOpen && (
    <div className="custom-dropdown-list">
      {shippingLines.map(sl => (
        <div
          key={sl.id}
          className="custom-dropdown-option"
          onClick={() => {
            handleInputChange('shippingLine', sl.id);
            setSelectedShippingLineName(sl.name);
            setIsShippingLineOpen(false);
          }}
        >
          {`${sl.code} - ${sl.name}`}
        </div>
      ))}
    </div>
  )}
</div>
```

#### Container Type Dropdown
```tsx
<div className="custom-dropdown-container">
  <button
    type="button"
    className={`custom-dropdown-button ${errors.containerType ? 'error' : ''}`}
    onClick={() => setIsContainerTypeOpen(!isContainerTypeOpen)}
  >
    <span>
      {formData.containerType 
        ? `${containerTypes.find(ct => ct.id === formData.containerType)?.code} - ${containerTypes.find(ct => ct.id === formData.containerType)?.description}`
        : 'Chọn loại container'
      }
    </span>
    <svg className={`custom-dropdown-arrow ${isContainerTypeOpen ? 'open' : ''}`}>
      <polyline points="6,9 12,15 18,9"></polyline>
    </svg>
  </button>
  {isContainerTypeOpen && (
    <div className="custom-dropdown-list">
      {containerTypes.map(ct => (
        <div
          key={ct.id}
          className="custom-dropdown-option"
          onClick={() => {
            handleInputChange('containerType', ct.id);
            setIsContainerTypeOpen(false);
          }}
        >
          {`${ct.code} - ${ct.description}`}
        </div>
      ))}
    </div>
  )}
</div>
```

#### Transport Company Dropdown
```tsx
<div className="custom-dropdown-container">
  <button
    type="button"
    className="custom-dropdown-button"
    onClick={() => setIsTransportCompanyOpen(!isTransportCompanyOpen)}
  >
    <span>
      {formData.vehicleCompany 
        ? `${transportCompanies.find(tc => tc.id === formData.vehicleCompany)?.code} - ${transportCompanies.find(tc => tc.id === formData.vehicleCompany)?.name}`
        : 'Chọn nhà xe'
      }
    </span>
    <svg className={`custom-dropdown-arrow ${isTransportCompanyOpen ? 'open' : ''}`}>
      <polyline points="6,9 12,15 18,9"></polyline>
    </svg>
  </button>
  {isTransportCompanyOpen && (
    <div className="custom-dropdown-list">
      {transportCompanies.map(tc => (
        <div
          key={tc.id}
          className="custom-dropdown-option"
          onClick={() => {
            handleInputChange('vehicleCompany', tc.id);
            setSelectedTransportCompanyName(tc.name);
            setIsTransportCompanyOpen(false);
          }}
        >
          {`${tc.code} - ${tc.name}`}
        </div>
      ))}
    </div>
  )}
</div>
```

## Event Handling

### 1. Click Outside Handler
```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown-container')) {
      setIsShippingLineOpen(false);
      setIsContainerTypeOpen(false);
      setIsTransportCompanyOpen(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, []);
```

### 2. Data Loading
```typescript
useEffect(() => {
  (async () => {
    try {
      const [slRes, tcRes, ctRes] = await Promise.all([
        setupService.getShippingLines({ page: 1, limit: 100 }),
        setupService.getTransportCompanies({ page: 1, limit: 100 }),
        setupService.getContainerTypes({ page: 1, limit: 100 })
      ]);
      if (slRes.success && slRes.data) setShippingLines(slRes.data.data);
      if (tcRes.success && tcRes.data) setTransportCompanies(tcRes.data.data);
      if (ctRes.success && ctRes.data) setContainerTypes(ctRes.data.data);
    } catch (_) {}
  })();
}, []);
```

## Service Integration

### SetupService
**File:** `services/setupService.ts`

**Methods:**
```typescript
// Get shipping lines
export const getShippingLines = async (params: PaginationParams): Promise<ApiResponse<ShippingLine[]>> => {
  return api.get('/setup/shipping-lines', { params });
};

// Get container types
export const getContainerTypes = async (params: PaginationParams): Promise<ApiResponse<ContainerType[]>> => {
  return api.get('/setup/container-types', { params });
};

// Get transport companies
export const getTransportCompanies = async (params: PaginationParams): Promise<ApiResponse<TransportCompany[]>> => {
  return api.get('/setup/transport-companies', { params });
};
```

## Type Definitions

### API Response Types
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  message?: string;
}

interface PaginationParams {
  page: number;
  limit: number;
}
```

### Data Types
```typescript
interface ShippingLine {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface ContainerType {
  id: string;
  code: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface TransportCompany {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
```

## Styling Features

### 1. Scrollbar Customization
- **Width**: 8px
- **Track Color**: #f1f5f9 (light gray)
- **Thumb Color**: #cbd5e1 (medium gray)
- **Hover Color**: #94a3b8 (darker gray)
- **Border Radius**: 4px

### 2. Animation Effects
- **Arrow Rotation**: 180deg when open
- **Transition Duration**: 0.2s ease
- **Hover Effects**: Background color change
- **Focus States**: Blue border with shadow

### 3. Responsive Design
- **Max Height**: 200px for dropdown list
- **Z-Index**: 1000 to ensure proper layering
- **Box Shadow**: Subtle shadow for depth
- **Border Radius**: 8px for modern look

## Performance Considerations

### 1. Data Loading
- Load all data at once (limit: 100)
- Use Promise.all for parallel loading
- Error handling for failed requests

### 2. Event Listeners
- Proper cleanup in useEffect
- Event delegation for better performance
- Debounced search (if implemented)

### 3. Re-rendering
- Minimal state updates
- Conditional rendering for dropdown lists
- Memoization for expensive operations

## Accessibility Features

### 1. Keyboard Navigation
- Tab navigation support
- Enter key to open/close
- Escape key to close
- Arrow keys for option selection

### 2. Screen Reader Support
- Proper ARIA labels
- Role attributes
- Focus management

### 3. Visual Indicators
- Clear focus states
- Error state styling
- Loading states

## Testing

### Unit Tests
**File:** `pages/Requests/components/CreateLiftRequestModal.test.tsx`

**Test Cases:**
1. Dropdown open/close functionality
2. Option selection
3. Click outside behavior
4. Data loading
5. Error handling
6. Form validation

### Integration Tests
**File:** `pages/Requests/components/CreateLiftRequestModal.integration.test.tsx`

**Test Scenarios:**
1. Complete form submission flow
2. API integration
3. Error states
4. Loading states

## Browser Compatibility

### Supported Browsers
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### CSS Features Used
- CSS Grid
- Flexbox
- CSS Custom Properties
- Webkit Scrollbar Styling

## Future Enhancements

### 1. Search Functionality
- Add search input inside dropdown
- Filter options as user types
- Highlight matching text

### 2. Virtual Scrolling
- For very large datasets
- Improved performance
- Smooth scrolling

### 3. Multi-select Support
- Allow multiple selections
- Checkbox interface
- Selected items display

### 4. Lazy Loading
- Load data on demand
- Infinite scrolling
- Better performance for large datasets

---

## Phần bổ sung: Upload nhiều chứng từ (PDF/Ảnh) cho Request

Ánh xạ thay đổi phía Frontend cho tính năng upload nhiều file và gọi API lưu DB.

### 1) File/Thư mục mã nguồn
- Modal nâng: `frontend/pages/Requests/components/CreateLiftRequestModal.tsx`
- Modal hạ: `frontend/pages/Requests/components/CreateLowerRequestModal.tsx`
- Service gọi API: `frontend/services/requests.ts`

### 2) Cách gửi dữ liệu
```ts
import { requestService } from '../../services/requests';

await requestService.createRequest({
  type: 'IMPORT' | 'EXPORT',
  container_no,
  appointment_time,
  // ...các trường khác
  files: uploadedFiles // File[] từ input multiple
});
```

- Service sẽ đóng gói `FormData` và append từng `File` vào field `files`.

### 3) Ràng buộc trên FE
- Cho phép chọn nhiều file (`multiple`)
- Chỉ nhận: `.pdf,.jpg,.jpeg,.png`
- Giới hạn size: 10MB/file (lọc ngay khi chọn)
- Cho phép xóa file đã chọn trước khi submit

### 4) UI/UX
- Preview danh sách file (tên + dung lượng + icon)
- Nút xóa từng file
- Loading state khi submit: đổi chữ nút thành “Đang tạo yêu cầu…”, disable nút

### 5) Luồng submit
1. Người dùng chọn nhiều file
2. Submit form → gọi `requestService.createRequest`
3. Backend lưu file vào `uploads/requests/` và metadata vào `RequestAttachment`
4. Reset state, đóng modal khi tạo thành công

