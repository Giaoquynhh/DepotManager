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

// Route để lấy containers trong yard theo shipping line cho lift request
router.get('/yard/by-shipping-line/:shipping_line_id', (req, res) => {
  const { shipping_line_id } = req.params;
  const { q: searchQuery } = req.query;
  controller.getContainersInYardByShippingLine(req as any, res, shipping_line_id, searchQuery as string);
});

router.get('/:container_no', (req, res) => controller.get(req as any, res));
router.put('/:container_no', (req, res) => controller.updateContainer(req, res));
router.get('/alerts/list', (req, res) => controller.alerts(req as any, res));

export default router;


