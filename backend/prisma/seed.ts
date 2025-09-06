import { PrismaClient, RepairStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(){
	const email = 'admin@smartlog.local';
	const password = 'Admin@1234';
	const password_hash = await bcrypt.hash(password, 10);
	await prisma.user.upsert({
		where: { email },
		update: {},
		create: {
			email,
			full_name: 'System Admin',
			role: 'SystemAdmin',
			status: 'ACTIVE',
			password_hash
		}
	});
	console.log('Seeded SystemAdmin:', email, password);
	// Khôi phục layout bãi cố định (dữ liệu thật): tạo Yard/Block/Slot nếu chưa có
	const yards = await prisma.yard.count();
	if (yards === 0) {
		const yard = await prisma.yard.create({ data: { name: 'B' } });
		for (let bi = 1; bi <= 2; bi++) {
			const block = await prisma.yardBlock.create({ data: { yard_id: yard.id, code: `B${bi}` } });
			const slots = new Array(20).fill(0).map((_, idx) => ({
				block_id: block.id,
				code: `${block.code}-${idx + 1}`,
				status: 'EMPTY',
				near_gate: 20 - idx,
				avoid_main: idx % 5 === 0 ? 1 : 0,
				is_odd: (idx % 2) === 1,
				tier_capacity: 5
			}));
			await prisma.yardSlot.createMany({ data: slots });
		}
		console.log('Seeded Yard layout (B, B1-B2, 20 slots/block)');
	} else {
		console.log('Yard layout already exists, skipping.');
	}

	// Seed dữ liệu mẫu cho báo cáo containers CHECKED (bật bằng SEED_DEMO=true)
	const enableDemo = process.env.SEED_DEMO === 'true';
	if (enableDemo) try {
		const admin = await prisma.user.findUnique({ where: { email } });

		// A. Container đã Gate CHECKED (có ServiceRequest.gate_checked_at)
		const containerA = 'TGHU1234567';
		const existsA = await prisma.serviceRequest.findFirst({
			where: { container_no: containerA, gate_checked_at: { not: null } }
		});
		if (!existsA && admin) {
			await prisma.serviceRequest.create({
				data: {
					created_by: admin.id,
					type: 'IMPORT',
					container_no: containerA,
					status: 'GATE_IN',
					gate_checked_at: new Date(),
					gate_checked_by: admin.id,
					driver_name: 'Nguyễn Văn A',
					license_plate: '51H-123.45'
				}
			});

			// Thử đặt container vào một slot trống để có trạng thái IN_YARD
			const emptySlot = await prisma.yardSlot.findFirst({ where: { status: 'EMPTY' } });
			if (emptySlot) {
				await prisma.yardSlot.update({
					where: { id: emptySlot.id },
					data: { status: 'OCCUPIED', occupant_container_no: containerA }
				});
				console.log('Placed container in yard:', containerA, emptySlot.code);
			}

			console.log('Seeded ServiceRequest (gate checked):', containerA);
		} else {
			console.log('ServiceRequest (gate checked) exists:', containerA);
		}

		// B. Container đã Repair CHECKED (RepairTicket.status = CHECKED)
		const containerB = 'MSCU7654321';
		const existsB = await prisma.repairTicket.findFirst({
			where: { container_no: containerB, status: RepairStatus.CHECKED }
		});
		if (!existsB && admin) {
			await prisma.repairTicket.create({
				data: {
					code: 'RT-DEMO-CHECKED-1',
					container_no: containerB,
					created_by: admin.id,
					status: RepairStatus.CHECKED,
					problem_description: 'Demo checked repair'
				}
			});
			console.log('Seeded RepairTicket CHECKED:', containerB);
		} else {
			console.log('RepairTicket CHECKED exists:', containerB);
		}
	} catch (e) {
		console.error('Seed demo data error:', e);
	} else {
		console.log('Skip demo seed (SEED_DEMO != true)');
	}

	console.log('Seed completed.');
}

main().finally(()=>prisma.$disconnect());
