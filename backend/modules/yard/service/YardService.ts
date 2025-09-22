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
		
		// Lấy danh sách container có trạng thái IN_CAR để loại bỏ khỏi yard
		const inCarContainers = await prisma.serviceRequest.findMany({
			where: { 
				status: 'IN_CAR',
				container_no: { not: null }
			},
			select: { container_no: true }
		});
		const inCarContainerNos = new Set(inCarContainers.map(c => c.container_no!));
		
		// Đếm số OCCUPIED và HOLD(active) theo slot_id bằng groupBy, loại bỏ container IN_CAR
		const [occCounts, holdCounts] = await Promise.all([
			prisma.yardPlacement.groupBy({
				by: ['slot_id'],
				where: { 
					status: 'OCCUPIED', 
					removed_at: null,
					container_no: { notIn: Array.from(inCarContainerNos) } // Loại bỏ container IN_CAR
				},
				_count: { _all: true }
			}),
			prisma.yardPlacement.groupBy({
				by: ['slot_id'],
				where: { 
					status: 'HOLD', 
					OR: [ { hold_expires_at: null }, { hold_expires_at: { gt: now } } ],
					container_no: { notIn: Array.from(inCarContainerNos) } // Loại bỏ container IN_CAR
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
		
		// Lọc bỏ container có trạng thái IN_CAR khỏi placements
		const inCarContainers = await prisma.serviceRequest.findMany({
			where: { 
				status: 'IN_CAR',
				container_no: { not: null }
			},
			select: { container_no: true }
		});
		const inCarContainerNos = new Set(inCarContainers.map(c => c.container_no!));
		
		// Lọc placements để loại bỏ container IN_CAR
		const filteredPlacements = slot.placements.filter((p: any) => 
			!p.container_no || !inCarContainerNos.has(p.container_no)
		);
		
		return {
			...slot,
			placements: filteredPlacements
		};
	}

	async findContainerLocation(container_no: string) {
		// Kiểm tra xem container có trạng thái IN_CAR không
		const inCarRequest = await prisma.serviceRequest.findFirst({
			where: { 
				container_no,
				status: 'IN_CAR'
			}
		});
		
		// Nếu container có trạng thái IN_CAR, không trả về vị trí
		if (inCarRequest) {
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
		
		// SystemAdmin có thể nhập container tùy ý
		const isSystemAdmin = actor.role === 'SystemAdmin';
		

		
		// Kiểm tra container có tồn tại và có trạng thái "Đang chờ sắp xếp" không (chỉ cho non-SystemAdmin)
		if (!isSystemAdmin) {
			const containerStatus = await this.validateContainerForYardPlacement(container_no);
			if (!containerStatus.canPlace) {
				throw new Error(containerStatus.reason);
			}
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
			

			
			if (isSystemAdmin) {
				// SystemAdmin: Logic mới - chỉ tạo ForkliftTask khi container có trạng thái "Đang chờ sắp xếp"
				
				const latestRequest = await tx.serviceRequest.findFirst({
					where: { container_no },
					orderBy: { createdAt: 'desc' }
				});


				// Kiểm tra xem container có trạng thái "Đang chờ sắp xếp" không
				// Container đang chờ sắp xếp nếu có ServiceRequest với status = 'COMPLETED'
				const isWaitingForPlacement = latestRequest && latestRequest.status === 'COMPLETED';
				
				// Nếu không có ServiceRequest COMPLETED, kiểm tra RepairTicket
				let isWaitingFromRepair = false;
				if (!isWaitingForPlacement) {
					const repairTicket = await tx.repairTicket.findFirst({
						where: { 
							container_no,
							status: 'COMPLETED'
						},
						orderBy: { updatedAt: 'desc' }
					});
					isWaitingFromRepair = !!repairTicket;
				}
				
				const shouldCreateForkliftTask = isWaitingForPlacement || isWaitingFromRepair;

				if (shouldCreateForkliftTask) {
					// Container có trạng thái "Đang chờ sắp xếp" - tạo ForkliftTask
					console.log(`✅ [SystemAdmin] Creating forklift task for ${container_no}`);
					await tx.forkliftTask.create({
						data: {
							container_no,
							to_slot_id: slot_id,
							status: 'PENDING',
							created_by: actor._id
						}
					});

					// Cập nhật request status từ COMPLETED sang POSITIONED (nếu có ServiceRequest)
					if (isWaitingForPlacement && latestRequest) {
						await tx.serviceRequest.update({
							where: { id: latestRequest.id },
							data: { 
								status: 'POSITIONED',
								updatedAt: now
							}
						});
						console.log(`✅ [SystemAdmin] Updated request status to POSITIONED for ${container_no}`);
					}
				} else {
					// Container không có trạng thái "Đang chờ sắp xếp" - không tạo ForkliftTask
					console.log(`❌ [SystemAdmin] NOT creating forklift task for ${container_no} - not waiting for placement`);
					// Chỉ tạo ContainerMeta nếu chưa tồn tại
					await tx.containerMeta.upsert({
						where: { container_no },
						update: { updatedAt: now },
						create: { 
							container_no,
							updatedAt: now
						}
					});
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

	async liftContainer(actor: any, container_no: string) {
		// Kiểm tra container có tồn tại trong bãi không
		const containerLocation = await this.findContainerLocation(container_no);
		if (!containerLocation) {
			throw new Error(`Container ${container_no} không tồn tại trong bãi`);
		}

		// Kiểm tra container có đang ở trạng thái OCCUPIED không
		if (containerLocation.status !== 'OCCUPIED') {
			throw new Error(`Container ${container_no} không ở trạng thái OCCUPIED (hiện tại: ${containerLocation.status})`);
		}

		// Thực hiện remove container (sử dụng logic tương tự removeByContainer)
		const now = new Date();
		const updated = await prisma.$transaction(async (tx) => {
			const placement = await tx.yardPlacement.findFirst({ 
				where: { 
					container_no, 
					status: 'OCCUPIED',
					removed_at: null
				} 
			});
			
			if (!placement) {
				throw new Error('Container không ở trạng thái OCCUPIED');
			}

			// Kiểm tra LIFO constraint - không thể remove nếu có container ở tier cao hơn
			const higher = await tx.yardPlacement.findFirst({
				where: {
					slot_id: placement.slot_id,
					tier: { gt: placement.tier },
					OR: [
						{ status: 'OCCUPIED', removed_at: null },
						{ status: 'HOLD', hold_expires_at: { gt: now } }
					]
				}
			});
			
			if (higher) {
				throw new Error('Vi phạm LIFO: Tồn tại container ở tier cao hơn, không thể nâng container này');
			}

			// Cập nhật placement thành REMOVED
			const updatedPlacement = await tx.yardPlacement.update({
				where: { slot_tier_unique: { slot_id: placement.slot_id, tier: placement.tier } },
				data: { status: 'REMOVED', removed_at: new Date() }
			});

			// Cập nhật YardSlot.occupant_container_no nếu cần
			const remainingPlacements = await tx.yardPlacement.findMany({
				where: {
					slot_id: placement.slot_id,
					status: 'OCCUPIED',
					removed_at: null
				},
				orderBy: { tier: 'desc' }
			});

			if (remainingPlacements.length > 0) {
				// Cập nhật occupant_container_no cho container ở tier cao nhất còn lại
				const topContainer = remainingPlacements[0];
				await tx.yardSlot.update({
					where: { id: placement.slot_id },
					data: { occupant_container_no: topContainer.container_no }
				});
			} else {
				// Không còn container nào trong slot
				await tx.yardSlot.update({
					where: { id: placement.slot_id },
					data: { 
						occupant_container_no: null,
						status: 'EMPTY'
					}
				});
			}

			return updatedPlacement;
		}, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

		await audit(actor._id, 'YARD.LIFT_CONTAINER', 'YARD_SLOT', updated.slot_id, { 
			tier: updated.tier, 
			container_no,
			action: 'LIFT_CONTAINER'
		});

		return {
			message: `Container ${container_no} đã được nâng thành công`,
			container_no,
			slot_id: updated.slot_id,
			tier: updated.tier,
			removed_at: updated.removed_at
		};
	}

	async searchContainers(query: string, limit: number = 10) {
		// Tìm kiếm container trong bãi theo pattern
		const searchPattern = `%${query.toUpperCase()}%`;
		
		// Tìm container từ YardPlacement (container đang trong bãi)
		const yardContainers = await prisma.yardPlacement.findMany({
			where: {
				container_no: {
					contains: query.toUpperCase(),
					mode: 'insensitive'
				},
				status: 'OCCUPIED',
				removed_at: null
			},
			select: {
				container_no: true,
				slot: {
					select: {
						code: true,
						block: {
							select: {
								code: true,
								yard: {
									select: {
										name: true
									}
								}
							}
						}
					}
				},
				tier: true
			},
			take: limit,
			orderBy: {
				container_no: 'asc'
			}
		});

		// Tìm container từ ServiceRequest (container có thể được nâng)
		const serviceContainers = await prisma.serviceRequest.findMany({
			where: {
				container_no: {
					contains: query.toUpperCase(),
					mode: 'insensitive'
				},
				status: {
					in: ['COMPLETED', 'POSITIONED', 'IN_CAR']
				}
			},
			select: {
				container_no: true,
				status: true,
				createdAt: true
			},
			take: Math.max(0, limit - yardContainers.length),
			orderBy: {
				createdAt: 'desc'
			}
		});

		// Format kết quả
		const results = [];

		// Thêm container từ bãi
		for (const container of yardContainers) {
			results.push({
				container_no: container.container_no,
				location: `${container.slot.block.yard.name} - ${container.slot.block.code} - ${container.slot.code}`,
				tier: container.tier,
				status: 'IN_YARD',
				type: 'yard'
			});
		}

		// Thêm container từ service request
		for (const container of serviceContainers) {
			// Chỉ thêm nếu chưa có trong kết quả bãi
			if (!results.find(r => r.container_no === container.container_no)) {
				results.push({
					container_no: container.container_no,
					location: 'Chưa đặt vào bãi',
					tier: null,
					status: container.status,
					type: 'service'
				});
			}
		}

		return results.slice(0, limit);
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
}

export default new YardService();


