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
    cb(null, 'uploads/reports/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
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
  const filePath = path.join(__dirname, '../../../uploads/reports', filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ message: 'File not found' });
  }
});

// Lấy lịch sử task
router.get('/tasks/history', (req, res) => controller.getTaskHistory(req as any, res));

export default router;
