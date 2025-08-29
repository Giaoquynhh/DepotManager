import { Response } from 'express';
import { AuthRequest } from '../../../shared/middlewares/auth';
import service from '../service/DriverDashboardService';

export class DriverDashboardController {
	async getDashboard(req: AuthRequest, res: Response) {
		try {
			const driverId = req.user?._id;
			if (!driverId) {
				return res.status(401).json({ message: 'Unauthorized' });
			}

			const dashboardData = await service.getDashboardData(driverId);
			return res.json(dashboardData);
		} catch (e: any) {
			return res.status(400).json({ message: e.message });
		}
	}

	async getAssignedTasks(req: AuthRequest, res: Response) {
		try {
			const driverId = req.user?._id;
			if (!driverId) {
				return res.status(401).json({ message: 'Unauthorized' });
			}

			const tasks = await service.getAssignedTasks(driverId);
			return res.json(tasks);
		} catch (e: any) {
			return res.status(400).json({ message: e.message });
		}
	}

	async updateTaskStatus(req: AuthRequest, res: Response) {
		try {
			const driverId = req.user?._id;
			const { taskId } = req.params;
			const { status, notes } = req.body;

			if (!driverId) {
				return res.status(401).json({ message: 'Unauthorized' });
			}

			const result = await service.updateTaskStatus(driverId, taskId, status, notes);
			return res.json(result);
		} catch (e: any) {
			return res.status(400).json({ message: e.message });
		}
	}

	async getTaskHistory(req: AuthRequest, res: Response) {
		try {
			const driverId = req.user?._id;
			if (!driverId) {
				return res.status(401).json({ message: 'Unauthorized' });
			}

			const history = await service.getTaskHistory(driverId);
			return res.json(history);
		} catch (e: any) {
			return res.status(400).json({ message: e.message });
		}
	}

	async updateTaskCost(req: AuthRequest, res: Response) {
		try {
			const driverId = req.user?._id;
			const { taskId } = req.params;
			const { cost } = req.body;

			if (!driverId) {
				return res.status(401).json({ message: 'Unauthorized' });
			}

			if (typeof cost !== 'number' || cost < 0) {
				return res.status(400).json({ message: 'Chi phí phải là số không âm' });
			}

			const result = await service.updateTaskCost(driverId, taskId, cost);
			return res.json(result);
		} catch (e: any) {
			return res.status(400).json({ message: e.message });
		}
	}

	async uploadReportImage(req: AuthRequest, res: Response) {
		try {
			const driverId = req.user?._id;
			const { taskId } = req.params;

			if (!driverId) {
				return res.status(401).json({ message: 'Unauthorized' });
			}

			// Kiểm tra file upload
			if (!req.file) {
				return res.status(400).json({ message: 'Không có file ảnh được upload' });
			}

			// Log thông tin file để debug
			console.log('File upload info:', {
				originalname: req.file.originalname,
				mimetype: req.file.mimetype,
				size: req.file.size,
				fieldname: req.file.fieldname,
				hasBuffer: !!req.file.buffer,
				hasPath: !!req.file.path
			});

			const result = await service.uploadReportImage(driverId, taskId, req.file);
			return res.json(result);
		} catch (e: any) {
			console.error('Error in uploadReportImage controller:', e);
			return res.status(500).json({ 
				message: 'Lỗi upload file', 
				error: e.message,
				stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
			});
		}
	}
}

export default new DriverDashboardController();
