import { Router } from 'express';
import controller from './SetupController';
import { authenticate } from '../../../shared/middlewares/auth';
import { requireRoles } from '../../../shared/middlewares/rbac';
import multer from 'multer';

// Configure multer for Excel file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory for processing
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept Excel files
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
    const allowedExtensions = ['.xlsx', '.xls'];
    
    // Check MIME type
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    
    // Check extension if MIME type doesn't match
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
      return;
    }
    
    cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
  }
});

const router = Router();

// All routes require authentication
router.use(authenticate);

// Shipping Lines Routes
router.get('/shipping-lines', requireRoles('SystemAdmin', 'SaleAdmin'), controller.getShippingLines);
router.get('/shipping-lines/:id', requireRoles('SystemAdmin', 'SaleAdmin'), controller.getShippingLineById);
router.post('/shipping-lines', requireRoles('SystemAdmin', 'SaleAdmin'), controller.createShippingLine);
router.post('/shipping-lines/bulk', requireRoles('SystemAdmin', 'SaleAdmin'), controller.bulkCreateShippingLines);
router.put('/shipping-lines/:id', requireRoles('SystemAdmin', 'SaleAdmin'), controller.updateShippingLine);
router.delete('/shipping-lines/:id', requireRoles('SystemAdmin', 'SaleAdmin'), controller.deleteShippingLine);

// Transport Companies Routes
router.get('/transport-companies', requireRoles('SystemAdmin', 'SaleAdmin'), controller.getTransportCompanies);
router.get('/transport-companies/:id', requireRoles('SystemAdmin', 'SaleAdmin'), controller.getTransportCompanyById);
router.post('/transport-companies', requireRoles('SystemAdmin', 'SaleAdmin'), controller.createTransportCompany);
router.put('/transport-companies/:id', requireRoles('SystemAdmin', 'SaleAdmin'), controller.updateTransportCompany);
router.delete('/transport-companies/:id', requireRoles('SystemAdmin', 'SaleAdmin'), controller.deleteTransportCompany);
router.post('/transport-companies/upload-excel', requireRoles('SystemAdmin', 'SaleAdmin'), upload.single('file'), controller.uploadTransportCompanyExcel);

// Container Types Routes
router.get('/container-types', requireRoles('SystemAdmin', 'SaleAdmin'), controller.getContainerTypes);
router.get('/container-types/:id', requireRoles('SystemAdmin', 'SaleAdmin'), controller.getContainerTypeById);
router.post('/container-types', requireRoles('SystemAdmin', 'SaleAdmin'), controller.createContainerType);
router.put('/container-types/:id', requireRoles('SystemAdmin', 'SaleAdmin'), controller.updateContainerType);
router.delete('/container-types/:id', requireRoles('SystemAdmin', 'SaleAdmin'), controller.deleteContainerType);
router.post('/container-types/upload-excel', requireRoles('SystemAdmin', 'SaleAdmin'), upload.single('file'), controller.uploadContainerTypeExcel);

export default router;
