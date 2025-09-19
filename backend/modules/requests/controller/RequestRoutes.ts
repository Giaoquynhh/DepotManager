import { Router } from 'express';
import { authenticate } from '../../../shared/middlewares/auth';
import { requireRoles } from '../../../shared/middlewares/rbac';
import * as controller from './RequestController';
import FileUploadService from '../service/FileUploadService';

const router = Router();
const fileUploadService = new FileUploadService(require('@prisma/client').PrismaClient);

// Tất cả routes đều yêu cầu authentication
router.use(authenticate);

// Upload multiple files for a request
router.post('/:requestId/files', 
    requireRoles('SaleAdmin', 'Accountant', 'CustomerAdmin', 'CustomerUser', 'SystemAdmin', 'BusinessAdmin'),
    fileUploadService.getMulter().array('files', 10), // Tối đa 10 files
    controller.uploadFiles
);

// Get files for a request
router.get('/:requestId/files', 
    requireRoles('SaleAdmin', 'Accountant', 'CustomerAdmin', 'CustomerUser', 'SystemAdmin', 'BusinessAdmin'),
    controller.getFiles
);

// Delete a file
router.delete('/files/:fileId', 
    requireRoles('SaleAdmin', 'Accountant', 'CustomerAdmin', 'CustomerUser', 'SystemAdmin', 'BusinessAdmin'),
    controller.deleteFile
);

// Create a new request with files
router.post('/create', 
    requireRoles('SaleAdmin', 'Accountant', 'CustomerAdmin', 'CustomerUser', 'SystemAdmin', 'BusinessAdmin'),
    fileUploadService.getMulter().array('files', 10), // Tối đa 10 files
    controller.createRequest
);

// Get list of requests
router.get('/', 
    requireRoles('SaleAdmin', 'Accountant', 'CustomerAdmin', 'CustomerUser', 'SystemAdmin', 'BusinessAdmin'),
    controller.getRequests
);

export default router;

