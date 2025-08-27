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
}

export default new DriverDashboardController();
