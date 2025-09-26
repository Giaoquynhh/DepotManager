import { Router } from 'express';
import controller from './DriverDashboardController';
import { authenticate } from '../../../shared/middlewares/auth';
import { requireRoles } from '../../../shared/middlewares/rbac';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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

// Cấu hình upload ảnh báo cáo cho Forklift Task
// Lưu vào thư mục đã tồn tại: backend/uploads/reports (tính từ thư mục backend)
// Dùng __dirname để tránh lệ thuộc process.cwd()
const reportsDir = path.join(__dirname, '../../../uploads/reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, reportsDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `forklift_report_${unique}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// Upload ảnh báo cáo cho task
router.post('/tasks/:taskId/images', upload.array('files', 10), (req, res) => controller.uploadTaskImages(req as any, res));

// Danh sách ảnh báo cáo của task
router.get('/tasks/:taskId/images', (req, res) => controller.getTaskImages(req as any, res));

// Xóa ảnh báo cáo
router.delete('/tasks/:taskId/images/:imageId', (req, res) => controller.deleteTaskImage(req as any, res));

// Lấy lịch sử task
router.get('/tasks/history', (req, res) => controller.getTaskHistory(req as any, res));

export default router;
