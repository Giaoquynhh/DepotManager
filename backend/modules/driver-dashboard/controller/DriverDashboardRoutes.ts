import { Router } from 'express';
import controller from './DriverDashboardController';
import { authenticate } from '../../../shared/middlewares/auth';
import { requireRoles } from '../../../shared/middlewares/rbac';

const router = Router();

// Tất cả routes đều yêu cầu authentication và role Driver
router.use(authenticate, requireRoles('Driver'));

// Dashboard chính
router.get('/dashboard', (req, res) => controller.getDashboard(req as any, res));

// Lấy danh sách task được giao
router.get('/tasks', (req, res) => controller.getAssignedTasks(req as any, res));

// Cập nhật trạng thái task
router.patch('/tasks/:taskId/status', (req, res) => controller.updateTaskStatus(req as any, res));

// Lấy lịch sử task
router.get('/tasks/history', (req, res) => controller.getTaskHistory(req as any, res));

export default router;
