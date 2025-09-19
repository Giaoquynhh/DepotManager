import { Router } from 'express';
import controller from './customerController';
import { requireRoles } from '../../../shared/middlewares/rbac';

const router = Router();

router.get('/', requireRoles('SystemAdmin','SaleAdmin'), (req, res) => controller.list(req as any, res));
// Đã tạm gỡ API partners theo yêu cầu
router.post('/', requireRoles('SystemAdmin','SaleAdmin'), (req, res) => controller.create(req as any, res));
router.patch('/:id', requireRoles('SystemAdmin','SaleAdmin'), (req, res) => controller.update(req as any, res));
router.patch('/:id/disable', requireRoles('SystemAdmin','SaleAdmin'), (req, res) => controller.disable(req as any, res));
router.delete('/:id', requireRoles('SystemAdmin','SaleAdmin'), (req, res) => controller.delete(req as any, res));

export default router;
