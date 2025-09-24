import { Router } from 'express';
import { RepairController } from './RepairController';
import { authenticate } from '../../../shared/middlewares/auth';
import { requireRoles } from '../../../shared/middlewares/rbac';

const router = Router();
const repairController = new RepairController();

// Tất cả routes đều cần authentication
router.use(authenticate);

// Lấy danh sách repair tickets
router.get(
  '/repairs',
  requireRoles('SystemAdmin', 'BusinessAdmin', 'TechnicalDepartment', 'MaintenanceManager'),
  repairController.getRepairs.bind(repairController)
);

export default router;
