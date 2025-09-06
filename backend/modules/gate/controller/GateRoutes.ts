import { Router } from 'express';
import { GateController } from './GateController';
import { requireRoles } from '../../../shared/middlewares/rbac';

const router = Router();
const gateController = new GateController();

// Không cần auth middleware vì đã có trong main.ts

// Forward request từ Kho sang Gate (SaleAdmin, SystemAdmin)
router.patch(
  '/requests/:id/forward',
  requireRoles('SaleAdmin', 'SystemAdmin'),
  gateController.forwardRequest.bind(gateController)
);

// Gate approve request (SaleAdmin, SystemAdmin)
router.patch(
  '/requests/:id/approve',
  requireRoles('SaleAdmin', 'SystemAdmin'),
  gateController.approveGate.bind(gateController)
);

// Gate reject request (SaleAdmin, SystemAdmin)
router.patch(
  '/requests/:id/reject',
  requireRoles('SaleAdmin', 'SystemAdmin'),
  gateController.rejectGate.bind(gateController)
);

// Gate chấp nhận xe vào (YardManager, SystemAdmin)
router.patch(
  '/requests/:id/gate-accept',
  requireRoles('YardManager', 'SystemAdmin'),
  gateController.acceptGate.bind(gateController)
);

// Gate từ chối xe (YardManager, SystemAdmin)
router.patch(
  '/requests/:id/gate-reject',
  requireRoles('YardManager', 'SystemAdmin'),
  gateController.rejectGate.bind(gateController)
);

// Tìm kiếm requests ở Gate (tất cả role có thể thấy trang Gate)
router.get(
  '/requests/search',
  requireRoles('SystemAdmin', 'BusinessAdmin', 'YardManager', 'SaleAdmin', 'MaintenanceManager'),
  gateController.searchRequests.bind(gateController)
);

// Lấy chi tiết request để xử lý ở Gate (tất cả role có thể thấy trang Gate)
router.get(
  '/requests/:id',
  requireRoles('SystemAdmin', 'BusinessAdmin', 'YardManager', 'SaleAdmin', 'MaintenanceManager'),
  gateController.getRequestDetails.bind(gateController)
);

// Lấy danh sách chứng từ của request (tất cả role có thể thấy trang Gate)
router.get(
  '/requests/:id/documents',
  requireRoles('SystemAdmin', 'BusinessAdmin', 'YardManager', 'SaleAdmin', 'MaintenanceManager'),
  gateController.getRequestDocuments.bind(gateController)
);

// Xem file chứng từ (tất cả role có thể thấy trang Gate)
router.get(
  '/requests/:requestId/documents/:documentId/view',
  requireRoles('SystemAdmin', 'BusinessAdmin', 'YardManager', 'SaleAdmin', 'MaintenanceManager'),
  gateController.viewDocument.bind(gateController)
);

// Gate OUT - Xe rời kho (YardManager, SaleAdmin, SystemAdmin)
router.patch(
  '/requests/:id/gate-out',
  requireRoles('YardManager', 'SaleAdmin', 'SystemAdmin'),
  gateController.gateOut.bind(gateController)
);

// Lịch sử xe ra vào cổng (tất cả role có thể thấy trang Gate)
router.get(
  '/history',
  requireRoles('SystemAdmin', 'BusinessAdmin', 'YardManager', 'SaleAdmin', 'MaintenanceManager'),
  gateController.getGateHistory.bind(gateController)
);

export default router;


