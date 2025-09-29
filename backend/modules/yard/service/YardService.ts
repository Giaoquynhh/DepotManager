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
		
		// Lấy danh sách container có trạng thái IN_CAR, DONE_LIFTING hoặc GATE_OUT (EXPORT) để loại bỏ khỏi yard
		// IMPORT với GATE_OUT: xe rời khỏi bãi nhưng container ở lại, không nên lọc bỏ
		const removedContainers = await prisma.serviceRequest.findMany({
			where: { 
				OR: [
					{ status: { in: ['IN_CAR', 'DONE_LIFTING'] } },
					{ 
						status: 'GATE_OUT',
						type: 'EXPORT' // Chỉ lọc bỏ EXPORT với GATE_OUT, giữ lại IMPORT với GATE_OUT
					}
				],
				container_no: { not: null }
			},
			select: { container_no: true }
		});
		const removedContainerNos = new Set(removedContainers.map(c => c.container_no!));
		
		// Đếm số OCCUPIED và HOLD(active) theo slot_id bằng groupBy, loại bỏ container đã rời khỏi bãi
		const [occCounts, holdCounts] = await Promise.all([
			prisma.yardPlacement.groupBy({
				by: ['slot_id'],
				where: { 
					status: 'OCCUPIED', 
					removed_at: null,
					container_no: { notIn: Array.from(removedContainerNos) } // Loại bỏ container IN_CAR và DONE_LIFTING
				},
				_count: { _all: true }
			}),
			prisma.yardPlacement.groupBy({
				by: ['slot_id'],
				where: { 
					status: 'HOLD', 
					OR: [ { hold_expires_at: null }, { hold_expires_at: { gt: now } } ],
					container_no: { notIn: Array.from(removedContainerNos) } // Loại bỏ container IN_CAR và DONE_LIFTING
				},
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
		
		// Lọc bỏ container có trạng thái IN_CAR, DONE_LIFTING hoặc GATE_OUT (EXPORT) khỏi placements
		// IMPORT với GATE_OUT: xe rời khỏi bãi nhưng container ở lại, không nên lọc bỏ
		const removedContainers = await prisma.serviceRequest.findMany({
			where: { 
				OR: [
					{ status: { in: ['IN_CAR', 'DONE_LIFTING'] } },
					{ 
						status: 'GATE_OUT',
						type: 'EXPORT' // Chỉ lọc bỏ EXPORT với GATE_OUT, giữ lại IMPORT với GATE_OUT
					}
				],
				container_no: { not: null }
			},
			select: { container_no: true }
		});
		const removedContainerNos = new Set(removedContainers.map(c => c.container_no!));
		
		// Lọc placements để loại bỏ container đã rời khỏi bãi
		const filteredPlacements = slot.placements.filter((p: any) => 
			!p.container_no || !removedContainerNos.has(p.container_no)
		);
		
		return {
			...slot,
			placements: filteredPlacements
		};
	}

	async findContainerLocation(container_no: string) {
		// Kiểm tra xem container có trạng thái IN_CAR, DONE_LIFTING hoặc GATE_OUT (EXPORT) không
		// IMPORT với GATE_OUT: xe rời khỏi bãi nhưng container ở lại, vẫn có thể tìm thấy vị trí
		const removedRequest = await prisma.serviceRequest.findFirst({
			where: { 
				container_no,
				OR: [
					{ status: { in: ['IN_CAR', 'DONE_LIFTING'] } },
					{ 
						status: 'GATE_OUT',
						type: 'EXPORT' // Chỉ lọc bỏ EXPORT với GATE_OUT, giữ lại IMPORT với GATE_OUT
					}
				]
			}
		});
		
		// Nếu container đã rời khỏi bãi, không trả về vị trí
		if (removedRequest) {
			return null;
		}
		
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
		
		// SystemAdmin có thể nhập container tùy ý, NHƯNG vẫn phải tuân theo quy tắc DONE_LIFTING
		const isSystemAdmin = actor.role === 'SystemAdmin';
		
		// Kiểm tra container có tồn tại và có trạng thái hợp lệ
		const containerStatus = await this.validateContainerForYardPlacement(container_no);
		if (!containerStatus.canPlace) {
			// SystemAdmin có thể bypass một số validation, NHƯNG KHÔNG được bypass DONE_LIFTING và GATE_OUT
			if (isSystemAdmin && !containerStatus.reason?.includes('DONE_LIFTING') && !containerStatus.reason?.includes('GATE_OUT')) {
				// SystemAdmin có thể bypass các validation khác, nhưng không được bypass DONE_LIFTING và GATE_OUT
			} else {
				throw new Error(containerStatus.reason);
			}
		}
		
		// Đặc biệt xử lý container có trạng thái GATE_OUT - tự động chuyển về IN_YARD khi hạ xuống bãi
		const latestRequest = await prisma.serviceRequest.findFirst({
			where: { container_no },
			orderBy: { createdAt: 'desc' }
		});
		
		if (latestRequest && latestRequest.status === 'GATE_OUT') {
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
			
			// Cập nhật YardSlot.occupant_container_no cho tier cao nhất
			const topOccupiedTier = Math.max(...placements.filter((p: any) => p.status === 'OCCUPIED' && !p.removed_at).map((p: any) => p.tier), tier);
			if (topOccupiedTier === tier) {
				await tx.yardSlot.update({
					where: { id: slot_id },
					data: { occupant_container_no: container_no }
				});
			}
			
			// Đặc biệt xử lý: Chỉ với IMPORT (HẠ), nếu container có trạng thái GATE_OUT, tự động chuyển về IN_YARD
			// EXPORT (NÂNG): GATE_OUT có nghĩa là container thực sự ra khỏi bãi, không chuyển về IN_YARD
			if (latestRequest && latestRequest.status === 'GATE_OUT' && latestRequest.type === 'IMPORT') {
				console.log(`🔄 [Auto-fix] Container ${container_no} là IMPORT (HẠ), chuyển từ GATE_OUT về IN_YARD`);
				await tx.serviceRequest.update({
					where: { id: latestRequest.id },
					data: {
						status: 'IN_YARD',
						history: {
							...(latestRequest.history as any || {}),
							container_placed: {
								previous_status: 'GATE_OUT',
								placed_at: now.toISOString(),
								placed_by: actor._id,
								yard: 'N/A', // Slot info không có trong transaction này
								block: 'N/A',
								slot: 'N/A',
								reason: 'Container IMPORT (HẠ) được hạ xuống bãi, tự động chuyển từ GATE_OUT về IN_YARD'
							}
						}
					}
				});
			} else if (latestRequest && latestRequest.status === 'GATE_OUT' && latestRequest.type === 'EXPORT') {
				console.log(`⚠️ [Skip] Container ${container_no} là EXPORT (NÂNG), GATE_OUT có nghĩa là đã ra khỏi bãi, không chuyển về IN_YARD`);
			}
			

			
			if (isSystemAdmin) {
				// SystemAdmin: Logic mới - tạo ServiceRequest nếu chưa có, sau đó xử lý ForkliftTask
				console.log(`🔍 [SystemAdmin] Processing container ${container_no} for SystemAdmin placement`);
				
				let latestRequest = await tx.serviceRequest.findFirst({
					where: { container_no },
					orderBy: { createdAt: 'desc' }
				});

				console.log(`🔍 [SystemAdmin] Latest request for ${container_no}:`, latestRequest ? {
					id: latestRequest.id,
					status: latestRequest.status,
					type: latestRequest.type,
					container_no: latestRequest.container_no,
					createdAt: latestRequest.createdAt
				} : 'No request found');

				if (latestRequest) {
					// SystemAdmin với ServiceRequest: Tạo ForkliftTask để hiển thị trong LowerContainer/Forklift
					console.log(`💡 [SystemAdmin] Container ${container_no} có ServiceRequest, tạo ForkliftTask`);
					await tx.forkliftTask.create({
						data: {
							container_no,
							to_slot_id: slot_id,
							status: 'PENDING',
							created_by: actor._id
						}
					});
					console.log(`✅ [SystemAdmin] Created ForkliftTask for ${container_no}`);
				} else {
					// SystemAdmin không có ServiceRequest: Đặt trực tiếp vào bãi
					console.log(`💡 [SystemAdmin] Container ${container_no} không có ServiceRequest, đặt trực tiếp vào bãi`);
					
					// SystemAdmin tạo Container với trạng thái EMPTY_IN_YARD
					await tx.container.upsert({
						where: { container_no },
						update: { 
							status: 'EMPTY_IN_YARD',
							updatedAt: now 
						},
						create: { 
							container_no,
							status: 'EMPTY_IN_YARD',
							created_by: actor._id,
							createdAt: now,
							updatedAt: now
						}
					});
					console.log(`✅ [SystemAdmin] Created/Updated Container ${container_no} with status EMPTY_IN_YARD`);
				}
			} else {
				// Non-SystemAdmin: Giữ nguyên logic cũ - luôn tạo ForkliftTask
				await tx.forkliftTask.create({
					data: {
						container_no,
						to_slot_id: slot_id,
						status: 'PENDING',
						created_by: actor._id
					}
				});

				// Cập nhật request status từ COMPLETED sang POSITIONED
				// Tìm ServiceRequest mới nhất của container này
				const latestRequest = await tx.serviceRequest.findFirst({
					where: { container_no },
					orderBy: { createdAt: 'desc' }
				});

				if (latestRequest && latestRequest.status === 'COMPLETED') {
					await tx.serviceRequest.update({
						where: { id: latestRequest.id },
						data: { 
							status: 'POSITIONED',
							updatedAt: now
						}
					});
				}
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
			
			// Kiểm tra container đã được kiểm tra chưa (COMPLETED)
			const isChecked = container.gate_checked_at || container.repair_checked;
			if (!isChecked) {
				return { canPlace: false, reason: 'Container chưa được kiểm tra (COMPLETED)' };
			}
			
			// Kiểm tra container có trạng thái DONE_LIFTING không (đã rời khỏi bãi)
			if (container.service_status === 'DONE_LIFTING') {
				return { canPlace: false, reason: 'Container đã được nâng ra khỏi bãi (DONE_LIFTING), không thể đặt lại vào yard' };
			}
			
			// GATE_OUT: Chỉ cho phép IMPORT (HẠ) được đặt vào yard, EXPORT (NÂNG) không được
			if (container.service_status === 'GATE_OUT') {
				// Cần kiểm tra type của request để phân biệt IMPORT vs EXPORT
				const requestType = await prisma.serviceRequest.findFirst({
					where: { container_no },
					orderBy: { createdAt: 'desc' },
					select: { type: true }
				});
				
				if (requestType?.type === 'EXPORT') {
					return { canPlace: false, reason: 'Container EXPORT (NÂNG) đã ra khỏi cổng (GATE_OUT), không thể đặt lại vào yard' };
				}
				// IMPORT (HẠ) với GATE_OUT được phép đặt vào yard (sẽ tự động chuyển về IN_YARD)
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

	// ==========================
	// Yard Configuration APIs
	// ==========================

	async getConfiguration() {
		// Lấy cấu hình hiện tại từ database
		const yards = await prisma.yard.findMany({
			include: { 
				blocks: { 
					include: { 
						slots: {
							select: { tier_capacity: true }
						}
					} 
				} 
			}
		});

		if (yards.length === 0) {
			// Trả về cấu hình mặc định nếu chưa có
			return {
				depotCount: 2,
				slotsPerDepot: 20,
				tiersPerSlot: 5
			};
		}

		const yard = yards[0];
		const depotCount = yard.blocks.length;
		const slotsPerDepot = yard.blocks.length > 0 ? yard.blocks[0].slots.length : 0;
		const tiersPerSlot = yard.blocks.length > 0 && yard.blocks[0].slots.length > 0 
			? (yard.blocks[0].slots[0].tier_capacity || 5) 
			: 5;

		return {
			depotCount,
			slotsPerDepot,
			tiersPerSlot
		};
	}

	async configureYard(actor: any, depotCount: number, slotsPerDepot: number, tiersPerSlot: number) {
		// Validation
		if (depotCount < 1 || depotCount > 50) {
			throw new Error('Số lượng depot phải từ 1 đến 50');
		}
		if (slotsPerDepot < 1 || slotsPerDepot > 100) {
			throw new Error('Số lượng ô phải từ 1 đến 100');
		}
		if (tiersPerSlot < 1 || tiersPerSlot > 20) {
			throw new Error('Số lượng tầng phải từ 1 đến 20');
		}

		// Xóa toàn bộ dữ liệu cũ và tạo mới
		await prisma.$transaction(async (tx) => {
			// Xóa tất cả placements trước
			await tx.yardPlacement.deleteMany();
			
			// Xóa tất cả slots
			await tx.yardSlot.deleteMany();
			
			// Xóa tất cả blocks
			await tx.yardBlock.deleteMany();
			
			// Xóa tất cả yards
			await tx.yard.deleteMany();

			// Tạo yard mới
			const yard = await tx.yard.create({
				data: {
					name: 'B'
				}
			});

			// Tạo blocks (depots)
			const blocks = [];
			for (let i = 1; i <= depotCount; i++) {
				const block = await tx.yardBlock.create({
					data: {
						yard_id: yard.id,
						code: `B${i}`
					}
				});
				blocks.push(block);
			}

			// Tạo slots cho mỗi block
			for (const block of blocks) {
				for (let i = 1; i <= slotsPerDepot; i++) {
					await tx.yardSlot.create({
						data: {
							block_id: block.id,
							code: `${block.code}-${i}`,
							status: 'EMPTY',
							tier_capacity: tiersPerSlot,
							occupant_container_no: null,
							reserved_expire_at: null
						}
					});
				}
			}
		});

		await audit(actor._id, 'YARD.CONFIGURE', 'YARD', '', { 
			depotCount, 
			slotsPerDepot, 
			tiersPerSlot 
		});

		return {
			message: 'Cấu hình bãi đã được cập nhật thành công',
			depotCount,
			slotsPerDepot,
			tiersPerSlot
		};
	}

	async resetYard() {
		// Reset về cấu hình mặc định (2 depot, 20 slots, 5 tiers)
		await prisma.$transaction(async (tx) => {
			// Xóa tất cả placements trước
			await tx.yardPlacement.deleteMany();
			
			// Xóa tất cả slots
			await tx.yardSlot.deleteMany();
			
			// Xóa tất cả blocks
			await tx.yardBlock.deleteMany();
			
			// Xóa tất cả yards
			await tx.yard.deleteMany();

			// Tạo cấu hình mặc định
			const yard = await tx.yard.create({
				data: {
					name: 'B'
				}
			});

			// Tạo 2 blocks mặc định
			const blocks = [];
			for (let i = 1; i <= 2; i++) {
				const block = await tx.yardBlock.create({
					data: {
						yard_id: yard.id,
						code: `B${i}`
					}
				});
				blocks.push(block);
			}

			// Tạo 20 slots cho mỗi block
			for (const block of blocks) {
				for (let i = 1; i <= 20; i++) {
					await tx.yardSlot.create({
						data: {
							block_id: block.id,
							code: `${block.code}-${i}`,
							status: 'EMPTY',
							tier_capacity: 5,
							occupant_container_no: null,
							reserved_expire_at: null
						}
					});
				}
			}
		});

		return {
			message: 'Bãi đã được reset về cấu hình mặc định',
			depotCount: 2,
			slotsPerDepot: 20,
			tiersPerSlot: 5
		};
	}

	// ==========================
	// Additional Yard APIs
	// ==========================

	async liftContainer(actor: any, container_no: string) {
		// Tìm container trong yard
		const placement = await prisma.yardPlacement.findFirst({
			where: { 
				container_no, 
				status: 'OCCUPIED',
				removed_at: null
			},
			include: { slot: { include: { block: { include: { yard: true } } } } }
		});

		if (!placement) {
			throw new Error('Container không tồn tại trong bãi');
		}

		// Kiểm tra có container ở tier cao hơn không (vi phạm LIFO)
		const now = new Date();
		const higherPlacement = await prisma.yardPlacement.findFirst({
			where: {
				slot_id: placement.slot_id,
				tier: { gt: placement.tier },
				OR: [
					{ status: 'OCCUPIED', removed_at: null },
					{ status: 'HOLD', hold_expires_at: { gt: now } }
				]
			}
		});

		if (higherPlacement) {
			throw new Error('Vi phạm LIFO: Tồn tại container ở tier cao hơn');
		}

		// Xóa container khỏi yard
		const updated = await prisma.yardPlacement.update({
			where: { slot_tier_unique: { slot_id: placement.slot_id, tier: placement.tier } },
			data: { 
				status: 'REMOVED', 
				removed_at: new Date(),
				container_no: null
			}
		});

		// Cập nhật YardSlot.occupant_container_no nếu cần
		const remainingPlacements = await prisma.yardPlacement.findMany({
			where: {
				slot_id: placement.slot_id,
				status: 'OCCUPIED',
				removed_at: null
			},
			orderBy: { tier: 'desc' }
		});

		const topContainer = remainingPlacements.length > 0 ? remainingPlacements[0].container_no : null;
		await prisma.yardSlot.update({
			where: { id: placement.slot_id },
			data: { occupant_container_no: topContainer }
		});

		await audit(actor._id, 'YARD.LIFT', 'YARD_SLOT', placement.slot_id, { 
			container_no, 
			tier: placement.tier 
		});

		return {
			message: 'Container đã được nâng khỏi bãi',
			container_no,
			slot_code: placement.slot.code,
			tier: placement.tier
		};
	}

    async searchContainers(query: string, limit: number = 10, shippingLineId?: string) {
        // Ưu tiên lấy từ ServiceRequest mới nhất để biết shipping_line_id và container_type_id
        const results = await prisma.$queryRawUnsafe<any[]>(
            `
            WITH latest_sr AS (
              SELECT DISTINCT ON (sr.container_no)
                sr.container_no,
                sr.shipping_line_id,
                sr.container_type_id,
                sr.status as service_status,
                sr."createdAt"
              FROM "ServiceRequest" sr
              WHERE sr.container_no ILIKE $1
              ORDER BY sr.container_no, sr."createdAt" DESC
            )
            SELECT 
              yp.container_no,
              ys.code as slot_code,
              yb.code as block_code,
              y.name as yard_name,
              yp.tier,
              yp.placed_at,
              ls.shipping_line_id,
              ls.container_type_id
            FROM "YardPlacement" yp
            LEFT JOIN "YardSlot" ys ON ys.id = yp.slot_id
            LEFT JOIN "YardBlock" yb ON yb.id = ys.block_id
            LEFT JOIN "Yard" y ON y.id = yb.yard_id
            LEFT JOIN latest_sr ls ON ls.container_no = yp.container_no
            WHERE yp.status = 'OCCUPIED' AND yp.removed_at IS NULL
              AND yp.container_no ILIKE $1
              AND (ls.service_status IS NULL 
                   OR ls.service_status NOT IN ('IN_CAR', 'DONE_LIFTING') 
                   OR (ls.service_status = 'GATE_OUT' AND ls.type = 'IMPORT'))
              ${shippingLineId ? 'AND (ls.shipping_line_id = $2)' : ''}
            ORDER BY yp.container_no ASC
            LIMIT ${limit}
            `,
            `%${query}%`,
            ...(shippingLineId ? [shippingLineId] as any : [])
        );

        return results.map(row => ({
            container_no: row.container_no,
            slot_code: row.slot_code,
            block_code: row.block_code,
            yard_name: row.yard_name,
            tier: row.tier,
            placed_at: row.placed_at,
            shipping_line_id: row.shipping_line_id,
            container_type_id: row.container_type_id
        }));
    }
}

export default new YardService();


