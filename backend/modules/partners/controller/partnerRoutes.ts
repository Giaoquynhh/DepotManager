import { Router } from 'express';
import controller from './partnerController';
import { requireRoles } from '../../../shared/middlewares/rbac';

const router = Router();

router.get('/', requireRoles('SystemAdmin','TechnicalDepartment'), (req, res) => controller.list(req as any, res));
router.post('/', requireRoles('SystemAdmin','TechnicalDepartment'), (req, res) => controller.create(req as any, res));
router.patch('/:id', requireRoles('SystemAdmin'), (req, res) => controller.update(req as any, res));
router.post('/:id/activate', requireRoles('SystemAdmin'), (req, res) => controller.activate(req as any, res));
router.post('/:id/deactivate', requireRoles('SystemAdmin'), (req, res) => controller.deactivate(req as any, res));
// Route tạo primary-admin (CustomerAdmin) đã vô hiệu hoá

export default router;
