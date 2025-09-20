import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import repo from '../repository/UserRepository';
import { audit } from '../../../shared/middlewares/audit';
import { AppRole } from '../../../shared/middlewares/auth';
import { prisma } from '../../../shared/config/database';

const INTERNAL_ROLES: AppRole[] = ['SystemAdmin','TechnicalDepartment','Driver','Security','Dispatcher'];
const CUSTOMER_ROLES: AppRole[] = [];

export class UserService {
	private ensureEmailUnique = async (email: string) => {
		const existing = await repo.findByEmail(email);
		if (existing) throw new Error('Email đã tồn tại');
	};

	private ensureRoleAllowedByCreator(creatorRole: AppRole, role: AppRole) {
		// Note: CustomerAdmin/CustomerUser roles are deprecated
		// Role validation simplified
		if (creatorRole === 'TechnicalDepartment') {
			// TechnicalDepartment can create any role
			return;
		}
	}

	async list(creator: any, query: any) {
		// Xây where cho Prisma
		const where: any = {};
		if (query.role) where.role = String(query.role);
		if (query.tenant_id) where.tenant_id = String(query.tenant_id);
		if (query.partner_id) where.partner_id = String(query.partner_id);

		// RLS scope: đã loại bỏ CustomerAdmin/CustomerUser

		const page = Math.max(1, Number(query.page) || 1);
		const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
		const skip = (page - 1) * limit;
		const [data, total] = await Promise.all([
			repo.list(where, skip, limit),
			repo.count(where)
		]);
		return { data, total, page, totalPages: Math.ceil(total / limit) };
	}

	async createByHR(actor: any, payload: { full_name: string; email: string; password: string; role: AppRole; }) {
		this.ensureRoleAllowedByCreator(actor.role as AppRole, payload.role);
		await this.ensureEmailUnique(payload.email);
		const passwordHash = await bcrypt.hash(payload.password, 10);
		const user = await repo.create({
			full_name: payload.full_name,
			email: payload.email,
			role: payload.role,
			status: 'ACTIVE',
			password_hash: passwordHash
		});
		await audit(String(actor._id as any), 'USER.CREATED', 'USER', String((user as any)._id));
		
		return user;
	}

    // createCustomerUser: đã loại bỏ

	async update(actor: any, id: string, data: any) {
		const user = await repo.findById(id);
		if (!user) throw new Error('User không tồn tại');

		// Defense-in-depth: chặn tự đổi vai trò/chức năng
		if (String(actor._id) === String(id) && (typeof data.role !== 'undefined' || typeof data.permissions !== 'undefined')) {
			throw new Error('Không thể tự đổi vai trò/chức năng của chính mình');
		}
		// Tenant boundary for Customer Admin: đã loại bỏ
		// Role change rule
		if (data.role && actor.role !== 'SystemAdmin') {
			// Only high roles can change role
			throw new Error('Không có quyền đổi vai trò');
		}
		// Permissions change rule
		if (data.permissions && actor.role !== 'SystemAdmin') {
			throw new Error('Không có quyền đổi chức năng');
		}

		// Chuẩn hóa permissions (unique, trimmed, max 50) — Joi đã validate pattern/size, đây là lớp phòng vệ bổ sung
		if (Array.isArray(data.permissions)) {
			const uniq = Array.from(new Set((data.permissions as string[]).map((s) => String(s).trim())));
			data.permissions = uniq.slice(0, 50);
		}
		// Prevent tenant/partner change without high privileges
		if ((data.tenant_id || data.partner_id) && actor.role !== 'SystemAdmin') {
			throw new Error('Không có quyền đổi scope');
		}
		const updated = await repo.updateById(id, data);
		const event = data.role
			? 'USER.ROLE_CHANGED'
			: (data.permissions ? 'USER.PERMISSION_CHANGED' : 'USER.UPDATED');
		await audit(String(actor._id as any), event, 'USER', id, { fields: Object.keys(data) });
		return updated;
	}

	async disable(actor: any, id: string) {
		const user = await repo.updateById(id, { status: 'DISABLED' });
		if (!user) throw new Error('User không tồn tại');
		await audit(String(actor._id as any), 'USER.DISABLED', 'USER', id);
		return true;
	}

	async enable(actor: any, id: string) {
		const user = await repo.updateById(id, { status: 'ACTIVE' });
		if (!user) throw new Error('User không tồn tại');
		await audit(String(actor._id as any), 'USER.ENABLED', 'USER', id);
		return true;
	}

	async lock(actor: any, id: string) {
		const user = await repo.findById(id);
		if (!user) throw new Error('User không tồn tại');
		
		// Logic liên quan CustomerAdmin: đã loại bỏ
		
		await repo.updateById(id, { status: 'LOCKED' });
		await audit(String(actor._id as any), 'USER.LOCKED', 'USER', id);
		return true;
	}

	async unlock(actor: any, id: string) {
		const user = await repo.findById(id);
		if (!user) throw new Error('User không tồn tại');
		
		// Logic liên quan CustomerAdmin: đã loại bỏ
		
		await repo.updateById(id, { status: 'ACTIVE' });
		await audit(String(actor._id as any), 'USER.UNLOCKED', 'USER', id);
		return true;
	}


	async delete(actor: any, id: string) {
		const user = await repo.findById(id);
		if (!user) throw new Error('User không tồn tại');
		if (user.status !== 'DISABLED') throw new Error('Chỉ có thể xóa user đã bị vô hiệu hóa');
		
		await repo.deleteById(id);
		await audit(String(actor._id as any), 'USER.DELETED', 'USER', id);
		return true;
	}

	private buildInvite() { return { token: crypto.randomBytes(24).toString('hex'), expires: new Date(Date.now() + 1000*60*60*24*7) }; }
}

export default new UserService();
