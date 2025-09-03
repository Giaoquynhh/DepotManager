# Yard Components - Frontend Documentation

## Tổng quan
Tài liệu này mô tả các component React được sử dụng trong module Yard Management của ứng dụng Smartlog Container Manager. **Logic mới**: Chỉ hiển thị thông tin container trong popup modal, không còn hiển thị ở dưới trang.

## Cấu trúc thư mục
```
frontend/
├── components/
│   └── yard/
│       ├── YardMap.tsx                    # Sơ đồ bãi dạng grid
│       ├── ModernYardMap.tsx              # Sơ đồ bãi hiện đại với settings
│       ├── YardConfigurationModal.tsx     # Modal cấu hình bãi (SystemAdmin)
│       ├── ContainerSearch/
│       │   └── ContainerSearchForm.tsx    # Form tìm kiếm container
│       ├── ContainerInfo/
│       │   ├── ContainerInfoCard.tsx      # Component rỗng (không hiển thị)
│       │   └── ContainerInfoModal.tsx     # Modal hiển thị thông tin + tạo phiếu
│       ├── PDFSlip/
│       │   └── PDFSlip.tsx                # Component tạo PDF và in phiếu
│       ├── hooks/
│       │   └── useContainerSearch.ts      # Hook quản lý tìm kiếm container
│       └── index.ts                       # Export tất cả components
├── pages/
│   └── Yard/
│       └── index.tsx                      # Trang chính Yard (đã làm gọn)
└── styles/
    ├── yard-configuration.css              # CSS cho modal cấu hình bãi
    └── yard/
        ├── layout.css                      # Layout chính
        ├── map.css                         # CSS cho sơ đồ bãi
        ├── form.css                        # CSS cho form tìm kiếm
        ├── modal.css                       # CSS cho modal
        ├── pdf-slip.css                    # CSS cho PDF slip
        └── yard.css                        # File import chính
```

## Components

### 1. YardMap.tsx
Component chính để hiển thị sơ đồ bãi dạng grid.

#### Props
```typescript
interface YardMapProps {
  yard: Yard;
  onSlotClick?: (slot: Slot) => void;
  suggestedSlots?: string[];
  selectedSlotId?: string;
}
```

#### Tính năng
- **Hiển thị sơ đồ bãi** với các block và slot
- **Màu sắc phân biệt trạng thái**:
  - EMPTY: Xám nhạt (có thể click)
  - RESERVED: Vàng
  - OCCUPIED: Xám đậm (không thể click)
  - UNDER_MAINTENANCE: Cam + icon 🔧
  - EXPORT: Xanh lá
- **Highlight vị trí gợi ý** với border xanh dương
- **Highlight vị trí đã chọn** với border xanh đậm
- **Tooltip thông tin** khi hover
- **Legend giải thích** màu sắc

#### Sử dụng
```tsx
<YardMap
  yard={yardData}
  onSlotClick={() => {}} // Không còn xử lý click
  suggestedSlots={[]}    // Không còn gợi ý vị trí
  selectedSlotId={containerInfo?.slot_id || ''}
/>
```

### 2. ContainerSearchForm.tsx
Component form tìm kiếm container với filter gate location.

#### Props
```typescript
interface ContainerSearchFormProps {
  containerNo: string;
  onContainerNoChange: (value: string) => void;
  gateLocationFilter: string;
  onGateLocationFilterChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
}
```

#### Tính năng
- **Input Container No** với validation tối thiểu 4 ký tự
- **Filter Gate Location** dropdown với mock data (Cổng 1, Cổng 2, Cổng 3)
- **Nút tìm kiếm** với loading state
- **Error message** khi input không hợp lệ
- **Responsive design** cho mobile

#### Sử dụng
```tsx
<ContainerSearchForm
  containerNo={containerNo}
  onContainerNoChange={setContainerNo}
  gateLocationFilter={gateLocationFilter}
  onGateLocationFilterChange={setGateLocationFilter}
  onSubmit={handleSearchContainer}
  loading={loading}
/>
```

### 3. ContainerInfoModal.tsx
Modal chính hiển thị thông tin container và quản lý luồng tạo phiếu.

#### Props
```typescript
interface ContainerInfoModalProps {
  isOpen: boolean;
  containerInfo: any;
  isDuplicate: boolean;
  existingContainers: any[];
  onClose: () => void;
}
```

#### Tính năng
- **3 trạng thái hiển thị**:
  1. **Thông tin container** với 6 thông tin cơ bản
  2. **Gợi ý vị trí** với 5 vị trí mock data
  3. **Tạo phiếu** với component PDFSlip
- **Navigation giữa các view** với nút "Quay lại"
- **Duplicate warning** khi container đã tồn tại
- **No info message** khi container không có trạng thái Gate In

#### Thông tin hiển thị
```typescript
// 6 thông tin cơ bản
- CONTAINER NO: containerInfo.container_no
- TRẠNG THÁI CỔNG: "GATE IN" (hardcoded)
- CỔNG XE ĐÃ VÀO: "Cổng 1" (mock data)
- Ô SỐ: containerInfo.status_text
- LOẠI: containerInfo.type
- BÃI: containerInfo.yard_name
```

#### Sử dụng
```tsx
<ContainerInfoModal
  isOpen={showContainerModal}
  containerInfo={containerInfo}
  isDuplicate={isDuplicate}
  existingContainers={existingContainers}
  onClose={handleCloseContainerModal}
/>
```

### 4. PDFSlip.tsx
Component tạo PDF và in phiếu thay vì hiển thị popup.

#### Props
```typescript
interface PDFSlipProps {
  containerInfo: any;
  selectedPosition: any;
}
```

#### Tính năng
- **2 nút chức năng chính**:
  - 📄 **Tải xuống PDF**: Tạo file PDF chất lượng cao
  - 🖨️ **In phiếu**: Mở cửa sổ in mới
- **PDF Generation**:
  - Sử dụng jsPDF + html2canvas
  - Scale 2x cho độ phân giải cao
  - Tự động fit A4, chia trang nếu cần
  - Tên file: `Container_ISO1237_B1-11.pdf`
- **Print Function**:
  - Mở tab mới với CSS tối ưu cho in
  - Tự động đóng sau khi in xong

#### Sử dụng
```tsx
<PDFSlip 
  containerInfo={containerInfo} 
  selectedPosition={selectedPosition} 
/>
```

### 5. ModernYardMap.tsx
Component sơ đồ bãi hiện đại với nút Settings để cấu hình bãi.

#### Props
```typescript
interface ModernYardMapProps {
  yard: Yard;
  onSettings?: () => void;
}
```

#### Tính năng
- **Hiển thị sơ đồ bãi** với layout hiện đại
- **Nút Settings (⚙️)** để mở modal cấu hình (chỉ SystemAdmin)
- **Responsive design** cho mobile và desktop
- **Loading states** và error handling

#### Sử dụng
```tsx
<ModernYardMap
  yard={yardData}
  onSettings={() => setShowConfigModal(true)}
/>
```

### 6. YardConfigurationModal.tsx
Modal cấu hình bãi cho SystemAdmin.

#### Props
```typescript
interface YardConfigurationModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}
```

#### Tính năng
- **Form cấu hình** với 3 trường:
  - Số lượng depot (1-50)
  - Số lượng ô trong mỗi depot (1-100)
  - Số lượng tầng trong mỗi ô (1-20)
- **Preview real-time** hiển thị tổng số depot, ô, tầng
- **3 nút hành động**:
  - Hủy (đóng modal)
  - 🔄 Cài đặt mặc định (reset về 2 depot, 20 ô, 5 tầng)
  - 💾 Cập nhật (áp dụng cấu hình mới)
- **Success messages** và loading states
- **Validation** input với giá trị tối thiểu

#### API Integration
- `GET /yard/configuration` - Lấy cấu hình hiện tại
- `POST /yard/configure` - Cập nhật cấu hình
- `POST /yard/reset` - Reset về mặc định

#### Sử dụng
```tsx
<YardConfigurationModal
  visible={showConfigModal}
  onCancel={() => setShowConfigModal(false)}
  onSuccess={() => {
    setShowConfigModal(false);
    mutate('yard_map'); // Refresh data
  }}
/>
```

### 7. useContainerSearch.ts
Custom hook quản lý logic tìm kiếm container.

#### State Management
```typescript
const [containerInfo, setContainerInfo] = useState<any>(null);
const [loading, setLoading] = useState(false);
const [msg, setMsg] = useState('');
const [isDuplicate, setIsDuplicate] = useState(false);
const [existingContainers, setExistingContainers] = useState<any[]>([]);
```

#### API Integration
- **Primary search**: `/gate/requests/search` để kiểm tra trạng thái Gate In
- **Fallback APIs**: `/containers/:container_no`, `/gate/requests`, `/gate/containers`
- **Duplicate check**: So sánh với containers hiện có
- **Gate location filter**: Lọc kết quả theo cổng

#### Logic chính
```typescript
const searchContainer = async (containerNo: string, gateLocationFilter?: string) => {
  // 1. Kiểm tra độ dài tối thiểu (4 ký tự)
  // 2. Tìm kiếm trong Gate API
  // 3. Kiểm tra trạng thái Gate In
  // 4. Xử lý duplicate nếu có
  // 5. Cập nhật state và message
};
```

## Trang chính Yard

### Yard/index.tsx
Trang chính đã được làm gọn, chỉ giữ lại chức năng cốt lõi.

#### State Management (Đã làm gọn)
```typescript
const [containerNo, setContainerNo] = useState('');
const [gateLocationFilter, setGateLocationFilter] = useState('');
const [showContainerModal, setShowContainerModal] = useState(false);
const [showConfigModal, setShowConfigModal] = useState(false);

const {
  containerInfo,
  loading,
  msg,
  isDuplicate,
  existingContainers,
  searchContainer,
  reset,
  setMsg
} = useContainerSearch();
```

#### Layout mới
- **Left column (2/3)**: Sơ đồ bãi với ModernYardMap (có nút Settings)
- **Right column (1/3)**: Chỉ form tìm kiếm ContainerSearchForm
- **Modal cấu hình**: YardConfigurationModal (chỉ SystemAdmin)
- **Không còn hiển thị**:
  - ContainerInfoCard
  - PositionSuggestionCard  
  - YardActionsCard
  - ConfirmPositionModal

#### Luồng hoạt động mới
```
1. Nhập Container No → Bấm Tìm kiếm
2. Hiển thị popup modal với thông tin container
3. Bấm "Tiếp tục" → Chọn vị trí từ 5 gợi ý
4. Bấm "Tạo phiếu" → Hiển thị PDFSlip
5. Chọn "Tải xuống PDF" hoặc "In phiếu"
```

#### Luồng cấu hình bãi (SystemAdmin)
```
1. Click nút Settings (⚙️) trên ModernYardMap
2. Modal cấu hình hiển thị với form nhập
3. Thay đổi số depot, ô, tầng → Preview tự động cập nhật
4. Click "💾 Cập nhật" → Áp dụng cấu hình mới
5. Click "🔄 Cài đặt mặc định" → Reset về mặc định
6. Hệ thống tự động làm mới sơ đồ bãi
```

## Styling

### CSS Structure mới
```
styles/
├── yard-configuration.css  # Modal cấu hình bãi + form + buttons
└── yard/
    ├── layout.css          # Layout chính (2 cột)
    ├── map.css             # Sơ đồ bãi
    ├── form.css            # Form tìm kiếm + validation
    ├── modal.css           # Modal styling + no-info message
    ├── pdf-slip.css        # PDF slip + actions buttons
    ├── info.css            # Info cards + grid layout
    ├── suggestions.css      # Position suggestion cards
    ├── duplicate.css        # Duplicate warning styling
    ├── responsive.css       # Mobile responsive
    └── yard.css            # File import chính
```

### Key CSS Classes
- **`.yard-config-modal`**: Modal cấu hình bãi chính
- **`.config-form`**: Form nhập cấu hình
- **`.config-preview`**: Preview section với thống kê
- **`.preview-actions`**: 2 nút Cập nhật và Cài đặt mặc định
- **`.modal-footer`**: Footer với 3 nút (Hủy, Reset, Update)
- **`.pdf-slip-container`**: Container chính cho PDF slip
- **`.pdf-actions`**: 2 nút tải PDF và in phiếu
- **`.pdf-modal`**: Modal styling cho PDF view
- **`.no-info-message`**: Message khi container không có thông tin

## Tích hợp

### Với Design System
- **CSS Variables** từ globals.css
- **Button components** với gradient và hover effects
- **Card components** với shadows và borders

### Với PDF Generation
- **jsPDF**: Tạo PDF từ HTML
- **html2canvas**: Convert HTML thành canvas
- **Print API**: In trực tiếp từ browser

### Với State Management
- **Local state** với useState
- **Custom hook** useContainerSearch
- **Modal state** cho navigation giữa các view

## Performance

### Optimization
- **Component memoization** với React.memo
- **Lazy loading** cho modal components
- **PDF generation** với async/await

### Accessibility
- **ARIA labels** cho screen readers
- **Keyboard navigation** cho modal
- **Focus management** cho form inputs

## Testing

### Unit Tests
- **Component rendering** với React Testing Library
- **PDF generation** với jsPDF mocking
- **Print function** với window.open mocking

### Integration Tests
- **API integration** với MSW
- **User flows** end-to-end
- **PDF download** và print scenarios

## Deployment

### Build Process
- **TypeScript compilation** với strict mode
- **CSS bundling** với PostCSS
- **PDF libraries** được bundle cùng

### Environment
- **Development** với hot reload
- **Production** với PDF optimization
- **Staging** với feature flags

## Thay đổi chính từ phiên bản cũ

### ❌ Đã loại bỏ
1. **ContainerInfoCard**: Không còn hiển thị thông tin ở dưới
2. **PositionSuggestionCard**: Không còn gợi ý vị trí ở dưới
3. **YardActionsCard**: Không còn panel hành động
4. **ConfirmPositionModal**: Không còn modal xác nhận vị trí
5. **Position suggestion logic**: Không còn API call gợi ý vị trí

### ✅ Đã thêm mới
1. **PDFSlip component**: Tạo PDF và in phiếu
2. **3-view modal system**: Info → Suggestions → PDF
3. **PDF generation**: jsPDF + html2canvas
4. **Print functionality**: Cửa sổ in riêng biệt
5. **Mock position data**: 5 vị trí gợi ý cố định
6. **YardConfigurationModal**: Modal cấu hình bãi cho SystemAdmin
7. **ModernYardMap**: Component sơ đồ bãi với nút Settings
8. **Yard configuration APIs**: GET/POST /yard/configuration, /yard/configure, /yard/reset

### 🔄 Đã thay đổi
1. **Layout**: Chỉ 2 cột, không còn thông tin phức tạp
2. **Search logic**: Tập trung vào Gate In status
3. **User flow**: Đơn giản hóa thành 4 bước
4. **Information display**: Chỉ trong popup modal
5. **Yard map**: Sử dụng ModernYardMap thay vì YardMap cũ
6. **Settings integration**: Nút Settings tích hợp vào ModernYardMap

## Tài liệu tham khảo

- [React Documentation](https://reactjs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/)
- [jsPDF Documentation](https://artskydj.github.io/jsPDF/docs/)
- [html2canvas Documentation](https://html2canvas.hertzen.com/)
- [CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)
- [Design System Guidelines](./DESIGN_SYSTEM.md)
