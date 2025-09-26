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

    // Các API ảnh báo cáo đã được gỡ bỏ
    async uploadTaskImages(req: AuthRequest, res: Response) {
        try {
            const driverId = req.user?._id;
            const { taskId } = req.params;
            const files = (req as any).files as Express.Multer.File[];
            if (!driverId) return res.status(401).json({ message: 'Unauthorized' });
            if (!files || files.length === 0) return res.status(400).json({ message: 'No files uploaded' });

            const result = await service.uploadTaskImages(driverId, taskId, files);
            return res.json(result);
        } catch (e: any) {
            return res.status(400).json({ message: e.message });
        }
    }

    async getTaskImages(req: AuthRequest, res: Response) {
        try {
            const driverId = req.user?._id;
            const { taskId } = req.params;
            if (!driverId) return res.status(401).json({ message: 'Unauthorized' });
            const images = await service.getTaskImages(driverId, taskId);
            return res.json(images);
        } catch (e: any) {
            return res.status(400).json({ message: e.message });
        }
    }

    async deleteTaskImage(req: AuthRequest, res: Response) {
        try {
            const driverId = req.user?._id;
            const { taskId, imageId } = req.params;
            if (!driverId) return res.status(401).json({ message: 'Unauthorized' });
            const result = await service.deleteTaskImage(driverId, taskId, imageId);
            return res.json(result);
        } catch (e: any) {
            return res.status(400).json({ message: e.message });
        }
    }
}

export default new DriverDashboardController();
