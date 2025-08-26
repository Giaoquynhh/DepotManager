import { prisma } from '../../../shared/config/database';
import { audit } from '../../../shared/middlewares/audit';

async function main() {
  const now = new Date();
  try {
    const res = await prisma.yardPlacement.updateMany({
      where: {
        status: 'HOLD',
        hold_expires_at: { lt: now },
      },
      data: {
        status: 'REMOVED',
        hold_expires_at: null,
        removed_at: now,
      },
    });

    await audit(null, 'YARD.HOLD_TTL_CLEANUP', 'YARD_PLACEMENT', undefined, {
      affected: res.count,
      executed_at: now.toISOString(),
    });

    console.log(`[cleanupExpiredHolds] affected=${res.count} at=${now.toISOString()}`);
  } catch (e) {
    console.error('[cleanupExpiredHolds] error:', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
