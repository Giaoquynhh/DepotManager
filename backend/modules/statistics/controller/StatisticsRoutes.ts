import { Router } from 'express';
import { StatisticsController } from './StatisticsController';
import { authenticate, AppRole } from '../../../shared/middlewares/auth';
import { requireRoles } from '../../../shared/middlewares/rbac';

const router = Router();
const statisticsController = new StatisticsController();

// Apply authentication to all routes
router.use(authenticate);

// Role-based authorization for different endpoints
// SystemAdmin, BusinessAdmin, Accountant can see all statistics
const adminRoles: AppRole[] = ['SystemAdmin', 'BusinessAdmin', 'Accountant'];
const salesRoles: AppRole[] = ['SaleAdmin', 'YardManager'];
const maintenanceRoles: AppRole[] = ['MaintenanceManager'];
const customerRoles: AppRole[] = ['CustomerAdmin', 'CustomerUser'];

// Overview endpoint - available to admin roles and sales roles
router.get('/overview', 
  requireRoles(...adminRoles, ...salesRoles, ...maintenanceRoles),
  statisticsController.getOverview.bind(statisticsController)
);

// Container statistics - available to most roles
router.get('/containers', 
  requireRoles(...adminRoles, ...salesRoles, ...maintenanceRoles, ...customerRoles),
  statisticsController.getContainers.bind(statisticsController)
);

// Customer statistics - available to admin and sales roles
router.get('/customers', 
  requireRoles(...adminRoles, ...salesRoles),
  statisticsController.getCustomers.bind(statisticsController)
);

// Maintenance statistics - available to admin and maintenance roles
router.get('/maintenance', 
  requireRoles(...adminRoles, ...maintenanceRoles),
  statisticsController.getMaintenance.bind(statisticsController)
);

// Financial statistics - only available to admin roles
router.get('/financial', 
  requireRoles(...adminRoles),
  statisticsController.getFinancial.bind(statisticsController)
);

// Operational statistics - available to admin, sales, and maintenance roles
router.get('/operational', 
  requireRoles(...adminRoles, ...salesRoles, ...maintenanceRoles),
  statisticsController.getOperational.bind(statisticsController)
);

export default router;
