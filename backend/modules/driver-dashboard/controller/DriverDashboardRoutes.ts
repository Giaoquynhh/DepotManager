import { Router } from 'express';
import controller from './DriverDashboardController';
import { authenticate } from '../../../shared/middlewares/auth';
import { requireRoles } from '../../../shared/middlewares/rbac';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Cấu hình multer cho upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Sử dụng đường dẫn tuyệt đối cố định
    const uploadPath = 'D:\\container20\\manageContainer\\backend\\uploads\\reports';
    
    console.log('=== MULTER DEBUG ===');
    console.log('Multer upload destination:', uploadPath);
    
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(uploadPath)) {
      console.log('Creating multer upload directory:', uploadPath);
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log('Multer upload directory created successfully');
    } else {
      console.log('Multer upload directory already exists');
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + '-' + file.originalname;
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // Giới hạn 5MB
  }
});

const router = Router();

// Tất cả routes đều yêu cầu authentication và role Driver
router.use(authenticate, requireRoles('Driver'));

// Dashboard chính
router.get('/dashboard', (req, res) => controller.getDashboard(req as any, res));

// Lấy danh sách task được giao
router.get('/tasks', (req, res) => controller.getAssignedTasks(req as any, res));

// Cập nhật trạng thái task
router.patch('/tasks/:taskId/status', (req, res) => controller.updateTaskStatus(req as any, res));

// Cập nhật chi phí task
router.patch('/tasks/:taskId/cost', (req, res) => controller.updateTaskCost(req as any, res));

// Upload ảnh báo cáo
router.post('/tasks/:taskId/report', upload.single('report_image'), (req, res) => {
  controller.uploadReportImage(req as any, res);
});

// Serve ảnh báo cáo (public access)
router.get('/reports/:filename', (req, res) => {
  const { filename } = req.params;
  // Sử dụng đường dẫn tuyệt đối cố định
  const filePath = path.join('D:\\container20\\manageContainer\\backend\\uploads\\reports', filename);
  
  console.log('=== SERVING FILE DEBUG ===');
  console.log('Filename:', filename);
  console.log('Full file path:', filePath);
  
  if (fs.existsSync(filePath)) {
    console.log('File found, serving:', filePath);
    res.sendFile(filePath);
  } else {
    console.log('File not found:', filePath);
    res.status(404).json({ message: 'File not found' });
  }
});

// Lấy lịch sử task
router.get('/tasks/history', (req, res) => controller.getTaskHistory(req as any, res));

export default router;
