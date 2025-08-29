import { prisma, appConfig } from '../../../shared/config/database';
import { audit } from '../../../shared/middlewares/audit';
import { Prisma } from '@prisma/client';

export class YardService {
	async getMap() {
		const yards = await prisma.yard.findMany({ include: { blocks: { include: { slots: true } } } });
		return yards;
	}

	async findContainer(container_no: string) {
		const slot = await prisma.yardSlot.findFirst({ where: { occupant_container_no: container_no }, include: { block: { include: { yard: true } } } });
		return slot;
	}

	async suggestPosition(container_no: string) {
		// Nếu container đã có vị trí -> không gợi ý, yêu cầu thao tác di chuyển
		if (container_no) {
			const current = await prisma.yardSlot.findFirst({ where: { occupant_container_no: container_no } });
			if (current) {
				throw new Error(`Container đã được gán tại ${current.code}. Vui lòng giải phóng/di chuyển trước khi gán mới`);
			}
		}
		// simple scoring demo according to weights
		const slots: any[] = await prisma.yardSlot.findMany({ where: { status: 'EMPTY' }, take: 50 });
		const scored: Array<{ slot: any; score: number }> = slots.map((s: any) => {
			const near = s.near_gate || 0; // higher is closer
			const sameType = 1; // placeholder
			const avoid = s.avoid_main || 0;
			const odd = s.is_odd ? 1 : 0;
			const score = 0.4*near + 0.3*sameType + 0.2*(1-avoid) + 0.1*odd;
			return { slot: s, score };
		}).sort((a: {score:number}, b: {score:number})=>b.score-a.score);
		return scored.slice(0,10);
	}

	async assignPosition(actor: any, container_no: string, slot_id: string) {
		// Chặn gán khi container đã có vị trí hiện hữu
		const existing = await prisma.yardSlot.findFirst({ where: { occupant_container_no: container_no } });
		if (existing) {
			throw new Error(`Container đã được gán tại ${existing.code}. Không thể gán trùng.`);
		}
		const slot = await prisma.yardSlot.findUnique({ where: { id: slot_id } });
		if (!slot) throw new Error('Slot không tồn tại');
		if (!['EMPTY','RESERVED'].includes(slot.status)) throw new Error('Slot không khả dụng');
		const updated = await prisma.yardSlot.update({ where: { id: slot_id }, data: { status: 'OCCUPIED', occupant_container_no: container_no, reserved_expire_at: null } });
		await audit(actor._id, 'YARD.POSITION_ASSIGNED', 'YARD_SLOT', slot_id, { container_no });
		return updated;
	}

	// ==========================
	// Stacking (multi-tier) APIs
	// ==========================

	private isHoldActive(p: any, now: Date) {
		return p.status === 'HOLD' && (!p.hold_expires_at || new Date(p.hold_expires_at) > now);
	}

	async getStackMap() {
		const now = new Date();
		// Đếm số OCCUPIED và HOLD(active) theo slot_id bằng groupBy
		const [occCounts, holdCounts] = await Promise.all([
			prisma.yardPlacement.groupBy({
				by: ['slot_id'],
				where: { status: 'OCCUPIED', removed_at: null },
				_count: { _all: true }
			}),
			prisma.yardPlacement.groupBy({
				by: ['slot_id'],
				where: { status: 'HOLD', OR: [ { hold_expires_at: null }, { hold_expires_at: { gt: now } } ] },
				_count: { _all: true }
			})
		]);
		const occMap = new Map<string, number>(occCounts.map((c: any) => [c.slot_id, c._count._all]));
		const holdMap = new Map<string, number>(holdCounts.map((c: any) => [c.slot_id, c._count._all]));

		const yards = await prisma.yard.findMany({
			include: { blocks: { include: { slots: true } } }
		});
		return yards.map((y: any) => ({
			...y,
			blocks: y.blocks.map((b: any) => ({
				...b,
				slots: b.slots.map((s: any) => ({
					...s,
					occupied_count: occMap.get(s.id) || 0,
					hold_count: holdMap.get(s.id) || 0
				}))
			}))
		}));
	}

	async getStackDetails(slot_id: string) {
		const slot = await prisma.yardSlot.findUnique({
			where: { id: slot_id },
			include: { placements: { orderBy: { tier: 'asc' } }, block: { include: { yard: true } } }
		});
		if (!slot) throw new Error('Slot không tồn tại');
		return slot;
	}

	async findContainerLocation(container_no: string) {
		const place = await prisma.yardPlacement.findFirst({
			where: { container_no, status: { in: ['HOLD','OCCUPIED'] } },
			include: { slot: { include: { block: { include: { yard: true } } } } }
		});
		return place;
	}

	private async pickAvailableTier(slot: any, now: Date): Promise<number> {
		const cap: number = slot.tier_capacity || 5;
		for (let t = 1; t <= cap; t++) {
			const found = slot.placements?.find((p: any) => p.tier === t);
			if (!found) return t;
			if (found.status === 'REMOVED') return t;
			if (this.isHoldActive(found, now)) continue; // đang hold
			if (found.status === 'OCCUPIED') continue; // đang chiếm
		}
		throw new Error('Không còn tier trống trong stack');
	}

	async hold(actor: any, slot_id: string, tier?: number) {
		const now = new Date();
		const placed = await prisma.$transaction(async (tx) => {
			const slot = await tx.yardSlot.findUnique({ where: { id: slot_id }, include: { placements: true } });
			if (!slot) throw new Error('Slot không tồn tại');
			const cap: number = slot.tier_capacity ?? 5;
			let targetTier = tier;
			const placements = slot.placements || [];
			const maxOccupied = Math.max(0, ...placements.filter((p: any) => p.status === 'OCCUPIED' && !p.removed_at).map((p: any) => p.tier));
			const allowedTier = maxOccupied + 1;
			if (allowedTier > cap) throw new Error('Không còn tier trống trong stack');

			if (targetTier) {
				if (targetTier < 1 || targetTier > cap) throw new Error('Tier không hợp lệ');
				if (targetTier !== allowedTier) {
					throw new Error(`Tier không hợp lệ: chỉ được HOLD tại tier kế tiếp ${allowedTier}`);
				}
				const existingTier = placements.find((p: any) => p.tier === targetTier);
				if (existingTier) {
					if (existingTier.status === 'OCCUPIED' && !existingTier.removed_at) {
						throw new Error('Tier đang OCCUPIED, không thể HOLD');
					}
					if (this.isHoldActive(existingTier, now)) {
						throw new Error('Tier đang HOLD, không thể HOLD trùng');
					}
				}
			} else {
				const existingAtAllowed = placements.find((p: any) => p.tier === allowedTier);
				if (existingAtAllowed && this.isHoldActive(existingAtAllowed, now)) {
					throw new Error('Tier kế tiếp đang HOLD, không thể HOLD tầng cao hơn');
				}
				targetTier = allowedTier;
			}
			const expires = new Date(now.getTime() + (appConfig.reserveTtlMinutes || 15) * 60 * 1000);
			return tx.yardPlacement.upsert({
				where: { slot_tier_unique: { slot_id, tier: targetTier! } },
				update: { status: 'HOLD', container_no: null, hold_expires_at: expires, removed_at: null, created_by: actor._id },
				create: { slot_id, tier: targetTier!, status: 'HOLD', container_no: null, hold_expires_at: expires, created_by: actor._id }
			});
		}, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
		await audit(actor._id, 'YARD.HOLD', 'YARD_SLOT', slot_id, { tier: placed.tier });
		return placed;
	}

	async confirm(actor: any, slot_id: string, tier: number, container_no: string) {
		if (!container_no) throw new Error('Thiếu container_no');
		
		// Kiểm tra container có tồn tại và có trạng thái "Đang chờ sắp xếp" không
		const containerStatus = await this.validateContainerForYardPlacement(container_no);
		if (!containerStatus.canPlace) {
			throw new Error(containerStatus.reason);
		}
		
		const now = new Date();
		const updated = await prisma.$transaction(async (tx) => {
			const existing = await tx.yardPlacement.findUnique({ where: { slot_tier_unique: { slot_id, tier } } });
			if (!existing || existing.status !== 'HOLD' || (existing.hold_expires_at && new Date(existing.hold_expires_at) <= now)) {
				throw new Error('Tier chưa HOLD hoặc đã hết hạn');
			}
			// Ngăn container đã OCCUPIED ở vị trí khác
			const dup = await tx.yardPlacement.findFirst({ where: { container_no, status: 'OCCUPIED' } });
			if (dup) throw new Error('Container đã OCCUPIED ở một vị trí khác');

			// Ràng buộc stacking: không thể confirm nếu có vật cản ở tier cao hơn
			const slot = await tx.yardSlot.findUnique({ where: { id: slot_id }, include: { placements: true } });
			if (!slot) throw new Error('Slot không tồn tại');
			const placements = slot.placements || [];
			const higherBlocking = placements.find((p: any) => p.tier > tier && ((p.status === 'OCCUPIED' && !p.removed_at) || this.isHoldActive(p, now)));
			if (higherBlocking) throw new Error('Vi phạm stacking: tồn tại container/hold ở tier cao hơn');
			// Ràng buộc: các tier phía dưới phải OCCUPIED liên tục
			for (let i = 1; i < tier; i++) {
				const below = placements.find((p: any) => p.tier === i);
				if (!below || below.status !== 'OCCUPIED' || below.removed_at) {
					throw new Error('Vi phạm stacking: các tier phía dưới chưa được OCCUPIED liên tục');
				}
			}
			
			// Cập nhật placement thành OCCUPIED
			const updatedPlacement = await tx.yardPlacement.update({
				where: { slot_tier_unique: { slot_id, tier } },
				data: { status: 'OCCUPIED', container_no, hold_expires_at: null, placed_at: now }
			});
			
			// Tạo ForkliftTask để di chuyển container vào vị trí
			await tx.forkliftTask.create({
				data: {
					container_no,
					to_slot_id: slot_id,
					status: 'PENDING',
					created_by: actor._id
				}
			});

			// Cập nhật request status từ CHECKED sang POSITIONED
			// Tìm ServiceRequest mới nhất của container này
			const latestRequest = await tx.serviceRequest.findFirst({
				where: { container_no },
				orderBy: { createdAt: 'desc' }
			});

			if (latestRequest && latestRequest.status === 'CHECKED') {
				await tx.serviceRequest.update({
					where: { id: latestRequest.id },
					data: { 
						status: 'POSITIONED',
						updatedAt: now
					}
				});
			}
			
			return updatedPlacement;
		}, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
		
		await audit(actor._id, 'YARD.CONFIRM', 'YARD_SLOT', slot_id, { tier, container_no });
		return updated;
	}

	// Thêm method mới để validate container trước khi cho phép đặt vào yard
	private async validateContainerForYardPlacement(container_no: string): Promise<{canPlace: boolean, reason?: string}> {
		try {
			// Kiểm tra container có tồn tại trong hệ thống không
			const containerExists = await prisma.$queryRaw<any[]>`
				WITH latest_sr AS (
					SELECT DISTINCT ON (sr.container_no)
						   sr.container_no,
						   sr.status as service_status,
						   sr.gate_checked_at as gate_checked_at
					FROM "ServiceRequest" sr
					ORDER BY sr.container_no, sr."createdAt" DESC
				),
				rt_checked AS (
					SELECT DISTINCT ON (rt.container_no)
						   rt.container_no,
						   TRUE as repair_checked
					FROM "RepairTicket" rt
					WHERE rt.status::text = 'CHECKED'
					ORDER BY rt.container_no, rt."updatedAt" DESC
				)
				SELECT 
					COALESCE(sr.container_no, rt.container_no) as container_no,
					sr.service_status,
					sr.gate_checked_at,
					COALESCE(rt.repair_checked, FALSE) as repair_checked
				FROM latest_sr sr
				FULL OUTER JOIN rt_checked rt ON rt.container_no = sr.container_no
				WHERE sr.container_no = ${container_no} OR rt.container_no = ${container_no}
			`;
			
			if (containerExists.length === 0) {
				return { canPlace: false, reason: 'Container không tồn tại trong hệ thống' };
			}
			
			const container = containerExists[0];
			
			// Kiểm tra container đã được kiểm tra chưa (CHECKED)
			const isChecked = container.gate_checked_at || container.repair_checked;
			if (!isChecked) {
				return { canPlace: false, reason: 'Container chưa được kiểm tra (CHECKED)' };
			}
			
			// Kiểm tra container đã được đặt vào yard chưa
			const existingPlacement = await prisma.yardPlacement.findFirst({
				where: { 
					container_no, 
					status: 'OCCUPIED',
					removed_at: null
				}
			});
			
			if (existingPlacement) {
				return { canPlace: false, reason: 'Container đã được đặt vào yard tại vị trí khác' };
			}
			
			// Container hợp lệ để đặt vào yard
			return { canPlace: true };
			
		} catch (error) {
			console.error('Error validating container for yard placement:', error);
			return { canPlace: false, reason: 'Lỗi kiểm tra container' };
		}
	}

	async release(actor: any, slot_id: string, tier: number) {
		const existing = await prisma.yardPlacement.findUnique({ where: { slot_tier_unique: { slot_id, tier } } });
		if (!existing || existing.status !== 'HOLD') throw new Error('Không ở trạng thái HOLD');
		const updated = await prisma.yardPlacement.update({
			where: { slot_tier_unique: { slot_id, tier } },
			data: { status: 'REMOVED', hold_expires_at: null, container_no: null, removed_at: new Date() }
		});
		await audit(actor._id, 'YARD.RELEASE', 'YARD_SLOT', slot_id, { tier });
		return updated;
	}

	async removeByContainer(actor: any, container_no: string) {
		const now = new Date();
		const updated = await prisma.$transaction(async (tx) => {
			const placement = await tx.yardPlacement.findFirst({ where: { container_no, status: 'OCCUPIED' } });
			if (!placement) throw new Error('Container không ở trạng thái OCCUPIED');
			const higher = await tx.yardPlacement.findFirst({
				where: {
					slot_id: placement.slot_id,
					tier: { gt: placement.tier },
					OR: [
						{ status: 'OCCUPIED' },
						{ status: 'HOLD', hold_expires_at: { gt: now } }
					]
				}
			});
			if (higher) throw new Error('Vi phạm LIFO: Tồn tại container ở tier cao hơn');
			return tx.yardPlacement.update({
				where: { slot_tier_unique: { slot_id: placement.slot_id, tier: placement.tier } },
				data: { status: 'REMOVED', removed_at: new Date() }
			});
		}, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
		await audit(actor._id, 'YARD.REMOVE', 'YARD_SLOT', updated.slot_id, { tier: updated.tier, container_no });
		return updated;
	}
}

export default new YardService();


