# EIR (Equipment Interchange Receipt) System Documentation

## 📋 Tổng quan hệ thống

Hệ thống EIR cho phép upload, lưu trữ và xem các file EIR cho từng container. Hệ thống đã được sửa để giải quyết vấn đề tên file "UNKNOWN" và cải thiện logic tìm kiếm EIR documents.

## 🏗️ Kiến trúc hệ thống

### 1. **Multer Storage Configuration**
```typescript
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'D:\\container21\\manageContainer\\backend\\uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    
    // Vấn đề: req.body chưa được parse khi filename function được gọi
    // Giải pháp: Sử dụng originalname để tạo tên file tạm thời
    // Sau đó sẽ đổi tên file trong route handler
    const tempFilename = `EIR_TEMP_${uniqueSuffix}_${file.originalname}`;
    console.log('📁 Creating temporary filename:', tempFilename);
    cb(null, tempFilename);
  }
});
```

**Lý do sử dụng tên file tạm thời:**
- Multer storage configuration được thực thi **TRƯỚC KHI** `req.body` được parse
- Khi `filename` function được gọi, `req.body.container_no` vẫn là `undefined`
- Giải pháp: Tạo tên file tạm thời, sau đó đổi tên trong route handler

### 2. **API Endpoints**

#### **POST `/finance/upload/eir` - Upload EIR File**
```typescript
router.post('/upload/eir', upload.single('file'), async (req: any, res: any) => {
  // 1. Đổi tên file từ TEMP thành tên chính xác với container number
  const oldFilePath = req.file.path;
  const oldFilename = req.file.filename;
  const fileExtension = path.extname(req.file.originalname);
  const newFilename = `EIR_${container_no}_${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
  const newFilePath = path.join(path.dirname(oldFilePath), newFilename);
  
  try {
    fs.renameSync(oldFilePath, newFilePath);
    console.log('📁 Đã đổi tên file:', oldFilename, '→', newFilename);
    
    // Cập nhật req.file để sử dụng tên mới
    req.file.filename = newFilename;
    req.file.path = newFilePath;
  } catch (renameError) {
    console.error('❌ Lỗi khi đổi tên file:', renameError);
  }

  // 2. Tìm request tương ứng với container_no
  const request = await prisma.serviceRequest.findFirst({
    where: { container_no: container_no },
    orderBy: { createdAt: 'desc' }
  });

  // 3. Lưu thông tin file vào database
  const document = await prisma.documentFile.create({
    data: {
      request_id: request.id,
      type: 'EIR',
      name: req.file.originalname,
      size: req.file.size,
      version: 1,
      uploader_id: req.user._id,
      storage_key: req.file.filename // Tên file mới đã đổi
    }
  });
});
```

**Workflow:**
1. **Upload file** → Tạo tên file tạm thời: `EIR_TEMP_[timestamp]_[originalname]`
2. **Đổi tên file** → Tên file chính xác: `EIR_[container_no]_[timestamp]_[originalname]`
3. **Lưu database** → `DocumentFile` với `storage_key` chính xác
4. **Response** → Trả về thông tin file và metadata

#### **GET `/finance/eir/container/:container_no` - Xem EIR theo Container**
```typescript
router.get('/eir/container/:container_no', async (req: any, res: any) => {
  const { container_no } = req.params;
  
  // Tìm request và EIR document
  const request = await prisma.serviceRequest.findFirst({
    where: { container_no: container_no },
    include: {
      docs: {
        where: { type: 'EIR', deleted_at: null },
        orderBy: { createdAt: 'desc' }, // Sử dụng createdAt thay vì version
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!request || !request.docs.length) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy EIR cho container này' });
  }

  const eirDoc = request.docs[0];
  const filename = eirDoc.storage_key;
  const filePath = path.join('D:\\container21\\manageContainer\\backend\\uploads', filename);
  
  // Kiểm tra file có tồn tại không
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File EIR không tồn tại trên server' });
  }

  // Set headers và stream file
  const stats = fs.statSync(filePath);
  const ext = path.extname(filename).toLowerCase();
  
  let contentType = 'application/octet-stream';
  if (ext === '.pdf') {
    contentType = 'application/pdf';
  } else if (['.png', '.jpg', '.jpeg', '.gif'].includes(ext)) {
    contentType = `image/${ext.slice(1)}`;
  }

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', stats.size);
  res.setHeader('Content-Disposition', `inline; filename="${eirDoc.name}"`);

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});
```

**Lý do sử dụng `createdAt` thay vì `version`:**
- **Vấn đề cũ**: `orderBy: { version: 'desc' }` có thể trả về document cũ với `storage_key` sai
- **Giải pháp**: `orderBy: { createdAt: 'desc' }` luôn trả về document mới nhất
- **Kết quả**: Đảm bảo luôn tìm thấy EIR document mới nhất với tên file chính xác

### 3. **Database Schema**

#### **ServiceRequest Table**
```sql
- id: string (Primary Key)
- container_no: string (Container number)
- type: string (IMPORT/EXPORT)
- status: string (PENDING, GATE_OUT, etc.)
- createdAt: DateTime
```

#### **DocumentFile Table**
```sql
- id: string (Primary Key)
- request_id: string (Foreign Key to ServiceRequest)
- type: string (EIR, INITIAL_DOC, etc.)
- name: string (Original filename)
- size: number (File size in bytes)
- version: number (Document version)
- uploader_id: string (User who uploaded)
- storage_key: string (Filename on disk)
- createdAt: DateTime
```

### 4. **File Naming Convention**

#### **Tên file tạm thời (Multer):**
```
EIR_TEMP_[timestamp]_[originalname]
```

#### **Tên file cuối cùng:**
```
EIR_[container_no]_[timestamp]-[random]_[extension]
```

**Ví dụ:**
```
EIR_ISO 1234_1756581445318-265458486.png
```

### 5. **Error Handling**

#### **Upload Errors:**
- `400`: Không có file được upload
- `400`: Container number là bắt buộc
- `404`: Không tìm thấy request cho container
- `500`: Lỗi server khi upload

#### **View Errors:**
- `400`: Container number là bắt buộc
- `404`: Không tìm thấy EIR cho container
- `404`: File EIR không tồn tại trên server
- `500`: Lỗi server khi xem file

## 🚀 Deployment & Testing

### **1. Restart Backend**
```bash
# Kill process cũ
taskkill /PID [PID] /F

# Khởi động lại
npm run dev
```

### **2. Test API Endpoints**
```bash
# Test upload EIR
curl -X POST "http://localhost:1000/finance/upload/eir" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-eir.png" \
  -F "container_no=ISO 1234" \
  -F "type=EIR"

# Test xem EIR
curl -X GET "http://localhost:1000/finance/eir/container/ISO%201234"
```

### **3. Kiểm tra Database**
```bash
# Chạy script kiểm tra
node check-eir-database.js
```

## 🔍 Troubleshooting

### **Vấn đề thường gặp:**

1. **File vẫn có tên "UNKNOWN"**
   - **Nguyên nhân**: Backend chưa được restart sau khi sửa code
   - **Giải pháp**: Restart backend process

2. **API trả về 404**
   - **Nguyên nhân**: Container không có EIR documents hoặc file không tồn tại trên disk
   - **Giải pháp**: Kiểm tra database và thư mục uploads

3. **Lỗi authentication**
   - **Nguyên nhân**: Frontend không gửi token hoặc token hết hạn
   - **Giải pháp**: Kiểm tra localStorage và refresh token

## 📝 Changelog

### **v1.1.0 - Fix EIR Filename Issue**
- ✅ Sửa multer storage configuration để tạo tên file tạm thời
- ✅ Thêm logic đổi tên file trong route handler
- ✅ Sửa orderBy từ `version` sang `createdAt` để tìm document mới nhất
- ✅ Cải thiện error handling và logging

### **v1.0.0 - Initial Implementation**
- ✅ Upload EIR files với multer
- ✅ Lưu metadata vào database
- ✅ API xem EIR theo container number
- ✅ Basic error handling
