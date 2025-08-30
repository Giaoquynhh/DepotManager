import { Router } from 'express';
import { RequestStatusController } from '../controllers/RequestStatusController';
import { authenticateToken } from '../../../shared/middlewares/auth';
import { checkRole } from '../../../shared/middlewares/roleCheck';

const router = Router();
const requestStatusController = new RequestStatusController();

// Middleware xác thực cho tất cả routes
router.use(authenticateToken);

/**
 * @route PATCH /requests/:id/invoice-status
 * @desc Cập nhật trạng thái hóa đơn cho request
 * @access YardManager, SaleAdmin, FinanceAdmin
 */
router.patch(
  '/:id/invoice-status',
  checkRole(['YardManager', 'SaleAdmin', 'FinanceAdmin']),
  requestStatusController.updateInvoiceStatus
);

/**
 * @route PATCH /requests/:id/payment-status
 * @desc Cập nhật trạng thái thanh toán cho request
 * @access YardManager, SaleAdmin, FinanceAdmin
 */
router.patch(
  '/:id/payment-status',
  checkRole(['YardManager', 'SaleAdmin', 'FinanceAdmin']),
  requestStatusController.updatePaymentStatus
);

/**
 * @route PATCH /requests/:id/both-statuses
 * @desc Cập nhật cả hai trạng thái cùng lúc
 * @access YardManager, SaleAdmin, FinanceAdmin
 */
router.patch(
  '/:id/both-statuses',
  checkRole(['YardManager', 'SaleAdmin', 'FinanceAdmin']),
  requestStatusController.updateBothStatuses
);

/**
 * @route GET /requests/search/status
 * @desc Tìm kiếm requests theo trạng thái hóa đơn và thanh toán
 * @access YardManager, SaleAdmin, FinanceAdmin, Customer
 */
router.get(
  '/search/status',
  checkRole(['YardManager', 'SaleAdmin', 'FinanceAdmin', 'Customer']),
  requestStatusController.searchRequestsByStatus
);

/**
 * @route GET /requests/statistics/status
 * @desc Lấy thống kê trạng thái requests
 * @access YardManager, SaleAdmin, FinanceAdmin
 */
router.get(
  '/statistics/status',
  checkRole(['YardManager', 'SaleAdmin', 'FinanceAdmin']),
  requestStatusController.getStatusStatistics
);

/**
 * @route POST /requests/:id/auto-update-invoice
 * @desc Tự động cập nhật trạng thái hóa đơn
 * @access YardManager, SaleAdmin, FinanceAdmin
 */
router.post(
  '/:id/auto-update-invoice',
  checkRole(['YardManager', 'SaleAdmin', 'FinanceAdmin']),
  requestStatusController.autoUpdateInvoiceStatus
);

/**
 * @route POST /requests/:id/auto-update-payment
 * @desc Tự động cập nhật trạng thái thanh toán
 * @access YardManager, SaleAdmin, FinanceAdmin
 */
router.post(
  '/:id/auto-update-payment',
  checkRole(['YardManager', 'SaleAdmin', 'FinanceAdmin']),
  requestStatusController.autoUpdatePaymentStatus
);

/**
 * @route GET /requests/:id/status
 * @desc Lấy thông tin trạng thái của request
 * @access YardManager, SaleAdmin, FinanceAdmin, Customer
 */
router.get(
  '/:id/status',
  checkRole(['YardManager', 'SaleAdmin', 'FinanceAdmin', 'Customer']),
  requestStatusController.getRequestStatus
);

export default router;
