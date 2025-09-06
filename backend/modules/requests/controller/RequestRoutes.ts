import { Router } from 'express';
import controller from './RequestController';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireRoles } from '../../../shared/middlewares/rbac';

const uploadDir = path.join(process.cwd(), 'backend', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Cấu hình multer cho file upload
const upload = multer({
	storage: multer.memoryStorage(), // Lưu file trong memory để xử lý
	limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
	fileFilter: (_req: any, file: any, cb: any) => {
		// Kiểm tra MIME type và extension
		const allowedMimeTypes = ['application/pdf','image/jpeg','image/png','image/jpg'];
		const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
		
		// Kiểm tra MIME type
		if (allowedMimeTypes.includes(file.mimetype)) {
			cb(null, true);
			return;
		}
		
		// Kiểm tra extension nếu MIME type không khớp
		const fileExtension = path.extname(file.originalname).toLowerCase();
		if (allowedExtensions.includes(fileExtension)) {
			cb(null, true);
			return;
		}
		
		cb(new Error('Định dạng không hỗ trợ. Chỉ chấp nhận PDF, JPG, JPEG, PNG'));
	}
});

const router = Router();

// Customer create/list - với file upload (hỗ trợ multiple files)
router.post('/', requireRoles('CustomerAdmin','CustomerUser','SaleAdmin'), upload.array('documents', 10), (req, res) => ((req as any).user?.role === 'SaleAdmin' ? controller.createBySale(req as any, res) : controller.create(req as any, res)));
router.get('/', requireRoles('CustomerAdmin','CustomerUser','SaleAdmin','Accountant','SystemAdmin'), (req, res) => controller.list(req as any, res));

// Get single request by ID
router.get('/:id', requireRoles('CustomerAdmin','CustomerUser','SaleAdmin','Accountant','SystemAdmin'), (req, res) => controller.getById(req as any, res));



// Status changes (SaleAdmin/SystemAdmin)
router.patch('/:id/status', requireRoles('SaleAdmin','SystemAdmin'), (req, res) => controller.updateStatus(req as any, res));

// Customer accept scheduled request (CustomerAdmin/CustomerUser)
router.patch('/:id/accept-scheduled', requireRoles('CustomerAdmin','CustomerUser'), (req, res) => controller.acceptScheduledRequest(req as any, res));

// Update container number (SaleAdmin/SystemAdmin)
router.patch('/:id/container', requireRoles('SaleAdmin','SystemAdmin'), (req, res) => controller.updateContainerNo(req as any, res));

// Get available containers for export (SaleAdmin/SystemAdmin)
router.get('/containers/available', requireRoles('SaleAdmin','SystemAdmin'), (req, res) => controller.getAvailableContainersForExport(req as any, res));

// Reject request (SaleAdmin/SystemAdmin)
router.patch('/:id/reject', requireRoles('SaleAdmin','SystemAdmin'), (req, res) => controller.rejectRequest(req as any, res));

// Soft delete theo scope
router.delete('/:id', requireRoles('CustomerAdmin','CustomerUser','SaleAdmin','SystemAdmin','Accountant'), (req, res) => controller.softDeleteRequest(req as any, res));

// Restore theo scope
router.post('/:id/restore', requireRoles('CustomerAdmin','CustomerUser','SaleAdmin','SystemAdmin','Accountant'), (req, res) => controller.restoreRequest(req as any, res));

// Documents - Single file upload
router.post('/:id/docs', requireRoles('SaleAdmin','Accountant','CustomerAdmin','CustomerUser','SystemAdmin','BusinessAdmin'), upload.single('file'), (req, res) => controller.uploadDoc(req as any, res));

// Documents - Multiple files upload
router.post('/:id/docs/multiple', requireRoles('SaleAdmin','Accountant','CustomerAdmin','CustomerUser','SystemAdmin','BusinessAdmin'), upload.array('files', 10), (req, res) => controller.uploadMultipleDocs(req as any, res));
router.get('/:id/docs', requireRoles('SaleAdmin','Accountant','CustomerAdmin','CustomerUser','SystemAdmin','BusinessAdmin'), (req, res) => controller.listDocs(req as any, res));
router.delete('/:id/docs/:docId', requireRoles('SaleAdmin','Accountant','SystemAdmin','BusinessAdmin'), (req, res) => controller.deleteDoc(req as any, res));

// Payment request
router.post('/:id/payment-request', requireRoles('SaleAdmin','SystemAdmin'), (req, res) => controller.sendPayment(req as any, res));

// State Machine Routes
router.patch('/:id/schedule', requireRoles('SaleAdmin','SystemAdmin'), (req, res) => controller.scheduleRequest(req as any, res));
router.patch('/:id/update-appointment', requireRoles('SaleAdmin','SystemAdmin'), (req, res) => controller.updateAppointment(req as any, res));
router.patch('/:id/add-info', requireRoles('CustomerAdmin','CustomerUser'), (req, res) => controller.addInfoToRequest(req as any, res));
router.patch('/:id/send-to-gate', requireRoles('SaleAdmin','SystemAdmin'), (req, res) => controller.sendToGate(req as any, res));
router.patch('/:id/complete', requireRoles('SaleAdmin','SystemAdmin'), (req, res) => controller.completeRequest(req as any, res));

// Customer actions for PENDING_ACCEPT requests
router.patch('/:id/accept', requireRoles('CustomerAdmin','CustomerUser'), (req, res) => controller.acceptRequest(req as any, res));
router.patch('/:id/reject-by-customer', requireRoles('CustomerAdmin','CustomerUser'), (req, res) => controller.rejectByCustomer(req as any, res));

// Helper routes
router.get('/:id/transitions', requireRoles('CustomerAdmin','CustomerUser','SaleAdmin','SystemAdmin'), (req, res) => controller.getValidTransitions(req as any, res));
router.get('/state/:state/info', requireRoles('CustomerAdmin','CustomerUser','SaleAdmin','SystemAdmin'), (req, res) => controller.getStateInfo(req as any, res));
router.get('/:id/appointment', requireRoles('CustomerAdmin','CustomerUser','SaleAdmin','SystemAdmin'), (req, res) => controller.getAppointmentInfo(req as any, res));

export default router;
