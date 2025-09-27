import { Router } from 'express';
import { authenticate } from '../../../shared/middlewares/auth';
import { requireRoles } from '../../../shared/middlewares/rbac';
import * as controller from './RequestController';
import { updateAllInvoicesWithSealCost, updateInvoiceWithSealCost } from './updateInvoiceWithSealCostController';
import { getSealCost } from './getSealCostController';
import FileUploadService from '../service/FileUploadService';

const router = Router();
const fileUploadService = new FileUploadService(require('@prisma/client').PrismaClient);

// Tất cả routes đều yêu cầu authentication
router.use(authenticate);

// Upload multiple files for a request
router.post('/:requestId/files', 
    requireRoles('TechnicalDepartment', 'Accountant', 'CustomerAdmin', 'CustomerUser', 'SystemAdmin', 'BusinessAdmin'),
    fileUploadService.getMulter().array('files', 10), // Tối đa 10 files
    controller.uploadFiles
);

// Get files for a request
router.get('/:requestId/files', 
    requireRoles('TechnicalDepartment', 'Accountant', 'CustomerAdmin', 'CustomerUser', 'SystemAdmin', 'BusinessAdmin'),
    controller.getFiles
);

// Delete a file
router.delete('/files/:fileId', 
    requireRoles('TechnicalDepartment', 'Accountant', 'CustomerAdmin', 'CustomerUser', 'SystemAdmin', 'BusinessAdmin'),
    controller.deleteFile
);

// Create a new request with files
router.post('/create', 
    requireRoles('TechnicalDepartment', 'Accountant', 'CustomerAdmin', 'CustomerUser', 'SystemAdmin', 'BusinessAdmin'),
    fileUploadService.getMulter().array('files', 10), // Tối đa 10 files
    controller.createRequest
);

// Check if container number already exists
router.get('/check-container', 
    requireRoles('TechnicalDepartment', 'Accountant', 'CustomerAdmin', 'CustomerUser', 'SystemAdmin', 'BusinessAdmin'),
    controller.checkContainerExists
);

// Get list of requests
router.get('/', 
    requireRoles('TechnicalDepartment', 'Accountant', 'CustomerAdmin', 'CustomerUser', 'SystemAdmin', 'BusinessAdmin'),
    controller.getRequests
);

// Get seal cost for a request (PHẢI ĐẶT TRƯỚC /:id)
router.get('/:id/seal-cost',
    requireRoles('TechnicalDepartment', 'Accountant', 'CustomerAdmin', 'CustomerUser', 'SystemAdmin', 'BusinessAdmin'),
    getSealCost
);

// Get single request details
router.get('/:id', 
    requireRoles('TechnicalDepartment', 'Accountant', 'CustomerAdmin', 'CustomerUser', 'SystemAdmin', 'BusinessAdmin'),
    controller.getRequest
);

// Cancel request
router.patch('/:id/cancel', 
    requireRoles('TechnicalDepartment', 'Accountant', 'CustomerAdmin', 'CustomerUser', 'SystemAdmin', 'BusinessAdmin'),
    controller.cancelRequest
);

// Update request
router.patch('/:id', 
    requireRoles('TechnicalDepartment', 'Accountant', 'CustomerAdmin', 'CustomerUser', 'SystemAdmin', 'BusinessAdmin'),
    fileUploadService.getMulter().array('files', 10), // Tối đa 10 files
    controller.updateRequest
);

// Mark as paid and set IN_CAR for EXPORT flow
router.patch('/:id/mark-paid',
    requireRoles('TechnicalDepartment', 'Accountant', 'SystemAdmin', 'BusinessAdmin'),
    controller.markPaid
);

// Delete request
router.delete('/:id', 
    requireRoles('TechnicalDepartment', 'Accountant', 'CustomerAdmin', 'CustomerUser', 'SystemAdmin', 'BusinessAdmin'),
    controller.deleteRequest
);

// Move request from PENDING to GATE_IN
router.patch('/:id/move-to-gate', 
    requireRoles('TechnicalDepartment', 'SystemAdmin', 'BusinessAdmin'),
    controller.moveToGate
);

// Update all invoices with seal cost
router.post('/update-all-invoices-with-seal-cost',
    requireRoles('SystemAdmin', 'BusinessAdmin'),
    updateAllInvoicesWithSealCost
);

// Update specific invoice with seal cost
router.post('/:requestId/update-invoice-with-seal-cost',
    requireRoles('SystemAdmin', 'BusinessAdmin'),
    updateInvoiceWithSealCost
);

export default router;

