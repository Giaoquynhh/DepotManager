import { Response } from 'express';
import { AuthRequest } from '../../../shared/middlewares/auth';
import service from '../service/ForkliftService';

export class ForkliftController {
	async list(req: AuthRequest, res: Response) {
		try { 
			const tasks = await service.list(String(req.query.status||''));
			return res.json(tasks); 
		} catch (e:any) { 
			return res.status(400).json({ message: e.message }); 
		}
	}
	async assign(req: AuthRequest, res: Response) {
		try { return res.json(await service.assign(req.user!, req.body)); } catch (e:any) { return res.status(400).json({ message: e.message }); }
	}
	async update(req: AuthRequest, res: Response) {
		const { status, reason } = req.body || {};
		if (!status) return res.status(400).json({ message: 'Thiếu status' });
		try { return res.json(await service.updateStatus(req.user!, req.params.id, status, reason)); } catch (e:any) { return res.status(400).json({ message: e.message }); }
	}

	async delete(req: AuthRequest, res: Response) {
		try { return res.json(await service.deleteTask(req.user!, req.params.id)); } catch (e:any) { return res.status(400).json({ message: e.message }); }
	}
}

export default new ForkliftController();


