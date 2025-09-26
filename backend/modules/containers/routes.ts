import { Router } from 'express';
import { ContainerController } from './controller/ContainerController';
import { auth } from '../../shared/middlewares/auth';

const router = Router();
const controller = new ContainerController();

// Cập nhật thông tin container
router.put('/:container_no', auth, controller.updateContainerInfo.bind(controller));

export default router;

