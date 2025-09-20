import { Router } from 'express';
import controller from './ContainerController';
import { authenticate, AuthRequest } from '../../../shared/middlewares/auth';
import { requireRoles } from '../../../shared/middlewares/rbac';
import reportsService from '../../reports/service/ReportsService';
import { containerListQuerySchema } from '../../reports/dto/ReportDtos';

const router = Router();
router.use(authenticate, requireRoles('TechnicalDepartment','SystemAdmin','Accountant'));

// Route để lấy danh sách containers (forward đến ReportsService)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { error, value } = containerListQuerySchema.validate(req.query);
    if (error) return res.status(400).json({ message: error.message });
    
    const result = await reportsService.listContainers(req.user!, value);
    return res.json(result);
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
});

router.get('/:container_no', (req, res) => controller.get(req as any, res));
router.get('/alerts/list', (req, res) => controller.alerts(req as any, res));

export default router;


