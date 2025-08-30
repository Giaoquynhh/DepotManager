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
    const uploadPath = 'D:\\container21\\manageContainer\\backend\\uploads';
    
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const containerNo = req.body.container_no || 'UNKNOWN';
    const filename = `EIR_${containerNo}_${uniqueSuffix}_${file.originalname}`;
    console.log('📁 Creating filename:', filename, 'for container:', containerNo);
    cb(null, filename);
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

// Middleware authentication và RBAC
router.use(authenticate, requireRoles('SaleAdmin','SystemAdmin'));

// Routes hiện tại
router.get('/invoices', (req, res) => invoiceCtrl.list(req as any, res));
router.get('/invoices/details', (req, res) => invoiceCtrl.listWithDetails(req as any, res));
router.get('/invoices/containers-need-invoice', (req, res) => invoiceCtrl.getContainersNeedInvoice(req as any, res));
router.get('/invoices/:id', (req, res) => invoiceCtrl.get(req as any, res));
router.post('/invoices', (req, res) => invoiceCtrl.create(req as any, res));
router.patch('/invoices/:id', (req, res) => invoiceCtrl.patch(req as any, res));
router.post('/invoices/:id/issue', (req, res) => invoiceCtrl.issue(req as any, res));
router.post('/invoices/:id/cancel', (req, res) => invoiceCtrl.cancel(req as any, res));

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

    // Lưu thông tin file vào database nếu cần
    // TODO: Implement file tracking

    res.json({
      success: true,
      message: 'Upload EIR thành công',
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        container_no: container_no,
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
  
  // API để xem file EIR
  router.get('/eir/:filename', async (req: any, res: any) => {
    try {
      const { filename } = req.params;
      
      if (!filename) {
        return res.status(400).json({ success: false, message: 'Tên file là bắt buộc' });
      }

      const filePath = path.join('D:\\container21\\manageContainer\\backend\\uploads', filename);
      
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



