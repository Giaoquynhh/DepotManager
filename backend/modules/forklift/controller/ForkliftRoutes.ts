import { Router } from 'express';
import controller from './ForkliftController';
import { authenticate } from '../../../shared/middlewares/auth';
import { requireRoles } from '../../../shared/middlewares/rbac';

const router = Router();

router.use(authenticate, requireRoles('SaleAdmin','SystemAdmin','YardManager'));

// List all forklift jobs
router.get('/jobs', (req, res) => controller.listJobs(req, res));

// Assign driver to a job
router.patch('/jobs/:jobId/assign-driver', (req, res) => controller.assignDriver(req as any, res));

// Start a job
router.patch('/jobs/:jobId/start', (req, res) => controller.startJob(req as any, res));

// Complete a job
router.patch('/jobs/:jobId/complete', (req, res) => controller.completeJob(req as any, res));

// Cancel a job
router.patch('/jobs/:jobId/cancel', (req, res) => controller.cancelJob(req as any, res));

export default router;


