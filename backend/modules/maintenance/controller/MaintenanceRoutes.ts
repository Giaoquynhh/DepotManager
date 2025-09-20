import { Router } from 'express';
import controller from './MaintenanceController';
import { authenticate } from '../../../shared/middlewares/auth';
import { requireRoles } from '../../../shared/middlewares/rbac';

const router = Router();
router.use(authenticate);

// Repairs - cho phép tất cả authenticated users xem danh sách và download PDF
router.get('/repairs', (req, res) => controller.listRepairs(req as any, res));
router.get('/repairs/:id/invoice/pdf', controller.downloadRepairInvoicePDF.bind(controller));

// Sync repair ticket status (for testing)
router.post('/repairs/sync-status', requireRoles('TechnicalDepartment','SystemAdmin'), (req, res) => controller.syncRepairTicketStatus(req as any, res));

// Repairs - chỉ cho SaleAdmin và SystemAdmin
router.post('/repairs', requireRoles('TechnicalDepartment','SystemAdmin'), (req, res) => controller.createRepair(req as any, res));
router.post('/repairs/:id/approve', requireRoles('TechnicalDepartment','SystemAdmin'), (req, res) => controller.approve(req as any, res));
router.post('/repairs/:id/reject', requireRoles('TechnicalDepartment','SystemAdmin'), (req, res) => controller.reject(req as any, res));
router.patch('/repairs/:id/status', requireRoles('TechnicalDepartment','SystemAdmin'), (req, res) => controller.updateStatus(req as any, res));
router.post('/repairs/:id/complete-check', requireRoles('TechnicalDepartment','SystemAdmin'), (req, res) => controller.completeCheck(req as any, res));

// Repair Invoice - chỉ cho SaleAdmin và SystemAdmin
router.post('/repairs/:id/invoice', requireRoles('TechnicalDepartment','SystemAdmin'), controller.createRepairInvoice.bind(controller));
router.get('/repairs/:id/invoice', requireRoles('TechnicalDepartment','SystemAdmin'), controller.getRepairInvoice.bind(controller));
router.post('/repairs/:id/pdf', requireRoles('TechnicalDepartment','SystemAdmin'), controller.uploadRepairInvoicePDF.bind(controller));

// Repair Invoice Actions - chỉ cho SaleAdmin và SystemAdmin
router.put('/repairs/:id/invoice', requireRoles('TechnicalDepartment','SystemAdmin'), controller.updateRepairInvoice.bind(controller));
router.post('/repairs/:id/confirmation-request', requireRoles('TechnicalDepartment','SystemAdmin'), controller.sendConfirmationRequest.bind(controller));

// Repair Actions - chỉ cho SaleAdmin và SystemAdmin
router.post('/repairs/:id/start-repair', requireRoles('TechnicalDepartment','SystemAdmin'), controller.startRepair.bind(controller));
router.post('/repairs/:id/complete-repair', requireRoles('TechnicalDepartment','SystemAdmin'), controller.completeRepair.bind(controller));

// Inventory - chỉ cho SaleAdmin và SystemAdmin
router.get('/inventory/items', requireRoles('TechnicalDepartment','SystemAdmin'), (req, res) => controller.listInventory(req as any, res));
router.post('/inventory/items', requireRoles('TechnicalDepartment','SystemAdmin'), (req, res) => controller.createInventory(req as any, res));
router.put('/inventory/items/:id', requireRoles('TechnicalDepartment','SystemAdmin'), (req, res) => controller.updateInventory(req as any, res));

// Expose equipments for FE select (simple list) - chỉ cho SaleAdmin và SystemAdmin
router.get('/equipments', requireRoles('TechnicalDepartment','SystemAdmin'), async (req, res) => {
  try{
    const { prisma } = await import('../../../shared/config/database');
    const items = await prisma.equipment.findMany({ orderBy: { code: 'asc' } });
    return res.json(items);
  }catch(e:any){ return res.status(400).json({ message: e.message }); }
});

export default router;


