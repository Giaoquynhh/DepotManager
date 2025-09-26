const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEmptyContainers() {
  try {
    console.log('🔍 Checking for EMPTY_IN_YARD containers...\n');
    
    // Kiểm tra YardPlacement có container nào không có ServiceRequest
    const emptyContainers = await prisma.$queryRaw`
      WITH latest_sr AS (
        SELECT DISTINCT ON (sr.container_no)
          sr.container_no,
          sr.status as service_status
        FROM "ServiceRequest" sr
        WHERE sr.container_no IS NOT NULL
        ORDER BY sr.container_no, sr."createdAt" DESC
      ),
      rt_checked AS (
        SELECT DISTINCT ON (rt.container_no)
          rt.container_no,
          TRUE as repair_checked
        FROM "RepairTicket" rt
        WHERE rt.status::text = 'COMPLETED' AND rt.container_no IS NOT NULL
        ORDER BY rt.container_no, rt."updatedAt" DESC
      )
      SELECT 
        yp.container_no,
        ys.code as slot_code,
        yb.code as block_code,
        y.name as yard_name,
        yp.placed_at,
        CASE 
          WHEN yp.container_no NOT IN (
            SELECT container_no FROM latest_sr
            UNION
            SELECT container_no FROM rt_checked
          ) THEN 'EMPTY_IN_YARD'
          ELSE 'HAS_SERVICE_REQUEST'
        END as container_type
      FROM "YardPlacement" yp
      LEFT JOIN "YardSlot" ys ON ys.id = yp.slot_id
      LEFT JOIN "YardBlock" yb ON yb.id = ys.block_id
      LEFT JOIN "Yard" y ON y.id = yb.yard_id
      WHERE yp.status = 'OCCUPIED' 
        AND yp.removed_at IS NULL
        AND yp.container_no IS NOT NULL
      ORDER BY yp.placed_at DESC
    `;
    
    console.log(`📊 Found ${emptyContainers.length} containers in yard:`);
    emptyContainers.forEach((container, index) => {
      console.log(`${index + 1}. ${container.container_no} - ${container.container_type}`);
      console.log(`   Position: ${container.yard_name} / ${container.block_code} / ${container.slot_code}`);
      console.log(`   Placed at: ${container.placed_at}`);
      console.log('');
    });
    
    const emptyInYardCount = emptyContainers.filter(c => c.container_type === 'EMPTY_IN_YARD').length;
    console.log(`✅ EMPTY_IN_YARD containers: ${emptyInYardCount}`);
    console.log(`📋 Containers with ServiceRequest: ${emptyContainers.length - emptyInYardCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmptyContainers();

