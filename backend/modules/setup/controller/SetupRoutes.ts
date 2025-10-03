import { Router } from 'express';
import controller from './SetupController';
import { authenticate } from '../../../shared/middlewares/auth';
import { requireRoles } from '../../../shared/middlewares/rbac';
import multer from 'multer';

// Configure multer for Excel file uploads
const upload = multer({
  dest: 'uploads/temp/', // Store temporarily for processing
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
router.get('/shipping-lines', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.getShippingLines);
router.get('/shipping-lines/:id', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.getShippingLineById);
router.post('/shipping-lines', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.createShippingLine);
router.post('/shipping-lines/bulk', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.bulkCreateShippingLines);
router.put('/shipping-lines/:id', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.updateShippingLine);
router.delete('/shipping-lines/:id', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.deleteShippingLine);
router.post('/shipping-lines/upload-eir', requireRoles('SystemAdmin', 'TechnicalDepartment'), upload.single('file'), controller.uploadShippingLineEIR);
router.get('/shipping-lines/:shipping_line_id/download-eir', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.downloadShippingLineEIR);

// Transport Companies Routes
router.get('/transport-companies', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.getTransportCompanies);
router.get('/transport-companies/:id', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.getTransportCompanyById);
router.post('/transport-companies', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.createTransportCompany);
router.put('/transport-companies/:id', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.updateTransportCompany);
router.delete('/transport-companies/:id', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.deleteTransportCompany);
router.post('/transport-companies/upload-excel', requireRoles('SystemAdmin', 'TechnicalDepartment'), upload.single('file'), controller.uploadTransportCompanyExcel);

// Container Types Routes
router.get('/container-types', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.getContainerTypes);
router.get('/container-types/:id', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.getContainerTypeById);
router.post('/container-types', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.createContainerType);
router.put('/container-types/:id', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.updateContainerType);
router.delete('/container-types/:id', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.deleteContainerType);
router.post('/container-types/upload-excel', requireRoles('SystemAdmin', 'TechnicalDepartment'), upload.single('file'), controller.uploadContainerTypeExcel);

// Customers Routes
router.get('/customers', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.getCustomers);
router.get('/customers/:id', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.getCustomerById);
router.post('/customers', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.createCustomer);
router.post('/customers/upload-excel', requireRoles('SystemAdmin', 'TechnicalDepartment'), upload.single('file'), controller.uploadCustomerExcel);
router.put('/customers/:id', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.updateCustomer);
router.patch('/customers/:id', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.updateCustomer);
router.delete('/customers/:id', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.deleteCustomer);
router.patch('/customers/:id/disable', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.disableCustomer);

// PriceList Routes
router.get('/price-lists', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.getPriceLists);
router.get('/price-lists/:id', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.getPriceListById);
router.post('/price-lists', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.createPriceList);
router.put('/price-lists/:id', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.updatePriceList);
router.delete('/price-lists/:id', requireRoles('SystemAdmin', 'TechnicalDepartment'), controller.deletePriceList);
router.post('/price-lists/upload-excel', requireRoles('SystemAdmin', 'TechnicalDepartment'), upload.single('file'), controller.uploadPriceListExcel);

export default router;
