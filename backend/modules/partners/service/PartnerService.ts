import repo from '../repository/PartnerRepository';
import { audit } from '../../../shared/middlewares/audit';
import { prisma } from '../../../shared/config/database';

export class PartnerService {
	async list(query: any) {
		const filter: any = {};
		if (query.type) filter.type = query.type;
		if (query.status) filter.status = query.status;
		const page = Math.max(1, Number(query.page) || 1);
		const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
		const skip = (page - 1) * limit;
		const [data, total] = await Promise.all([ repo.list(filter, skip, limit), repo.count(filter) ]);
		return { data, total, page, totalPages: Math.ceil(total / limit) };
	}

	async create(actorId: string, payload: any) {
		const dup = await repo.findByName(payload.name);
		if (dup) throw new Error('Tên đối tác đã tồn tại');
		const partner = await repo.create({ ...payload, status: 'DRAFT' });
		await audit(actorId, 'PARTNER.CREATED', 'PARTNER', String((partner as any)._id));
		return partner;
	}

	async update(actorId: string, id: string, data: any) {
		const updated = await repo.updateById(id, data);
		if (!updated) throw new Error('Đối tác không tồn tại');
		await audit(actorId, 'PARTNER.UPDATED', 'PARTNER', id, { fields: Object.keys(data) });
		return updated;
	}

	async activate(actorId: string, id: string) {
		const updated = await repo.updateById(id, { status: 'ACTIVE' });
		if (!updated) throw new Error('Đối tác không tồn tại');
		await audit(actorId, 'PARTNER.ACTIVATED', 'PARTNER', id);
		return true;
	}

	async deactivate(actorId: string, id: string) {
		const updated = await repo.updateById(id, { status: 'INACTIVE' });
		if (!updated) throw new Error('Đối tác không tồn tại');
		await audit(actorId, 'PARTNER.DEACTIVATED', 'PARTNER', id);
		return true;
	}

	// createPrimaryAdmin: đã vô hiệu hoá
}

export default new PartnerService();
