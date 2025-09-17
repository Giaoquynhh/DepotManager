# Setup Module - Frontend Documentation

## Tổng quan
Module Setup trong frontend cung cấp giao diện quản lý thông tin các hãng tàu và nhà xe với đầy đủ tính năng CRUD, upload Excel, validation dữ liệu, phân trang và xử lý lỗi thông minh. Module được xây dựng với React/Next.js và hỗ trợ đa ngôn ngữ.

## Cấu trúc Component

### 1. Trang chính Setup
**File:** `pages/Setup/index.tsx`

**Chức năng:**
- Quản lý state cho shipping lines và transport companies
- Xử lý các action CRUD cho cả hai loại dữ liệu
- Tích hợp các modal components
- Hiển thị thông báo success/error
- Tab navigation giữa hãng tàu và nhà xe
- Phân trang cho cả hai bảng dữ liệu
- Xử lý lỗi thông minh với thông báo rõ ràng

**Key State:**
```typescript
// Shipping Lines State
const [shippingLines, setShippingLines] = useState<ShippingLine[]>([]);
const [shippingLinesPagination, setShippingLinesPagination] = useState({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
});
const [showAddModal, setShowAddModal] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);
const [showUploadModal, setShowUploadModal] = useState(false);
const [editingShippingLine, setEditingShippingLine] = useState<ShippingLine | null>(null);
const [shippingLineFormData, setShippingLineFormData] = useState<ShippingLineFormData>({
  code: '',
  name: '',
  eir: '',
  note: ''
});

// Transport Companies State
const [transportCompanies, setTransportCompanies] = useState<TransportCompany[]>([]);
const [transportCompaniesPagination, setTransportCompaniesPagination] = useState({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
});
const [showAddTransportCompanyModal, setShowAddTransportCompanyModal] = useState(false);
const [showEditTransportCompanyModal, setShowEditTransportCompanyModal] = useState(false);
const [showUploadTransportCompanyModal, setShowUploadTransportCompanyModal] = useState(false);
const [editingTransportCompany, setEditingTransportCompany] = useState<TransportCompany | null>(null);
const [transportCompanyFormData, setTransportCompanyFormData] = useState<TransportCompanyFormData>({
  code: '',
  name: '',
  address: '',
  mst: '',
  phone: '',
  note: ''
});

// Common State
const [errorText, setErrorText] = useState('');
const [transportCompanyErrorText, setTransportCompanyErrorText] = useState('');
const [successMessage, setSuccessMessage] = useState('');
```

**Key Functions:**

#### Shipping Lines
- `handleAddNewShippingLine()`: Mở modal thêm mới hãng tàu
- `handleEditShippingLine()`: Mở modal chỉnh sửa hãng tàu
- `handleDeleteShippingLine()`: Xóa hãng tàu với confirmation
- `handleSubmitShippingLine()`: Xử lý thêm mới với validation và xử lý lỗi thông minh
- `handleUpdateShippingLine()`: Xử lý cập nhật với validation và xử lý lỗi thông minh
- `handleFileUpload()`: Xử lý upload Excel file
- `handlePageChange()`: Xử lý chuyển trang trong phân trang
- `loadShippingLines()`: Load dữ liệu với phân trang

#### Transport Companies
- `handleAddNewTransportCompany()`: Mở modal thêm mới nhà xe
- `handleEditTransportCompany()`: Mở modal chỉnh sửa nhà xe
- `handleDeleteTransportCompany()`: Xóa nhà xe với confirmation
- `handleSubmitTransportCompany()`: Xử lý thêm mới với validation và xử lý lỗi thông minh
- `handleUpdateTransportCompany()`: Xử lý cập nhật với validation và xử lý lỗi thông minh
- `handleTransportCompanyFileUpload()`: Xử lý upload Excel file cho nhà xe
- `handlePageChange()`: Xử lý chuyển trang trong phân trang
- `loadTransportCompanies()`: Load dữ liệu với phân trang

### 2. Tab Navigation
**File:** `pages/Setup/components/TabNavigation.tsx`

**Chức năng:**
- Chuyển đổi giữa tab "Hãng tàu" và "Nhà xe"
- Styling active/inactive state
- Responsive design

**Props:**
```typescript
interface TabNavigationProps {
  activeTab: SetupTab;
  setActiveTab: (tab: SetupTab) => void;
  language: 'vi' | 'en';
  translations: any;
}
```

### 3. Pagination Component
**File:** `components/Pagination.tsx`

**Chức năng:**
- Component phân trang chung cho tất cả bảng
- Hiển thị thông tin số items hiện tại và tổng số
- Navigation buttons (Previous/Next)
- Hiển thị số trang với logic thông minh
- Hỗ trợ đa ngôn ngữ

**Props:**
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  language: 'vi' | 'en';
  translations: any;
}
```

**Features:**
- **Smart Page Display**: Hiển thị tối đa 5 số trang với logic thông minh
- **Items Info**: "Hiển thị 1-10 trong tổng số 25 mục"
- **Navigation**: Previous/Next buttons với disabled state
- **Responsive**: Tự động ẩn khi chỉ có 1 trang

### 4. Shipping Lines Table
**File:** `pages/Setup/components/ShippingLinesTable.tsx`

**Chức năng:**
- Hiển thị danh sách hãng tàu trong table
- Hiển thị 5 cột: Mã hãng tàu, Tên hãng tàu, EIR, Ghi chú, Hành động
- Buttons Edit/Delete cho mỗi row
- Empty state khi không có dữ liệu
- Tích hợp component Pagination

**Props:**
```typescript
interface ShippingLinesTableProps {
  shippingLines: ShippingLine[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  language: 'vi' | 'en';
  translations: any;
  onEdit: (shippingLine: ShippingLine) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
}
```

**ShippingLine Interface:**
```typescript
export interface ShippingLine {
  id: string;
  code: string;
  name: string;
  eir: string;
  note?: string;
}
```

### 4. Add Shipping Line Modal
**File:** `pages/Setup/components/AddShippingLineModal.tsx`

**Chức năng:**
- Form thêm mới hãng tàu
- Validation các trường bắt buộc
- Styling responsive và user-friendly
- Portal rendering để tránh z-index issues

**Form Fields:**
- **Mã hãng tàu** (required): Input text với validation
- **Tên hãng tàu** (required): Input text với validation
- **EIR** (required): Input text với validation
- **Ghi chú** (optional): Textarea

**Props:**
```typescript
interface AddShippingLineModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: ShippingLineFormData) => void;
  formData: ShippingLineFormData;
  setFormData: React.Dispatch<React.SetStateAction<ShippingLineFormData>>;
  errorText: string;
  language: 'vi' | 'en';
  translations: any;
}
```

### 5. Edit Shipping Line Modal
**File:** `pages/Setup/components/EditShippingLineModal.tsx`

**Chức năng:**
- Form chỉnh sửa hãng tàu
- Pre-fill dữ liệu hiện tại
- Validation và duplicate checking
- Cập nhật ID nếu code thay đổi

**Props:**
```typescript
interface EditShippingLineModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: ShippingLineFormData) => void;
  formData: ShippingLineFormData;
  setFormData: (data: ShippingLineFormData) => void;
  errorText: string;
  language: 'vi' | 'en';
  translations: any;
  originalCode: string;
}
```

### 6. Upload Excel Modal
**File:** `pages/Setup/components/UploadExcelModal.tsx`

**Chức năng:**
- Upload file Excel với drag & drop
- Download template Excel
- File validation (.xlsx, .xls)
- Hướng dẫn format dữ liệu
- Preview file đã chọn

**Features:**
- **Drag & Drop**: Kéo thả file vào modal
- **File Validation**: Kiểm tra định dạng file
- **Template Download**: Tải mẫu Excel với dữ liệu mẫu
- **Instructions**: Hướng dẫn format dữ liệu chi tiết
- **File Preview**: Hiển thị tên file và kích thước

**Props:**
```typescript
interface UploadExcelModalProps {
  visible: boolean;
  onCancel: () => void;
  onUpload: (file: File) => void;
  language: 'vi' | 'en';
  translations: any;
}
```

## Transport Companies Components

### 1. Transport Companies Table
**File:** `pages/Setup/components/TransportCompaniesTable.tsx`

**Chức năng:**
- Hiển thị danh sách nhà xe trong table
- Hiển thị 7 cột: Mã nhà xe, Tên nhà xe, Địa chỉ, MST, SDT, Ghi chú, Hành động
- Buttons Edit/Delete cho mỗi row
- Empty state khi không có dữ liệu
- Tích hợp component Pagination

**Props:**
```typescript
interface TransportCompaniesTableProps {
  transportCompanies: TransportCompany[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  language: 'vi' | 'en';
  translations: any;
  onEdit: (transportCompany: TransportCompany) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
}
```

**TransportCompany Interface:**
```typescript
export interface TransportCompany {
  id: string;
  code: string;
  name: string;
  address?: string;
  mst?: string;
  phone?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 2. Add Transport Company Modal
**File:** `pages/Setup/components/AddTransportCompanyModal.tsx`

**Chức năng:**
- Form thêm mới nhà xe
- Validation các trường bắt buộc
- Styling responsive và user-friendly
- Portal rendering để tránh z-index issues

**Form Fields:**
- **Mã nhà xe** (required): Input text với validation
- **Tên nhà xe** (required): Input text với validation
- **Địa chỉ** (optional): Input text
- **MST** (optional): Input text
- **SDT** (optional): Input text
- **Ghi chú** (optional): Textarea

**Props:**
```typescript
interface AddTransportCompanyModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: TransportCompanyFormData) => void;
  formData: TransportCompanyFormData;
  setFormData: React.Dispatch<React.SetStateAction<TransportCompanyFormData>>;
  errorText: string;
  language: 'vi' | 'en';
  translations: any;
}
```

### 3. Edit Transport Company Modal
**File:** `pages/Setup/components/EditTransportCompanyModal.tsx`

**Chức năng:**
- Form chỉnh sửa nhà xe
- Pre-fill dữ liệu hiện tại
- Validation và duplicate checking
- Cập nhật ID nếu code thay đổi

**Props:**
```typescript
interface EditTransportCompanyModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: TransportCompanyFormData) => void;
  formData: TransportCompanyFormData;
  setFormData: (data: TransportCompanyFormData) => void;
  errorText: string;
  language: 'vi' | 'en';
  translations: any;
  originalCode: string;
}
```

### 4. Upload Transport Company Excel Modal
**File:** `pages/Setup/components/UploadTransportCompanyExcelModal.tsx`

**Chức năng:**
- Upload file Excel cho nhà xe với drag & drop
- File validation (.xlsx, .xls)
- Hướng dẫn format dữ liệu cho nhà xe
- Preview file đã chọn

**Excel Format:**
- Cột 1: Mã nhà xe (required)
- Cột 2: Tên nhà xe (required)
- Cột 3: Địa chỉ (optional)
- Cột 4: MST (optional)
- Cột 5: SĐT (optional)
- Cột 6: Ghi chú (optional)

**Props:**
```typescript
interface UploadTransportCompanyExcelModalProps {
  visible: boolean;
  onCancel: () => void;
  onUpload: (file: File) => void;
  language: 'vi' | 'en';
  translations: any;
}
```

## Business Logic

### 1. Pagination Logic

#### Pagination State Management
```typescript
// Pagination state for shipping lines
const [shippingLinesPagination, setShippingLinesPagination] = useState({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
});

// Load data with pagination
const loadShippingLines = async (page: number = 1, limit: number = 10) => {
  try {
    const response = await setupService.getShippingLines({ page, limit });
    if (response.success && response.data) {
      setShippingLines(response.data.data);
      setShippingLinesPagination({
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages
      });
    }
  } catch (error) {
    console.error('Error loading shipping lines:', error);
  }
};

// Handle page change
const handlePageChange = (page: number) => {
  loadShippingLines(page, shippingLinesPagination.limit);
};
```

#### Pagination Component Logic
```typescript
// Smart page number display
const getPageNumbers = () => {
  const pages = [];
  const maxVisiblePages = 5;
  
  if (totalPages <= maxVisiblePages) {
    // Show all pages if total is small
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Show pages around current page
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    
    // Always show first page
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('...');
      }
    }
    
    // Show pages around current
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    // Always show last page
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
  }
  
  return pages;
};
```

### 2. Smart Error Handling Logic

#### Duplicate Code Error Detection
```typescript
const handleSubmitShippingLine = async (data: ShippingLineFormData) => {
  try {
    const response = await setupService.createShippingLine({
      code: data.code.trim(),
      name: data.name.trim(),
      eir: data.eir.trim(),
      note: data.note.trim()
    }).catch((error: any) => {
      // Prevent error from being thrown to avoid Next.js error overlay
      return {
        success: false,
        error: 'CREATE_ERROR',
        message: error.response?.data?.message || 'Failed to create shipping line',
        details: error.response?.data?.details
      };
    });

    if (response.success && 'data' in response && response.data) {
      // Success handling
    } else {
      // Handle API error response
      const errorMessage = response.message || '';
      const errorDetails = response.details || [];
      
      // Check if it's a duplicate code error
      const isDuplicateError = errorMessage.toLowerCase().includes('duplicate') || 
                              errorMessage.toLowerCase().includes('already exists') ||
                              errorMessage.toLowerCase().includes('unique') ||
                              errorMessage.toLowerCase().includes('constraint') ||
                              errorDetails.some((detail: any) => 
                                detail.message?.toLowerCase().includes('duplicate') ||
                                detail.message?.toLowerCase().includes('already exists') ||
                                detail.message?.toLowerCase().includes('unique')
                              );
      
      if (isDuplicateError) {
        setErrorText(
          translations[language].code 
            ? `Mã hãng tàu "${data.code}" đã tồn tại. Vui lòng chọn mã khác.`
            : `Shipping line code "${data.code}" already exists. Please choose a different code.`
        );
      } else if (errorMessage.toLowerCase().includes('validation')) {
        setErrorText(
          translations[language].code 
            ? 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.'
            : 'Invalid data. Please check your information.'
        );
      } else {
        // Show detailed error message if available
        if (errorDetails && errorDetails.length > 0) {
          const detailMessages = errorDetails.map((d: any) => d.message).join(', ');
          setErrorText(detailMessages);
        } else {
          setErrorText(errorMessage || 'Failed to create shipping line');
        }
      }
    }
  } catch (error: any) {
    console.error('Error creating shipping line:', error);
    // Prevent error from being thrown to avoid Next.js error overlay
    setErrorText(
      translations[language].code 
        ? 'Không thể tạo hãng tàu. Vui lòng thử lại.'
        : 'Failed to create shipping line. Please try again.'
    );
  }
};
```

#### Error Prevention Strategy
```typescript
// 1. Catch errors at service level
.catch((error: any) => {
  return {
    success: false,
    error: 'CREATE_ERROR',
    message: error.response?.data?.message || 'Failed to create',
    details: error.response?.data?.details
  };
});

// 2. Handle errors in handlers
if (response.success && 'data' in response && response.data) {
  // Success path
} else {
  // Error handling with smart detection
}

// 3. Prevent Next.js error overlay
try {
  // All operations
} catch (error: any) {
  // Handle gracefully without throwing
}
```

### 3. Validation Logic

#### Shipping Lines Validation
```typescript
// Required fields validation
if (!data.code.trim()) {
  setErrorText('Vui lòng nhập mã hãng tàu.');
  return;
}
if (!data.name.trim()) {
  setErrorText('Vui lòng nhập tên hãng tàu.');
  return;
}
if (!data.eir.trim()) {
  setErrorText('Vui lòng nhập EIR.');
  return;
}

// Duplicate code checking (case-insensitive)
const isDuplicate = shippingLines.some(sl =>
  sl.code.toLowerCase() === trimmedCode.toLowerCase()
);
```

#### Transport Companies Validation
```typescript
// Required fields validation
if (!data.code.trim()) {
  setTransportCompanyErrorText('Vui lòng nhập mã nhà xe.');
  return;
}
if (!data.name.trim()) {
  setTransportCompanyErrorText('Vui lòng nhập tên nhà xe.');
  return;
}

// Duplicate code checking (case-insensitive)
const isDuplicate = transportCompanies.some(tc =>
  tc.code.toLowerCase() === trimmedCode.toLowerCase()
);
```

### 2. Excel Parsing Logic

#### Shipping Lines Excel Parsing
```typescript
const handleFileUpload = async (file: File) => {
  try {
    const XLSX = await import('xlsx');
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Process data with validation
    const rows = jsonData.slice(1) as string[][];
    const newShippingLines: ShippingLine[] = [];
    const errors: string[] = [];
    
    // Validation and duplicate checking
    // Add to state if valid
  } catch (error) {
    setErrorText('Lỗi khi đọc file Excel.');
  }
};
```

#### Transport Companies Excel Parsing
```typescript
const handleTransportCompanyFileUpload = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await setupService.uploadTransportCompanyExcel(formData);

    if (response.success && response.data) {
      // Add new transport companies to the list
      setTransportCompanies(prev => [...response.data!, ...prev]);

      // Show success message
      setSuccessMessage(
        `Đã tải lên ${response.data.length} nhà xe thành công!`
      );

      // Close modal
      setShowUploadTransportCompanyModal(false);
    } else {
      // Handle API error
      setTransportCompanyErrorText(response.message || 'Failed to upload Excel file');
    }
  } catch (error) {
    console.error('Error uploading Excel file:', error);
    setTransportCompanyErrorText('Failed to upload Excel file');
  }
};
```

### 3. State Management

#### Shipping Lines State Management
```typescript
// Add new shipping line
setShippingLines(prev => [newShippingLine, ...prev]);

// Update existing shipping line
setShippingLines(prev => prev.map(sl => 
  sl.id === editingShippingLine.id ? updatedShippingLine : sl
));

// Delete shipping line
setShippingLines(prev => prev.filter(sl => sl.id !== id));
```

#### Transport Companies State Management
```typescript
// Add new transport company
setTransportCompanies(prev => [newTransportCompany, ...prev]);

// Update existing transport company
setTransportCompanies(prev => prev.map(tc => 
  tc.id === editingTransportCompany.id ? updatedTransportCompany : tc
));

// Delete transport company
setTransportCompanies(prev => prev.filter(tc => tc.id !== id));
```

## Styling & UI

### 1. Button Styling
```typescript
// Add New Button
<button
  className="btn"
  onClick={handleAddNewShippingLine}
  style={{background:'#059669', color:'#fff'}}
>
  <svg>...</svg>
  {translations[language].addNew}
</button>

// Upload Excel Button
<button
  className="btn btn-outline"
  onClick={handleUploadExcel}
  style={{color: '#7c3aed', borderColor: '#7c3aed', backgroundColor: '#f3f4f6'}}
>
  <svg>...</svg>
  {translations[language].uploadExcel}
</button>
```

### 2. Modal Styling
```typescript
// Modal overlay
<div className="modal-overlay" onClick={onCancel}>
  <div className="modal-content" onClick={(e) => e.stopPropagation()} 
       style={{width: '500px', maxWidth: '90vw'}}>
    {/* Modal content */}
  </div>
</div>
```

### 3. Table Styling
```typescript
// Table container
<div className="table-container">
  <table className="table">
    <thead style={{background: '#f8fafc'}}>
      {/* Table headers */}
    </thead>
    <tbody>
      {/* Table rows */}
    </tbody>
  </table>
</div>
```

## Internationalization

### 1. Translation Keys
```json
{
  "sidebar": {
    "setup": "Thiết lập",
    "shippingLines": "Hãng tàu",
    "transportCompanies": "Nhà xe"
  },
  "addNew": "Thêm mới",
  "uploadExcel": "Upload Excel",
  "addNewShippingLine": "Thêm hãng tàu mới",
  "editShippingLine": "Cập nhật hãng tàu",
  "addNewTransportCompany": "Thêm nhà xe mới",
  "editTransportCompany": "Cập nhật nhà xe",
  "update": "Cập nhật",
  "code": "Mã hãng tàu",
  "name": "Tên hãng tàu",
  "eir": "EIR",
  "note": "Ghi chú",
  "optional": "tùy chọn",
  "transportCompanyCode": "Mã nhà xe",
  "transportCompanyName": "Tên nhà xe",
  "address": "Địa chỉ",
  "mst": "MST",
  "phone": "SDT",
  "uploadTransportCompanyExcel": "Tải lên Excel nhà xe",
  "uploadInstructions": "Hướng dẫn tải lên file Excel",
  "downloadTemplate": "Tải mẫu Excel",
  "dragDropFile": "Kéo thả file Excel vào đây hoặc click để chọn file",
  "supportedFormats": "Định dạng hỗ trợ: .xlsx, .xls",
  "maxFileSize": "Kích thước tối đa: 10MB"
}
```

### 2. Language Support
- **Vietnamese (vi)**: Ngôn ngữ chính
- **English (en)**: Ngôn ngữ phụ
- Dynamic switching với `useTranslation` hook

## File Mapping

### Frontend Files
```
manageContainer/frontend/
├── pages/Setup/
│   ├── index.tsx                        # Main Setup page
│   ├── hooks/
│   │   └── useSetupState.ts            # State management hook with pagination
│   ├── handlers/
│   │   ├── shippingLineHandlers.ts     # Shipping line handlers with pagination & error handling
│   │   └── transportCompanyHandlers.ts # Transport company handlers with pagination & error handling
│   └── components/
│       ├── TabNavigation.tsx            # Tab switching
│       ├── ShippingLinesTable.tsx      # Shipping lines data table with pagination
│       ├── AddShippingLineModal.tsx    # Add shipping line modal
│       ├── EditShippingLineModal.tsx   # Edit shipping line modal
│       ├── UploadExcelModal.tsx        # Upload shipping lines Excel modal
│       ├── TransportCompaniesTable.tsx # Transport companies data table with pagination
│       ├── AddTransportCompanyModal.tsx # Add transport company modal
│       ├── EditTransportCompanyModal.tsx # Edit transport company modal
│       └── UploadTransportCompanyExcelModal.tsx # Upload transport companies Excel modal
├── services/
│   └── setupService.ts                 # API service for setup operations
├── components/
│   ├── Header.tsx                      # Navigation header
│   ├── Card.tsx                        # Card component
│   └── Pagination.tsx                  # Reusable pagination component
├── locales/
│   ├── vi.json                         # Vietnamese translations (updated with pagination)
│   └── en.json                         # English translations (updated with pagination)
├── hooks/
│   └── useTranslation.ts               # Translation hook
└── styles/
    ├── modal.css                       # Modal styles
    └── table.css                       # Table styles
```

### Key Dependencies
```json
{
  "dependencies": {
    "next": "^13.0.0",
    "react": "^18.0.0",
    "xlsx": "^0.18.5"
  }
}
```

## User Experience Features

### 1. Success/Error Notifications
```typescript
// Success message
setSuccessMessage(
  `Đã thêm hãng tàu "${newShippingLine.name}" thành công!`
);

// Auto-dismiss after 3 seconds
setTimeout(() => {
  setSuccessMessage('');
}, 3000);
```

### 2. Confirmation Dialogs
```typescript
// Delete confirmation
if (window.confirm(
  'Bạn có chắc chắn muốn xóa hãng tàu này?'
)) {
  // Delete logic
}
```

### 3. Form Validation
- Real-time validation
- Clear error messages
- Required field indicators
- Duplicate checking

### 4. Responsive Design
- Mobile-friendly modals
- Responsive table layout
- Touch-friendly buttons

## Error Handling

### 1. Validation Errors
```typescript
if (!data.code.trim()) {
  setErrorText('Vui lòng nhập mã hãng tàu.');
  return;
}
```

### 2. Duplicate Errors
```typescript
if (isDuplicate) {
  setErrorText(
    `Mã hãng tàu "${trimmedCode}" đã tồn tại (${existingShippingLine?.name}). Vui lòng chọn mã khác.`
  );
  return;
}
```

### 3. Excel Parsing Errors
```typescript
catch (error) {
  console.error('Error parsing Excel file:', error);
  setErrorText('Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng file.');
}
```

## Performance Optimizations

### 1. Dynamic Imports
```typescript
// Lazy load XLSX library
const XLSX = await import('xlsx');
```

### 2. Portal Rendering
```typescript
// Render modals in document.body to avoid z-index issues
return createPortal(
  <div className="modal-overlay">...</div>,
  document.body
);
```

### 3. State Updates
```typescript
// Efficient state updates
setShippingLines(prev => [newShippingLine, ...prev]);
```

## Testing Considerations

### 1. Unit Tests
- Component rendering
- Form validation
- State management
- Event handlers

### 2. Integration Tests
- Modal interactions
- Excel upload flow
- CRUD operations
- Error handling

### 3. E2E Tests
- Complete user workflows
- Cross-browser compatibility
- Mobile responsiveness

## Deployment Notes

### 1. Build Configuration
```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    config.externals = [...config.externals, 'xlsx'];
    return config;
  }
};
```

### 2. Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_UPLOAD_MAX_SIZE=10485760
```

## Changelog

### Version 1.2.0 (2024-01-25)
- **Pagination System**: Added comprehensive pagination for both shipping lines and transport companies tables
- **Smart Error Handling**: Implemented intelligent error detection and user-friendly error messages
- **Pagination Component**: Created reusable `Pagination.tsx` component with smart page display logic
- **Error Prevention**: Prevented Next.js error overlay by implementing proper error catching
- **Enhanced UX**: Improved user experience with clear error messages and smooth pagination
- **State Management**: Updated `useSetupState` hook to include pagination state
- **Handler Updates**: Enhanced all handlers to support pagination and smart error handling
- **Translation Updates**: Added pagination-related translations for both Vietnamese and English
- **API Integration**: Updated API calls to support pagination parameters
- **Type Safety**: Improved TypeScript type safety with proper error handling

### Version 1.1.0 (2024-01-20)
- Added Transport Companies management
- CRUD operations UI for transport companies
- Excel upload functionality for transport companies
- Enhanced API integration with backend
- Updated state management for dual entities
- Added transport company specific modals and components
- Enhanced error handling for API calls

### Version 1.0.0 (2024-01-15)
- Initial implementation
- CRUD operations UI
- Excel upload/download functionality
- Multi-language support
- Responsive design
- Comprehensive error handling
- Success/error notifications
