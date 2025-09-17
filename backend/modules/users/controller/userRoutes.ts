import { Router } from 'express';
import controller from './userController';
import { requireRoles } from '../../../shared/middlewares/rbac';

const router = Router();

router.get('/', requireRoles('SystemAdmin','SaleAdmin'), (req, res) => controller.list(req as any, res));
router.post('/', requireRoles('SystemAdmin','SaleAdmin'), (req, res) => controller.create(req as any, res));
router.patch('/:id', requireRoles('SystemAdmin'), (req, res) => controller.update(req as any, res));
router.patch('/:id/disable', requireRoles('SystemAdmin','SaleAdmin'), (req, res) => controller.disable(req as any, res));
router.patch('/:id/enable', requireRoles('SystemAdmin','SaleAdmin'), (req, res) => controller.enable(req as any, res));
router.patch('/:id/lock', requireRoles('SystemAdmin'), (req, res) => controller.lock(req as any, res));
router.patch('/:id/unlock', requireRoles('SystemAdmin'), (req, res) => controller.unlock(req as any, res));
router.delete('/:id', requireRoles('SystemAdmin'), (req, res) => controller.delete(req as any, res));

export default router;
