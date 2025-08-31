# Frontend EIR (Equipment Interchange Receipt) System Documentation

## 📋 Tổng quan hệ thống

Frontend EIR system cho phép người dùng upload EIR files khi tạo hóa đơn và xem EIR files theo container number. Hệ thống đã được sửa để sử dụng đúng API instance với authentication và xử lý file binary responses.

## 🏗️ Kiến trúc hệ thống

### 1. **File Structure**
```
frontend/
├── pages/
│   └── finance/
│       ├── invoices/
│       │   └── index.tsx          # Danh sách hóa đơn với link "Xem EIR"
│       └── eir/
│           └── container/
│               └── [containerNo].tsx  # Trang xem EIR theo container
├── components/
│   ├── Header.tsx                  # Header component
│   └── CreateInvoiceModal.tsx      # Modal tạo hóa đơn với upload EIR
└── services/
    └── api.ts                      # API instance với authentication
```

### 2. **API Configuration**

#### **File: `services/api.ts`**
```typescript
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/backend';
export const api = axios.create({ baseURL: API_BASE });

// Authentication interceptor
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      if (!config.headers) config.headers = {} as any;
      (config.headers as any)['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-refresh token interceptor
api.interceptors.response.use(r => r, async (error) => {
  const status = error?.response?.status;
  if (status === 401 && !isRefreshing) {
    // Auto refresh token logic
  }
  return Promise.reject(error);
});
```

**Path Alias Configuration (`tsconfig.json`):**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@services/*": ["services/*"],
      "@components/*": ["components/*"],
      "@utils/*": ["utils/*"]
    }
  }
}
```

### 3. **Components**

#### **CreateInvoiceModal.tsx - Upload EIR khi tạo hóa đơn**
```typescript
import { api } from '@services/api';

export default function CreateInvoiceModal({ isOpen, onClose, container }: CreateInvoiceModalProps) {
  const [eirFile, setEirFile] = useState<File | null>(null);
  
  const handleCreateInvoice = async () => {
    try {
      // Nếu có file EIR, upload trước khi tạo hóa đơn
      let eirFilePath = null;
      if (eirFile) {
        console.log('📤 Đang upload file EIR...');
        
        const formData = new FormData();
        formData.append('file', eirFile);
        formData.append('container_no', container.container_no);
        formData.append('type', 'EIR');

        const uploadResponse = await api.post('/finance/upload/eir', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (uploadResponse.data.success) {
          eirFilePath = uploadResponse.data.data.upload_path;
          console.log('✅ Upload EIR thành công:', eirFilePath);
        }
      }

      // Tạo hóa đơn với thông tin chi phí
      // ... logic tạo hóa đơn
    } catch (error) {
      console.error('❌ Lỗi:', error);
    }
  };
}
```

**Workflow Upload EIR:**
1. **Chọn file** → `handleFileChange` → `setEirFile`
2. **Click "Hoàn tất"** → `handleCreateInvoice`
3. **Upload EIR** → `api.post('/finance/upload/eir', formData)`
4. **Tạo hóa đơn** → Với thông tin EIR đã upload

#### **Invoices List - Link "Xem EIR"**
```typescript
// pages/finance/invoices/index.tsx
<Link href={`/finance/eir/container/${invoice.serviceRequest.container_no}`} 
      style={{color:'#1976d2', textDecoration:'none'}}>
  Xem EIR
</Link>
```

**URL Structure:**
- **Danh sách hóa đơn**: `/finance/invoices`
- **Xem EIR**: `/finance/eir/container/{containerNo}`
- **Backend API**: `/backend/finance/eir/container/{containerNo}`

### 4. **EIR Viewer Page**

#### **File: `pages/finance/eir/container/[containerNo].tsx`**
```typescript
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from '../../../../components/Header';
import { api } from '@services/api';

export default function ViewEIRByContainer() {
  const router = useRouter();
  const { containerNo } = router.query;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eirData, setEirData] = useState<any>(null);

  useEffect(() => {
    if (containerNo) {
      fetchEIRData();
    }
  }, [containerNo]);

  const fetchEIRData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Gọi API để lấy thông tin EIR với authentication
      const response = await api.get(`/finance/eir/container/${containerNo}`, {
        responseType: 'blob' // Để nhận file binary
      });
      
      // Lấy thông tin file từ response
      const contentType = response.headers['content-type'];
      const contentLength = response.headers['content-length'];
      const contentDisposition = response.headers['content-disposition'];
      
      // Lấy filename từ content-disposition header
      let filename = 'EIR';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      // Tạo URL cho file để hiển thị
      const blob = new Blob([response.data], { type: contentType });
      const fileUrl = URL.createObjectURL(blob);

      setEirData({
        contentType,
        contentLength,
        filename,
        url: fileUrl,
        blob: blob
      });

    } catch (err: any) {
      console.error('Error fetching EIR:', err);
      setError('Lỗi khi tải EIR: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (eirData?.blob) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(eirData.blob);
      link.download = eirData.filename;
      link.target = '_blank';
      link.click();
    }
  };
}
```

**Key Features:**
- **Authentication**: Sử dụng `api` instance với auto-token
- **Binary Response**: `responseType: 'blob'` để nhận file
- **Blob URL**: Tạo URL để hiển thị file trực tiếp
- **Download**: Nút download sử dụng blob data

### 5. **File Display Logic**

```typescript
const isImage = eirData?.contentType?.startsWith('image/');
const isPdf = eirData?.contentType === 'application/pdf';

return (
  <div>
    {isImage ? (
      <img 
        src={eirData.url} 
        alt={`EIR for container ${containerNo}`}
        style={{ maxWidth: '100%', maxHeight: '600px' }}
        onError={() => setError('Không thể hiển thị hình ảnh')}
      />
    ) : isPdf ? (
      <iframe
        src={eirData.url}
        title={`EIR for container ${containerNo}`}
        style={{ width: '100%', height: '600px' }}
      />
    ) : (
      <div>
        <p>Không thể hiển thị file này trực tiếp</p>
        <p>Vui lòng tải xuống để xem</p>
      </div>
    )}
  </div>
);
```

**File Type Support:**
- **Images** (PNG, JPG, JPEG, GIF): Hiển thị trực tiếp với `<img>`
- **PDFs**: Hiển thị với `<iframe>`
- **Other files**: Hiển thị thông báo và nút download

## 🔄 Data Flow

### **1. Upload EIR Flow**
```
User selects EIR file → CreateInvoiceModal → FormData → Backend API → Database → Response
```

### **2. View EIR Flow**
```
User clicks "Xem EIR" → Navigate to /finance/eir/container/{containerNo} → 
fetchEIRData() → Backend API → Blob Response → Create Blob URL → Display File
```

### **3. Authentication Flow**
```
Page Load → Check localStorage token → API request with Bearer token → 
Backend validates → Response (success/401) → Auto refresh if 401
```

## 🚀 Deployment & Testing

### **1. Development Mode**
```bash
# Khởi động frontend
npm run dev

# Frontend sẽ chạy trên port 5002
# Backend proxy: /backend/* → http://localhost:1000/*
```

### **2. Test Frontend**
```bash
# 1. Mở http://localhost:5002/finance/invoices
# 2. Click "Tạo hóa đơn" cho container ISO 1234
# 3. Upload EIR file
# 4. Click "Hoàn tất"
# 5. Click "Xem EIR" để xem file
```

### **3. Environment Variables**
```env
# .env.local
NEXT_PUBLIC_API_BASE_URL=/backend
```

## 🔍 Troubleshooting

### **Vấn đề thường gặp:**

1. **"Cannot read properties of undefined (reading 'get')"**
   - **Nguyên nhân**: Import path sai hoặc path alias chưa được cấu hình
   - **Giải pháp**: Sử dụng `import { api } from '@services/api'`

2. **"Request failed with status code 404"**
   - **Nguyên nhân**: Backend API endpoint không tồn tại hoặc container không có EIR
   - **Giải pháp**: Kiểm tra backend logs và database

3. **"Unauthorized" error**
   - **Nguyên nhân**: Token hết hạn hoặc không được gửi
   - **Giải pháp**: Đăng nhập lại để refresh token

4. **File không hiển thị**
   - **Nguyên nhân**: Content-Type không được xử lý đúng
   - **Giải pháp**: Kiểm tra response headers và blob creation

## 📝 Changelog

### **v1.1.0 - Fix EIR Viewing Issues**
- ✅ Sửa import path để sử dụng `@services/api` alias
- ✅ Thay thế `fetch()` bằng `api.get()` với authentication
- ✅ Thêm `responseType: 'blob'` để xử lý file binary
- ✅ Cải thiện error handling và user experience

### **v1.0.0 - Initial Implementation**
- ✅ Upload EIR trong CreateInvoiceModal
- ✅ Link "Xem EIR" trong danh sách hóa đơn
- ✅ Trang xem EIR theo container number
- ✅ Basic file display logic

## 🔗 Related Files

- **Backend**: `manageContainer/backend/README_EIR_SYSTEM.md`
- **API**: `manageContainer/frontend/services/api.ts`
- **Components**: `manageContainer/frontend/components/CreateInvoiceModal.tsx`
- **Pages**: `manageContainer/frontend/pages/finance/eir/container/[containerNo].tsx`
- **Config**: `manageContainer/frontend/tsconfig.json`
