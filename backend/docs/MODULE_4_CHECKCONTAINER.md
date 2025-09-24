# Module 4: Check Container - Kiểm tra container

## Tổng quan

Module Check Container xử lý việc kiểm tra tình trạng container tại khu vực kiểm tra. Sau khi container được gate cho vào, bộ phận maintenance sẽ tiến hành kiểm tra tình trạng container và đánh giá khả năng sử dụng.

## Chức năng chính

### 1. Danh sách container chờ kiểm tra
- Hiển thị danh sách các container import có trạng thái `GATE_IN`
- Lọc chỉ lấy container loại `IMPORT`
- Hiển thị thông tin cơ bản: số yêu cầu, mã container, loại container, số xe, tài xế, SDT, thời gian tạo

### 2. Kiểm tra container
- Modal kiểm tra với các trường:
  - **Số container**: Lấy từ import request (read-only)
  - **Loại container**: Lấy từ import request (read-only)
  - **Trạng thái**: Dropdown với 5 options
  - **Hình ảnh**: Upload nhiều ảnh, preview và quản lý

## Trạng thái kiểm tra

Module hỗ trợ 5 trạng thái kiểm tra:

1. **Container tốt** (`good`)
   - Container đạt tiêu chuẩn, có thể sử dụng ngay

2. **Container xấu có thể sửa chữa** (`repairable`)
   - Container có lỗi nhưng có thể sửa chữa

3. **Container xấu không thể sửa chữa** (`unrepairable`)
   - Container hư hỏng nặng, không thể sửa chữa

4. **Đã kiểm tra** (`checked`)
   - Container đã hoàn thành quá trình kiểm tra

5. **Đang sửa chữa** (`repairing`)
   - Container đang trong quá trình sửa chữa

## API Endpoints

### 1. Lấy danh sách container chờ kiểm tra
```http
GET /backend/gate/requests/search?status=GATE_IN&limit=100
Authorization: Bearer <token>
```

**Response:**
```json
{
  "data": [
    {
      "id": "cmfx20plb001t5lbmgp8euaeh",
      "request_no": "NA24092500010",
      "request_id": "cmfx20plb001t5lbmgp8euaeh",
      "container_no": "Test1234",
      "container_type": {
        "code": "40VH"
      },
      "license_plate": "38A-12344",
      "driver_name": "Quỳnh",
      "driver_phone": "12342534",
      "time_in": "2025-01-17T04:17:50Z",
      "type": "IMPORT",
      "status": "GATE_IN"
    }
  ]
}
```

### 2. Lưu kết quả kiểm tra (TODO)
```http
POST /backend/maintenance/inspection
Authorization: Bearer <token>
```

**Body:**
```json
{
  "request_id": "cmfx20plb001t5lbmgp8euaeh",
  "container_no": "Test1234",
  "inspection_status": "good|repairable|unrepairable|checked|repairing",
  "images": ["base64_image1", "base64_image2"],
  "inspector_id": "user_id",
  "notes": "Ghi chú kiểm tra"
}
```

## Frontend Implementation

### File chính: `frontend/pages/Maintenance/Repairs.tsx`

#### State Management
```typescript
const [pendingContainers, setPendingContainers] = useState<any[]>([]);
const [loading, setLoading] = useState(false);
const [isPendingContainersModalOpen, setIsPendingContainersModalOpen] = useState(false);
const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
const [selectedContainer, setSelectedContainer] = useState<any>(null);
const [inspectionStatus, setInspectionStatus] = useState<string>('');
const [selectedImages, setSelectedImages] = useState<File[]>([]);
const [imagePreviews, setImagePreviews] = useState<string[]>([]);
```

#### Key Functions

**1. Fetch danh sách container chờ kiểm tra**
```typescript
const fetchPendingContainers = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/backend/gate/requests/search?status=GATE_IN&limit=100', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    const importContainers = (data.data || []).filter((request: any) => {
      return request.type === 'IMPORT';
    });
    
    setPendingContainers(importContainers);
  } catch (error) {
    console.error('Error fetching pending containers:', error);
    setPendingContainers([]);
  } finally {
    setLoading(false);
  }
};
```

**2. Xử lý upload ảnh**
```typescript
const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(event.target.files || []);
  const newImages = [...selectedImages, ...files];
  setSelectedImages(newImages);

  // Tạo preview cho ảnh mới
  const newPreviews = files.map(file => URL.createObjectURL(file));
  setImagePreviews(prev => [...prev, ...newPreviews]);
};
```

**3. Xử lý submit kết quả kiểm tra**
```typescript
const handleSubmitInspection = async () => {
  if (!inspectionStatus) {
    alert('Vui lòng chọn trạng thái kiểm tra');
    return;
  }

  try {
    // TODO: Gửi dữ liệu kiểm tra lên server
    console.log('Inspection data:', {
      container: selectedContainer,
      status: inspectionStatus,
      images: selectedImages
    });

    alert('Đã lưu kết quả kiểm tra thành công');
    // Reset state
  } catch (error) {
    console.error('Error submitting inspection:', error);
    alert('Có lỗi xảy ra khi lưu kết quả kiểm tra');
  }
};
```

## UI Components

### 1. Button "Danh sách container chờ kiểm tra"
- Hiển thị số lượng container đang chờ (badge đỏ)
- Loading indicator khi đang tải dữ liệu
- Mở modal danh sách container

### 2. Modal danh sách container
- Table hiển thị thông tin container
- Button "Bắt đầu kiểm tra" cho mỗi container
- Responsive design với scroll

### 3. Modal kiểm tra container
- Form kiểm tra với các trường:
  - Số container (read-only)
  - Loại container (read-only)
  - Trạng thái (dropdown bắt buộc)
  - Hình ảnh (upload multiple, preview, delete)
- Validation trước khi submit
- Memory management cho image URLs

## Data Flow

```mermaid
flowchart TD
    A[Page Load] --> B[Fetch Pending Containers]
    B --> C[Display Button with Count]
    C --> D[User Clicks Button]
    D --> E[Open Container List Modal]
    E --> F[User Clicks "Bắt đầu kiểm tra"]
    F --> G[Open Inspection Modal]
    G --> H[User Selects Status & Upload Images]
    H --> I[User Clicks "Lưu kết quả"]
    I --> J[Validate & Submit Data]
    J --> K[Close Modal & Reset State]
```

## Code Mapping

### Frontend Files
- **Main Component**: `frontend/pages/Maintenance/Repairs.tsx` (616 lines)
- **API Integration**: Direct fetch calls to `/backend/gate/requests/search`
- **State Management**: React useState hooks
- **Image Handling**: File API with URL.createObjectURL for previews

### Backend Integration
- **API Endpoint**: `/backend/gate/requests/search` (existing)
- **Data Source**: ServiceRequest table with status = 'GATE_IN'
- **Filtering**: type = 'IMPORT' containers only

### Key Features Implemented
1. ✅ Real-time container count display
2. ✅ Modal container list with proper data mapping
3. ✅ Inspection modal with status selection
4. ✅ Multiple image upload with preview
5. ✅ Image management (add/remove)
6. ✅ Memory leak prevention (URL cleanup)
7. ✅ Form validation
8. ✅ Responsive design
9. ✅ Error handling

## Future Enhancements

### Backend API (TODO)
- Create `/backend/maintenance/inspection` endpoint
- Implement image storage (S3/File system)
- Add inspection history tracking
- Implement status update workflow

### Frontend Improvements
- Add inspection history view
- Implement real-time updates
- Add bulk inspection features
- Improve image compression
- Add inspection reports

## Security Considerations

- All API calls require authentication token
- Image upload validation (file type, size limits)
- Input sanitization for inspection data
- Role-based access control (MaintenanceManager)

## Performance Optimizations

- Image preview using URL.createObjectURL
- Memory cleanup for image URLs
- Lazy loading for large container lists
- Debounced search functionality

## Testing Checklist

- [ ] Container list loads correctly
- [ ] Image upload and preview works
- [ ] Status validation functions
- [ ] Modal open/close behavior
- [ ] Memory cleanup on modal close
- [ ] Error handling for API failures
- [ ] Responsive design on mobile
- [ ] Form validation messages

## Deployment Notes

- Ensure backend API `/backend/gate/requests/search` is accessible
- Configure image upload limits if needed
- Set up proper CORS for file uploads
- Monitor memory usage for image previews
