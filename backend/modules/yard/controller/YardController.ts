import { Response } from 'express';
import { AuthRequest } from '../../../shared/middlewares/auth';
import service from '../service/YardService';

export class YardController {
    async map(_req: AuthRequest, res: Response) {
        try { return res.json(await service.getMap()); } catch (e: any) { return res.status(400).json({ message: e.message }); }
    }
    async container(req: AuthRequest, res: Response) {
        try { return res.json(await service.findContainer(String(req.params.container_no))); } catch (e: any) { return res.status(400).json({ message: e.message }); }
    }
    async suggest(req: AuthRequest, res: Response) {
        try { return res.json(await service.suggestPosition(String(req.query.container_no||''))); } catch (e: any) { return res.status(400).json({ message: e.message }); }
    }
    async assign(req: AuthRequest, res: Response) {
        const { container_no, slot_id } = req.body || {};
        if (!container_no || !slot_id) return res.status(400).json({ message: 'Thiếu dữ liệu' });
        try { return res.json(await service.assignPosition(req.user!, container_no, slot_id)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
    }

    // ----- Stacking endpoints -----
    async stackMap(_req: AuthRequest, res: Response) {
        try { return res.json(await service.getStackMap()); } catch (e: any) { return res.status(400).json({ message: e.message }); }
    }
    async stackDetails(req: AuthRequest, res: Response) {
        try { return res.json(await service.getStackDetails(String(req.params.slot_id))); } catch (e: any) { return res.status(400).json({ message: e.message }); }
    }
    async stackLookup(req: AuthRequest, res: Response) {
        try { return res.json(await service.findContainerLocation(String(req.params.container_no))); } catch (e: any) { return res.status(400).json({ message: e.message }); }
    }
    async hold(req: AuthRequest, res: Response) {
        const { slot_id, tier } = req.body || {};
        if (!slot_id) return res.status(400).json({ message: 'Thiếu slot_id' });
        try { return res.json(await service.hold(req.user!, String(slot_id), tier ? Number(tier) : undefined)); } catch (e: any) { return res.status(400).json({ message: e.message }); }
    }
    async confirm(req: AuthRequest, res: Response) {
        const { slot_id, tier, container_no } = req.body || {};
        if (!slot_id || !tier || !container_no) return res.status(400).json({ message: 'Thiếu dữ liệu' });
        try { return res.json(await service.confirm(req.user!, String(slot_id), Number(tier), String(container_no))); } catch (e: any) { return res.status(400).json({ message: e.message }); }
    }
    async release(req: AuthRequest, res: Response) {
        const { slot_id, tier } = req.body || {};
        if (!slot_id || !tier) return res.status(400).json({ message: 'Thiếu dữ liệu' });
        try { return res.json(await service.release(req.user!, String(slot_id), Number(tier))); } catch (e: any) { return res.status(400).json({ message: e.message }); }
    }
    async removeByContainer(req: AuthRequest, res: Response) {
        const { container_no } = req.body || {};
        if (!container_no) return res.status(400).json({ message: 'Thiếu container_no' });
        try { return res.json(await service.removeByContainer(req.user!, String(container_no))); } catch (e: any) { return res.status(400).json({ message: e.message }); }
    }
}

export default new YardController();
