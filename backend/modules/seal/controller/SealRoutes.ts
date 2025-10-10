import { Router } from 'express';
import { authenticate } from '../../../shared/middlewares/auth';
import { validate } from '../../../shared/middlewares/validate';
import controller from './SealController';
import debugController from './SealDebugController';
import { CreateSealDto, UpdateSealDto, SealListQueryDto } from '../dto/SealDtos';

const router = Router();

// Create seal
router.post('/', 
  authenticate, 
  validate(CreateSealDto), 
  controller.create
);

// Get all seals with pagination and filters
router.get('/', 
  authenticate, 
  controller.list
);

// Get seal statistics
router.get('/statistics', 
  authenticate, 
  controller.getStatistics
);

// Increment exported quantity
router.post('/increment-exported', 
  authenticate, 
  controller.incrementExportedQuantity
);

// Get seal usage history
router.get('/:id/usage-history', 
  authenticate, 
  controller.getUsageHistory
);

// Update seal usage history
router.post('/update-usage-history',
  authenticate,
  controller.updateSealUsageHistory
);

router.post('/remove-from-history',
  authenticate,
  controller.removeSealFromHistory
);

// Get seal by ID
router.get('/:id', 
  authenticate, 
  controller.getById
);

// Update seal
router.patch('/:id', 
  authenticate, 
  validate(UpdateSealDto), 
  controller.update
);

// Delete seal
router.delete('/:id', 
  authenticate, 
  controller.delete
);

// Debug routes
router.post('/debug/test-pricing', 
  authenticate, 
  debugController.testPricing
);

router.get('/debug/find-service-request', 
  authenticate, 
  debugController.findServiceRequest
);

router.get('/debug/seal-usage', 
  authenticate, 
  debugController.getAllSealUsage
);

export default router;
