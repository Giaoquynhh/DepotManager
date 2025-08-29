import { prisma } from '../../../shared/config/database';
import { audit } from '../../../shared/middlewares/audit';

export class ForkliftService {
	async list(status?: string) {
		return prisma.forkliftTask.findMany({ 
			where: status ? { status } : {}, 
			include: {
				from_slot: { 
					include: { 
						block: { 
							include: { 
								yard: true 
							} 
						},
						placements: {
							where: {
								container_no: { not: null },
								status: { in: ['OCCUPIED', 'HOLD'] }
							},
							orderBy: { tier: 'desc' }
						}
					} 
				},
				to_slot: { 
					include: { 
						block: { 
							include: { 
								yard: true 
							} 
						},
						placements: {
							where: {
								status: { in: ['EMPTY', 'RESERVED'] }
							},
							orderBy: { tier: 'asc' }
						}
					} 
				}
			},
			orderBy: { createdAt: 'desc' } 
		});
	}

	async assign(actor: any, payload: { container_no: string; from_slot_id?: string; to_slot_id?: string; driver_id?: string; }) {
		const task = await prisma.forkliftTask.create({ data: {
			container_no: payload.container_no,
			from_slot_id: payload.from_slot_id || null,
			to_slot_id: payload.to_slot_id || null,
			status: 'PENDING',
			assigned_driver_id: payload.driver_id || null,
			created_by: actor._id
		}});
		await audit(actor._id, 'FORKLIFT.ASSIGN', 'TASK', task.id, payload);
		return task;
	}

	async updateStatus(actor: any, id: string, status: string, reason?: string) {
		if (!['PENDING','ASSIGNED','IN_PROGRESS','PENDING_APPROVAL','COMPLETED','CANCELLED'].includes(status)) throw new Error('Status không hợp lệ');
		const data: any = { status };
		if (status === 'CANCELLED') data.cancel_reason = reason || 'N/A';
		const updated = await prisma.forkliftTask.update({ where: { id }, data });
		await audit(actor._id, 'FORKLIFT.STATUS', 'TASK', id, { status, reason });
		return updated;
	}

	async deleteTask(actor: any, id: string) {
		const task = await prisma.forkliftTask.findUnique({ where: { id } });
		if (!task) throw new Error('Task không tồn tại');
		if (task.status !== 'CANCELLED') throw new Error('Chỉ có thể xóa task đã hủy');
		
		await prisma.forkliftTask.delete({ where: { id } });
		await audit(actor._id, 'FORKLIFT.DELETE', 'TASK', id, { container_no: task.container_no });
		return { message: 'Task đã được xóa thành công' };
	}

	// Thêm method mới để lấy thông tin vị trí chi tiết
	async getLocationDetails(slotId: string | null) {
		if (!slotId) return null;
		
		const slot = await prisma.yardSlot.findUnique({
			where: { id: slotId },
			include: {
				block: {
					include: { yard: true }
				},
				placements: {
					orderBy: { tier: 'asc' }
				}
			}
		});
		
		return slot;
	}
}

export default new ForkliftService();


