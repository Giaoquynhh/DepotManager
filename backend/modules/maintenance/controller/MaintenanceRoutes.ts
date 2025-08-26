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
router.post('/repairs/sync-status', requireRoles('SaleAdmin','SystemAdmin'), (req, res) => controller.syncRepairTicketStatus(req as any, res));

// Repairs - chỉ cho SaleAdmin và SystemAdmin
router.post('/repairs', requireRoles('SaleAdmin','SystemAdmin'), (req, res) => controller.createRepair(req as any, res));
router.post('/repairs/:id/approve', requireRoles('SaleAdmin','SystemAdmin'), (req, res) => controller.approve(req as any, res));
router.post('/repairs/:id/reject', requireRoles('SaleAdmin','SystemAdmin'), (req, res) => controller.reject(req as any, res));
router.patch('/repairs/:id/status', requireRoles('SaleAdmin','SystemAdmin'), (req, res) => controller.updateStatus(req as any, res));
router.post('/repairs/:id/complete-check', requireRoles('SaleAdmin','SystemAdmin'), (req, res) => controller.completeCheck(req as any, res));

// Repair Invoice - chỉ cho SaleAdmin và SystemAdmin
router.post('/repairs/:id/invoice', requireRoles('SaleAdmin','SystemAdmin'), controller.createRepairInvoice.bind(controller));
router.get('/repairs/:id/invoice', requireRoles('SaleAdmin','SystemAdmin'), controller.getRepairInvoice.bind(controller));
router.post('/repairs/:id/pdf', requireRoles('SaleAdmin','SystemAdmin'), controller.uploadRepairInvoicePDF.bind(controller));

// Repair Invoice Actions - chỉ cho SaleAdmin và SystemAdmin
router.put('/repairs/:id/invoice', requireRoles('SaleAdmin','SystemAdmin'), controller.updateRepairInvoice.bind(controller));
router.post('/repairs/:id/confirmation-request', requireRoles('SaleAdmin','SystemAdmin'), controller.sendConfirmationRequest.bind(controller));

// Repair Actions - chỉ cho SaleAdmin và SystemAdmin
router.post('/repairs/:id/start-repair', requireRoles('SaleAdmin','SystemAdmin'), controller.startRepair.bind(controller));
router.post('/repairs/:id/complete-repair', requireRoles('SaleAdmin','SystemAdmin'), controller.completeRepair.bind(controller));

// Inventory - chỉ cho SaleAdmin và SystemAdmin
router.get('/inventory/items', requireRoles('SaleAdmin','SystemAdmin'), (req, res) => controller.listInventory(req as any, res));
router.post('/inventory/items', requireRoles('SaleAdmin','SystemAdmin'), (req, res) => controller.createInventory(req as any, res));
router.put('/inventory/items/:id', requireRoles('SaleAdmin','SystemAdmin'), (req, res) => controller.updateInventory(req as any, res));

// Expose equipments for FE select (simple list) - chỉ cho SaleAdmin và SystemAdmin
router.get('/equipments', requireRoles('SaleAdmin','SystemAdmin'), async (req, res) => {
  try{
    const { prisma } = await import('../../../shared/config/database');
    const items = await prisma.equipment.findMany({ orderBy: { code: 'asc' } });
    return res.json(items);
  }catch(e:any){ return res.status(400).json({ message: e.message }); }
});

export default router;


