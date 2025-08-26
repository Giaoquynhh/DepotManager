import { prisma } from '../../../shared/config/database';
import service from '../service/YardService';

async function main() {
  const actor = { _id: 'system-demo' } as any;
  const slotId = process.env.TEST_SLOT_ID;
  const containerNo = process.env.TEST_CONTAINER_NO;
  const tierEnv = process.env.TEST_TIER;
  const tier = tierEnv ? Number(tierEnv) : undefined;

  if (!slotId || !containerNo) {
    console.error('Thiếu TEST_SLOT_ID hoặc TEST_CONTAINER_NO trong biến môi trường.');
    process.exit(1);
  }

  try {
    console.log('--- STACKING FLOW DEMO START ---');
    console.log('Hold...');
    const holdRes = await service.hold(actor, slotId, tier);
    console.log('Hold OK:', { slot_id: holdRes.slot_id, tier: holdRes.tier, expires: holdRes.hold_expires_at });

    console.log('Confirm...');
    const confirmRes = await service.confirm(actor, slotId, holdRes.tier, containerNo);
    console.log('Confirm OK:', { slot_id: confirmRes.slot_id, tier: confirmRes.tier, container_no: confirmRes.container_no });

    console.log('Remove by container...');
    const removeRes = await service.removeByContainer(actor, containerNo);
    console.log('Remove OK:', { slot_id: removeRes.slot_id, tier: removeRes.tier, removed_at: removeRes.removed_at });

    console.log('--- STACKING FLOW DEMO END ---');
  } catch (e) {
    console.error('Demo lỗi:', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
