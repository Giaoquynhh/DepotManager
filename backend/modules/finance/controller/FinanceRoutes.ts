import { Router } from 'express';
import invoiceCtrl from './InvoiceController';
import paymentCtrl from './PaymentController';
import serviceCatalogCtrl from './ServiceCatalogController';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../../../shared/middlewares/auth';
import { requireRoles } from '../../../shared/middlewares/rbac';

// Cấu hình multer cho upload EIR file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Sử dụng đường dẫn tuyệt đối cố định
    const uploadPath = 'D:\\container35\\manageContainer\\backend\\uploads';
    
    // Tạo thư mục nếu chưa tồn tại
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

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Chỉ chấp nhận PDF và hình ảnh
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file PDF hoặc hình ảnh'));
    }
  }
});

const router = Router();

// Route riêng cho customer xem hóa đơn của họ (không cần quyền SaleAdmin)
router.get('/invoices/details', authenticate, (req, res) => invoiceCtrl.getCustomerInvoices(req as any, res));

// Route riêng cho customer xem EIR (không cần quyền SaleAdmin)
router.get('/eir/container/:container_no', authenticate, async (req: any, res: any) => {
  try {
    const { container_no } = req.params;
    
    
    if (!container_no) {
      return res.status(400).json({ success: false, message: 'Container number là bắt buộc' });
    }

    // Tìm request và EIR document
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const request = await prisma.serviceRequest.findFirst({
      where: { container_no: container_no },
      include: {
        docs: {
          where: { type: 'EIR', deleted_at: null },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });


    if (!request || !request.docs.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy EIR cho container này' });
    }

    // Kiểm tra quyền: customer chỉ có thể xem EIR của container họ tạo
    
    if (req.user.role === 'CustomerAdmin' || req.user.role === 'CustomerUser') {
      if (request.created_by !== req.user._id) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền xem EIR của container này' });
      }
    }

    const eirDoc = request.docs[0];
    const filename = eirDoc.storage_key;
    const filePath = path.join('D:\\container35\\manageContainer\\backend\\uploads', filename);
    
    
    // Kiểm tra file có tồn tại không
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File EIR không tồn tại trên server' });
    }
    

    // Lấy thông tin file
    const stats = fs.statSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    
    // Set content type dựa trên extension
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (['.png', '.jpg', '.jpeg', '.gif'].includes(ext)) {
      contentType = `image/${ext.slice(1)}`;
    }

    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `inline; filename="${eirDoc.name}"`);

    // Stream file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error: any) {
    console.error('Error serving EIR file by container:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Lỗi khi xem file' 
    });
  }
});

// Middleware authentication và RBAC cho các route khácnnanày đoiđoi
router.use(authenticate, requireRoles('TechnicalDepartment','SystemAdmin'));

// Routes hiện tại
router.get('/invoices', (req, res) => invoiceCtrl.list(req as any, res));
router.get('/invoices/details', (req, res) => invoiceCtrl.listWithDetails(req as any, res));
router.get('/invoices/containers-need-invoice', (req, res) => invoiceCtrl.getContainersNeedInvoice(req as any, res));
// API V2: danh sách hóa đơn kèm dữ liệu chuẩn hóa cho UI
router.get('/invoices/v2', (req, res) => invoiceCtrl.listV2(req as any, res));
// Xuất PDF hóa đơn
router.get('/invoices/:id/pdf', (req, res) => invoiceCtrl.exportPdf(req as any, res));
// Đã bỏ endpoint xem chi tiết hóa đơn theo yêu cầu (loại bỏ nút Xem ở FE)
router.post('/invoices', (req, res) => invoiceCtrl.create(req as any, res));
router.patch('/invoices/:id', (req, res) => invoiceCtrl.patch(req as any, res));
router.post('/invoices/:id/issue', (req, res) => invoiceCtrl.issue(req as any, res));
router.post('/invoices/:id/cancel', (req, res) => invoiceCtrl.cancel(req as any, res));
router.delete('/invoices/cleanup', (req, res) => invoiceCtrl.cleanup(req as any, res));



// Routes mới
router.post('/upload/eir', upload.single('file'), async (req: any, res: any) => {
  try {
    console.log('📤 Upload EIR request received:');
    console.log('  - req.body:', req.body);
    console.log('  - req.file:', req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      path: req.file.path
    } : 'No file');
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không có file được upload' });
    }

    const { container_no, type } = req.body;
    console.log('  - container_no:', container_no);
    console.log('  - type:', type);
    
    if (!container_no) {
      return res.status(400).json({ success: false, message: 'Container number là bắt buộc' });
    }

    // Đổi tên file từ TEMP thành tên chính xác với container number
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
      // Nếu không đổi tên được, vẫn tiếp tục với tên cũ
    }

    // Tìm request tương ứng với container_no
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    
    const request = await prisma.serviceRequest.findFirst({
      where: { container_no: container_no },
      orderBy: { createdAt: 'desc' }
    });

    if (!request) {
      console.log('❌ Không tìm thấy request cho container:', container_no);
      return res.status(404).json({ 
        success: false, 
        message: `Không tìm thấy request cho container ${container_no}` 
      });
    }

    console.log('✅ Tìm thấy request:', request);

    // Lưu thông tin file vào database
    const document = await prisma.documentFile.create({
      data: {
        request_id: request.id,
        type: 'EIR',
        name: req.file.originalname,
        size: req.file.size,
        version: 1,
        uploader_id: req.user._id,
        storage_key: req.file.filename
      }
    });

    console.log('✅ Đã lưu EIR document vào database:', document);

    res.json({
      success: true,
      message: 'Upload EIR thành công',
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        container_no: container_no,
        request_id: request.id,
        document_id: document.id,
        upload_path: req.file.path
      }
    });
  } catch (error: any) {
    console.error('Error uploading EIR:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Lỗi khi upload file' 
    });
  }
  });
  
  // Route EIR đã được di chuyển lên trên để cho phép customer truy cập
  
  // API để xem file EIR theo filename
  router.get('/eir/:filename', async (req: any, res: any) => {
    try {
      const { filename } = req.params;
      
      if (!filename) {
        return res.status(400).json({ success: false, message: 'Tên file là bắt buộc' });
      }

      const filePath = path.join('D:\\container35\\manageContainer\\backend\\uploads', filename);
      
      // Kiểm tra file có tồn tại không
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'File không tồn tại' });
      }

      // Lấy thông tin file
      const stats = fs.statSync(filePath);
      const ext = path.extname(filename).toLowerCase();
      
      // Set content type dựa trên extension
      let contentType = 'application/octet-stream';
      if (ext === '.pdf') {
        contentType = 'application/pdf';
      } else if (['.png', '.jpg', '.jpeg', '.gif'].includes(ext)) {
        contentType = `image/${ext.slice(1)}`;
      }

      // Set headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

      // Stream file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

    } catch (error: any) {
      console.error('Error serving EIR file:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Lỗi khi xem file' 
      });
    }
  });
  
  // Route cập nhật trạng thái has_invoice - sử dụng RequestStatusController
router.patch('/requests/:id/invoice-status', (req, res) => {
  // Redirect đến RequestStatusController
  const { RequestStatusController } = require('../../requests/controllers/RequestStatusController');
  const requestStatusCtrl = new RequestStatusController();
  return requestStatusCtrl.updateInvoiceStatus(req, res);
});

// Routes khác
router.get('/payments', (req, res) => paymentCtrl.list(req as any, res));
router.post('/payments', (req, res) => paymentCtrl.create(req as any, res));
router.get('/service-catalog', (req, res) => serviceCatalogCtrl.listServices(req as any, res));

export default router;



