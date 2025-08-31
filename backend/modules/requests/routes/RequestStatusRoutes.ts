import { Router } from 'express';
import { RequestStatusController } from '../controllers/RequestStatusController';
import { authenticate } from '../../../shared/middlewares/auth';
import { requireRoles } from '../../../shared/middlewares/rbac';

const router = Router();
const requestStatusController = new RequestStatusController();

// Middleware xác thực cho tất cả routes
router.use(authenticate);

/**
 * @route PATCH /requests/:id/invoice-status
 * @desc Cập nhật trạng thái hóa đơn cho request
 * @access YardManager, SaleAdmin, Accountant
 */
router.patch(
  '/:id/invoice-status',
  requireRoles('YardManager', 'SaleAdmin', 'Accountant'),
  requestStatusController.updateInvoiceStatus
);

/**
 * @route PATCH /requests/:id/payment-status
 * @desc Cập nhật trạng thái thanh toán cho request
 * @access YardManager, SaleAdmin, Accountant, CustomerAdmin, CustomerUser
 */
router.patch(
  '/:id/payment-status',
  requireRoles('YardManager', 'SaleAdmin', 'Accountant', 'CustomerAdmin', 'CustomerUser'),
  requestStatusController.updatePaymentStatus
);

/**
 * @route PATCH /requests/:id/both-statuses
 * @desc Cập nhật cả hai trạng thái cùng lúc
 * @access YardManager, SaleAdmin, Accountant
 */
router.patch(
  '/:id/both-statuses',
  requireRoles('YardManager', 'SaleAdmin', 'Accountant'),
  requestStatusController.updateBothStatuses
);

/**
 * @route GET /requests/search/status
 * @desc Tìm kiếm requests theo trạng thái hóa đơn và thanh toán
 * @access YardManager, SaleAdmin, Accountant, CustomerAdmin, CustomerUser
 */
router.get(
  '/search/status',
  requireRoles('YardManager', 'SaleAdmin', 'Accountant', 'CustomerAdmin', 'CustomerUser'),
  requestStatusController.searchRequestsByStatus
);

/**
 * @route GET /requests/statistics/status
 * @desc Lấy thống kê trạng thái requests
 * @access YardManager, SaleAdmin, Accountant
 */
router.get(
  '/statistics/status',
  requireRoles('YardManager', 'SaleAdmin', 'Accountant'),
  requestStatusController.getStatusStatistics
);

/**
 * @route POST /requests/:id/auto-update-invoice
 * @desc Tự động cập nhật trạng thái hóa đơn
 * @access YardManager, SaleAdmin, Accountant
 */
router.post(
  '/:id/auto-update-invoice',
  requireRoles('YardManager', 'SaleAdmin', 'Accountant'),
  requestStatusController.autoUpdateInvoiceStatus
);

/**
 * @route POST /requests/:id/auto-update-payment
 * @desc Tự động cập nhật trạng thái thanh toán
 * @access YardManager, SaleAdmin, Accountant
 */
router.post(
  '/:id/auto-update-payment',
  requireRoles('YardManager', 'SaleAdmin', 'Accountant'),
  requestStatusController.autoUpdatePaymentStatus
);

/**
 * @route GET /requests/:id/status
 * @desc Lấy thông tin trạng thái của request
 * @access YardManager, SaleAdmin, Accountant, CustomerAdmin, CustomerUser
 */
router.get(
  '/:id/status',
  requireRoles('YardManager', 'SaleAdmin', 'Accountant', 'CustomerAdmin', 'CustomerUser'),
  requestStatusController.getRequestStatus
);

export default router;
