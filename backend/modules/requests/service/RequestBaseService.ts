import repo from '../repository/RequestRepository';
import { audit } from '../../../shared/middlewares/audit';
import { prisma } from '../../../shared/config/database';
import chatService from '../../chat/service/ChatService';

export class RequestBaseService {
	/**
	 * Tạo request mới bởi customer
	 */
	async createByCustomer(actor: any, payload: { type: string; container_no?: string; eta?: Date }, files?: Express.Multer.File[]) {
		// Kiểm tra logic business: IMPORT cần container_no và files, EXPORT chỉ cần ETA
		if (payload.type === 'IMPORT') {
			if (!payload.container_no) {
				throw new Error('Mã định danh container là bắt buộc cho yêu cầu nhập');
			}
			if (!files || files.length === 0) {
				throw new Error('Chứng từ là bắt buộc cho yêu cầu nhập');
			}
			
		}

		const data = {
			tenant_id: actor.tenant_id || null,
			created_by: actor._id,
			type: payload.type,
			container_no: payload.container_no || null, // Có thể null cho EXPORT
			eta: payload.eta || null,
			status: 'PENDING',
			history: [{ at: new Date().toISOString(), by: actor._id, action: 'CREATE' }]
		};
		const req = await repo.create(data);
		
		await audit(actor._id, 'REQUEST.CREATED', 'ServiceRequest', req.id);
		
		// Tự động tạo chat room cho request mới
		try {
			await chatService.createChatRoom(actor, req.id);
		} catch (error) {
			console.error('Không thể tạo chat room:', error);
		}
		
		return req;
	}

	/**
	 * Tạo request bởi Sale Admin
	 */
	async createBySaleAdmin(actor: any, payload: any) {
		const req = await repo.create({ 
			...payload, 
			created_by: actor._id, 
			status: 'SCHEDULED', 
			history: [{ at: new Date().toISOString(), by: actor._id, action: 'SCHEDULED' }] 
		});
		await audit(actor._id, 'REQUEST.SCHEDULED', 'ServiceRequest', req.id);
		return req;
	}

	/**
	 * Lấy request theo ID với kiểm tra quyền
	 */
	async getById(actor: any, id: string) {
		const req = await repo.findById(id);
		if (!req) throw new Error('Yêu cầu không tồn tại');
		
		// Note: CustomerAdmin/CustomerUser roles are deprecated
		// Tenant access check removed as these roles no longer exist
		
		return req;
	}

	/**
	 * Lấy danh sách requests với filter và pagination
	 */
	async list(actor: any, query: any) {
		const filter: any = {};
		if (query.type) filter.type = query.type;
		if (query.status) filter.status = query.status;
		
		// Xác định actor type để filter soft-delete
		let actorType: 'depot' | 'customer' | undefined;
		if (['TechnicalDepartment', 'SystemAdmin', 'Accountant'].includes(actor.role)) {
			actorType = 'depot';
		}
		
		// Note: CustomerAdmin/CustomerUser roles are deprecated
		// Tenant scoping removed as these roles no longer exist
		
		const page = Math.max(1, Number(query.page) || 1);
		const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
		const skip = (page - 1) * limit;
		const includeHidden = query.includeHidden === 'true';
		
		const [data, total] = await Promise.all([
			repo.list(filter, skip, limit, actorType, includeHidden), 
			repo.count(filter)
		]);
		
		// Gắn thông tin payment mới nhất, documents và viewquote để FE hiển thị
		const withPaymentAndDocs = await Promise.all(
			data.map(async (r: any) => {
				const [pay, docs, repairTicket] = await Promise.all([
					repo.getLatestPayment(r.id),
					repo.listDocs(r.id),
					// Lấy thông tin viewquote từ RepairTicket nếu có container_no
					r.container_no ? prisma.repairTicket.findFirst({
						where: { container_no: r.container_no },
						select: { viewquote: true }
					}) : Promise.resolve(null)
				]);
				return { 
					...r, 
					latest_payment: pay || null,
					documents: docs || [],
					viewquote: repairTicket?.viewquote || 0
				};
			})
		);
		return { data: withPaymentAndDocs, total, page, totalPages: Math.ceil(total / limit) };
	}



}

export default new RequestBaseService();
