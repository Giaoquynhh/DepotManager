import { Router } from 'express';
import { repairImageService } from '../service/RepairImageService';
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

// Upload images for a repair ticket (images for RepairTicket, not Request documents)
router.post(
  '/repairs/:id/images',
  requireRoles('SystemAdmin', 'BusinessAdmin', 'TechnicalDepartment', 'MaintenanceManager'),
  repairImageService.getMulter().array('files', 10),
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) return res.status(400).json({ message: 'No files' });
      const created = await repairImageService.upload(id, files);
      res.json({ success: true, data: created });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message || 'Upload error' });
    }
  }
);

// List images for a repair ticket
router.get(
  '/repairs/:id/images',
  requireRoles('SystemAdmin', 'BusinessAdmin', 'TechnicalDepartment', 'MaintenanceManager'),
  async (req, res) => {
    try {
      const data = await repairImageService.list((req as any).params.id);
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message || 'List error' });
    }
  }
);

export default router;
