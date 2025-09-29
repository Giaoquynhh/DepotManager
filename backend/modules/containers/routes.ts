import { Router } from 'express';
import ContainerController from './controller/ContainerController';
import { authenticate } from '../../shared/middlewares/auth';

const router = Router();

// Cập nhật thông tin container
router.put('/:container_no', authenticate, ContainerController.updateContainerInfo.bind(ContainerController));

export default router;

