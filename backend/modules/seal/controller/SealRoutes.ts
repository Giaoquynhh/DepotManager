import { Router } from 'express';
import { authenticate } from '../../../shared/middlewares/auth';
import { validate } from '../../../shared/middlewares/validate';
import controller from './SealController';
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

export default router;
